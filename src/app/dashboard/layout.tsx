'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useShopSettings } from '@/contexts/ShopSettingsContext'
import { useEffect, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { useGlobalReSync } from '@/hooks/useGlobalReSync'

// Dynamic import for better code splitting
const UserProfilePopup = dynamic(
  () => import('@/components/UserProfilePopup').then(mod => mod.default),
  { loading: () => null, ssr: false }
)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading } = useAuth()
  const { shopSettings } = useShopSettings()
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isClientReady, setIsClientReady] = useState(false)

  // Activate global re-sync mechanism
  useGlobalReSync()

  // Mark client as ready after hydration
  useEffect(() => {
    setIsClientReady(true)
  }, [])

  // Force reload when user returns to tab (ensures fresh Supabase session)
  useEffect(() => {
    let lastVisibilityTime = Date.now()
    const MIN_AWAY_TIME = 1000 // 1 second minimum away time

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const awayTime = Date.now() - lastVisibilityTime
        
        if (awayTime >= MIN_AWAY_TIME) {
          console.log(`👁️ User returned after ${awayTime}ms, forcing page refresh...`)
          
          // Show loading state before reload
          setIsClientReady(false)
          
          // Small delay to show loading state
          setTimeout(() => {
            window.location.reload()
          }, 100)
        }
      } else {
        lastVisibilityTime = Date.now()
      }
    }

    const handleFocus = () => {
      const awayTime = Date.now() - lastVisibilityTime
      
      if (awayTime >= MIN_AWAY_TIME) {
        console.log(`🎯 Window focused after ${awayTime}ms, forcing page refresh...`)
        
        setIsClientReady(false)
        
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Loading state
  if (loading || !isClientReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-uni-salar)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p style={{ fontFamily: 'var(--font-uni-salar)' }}>خەریکی بارکردنەوە...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: 'var(--theme-background)', 
        color: 'var(--theme-foreground)',
        fontFamily: 'var(--font-uni-salar)'
      }}
    >
      {/* Header - no key prop to prevent re-mounting */}
      <Header 
        shopSettings={shopSettings}
        onProfileClick={() => setShowSidebar(true)}
      />

      {/* Main Content */}
      <div className="flex-1 min-h-screen w-full">
        <main className="p-4 sm:p-6 lg:p-8 w-full">
          <Suspense fallback={
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          }>
            <div>
              {children}
            </div>
          </Suspense>
        </main>
      </div>

      {/* User Profile Sidebar - no key prop to prevent re-mounting */}
      <Sidebar
        shopSettings={shopSettings}
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      {/* User Profile Popup */}
      <UserProfilePopup 
        isOpen={showProfilePopup} 
        onClose={() => setShowProfilePopup(false)}
        shopSettings={shopSettings}
      />
    </div>
  )
}
