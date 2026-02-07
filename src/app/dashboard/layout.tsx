'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { useGlobalReSync } from '@/hooks/useGlobalReSync'
import { supabase } from '@/lib/supabase'

// Dynamic import for better code splitting
const UserProfilePopup = dynamic(
  () => import('@/components/UserProfilePopup').then(mod => mod.default),
  { loading: () => null, ssr: false }
)

interface ShopSettings {
  id: string
  shopname: string
  icon: string
  phone: string
  location: string
  qrcodeimage: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isClientReady, setIsClientReady] = useState(false)

  // Activate global re-sync mechanism - runs once on mount
  useGlobalReSync()

  // Mark client as ready after hydration
  useEffect(() => {
    setIsClientReady(true)
  }, [])

  const fetchShopSettings = async () => {
    if (!supabase) {
      setShopSettings({
        id: 'demo-shop',
        shopname: 'فرۆشگای کوردستان',
        icon: '',
        phone: '+964 750 123 4567',
        location: 'هەولێر، کوردستان',
        qrcodeimage: ''
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }
      setShopSettings(data || null)
    } catch {
      setShopSettings({
        id: 'demo-shop',
        shopname: 'فرۆشگای کوردستان',
        icon: '',
        phone: '+964 750 123 4567',
        location: 'هەولێر، کوردستان',
        qrcodeimage: ''
      })
    }
  }

  useEffect(() => {
    if (!loading && user) {
      fetchShopSettings()
    }
  }, [user, loading])

  // Loading state
  if (loading || !isClientReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
      {/* Header with Navigation */}
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

      {/* User Profile Sidebar */}
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
