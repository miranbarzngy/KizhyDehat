import { supabase } from './supabase'
import { SupabaseClient } from '@supabase/supabase-js'

// Super admin email constant - shared across the app
export const SUPER_ADMIN_EMAIL = 'superadmin@clickgroup.com'
export const SUPER_ADMIN_NAME = 'سوپەر ئادمین'

// Kurdish system user name that should be replaced with actual user when possible
const KURDISH_SYSTEM_NAME = 'سیستەم'

/**
 * Check if user email is super admin
 */
export function isSuperAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
}

/**
 * Get current user info for activity logging
 * Handles both regular users and super admin
 */
export async function getCurrentUserInfo(client: SupabaseClient<any, any> | null): Promise<{ userId: string | null; userName: string | null }> {
  if (!client) {
    return { userId: null, userName: null }
  }

  try {
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      return { userId: null, userName: null }
    }

    // Check if super admin
    if (isSuperAdminEmail(user.email)) {
      return {
        userId: user.id,
        userName: SUPER_ADMIN_NAME
      }
    }

    // Try to get profile name
    const { data: profile } = await client
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    return {
      userId: user.id,
      userName: profile?.name || user.email?.split('@')[0] || null
    }
  } catch (error) {
    console.warn('Could not get current user info:', error)
    return { userId: null, userName: null }
  }
}

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
 * @param autoFetchUser - If true, will automatically fetch current user info (recommended)
 */
export async function logActivity(
  userId: string | null,
  userName: string | null,
  action: string,
  details: string,
  entityType: string,
  entityId?: string,
  supabaseClient?: SupabaseClient<any, any>,
  autoFetchUser: boolean = true
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
    let finalUserName = userName

    // FIXED: Auto-fetch user info if:
    // 1. autoFetchUser is true AND
    // 2. Either userId or userName is not provided, OR userName is the Kurdish "System" placeholder
    const shouldAutoFetch = autoFetchUser && (!finalUserId || !finalUserName || finalUserName === KURDISH_SYSTEM_NAME)
    
    if (shouldAutoFetch) {
      try {
        const { data: { user } } = await client.auth.getUser()
        console.log('[ActivityLog] Auto-fetching user, user object:', user?.email)
        
        if (user) {
          // Only set userId if not already provided
          if (!finalUserId) {
            finalUserId = user.id
            console.log('[ActivityLog] Set userId:', finalUserId)
          }
          
          // Only set userName if not already provided OR if it was the system placeholder
          if (!finalUserName || finalUserName === KURDISH_SYSTEM_NAME) {
            // Check if super admin - use Kurdish name FIRST before checking profile
            const userEmail = user.email
            console.log('[ActivityLog] Checking super admin for email:', userEmail, 'isSuperAdmin:', isSuperAdminEmail(userEmail))
            
            if (isSuperAdminEmail(userEmail)) {
              finalUserName = SUPER_ADMIN_NAME
              console.log('[ActivityLog] Set super admin name:', SUPER_ADMIN_NAME)
            } else {
              // Try to get profile name for regular users
              const { data: profile } = await client
                .from('profiles')
                .select('name')
                .eq('id', user.id)
                .single()
              finalUserName = profile?.name || null
              console.log('[ActivityLog] Got profile name:', finalUserName)
            }
          }
        } else {
          console.log('[ActivityLog] No user found')
        }
      } catch (authError) {
        console.warn('Could not get current user:', authError)
      }
    }

    console.log('[Activity Log] Saving:', { finalUserId, finalUserName, action, details })

    // Include user_name directly since database trigger may not exist
    // This ensures activity logs always show the user name
    const { error } = await client.from('activity_logs').insert({
      user_id: finalUserId,
      user_name: finalUserName, // Include user_name to avoid "Unknown User" issue
      action,
      details,
      entity_type: entityType,
      entity_id: entityId || null
    })

    if (error) {
      // Silent fail for activity logging - don't throw errors for logging failures
      console.warn('Activity log insert failed:', error.message || 'Unknown error')
    }
  } catch (error) {
    // Silent fail for activity logging - don't throw errors for logging failures
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.warn('Activity logging failed:', errorMessage)
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
  
  // Role actions
  ADD_ROLE: 'add_role',
  UPDATE_ROLE: 'update_role',
  DELETE_ROLE: 'delete_role',
  
  // Expense actions
  ADD_EXPENSE: 'add_expense',
  UPDATE_EXPENSE: 'update_expense',
  DELETE_EXPENSE: 'delete_expense',
  
  // Customer payment actions
  ADD_CUSTOMER_PAYMENT: 'add_customer_payment',
  DELETE_CUSTOMER_PAYMENT: 'delete_customer_payment',
  
  // Supplier payment actions
  ADD_SUPPLIER_PAYMENT: 'add_supplier_payment',
  DELETE_SUPPLIER_PAYMENT: 'delete_supplier_payment',
  
  // Category actions
  ADD_CATEGORY: 'add_category',
  UPDATE_CATEGORY: 'update_category',
  DELETE_CATEGORY: 'delete_category',
  
  // Unit actions
  ADD_UNIT: 'add_unit',
  UPDATE_UNIT: 'update_unit',
  DELETE_UNIT: 'delete_unit'
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
  SUPPLIER_PAYMENT: 'supplier_payment',
  CATEGORY: 'category',
  UNIT: 'unit'
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
  add_supplier: 'زیادکردنی دابینکار',
  update_supplier: 'دەستکاریکردنی دابینکار',
  delete_supplier: 'سڕینەوەی دابینکار',
  
  // Users
  add_user: 'زیادکردنی بەکارهێنەر',
  update_user: 'دەستکاریکردنی بەکارهێنەر',
  delete_user: 'سڕینەوەی بەکارهێنەر',
  change_user_role: 'گۆڕینی ڕۆڵی بەکارهێنەر',
  deactivate_user: 'ناچالاککردنی بەکارهێنەر',
  activate_user: 'چالاککردنی بەکارهێنەر',
  
  // Roles
  add_role: 'زیادکردنی ڕۆڵ',
  update_role: 'دەستکاریکردنی ڕۆڵ',
  delete_role: 'سڕینەوەی ڕۆڵ',
  
  // Expenses
  add_expense: 'زیادکردنی خەرجی',
  update_expense: 'دەستکاریکردنی خەرجی',
  delete_expense: 'سڕینەوەی خەرجی',
  
  // Payments
  add_customer_payment: 'زیادکردنی پارەدانی کڕیار',
  delete_customer_payment: 'سڕینەوەی پارەدانی کڕیار',
  add_supplier_payment: 'زیادکردنی پارەدانی دابینکار',
  delete_supplier_payment: 'سڕینەوەی پارەدانی دابینکار',
  
  // Categories
  add_category: 'زیادکردنی پۆل',
  update_category: 'دەستکاریکردنی پۆل',
  delete_category: 'سڕینەوەی پۆل',
  
  // Units
  add_unit: 'زیادکردنی یەکە',
  update_unit: 'دەستکاریکردنی یەکە',
  delete_unit: 'سڕینەوەی یەکە'
}

// Get color for action type
export function getActionColor(action: string): string {
  const addActions = ['add_product', 'add_customer', 'add_supplier', 'add_user', 'add_role', 'add_expense', 'add_customer_payment', 'add_supplier_payment', 'create_sale', 'approve_sale', 'activate_user', 'add_category', 'add_unit']
  const updateActions = ['update_product', 'update_customer', 'update_supplier', 'update_user', 'update_role', 'update_expense', 'change_user_role', 'update_category', 'update_unit']
  const deleteActions = ['delete_product', 'delete_customer', 'delete_supplier', 'delete_user', 'delete_role', 'delete_expense', 'delete_customer_payment', 'delete_supplier_payment', 'delete_category', 'delete_unit']
  const cancelActions = ['cancel_sale', 'refund_sale', 'deactivate_user']
  
  if (addActions.includes(action)) return 'green'
  if (updateActions.includes(action)) return 'yellow'
  if (deleteActions.includes(action)) return 'red'
  if (cancelActions.includes(action)) return 'red'
  
  return 'gray'
}
