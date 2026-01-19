'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface ShopSettings {
  id: string
  shopname: string
  icon: string
  phone: string
  location: string
  qrcodeimage: string
}

const menuItems = [
  { name: 'داشبۆرد', href: '/dashboard', icon: '📊' },
  { name: 'فرۆشتن', href: '/dashboard/sales', icon: '💰', permission: 'sales' },
  { name: 'کۆگا', href: '/dashboard/inventory', icon: '📦', permission: 'inventory' },
  { name: 'کڕیاران', href: '/dashboard/customers', icon: '👥', permission: 'customers' },
  { name: 'دابینکەران', href: '/dashboard/suppliers', icon: '🏭', permission: 'suppliers' },
  { name: 'خەرجییەکان', href: '/dashboard/expenses', icon: '💸', permission: 'expenses' },
  { name: 'قازانج', href: '/dashboard/profits', icon: '📈', permission: 'profits' },
  { name: 'یارمەتی', href: '/dashboard/help', icon: '❓', adminOnly: true },
  { name: 'بەڕێوەبەران', href: '/dashboard/admin', icon: '⚙️', adminOnly: true },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)

  const fetchShopSettings = async () => {
    // Demo mode: show sample shop settings data when Supabase is not configured
    if (!supabase) {
      const demoSettings: ShopSettings = {
        id: 'demo-shop',
        shopname: 'فرۆشگای کوردستان',
        icon: '',
        phone: '+964 750 123 4567',
        location: 'هەولێر، کوردستان',
        qrcodeimage: ''
      }
      setShopSettings(demoSettings)
      return
    }

    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setShopSettings(data || null)
    } catch (error) {
      console.error('Error fetching shop settings:', error)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    fetchShopSettings()
  }, [user, loading, router])

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    const handleAppInstalled = () => {
      setShowInstallButton(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstallButton(false)
    }
  }

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

  // Temporary fix: if role is undefined, assume admin permissions
  const permissions = profile?.role?.permissions ? {
    ...profile.role.permissions,
    expenses: true // Always allow expenses access
  } : {
    sales: true,
    inventory: true,
    customers: true,
    suppliers: true,
    expenses: true,
    payroll: true,
    profits: true
  }
  // Temporary fix: allow admin access for recovery - show admin menu items
  const isAdmin = (profile?.role?.name === 'Admin') || !profile?.role || user // If logged in, show admin items for recovery

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly) return isAdmin
    if (item.permission) return permissions[item.permission as keyof typeof permissions]
    return true
  })

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--theme-background)', color: 'var(--theme-foreground)' }}>
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen flex flex-col" style={{ background: 'var(--theme-sidebar-bg)', color: 'var(--theme-sidebar-text)' }}>
          <div className="p-6 border-b" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="flex flex-col items-center space-y-3 mb-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-xl backdrop-blur-md bg-white/10 border border-yellow-400 shadow-lg flex items-center justify-center">
                  {(shopSettings?.icon && shopSettings.icon.trim() !== '') ? (
                    <img
                      src={shopSettings.icon}
                      alt="Shop Logo"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-4xl">🏪</span>
                  )}
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontWeight: 'bold' }}>
                  {shopSettings?.shopname || 'سیستمی فرۆشتن'}
                </h1>
              </div>
            </div>
            <p className="text-sm opacity-75" style={{ color: 'var(--theme-secondary)' }}>{profile?.role?.name}</p>
          </div>
          <nav className="flex-1 mt-6">
            <div className="px-3">
              {filteredMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center px-3 py-4 text-base font-medium rounded-md transition-all duration-200 hover:scale-105"
                  style={{
                    color: 'var(--theme-sidebar-text)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--theme-sidebar-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span className="text-2xl mb-2">{item.icon}</span>
                  <span className="text-center text-xs">{item.name}</span>
                </Link>
              ))}
            </div>
          </nav>
          <div className="p-4 space-y-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
            {showInstallButton && (
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <span className="mr-3">📱</span>
                دامەزراندنی ئەپ
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:scale-105"
              style={{
                color: 'var(--theme-sidebar-text)',
                fontFamily: 'var(--font-uni-salar)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--theme-sidebar-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span className="mr-3">🚪</span>
              دەرچوون
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-h-screen">
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
