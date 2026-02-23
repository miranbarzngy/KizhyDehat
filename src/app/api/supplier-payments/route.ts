import { createServerClient } from '@/lib/server-supabase'
import { NextResponse } from 'next/server'
import { logActivity } from '@/lib/activityLogger'

// Force dynamic to prevent static optimization
export const dynamic = 'force-dynamic'

// Simplified POST - bare minimum for testing
export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database connection failed - check server config' }, { status: 500 })
    }

    const body = await request.json()
    console.log('Received body:', body)
    
    const { supplier_id, amount, date, note } = body
    
    if (!supplier_id || !amount || !date) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Simple insert
    const { data, error } = await supabase
      .from('supplier_payments')
      .insert({
        supplier_id: supplier_id,
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

    // Recalculate supplier's total debt after adding payment
    // Debt = (Sum of transactions) - (Sum of payments)
    const { data: transactions } = await supabase
      .from('supplier_transactions')
      .select('debt_amount')
      .eq('supplier_id', supplier_id)

    const { data: payments } = await supabase
      .from('supplier_payments')
      .select('amount')
      .eq('supplier_id', supplier_id)

    const totalDebtFromTransactions = (transactions || []).reduce((sum, tx) => sum + (tx.debt_amount || 0), 0)
    const totalPaidFromPayments = (payments || []).reduce((sum, pay) => sum + (pay.amount || 0), 0)
    const newDebt = Math.max(0, totalDebtFromTransactions - totalPaidFromPayments)

    // Update supplier's total_debt
    await supabase
      .from('suppliers')
      .update({ total_debt: newDebt })
      .eq('id', supplier_id)

    // Log the activity
    try {
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('name')
        .eq('id', supplier_id)
        .single()
      
      const supplierName = supplierData?.name || 'نەناسراو'
      
      await logActivity(
        null,
        null,
        'add_supplier_payment',
        `پارەدانی ${parseFloat(amount).toLocaleString()} دینار بۆ دابینکار: ${supplierName}`,
        'supplier_payment',
        data.id,
        supabase
      )
    } catch (logError) {
      console.error('Error logging activity:', logError)
    }

    console.log('Insert success:', data)
    return NextResponse.json({ success: true, data, newDebt })
    
  } catch (err: any) {
    console.error('Catch error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Unknown error' }, { status: 500 })
  }
}

// GET - Fetch payments
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const supplierId = searchParams.get('supplier_id')

  if (!supplierId) {
    return NextResponse.json({ error: 'supplier_id is required' }, { status: 400 })
  }

  const supabase = createServerClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  try {
    const { data, error } = await supabase
      .from('supplier_payments')
      .select('*')
      .eq('supplier_id', supplierId)
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
    const { id, supplier_id, amount, date, note } = body

    if (!id || !supplier_id) {
      return NextResponse.json({ error: 'id and supplier_id are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('supplier_payments')
      .update({
        amount: amount || 0,
        date: date || null,
        note: note || null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Recalculate supplier's total debt after update
    // Debt = (Sum of transactions) - (Sum of payments)
    const { data: transactions } = await supabase
      .from('supplier_transactions')
      .select('debt_amount')
      .eq('supplier_id', supplier_id)

    const { data: payments } = await supabase
      .from('supplier_payments')
      .select('amount')
      .eq('supplier_id', supplier_id)

    const totalDebtFromTransactions = (transactions || []).reduce((sum, tx) => sum + (tx.debt_amount || 0), 0)
    const totalPaidFromPayments = (payments || []).reduce((sum, pay) => sum + (pay.amount || 0), 0)
    const newDebt = Math.max(0, totalDebtFromTransactions - totalPaidFromPayments)

    // Update supplier's total_debt
    await supabase
      .from('suppliers')
      .update({ total_debt: newDebt })
      .eq('id', supplier_id)

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
  const supplierId = searchParams.get('supplier_id')

  if (!id || !supplierId) {
    return NextResponse.json({ error: 'id and supplier_id are required' }, { status: 400 })
  }

  const supabase = createServerClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  try {
    // Get payment amount before deleting
    const { data: payment } = await supabase
      .from('supplier_payments')
      .select('amount')
      .eq('id', id)
      .single()

    const paymentAmount = payment?.amount || 0

    const { error } = await supabase
      .from('supplier_payments')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Recalculate supplier's total debt after deletion
    // Debt = (Sum of transactions) - (Sum of payments)
    const { data: transactions } = await supabase
      .from('supplier_transactions')
      .select('debt_amount')
      .eq('supplier_id', supplierId)

    const { data: remainingPayments } = await supabase
      .from('supplier_payments')
      .select('amount')
      .eq('supplier_id', supplierId)

    const totalDebtFromTransactions = (transactions || []).reduce((sum, tx) => sum + (tx.debt_amount || 0), 0)
    const totalPaidFromPayments = (remainingPayments || []).reduce((sum, pay) => sum + (pay.amount || 0), 0)
    const newDebt = Math.max(0, totalDebtFromTransactions - totalPaidFromPayments)

    // Update supplier's total_debt
    await supabase
      .from('suppliers')
      .update({ total_debt: newDebt })
      .eq('id', supplierId)

    // Log the delete activity
    try {
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('name')
        .eq('id', supplierId)
        .single()
      
      const supplierName = supplierData?.name || 'نەناسراو'
      
      await logActivity(
        null,
        null,
        'delete_supplier_payment',
        `سڕینەوەی پارەدانی ${paymentAmount.toLocaleString()} دینار بۆ دابینکار: ${supplierName}`,
        'supplier_payment',
        id,
        supabase
      )
    } catch (logError) {
      console.error('Error logging delete activity:', logError)
    }

    return NextResponse.json({ success: true, newDebt })
  } catch (error: any) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
