'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface PermissionGuardProps {
  permission: string
  children: React.ReactNode
}

export default function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const { user, profile, loading, profileLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect while still loading - wait for profile to load
    if (loading || profileLoading) {
      return
    }

    if (user) {
      // Get the user's permissions from profile
      const userPermissions = profile?.role?.permissions || {}
      
      // Default permissions - ALLOW access while we figure out permissions
      // This prevents redirecting while profile is still loading
      const defaultPermissions = {
        dashboard: true, // Always allow dashboard
        sales: true,
        inventory: true,
        customers: true,
        suppliers: true,
        invoices: true,
        expenses: true,
        profits: true,
        help: true,
        admin: true
      }
      
      // Merge with defaults - if no permissions loaded yet, allow access
      const safePermissions = { ...defaultPermissions, ...userPermissions }
      
      // Check for admin access - support role ID, Kurdish, English role names, case-insensitive
      // Also check for SUPER ADMIN email
      const SUPER_ADMIN_EMAIL = 'superadmin@clickgroup.com'
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
        // Default to ALLOW if permissions not loaded yet
        const hasPermission = safePermissions[permission as keyof typeof safePermissions]
        
        // Only redirect if user explicitly has false for permission
        if (hasPermission === false && Object.keys(userPermissions).length > 0) {
          // User explicitly does not have permission, redirect to dashboard
          router.push('/dashboard')
          return
        }
      }
    }
  }, [user, profile, loading, profileLoading, permission, router])

  if (loading || profileLoading) {
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
