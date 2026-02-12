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

  // Loading state
  if (loading || !isClientReady) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ 
          background: 'var(--theme-background)',
          color: 'var(--theme-foreground)'
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--theme-accent)' }}></div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ 
        background: 'var(--theme-background)',
        color: 'var(--theme-foreground)',
        fontFamily: 'var(--font-uni-salar)'
      }}
    >
      {/* Header */}
      <Header 
        shopSettings={shopSettings}
        onProfileClick={() => setShowSidebar(true)}
      />

      {/* Main Content */}
      <div className="flex-1 min-h-screen w-full">
        <main className="p-4 sm:p-6 lg:p-8 w-full">
          <Suspense fallback={
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--theme-accent)' }}></div>
            </div>
          }>
            <div className="max-w-[2800px] mx-auto w-full">
              {children}
            </div>
          </Suspense>
        </main>
      </div>

      {/* Sidebar */}
      <Sidebar
        shopSettings={shopSettings}
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      {/* Profile Popup */}
      <UserProfilePopup 
        isOpen={showProfilePopup} 
        onClose={() => setShowProfilePopup(false)}
        shopSettings={shopSettings}
      />
    </div>
  )
}
