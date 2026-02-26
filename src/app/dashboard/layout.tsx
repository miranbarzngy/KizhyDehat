'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useShopSettings } from '@/contexts/ShopSettingsContext'
import { useEffect, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import { useGlobalReSync } from '@/hooks/useGlobalReSync'
import { GlobalInvoiceModalProvider, useGlobalInvoiceModal } from '@/hooks/useGlobalInvoiceModal'
import GlobalInvoiceModal from '@/components/GlobalInvoiceModal'
import OfflineIndicator from '@/components/common/OfflineIndicator'

// Dynamic import for better code splitting
const UserProfilePopup = dynamic(
  () => import('@/components/UserProfilePopup').then(mod => mod.default),
  { loading: () => null, ssr: false }
)

// Inner component that uses the global invoice modal hook
function DashboardContent({ children, shopSettings }: { children: React.ReactNode; shopSettings: any }) {
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  
  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ 
        background: 'var(--theme-background)',
        color: 'var(--theme-foreground)',
        fontFamily: 'var(--font-uni-salar)'
      }}
    >
      {/* Offline Indicator */}
      <OfflineIndicator position="top-right" />

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

      {/* Footer */}
      <Footer />

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

      {/* Global Invoice Modal - Always rendered, controlled by context */}
      <GlobalInvoiceModalWrapper />
    </div>
  )
}

// Wrapper component to use the hook inside the provider
function GlobalInvoiceModalWrapper() {
  const { isOpen, invoiceData, invoiceId, title, closeModal } = useGlobalInvoiceModal()
  
  return (
    <GlobalInvoiceModal
      isOpen={isOpen}
      onClose={closeModal}
      invoiceData={invoiceData}
      invoiceId={invoiceId}
      title={title}
    />
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading } = useAuth()
  const { shopSettings } = useShopSettings()
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
    <GlobalInvoiceModalProvider>
      <DashboardContent shopSettings={shopSettings}>
        {children}
      </DashboardContent>
    </GlobalInvoiceModalProvider>
  )
}
