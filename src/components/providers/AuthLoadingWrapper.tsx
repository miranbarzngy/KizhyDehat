'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-gray-900 z-50">
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="relative">
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-blue-200 rounded-full"></div>
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-blue-600 border-t-transparent rounded-full absolute top-0 left-0 animate-spin"></div>
        </div>
        <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 font-uni-salar text-center">
          جارەکردنەوە...
        </p>
      </div>
    </div>
  )
}

export default function AuthLoadingWrapper({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Client-side safety redirect - if loading is done and no user on protected route
  useEffect(() => {
    if (!loading && !user && pathname.startsWith('/dashboard')) {
      // Safety redirect to login if no user on protected route
      router.push('/login')
    }
  }, [loading, user, pathname, router])

  if (loading) {
    return <LoadingSpinner />
  }
  
  return <>{children}</>
}
