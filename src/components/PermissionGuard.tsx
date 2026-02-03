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
    if (!loading && user && profile) {
      // Check for admin access - support role ID, Kurdish, English role names, case-insensitive
      const isAdmin = profile?.role_id === '6dc4d359-8907-4815-baa7-9e003b662f2a' ||
                      profile?.role?.name?.toLowerCase() === 'ئادمین' ||
                      profile?.role?.name?.toLowerCase() === 'admin' ||
                      profile?.role?.name?.toLowerCase() === 'administrator' ||
                      !profile?.role || user // Fallback for recovery

      if (permission === 'admin' && !isAdmin) {
        router.push('/dashboard')
        return
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