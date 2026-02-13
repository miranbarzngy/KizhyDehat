'use server'

import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET - Fetch all payments for a supplier
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const supplierId = searchParams.get('supplier_id')

  if (!supplierId) {
    return NextResponse.json({ error: 'supplier_id is required' }, { status: 400 })
  }

  const supabase = createClient()
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

// POST - Add a new payment and update supplier debt
export async function POST(request: Request) {
  const supabase = createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { supplier_id, amount, date, note } = body

    if (!supplier_id || !amount || !date) {
      return NextResponse.json({ error: 'supplier_id, amount, and date are required' }, { status: 400 })
    }

    // Start a transaction to ensure data consistency
    // First, get current supplier debt
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('total_debt')
      .eq('id', supplier_id)
      .single()

    if (supplierError) throw supplierError

    // Insert the payment
    const { data: payment, error: paymentError } = await supabase
      .from('supplier_payments')
      .insert({
        supplier_id,
        amount,
        date,
        note: note || null
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Update supplier's total_debt (subtract the payment amount)
    const newDebt = (supplier.total_debt || 0) - amount
    
    const { error: updateError } = await supabase
      .from('suppliers')
      .update({ total_debt: newDebt })
      .eq('id', supplier_id)

    if (updateError) throw updateError

    return NextResponse.json({ payment, newDebt })
  } catch (error) {
    console.error('Error adding payment:', error)
    return NextResponse.json({ error: 'Failed to add payment' }, { status: 500 })
  }
}

// PUT - Update a payment and recalculate debt
export async function PUT(request: Request) {
  const supabase = createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { id, supplier_id, amount, date, note } = body

    if (!id || !supplier_id) {
      return NextResponse.json({ error: 'id and supplier_id are required' }, { status: 400 })
    }

    // Get the existing payment to calculate the difference
    const { data: existingPayment, error: fetchError } = await supabase
      .from('supplier_payments')
      .select('amount')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Update the payment
    const { data: payment, error: paymentError } = await supabase
      .from('supplier_payments')
      .update({
        amount: amount || existingPayment.amount,
        date: date || null,
        note: note || null
      })
      .eq('id', id)
      .select()
      .single()

    if (paymentError) throw paymentError

    // Calculate the difference and update supplier's total_debt
    const oldAmount = existingPayment.amount
    const newAmount = amount || oldAmount
    const difference = newAmount - oldAmount

    // Get current supplier debt
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('total_debt')
      .eq('id', supplier_id)
      .single()

    if (supplierError) throw supplierError

    // Update supplier's total_debt (subtract the difference)
    const newDebt = (supplier.total_debt || 0) - difference

    const { error: updateError } = await supabase
      .from('suppliers')
      .update({ total_debt: newDebt })
      .eq('id', supplier_id)

    if (updateError) throw updateError

    return NextResponse.json({ payment, newDebt })
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}

// DELETE - Delete a payment and restore debt
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const supplierId = searchParams.get('supplier_id')

  if (!id || !supplierId) {
    return NextResponse.json({ error: 'id and supplier_id are required' }, { status: 400 })
  }

  const supabase = createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  try {
    // Get the payment before deleting to know the amount
    const { data: payment, error: fetchError } = await supabase
      .from('supplier_payments')
      .select('amount')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Delete the payment
    const { error: deleteError } = await supabase
      .from('supplier_payments')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    // Get current supplier debt
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('total_debt')
      .eq('id', supplierId)
      .single()

    if (supplierError) throw supplierError

    // Update supplier's total_debt (add back the deleted payment amount)
    const newDebt = (supplier.total_debt || 0) + payment.amount

    const { error: updateError } = await supabase
      .from('suppliers')
      .update({ total_debt: newDebt })
      .eq('id', supplierId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, newDebt })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}
