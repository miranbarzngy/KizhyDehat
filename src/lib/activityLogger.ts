import { supabase } from './supabase'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Logs an activity to the activity_logs table
 * Note: The database trigger will automatically populate user_name from profiles table
 * @param userId - The ID of the user performing the action (from auth.user)
 * @param userName - The name of the user (optional - database trigger will fetch from profiles if userId provided)
 * @param action - The type of action (e.g., 'add_product', 'approve_sale', 'delete_customer')
 * @param details - Detailed description of the action (e.g., 'Product iPhone 15 added')
 * @param entityType - The type of entity being affected (e.g., 'product', 'sale', 'customer', 'supplier', 'user')
 * @param entityId - The ID of the entity being affected (optional)
 * @param supabaseClient - Optional server-side Supabase client (for API routes)
 */
export async function logActivity(
  userId: string | null,
  userName: string | null,
  action: string,
  details: string,
  entityType: string,
  entityId?: string,
  supabaseClient?: SupabaseClient<any, any>
): Promise<void> {
  try {
    // Use provided client if available, otherwise fall back to default client
    const client = supabaseClient || supabase

    // If no Supabase client, skip logging (for demo mode)
    if (!client) {
      console.log('[Activity Log]', { userName, action, details, entityType })
      return
    }

    // If no userId provided, try to get current user
    let finalUserId = userId
    if (!finalUserId) {
      try {
        const { data: { user } } = await client.auth.getUser()
        finalUserId = user?.id || null
      } catch (authError) {
        console.warn('Could not get current user:', authError)
      }
    }

    // The database trigger will automatically set user_name from profiles table
    // Only send user_id - omit user_name completely to let trigger handle it
    const { error } = await client.from('activity_logs').insert({
      user_id: finalUserId,
      action,
      details,
      entity_type: entityType,
      entity_id: entityId || null
    })

    if (error) {
      console.error('Error logging activity:', error)
    }
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

// Action types for better type safety
export const ActivityActions = {
  // Product actions
  ADD_PRODUCT: 'add_product',
  UPDATE_PRODUCT: 'update_product',
  DELETE_PRODUCT: 'delete_product',
  
  // Sale actions
  CREATE_SALE: 'create_sale',
  APPROVE_SALE: 'approve_sale',
  CANCEL_SALE: 'cancel_sale',
  REFUND_SALE: 'refund_sale',
  
  // Customer actions
  ADD_CUSTOMER: 'add_customer',
  UPDATE_CUSTOMER: 'update_customer',
  DELETE_CUSTOMER: 'delete_customer',
  
  // Supplier actions
  ADD_SUPPLIER: 'add_supplier',
  UPDATE_SUPPLIER: 'update_supplier',
  DELETE_SUPPLIER: 'delete_supplier',
  
  // User actions
  ADD_USER: 'add_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  CHANGE_USER_ROLE: 'change_user_role',
  DEACTIVATE_USER: 'deactivate_user',
  ACTIVATE_USER: 'activate_user',
  
  // Expense actions
  ADD_EXPENSE: 'add_expense',
  UPDATE_EXPENSE: 'update_expense',
  DELETE_EXPENSE: 'delete_expense',
  
  // Customer payment actions
  ADD_CUSTOMER_PAYMENT: 'add_customer_payment',
  DELETE_CUSTOMER_PAYMENT: 'delete_customer_payment',
  
  // Supplier payment actions
  ADD_SUPPLIER_PAYMENT: 'add_supplier_payment',
  DELETE_SUPPLIER_PAYMENT: 'delete_supplier_payment'
} as const

// Entity types
export const EntityTypes = {
  PRODUCT: 'product',
  SALE: 'sale',
  CUSTOMER: 'customer',
  SUPPLIER: 'supplier',
  USER: 'user',
  EXPENSE: 'expense',
  CUSTOMER_PAYMENT: 'customer_payment',
  SUPPLIER_PAYMENT: 'supplier_payment'
} as const

// Kurdish action labels
export const ActionLabels: Record<string, string> = {
  // Products
  add_product: 'زیادکردنی کاڵا',
  update_product: 'دەستکاریکردنی کاڵا',
  delete_product: 'سڕینەوەی کاڵا',
  
  // Sales
  create_sale: 'فرۆشتن',
  approve_sale: 'پەسەندکردنی فرۆشتن',
  cancel_sale: 'هەڵوەشاندنەوەی فرۆشتن',
  refund_sale: 'گەڕاندنەوەی پارە',
  
  // Customers
  add_customer: 'زیادکردنی کڕیار',
  update_customer: 'دەستکاریکردنی کڕیار',
  delete_customer: 'سڕینەوەی کڕیار',
  
  // Suppliers
  add_supplier: 'زیادکردنی دابینکەر',
  update_supplier: 'دەستکاریکردنی دابینکەر',
  delete_supplier: 'سڕینەوەی دابینکەر',
  
  // Users
  add_user: 'زیادکردنی بەکارهێنەر',
  update_user: 'دەستکاریکردنی بەکارهێنەر',
  delete_user: 'سڕینەوەی بەکارهێنەر',
  change_user_role: 'گۆڕینی ڕۆڵی بەکارهێنەر',
  deactivate_user: 'ناچالاککردنی بەکارهێنەر',
  activate_user: 'چالاککردنی بەکارهێنەر',
  
  // Expenses
  add_expense: 'زیادکردنی خەرجی',
  update_expense: 'دەستکاریکردنی خەرجی',
  delete_expense: 'سڕینەوەی خەرجی',
  
  // Payments
  add_customer_payment: 'زیادکردنی پارەدانی کڕیار',
  delete_customer_payment: 'سڕینەوەی پارەدانی کڕیار',
  add_supplier_payment: 'زیادکردنی پارەدانی دابینکەر',
  delete_supplier_payment: 'سڕینەوەی پارەدانی دابینکەر'
}

// Get color for action type
export function getActionColor(action: string): string {
  const addActions = ['add_product', 'add_customer', 'add_supplier', 'add_user', 'add_expense', 'add_customer_payment', 'add_supplier_payment', 'create_sale', 'approve_sale', 'activate_user']
  const updateActions = ['update_product', 'update_customer', 'update_supplier', 'update_user', 'update_expense', 'change_user_role']
  const deleteActions = ['delete_product', 'delete_customer', 'delete_supplier', 'delete_user', 'delete_expense', 'delete_customer_payment', 'delete_supplier_payment']
  const cancelActions = ['cancel_sale', 'refund_sale', 'deactivate_user']
  
  if (addActions.includes(action)) return 'green'
  if (updateActions.includes(action)) return 'yellow'
  if (deleteActions.includes(action)) return 'red'
  if (cancelActions.includes(action)) return 'red'
  
  return 'gray'
}
