// Standalone product service - survives component unmounts
import { supabase as supabaseClient } from '@/lib/supabase'

export interface ProductData {
  name: string
  total_amount_bought: number
  unit: string
  total_purchase_price: number
  selling_price_per_unit: number
  cost_per_unit: number
  category: string | null
  image: string | null
  barcode1: string | null
  barcode2: string | null
  barcode3: string | null
  barcode4: string | null
  added_date: string
  expire_date: string | null
  supplier_id: string | null
  note: string | null
}

export async function insertProduct(data: ProductData, supplierId?: string): Promise<{ success: boolean; error?: any }> {
  console.log('📦 [ProductService] Starting insert...')
  
  // Get fresh Supabase client
  let supabase = supabaseClient
  
  if (!supabase) {
    // Try to create a new client
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url_here') {
        supabase = createClient(supabaseUrl, supabaseAnonKey)
        console.log('📦 [ProductService] Created fresh Supabase client')
      }
    } catch (e) {
      console.error('📦 [ProductService] Failed to create client:', e)
      return { success: false, error: 'Failed to create Supabase client' }
    }
  }
  
  if (!supabase) {
    console.error('📦 [ProductService] No Supabase client available')
    return { success: false, error: 'Supabase not configured' }
  }
  
  try {
    // Step 1: Insert product
    console.log('📦 [ProductService] Inserting product...')
    const { error: productError } = await supabase.from('products').insert(data)
    
    if (productError) {
      console.error('📦 [ProductService] Product insert error:', productError)
      return { success: false, error: productError }
    }
    
    console.log('📦 [ProductService] Product inserted successfully')
    
    // Step 2: Track expense (if supplier and price provided)
    if (supplierId && data.total_purchase_price > 0) {
      console.log('📦 [ProductService] Tracking expense...')
      const { error: expenseError } = await supabase.from('purchase_expenses').insert({
        item_name: data.name,
        total_purchase_price: data.total_purchase_price,
        total_amount_bought: data.total_amount_bought,
        unit: data.unit,
        purchase_date: data.added_date
      })
      
      if (expenseError) {
        console.error('📦 [ProductService] Expense insert error:', expenseError)
        // Don't fail the whole operation for expense tracking error
      }
    }
    
    console.log('📦 [ProductService] All operations completed successfully')
    return { success: true }
    
  } catch (e: any) {
    console.error('📦 [ProductService] Unexpected error:', e?.message || e)
    return { success: false, error: e }
  }
}

export async function updateProduct(data: ProductData, productId: string): Promise<{ success: boolean; error?: any }> {
  console.log('📦 [ProductService] Starting update...')
  
  let supabase = supabaseClient
  
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }
  
  try {
    const { error } = await supabase.from('products').update(data).eq('id', productId)
    
    if (error) {
      console.error('📦 [ProductService] Update error:', error)
      return { success: false, error: error }
    }
    
    console.log('📦 [ProductService] Product updated successfully')
    return { success: true }
    
  } catch (e: any) {
    console.error('📦 [ProductService] Update error:', e?.message || e)
    return { success: false, error: e }
  }
}
