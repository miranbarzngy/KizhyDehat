import { createServerClient } from '@/lib/server-supabase'
import { NextResponse } from 'next/server'

// Force dynamic to prevent static optimization
export const dynamic = 'force-dynamic'

// POST - Add new payment
export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database connection failed - check server config' }, { status: 500 })
    }

    const body = await request.json()
    console.log('Received body:', body)
    
    const { customer_id, amount, date, note } = body
    
    if (!customer_id || !amount || !date) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Insert payment
    const { data, error } = await supabase
      .from('customer_payments')
      .insert({
        customer_id: customer_id,
        amount: parseFloat(amount),
        date: date,
        note: note || null
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    // Calculate new debt for the customer
    // New debt = current debt - payment amount
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('total_debt')
      .eq('id', customer_id)
      .single()

    if (customerError) {
      console.error('Error fetching customer:', customerError)
      return NextResponse.json({ success: true, data, newDebt: null })
    }

    const currentDebt = customerData?.total_debt || 0
    const newDebt = Math.max(0, currentDebt - parseFloat(amount))

    // Update customer's total_debt
    const { error: updateError } = await supabase
      .from('customers')
      .update({ total_debt: newDebt })
      .eq('id', customer_id)

    if (updateError) {
      console.error('Error updating customer debt:', updateError)
    }

    console.log('Insert success:', data, 'New debt:', newDebt)
    return NextResponse.json({ success: true, data, newDebt })
    
  } catch (err: any) {
    console.error('Catch error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Unknown error' }, { status: 500 })
  }
}

// GET - Fetch payments for a customer
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customer_id')

  if (!customerId) {
    return NextResponse.json({ error: 'customer_id is required' }, { status: 400 })
  }

  const supabase = createServerClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  try {
    const { data, error } = await supabase
      .from('customer_payments')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// PUT - Update payment
export async function PUT(request: Request) {
  const supabase = createServerClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { id, customer_id, amount, date, note } = body

    if (!id || !customer_id) {
      return NextResponse.json({ error: 'id and customer_id are required' }, { status: 400 })
    }

    // Get the old payment amount first
    const { data: oldPayment } = await supabase
      .from('customer_payments')
      .select('amount')
      .eq('id', id)
      .single()

    const oldAmount = oldPayment?.amount || 0

    // Update the payment
    const { data, error } = await supabase
      .from('customer_payments')
      .update({
        amount: amount || 0,
        date: date || null,
        note: note || null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Calculate the difference and update customer debt
    const difference = (amount || 0) - oldAmount
    
    const { data: customerData } = await supabase
      .from('customers')
      .select('total_debt')
      .eq('id', customer_id)
      .single()

    const currentDebt = customerData?.total_debt || 0
    const newDebt = Math.max(0, currentDebt - difference)

    await supabase
      .from('customers')
      .update({ total_debt: newDebt })
      .eq('id', customer_id)

    return NextResponse.json({ success: true, data, newDebt })
  } catch (error: any) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete payment
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const customerId = searchParams.get('customer_id')

  if (!id || !customerId) {
    return NextResponse.json({ error: 'id and customer_id are required' }, { status: 400 })
  }

  const supabase = createServerClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  try {
    // Get the payment amount before deleting
    const { data: payment } = await supabase
      .from('customer_payments')
      .select('amount')
      .eq('id', id)
      .single()

    const paymentAmount = payment?.amount || 0

    // Delete the payment
    const { error } = await supabase
      .from('customer_payments')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Increase customer debt by the deleted payment amount
    const { data: customerData } = await supabase
      .from('customers')
      .select('total_debt')
      .eq('id', customerId)
      .single()

    const currentDebt = customerData?.total_debt || 0
    const newDebt = currentDebt + paymentAmount

    await supabase
      .from('customers')
      .update({ total_debt: newDebt })
      .eq('id', customerId)

    return NextResponse.json({ success: true, newDebt })
  } catch (error: any) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
