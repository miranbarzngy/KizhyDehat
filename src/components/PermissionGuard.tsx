'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface PermissionGuardProps {
  permission: string
  children: React.ReactNode
}

export default function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Get the user's permissions from profile
      const userPermissions = profile?.role?.permissions || {}
      
      // Default permissions if none exist (deny everything)
      const defaultPermissions = {
        dashboard: false,
        sales: false,
        inventory: false,
        customers: false,
        suppliers: false,
        invoices: false,
        expenses: false,
        profits: false,
        help: false,
        admin: false
      }
      
      // Merge with defaults to ensure all keys exist
      const safePermissions = { ...defaultPermissions, ...userPermissions }
      
      // Check for admin access - support role ID, Kurdish, English role names, case-insensitive
      // Also check for SUPER ADMIN email
      const SUPER_ADMIN_EMAIL = 'rezhna@clickgroup.com'
      const userEmail = user?.email?.toLowerCase()
      const isSuperAdmin = userEmail === SUPER_ADMIN_EMAIL.toLowerCase()
      
      const isAdmin = profile?.role_id === '6dc4d359-8907-4815-baa7-9e003b662f2a' ||
                      profile?.role?.name?.toLowerCase() === 'ئادمین' ||
                      profile?.role?.name?.toLowerCase() === 'admin' ||
                      profile?.role?.name?.toLowerCase() === 'administrator' ||
                      profile?.role?.name?.toLowerCase() === 'سوپەر ئادمین' ||
                      isSuperAdmin ||
                      !profile?.role // Fallback for recovery

      // If permission is admin, check admin role
      if (permission === 'admin') {
        if (!isAdmin) {
          router.push('/dashboard')
          return
        }
      } else {
        // For other permissions, check if user has the specific permission
        const hasPermission = safePermissions[permission as keyof typeof safePermissions]
        
        if (hasPermission === false) {
          // User explicitly does not have permission, redirect to dashboard
          router.push('/dashboard')
          return
        }
      }
    }
  }, [user, profile, loading, permission, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
