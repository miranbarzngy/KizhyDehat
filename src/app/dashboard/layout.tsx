'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Store } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

interface ShopSettings {
  id: string
  shopname: string
  icon: string
  phone: string
  location: string
  qrcodeimage: string
}

const menuItems = [
  { name: 'داشبۆرد', href: '/dashboard', icon: '📊', permission: 'dashboard' },
  { name: 'فرۆشتن', href: '/dashboard/sales', icon: '💰', permission: 'sales' },
  { name: 'کۆگا', href: '/dashboard/inventory', icon: '📦', permission: 'inventory' },
  { name: 'کڕیاران', href: '/dashboard/customers', icon: '👥', permission: 'customers' },
  { name: 'دابینکەران', href: '/dashboard/suppliers', icon: '🏭', permission: 'suppliers' },
  { name: 'پسوڵەکان', href: '/dashboard/invoices', icon: '🧾', permission: 'sales' },
  { name: 'خەرجییەکان', href: '/dashboard/expenses', icon: '💸', permission: 'expenses' },
  { name: 'قازانج', href: '/dashboard/profits', icon: '📈', permission: 'profits' },
  { name: 'یارمەتی', href: '/dashboard/help', icon: '❓', permission: 'help' },
  { name: 'بەڕێوەبەران', href: '/dashboard/admin', icon: '⚙️', permission: 'admin' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [showUserSidebar, setShowUserSidebar] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

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
      // First check if shop_settings table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('shop_settings')
        .select('id')
        .limit(1)

      if (tableError) {
        console.log('Shop settings table not found or not accessible, using demo data')
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

      // Table exists, fetch the settings
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching shop settings:', error)
        // Use demo data as fallback
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

      const settings = data || null
      setShopSettings(settings)
    } catch (error) {
      console.error('Error fetching shop settings:', error)
      // Final fallback to demo data
      const demoSettings: ShopSettings = {
        id: 'demo-shop',
        shopname: 'فرۆشگای کوردستان',
        icon: '',
        phone: '+964 750 123 4567',
        location: 'هەولێر، کوردستان',
        qrcodeimage: ''
      }
      setShopSettings(demoSettings)
    }
  }

  useEffect(() => {
    if (!loading && user) {
      fetchShopSettings()
    }
  }, [user, loading])

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

  // Get permissions from profile role, with fallback for admin access
  const permissions = profile?.role?.permissions || {
    dashboard: true,
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

  // Check for admin access - support role ID, Kurdish, English role names, case-insensitive
  const isAdmin = profile?.role_id === '6dc4d359-8907-4815-baa7-9e003b662f2a' ||
                  profile?.role?.name?.toLowerCase() === 'ئادمین' ||
                  profile?.role?.name?.toLowerCase() === 'admin' ||
                  profile?.role?.name?.toLowerCase() === 'administrator' ||
                  permissions.admin === true // Check permissions.admin flag

  const filteredMenuItems = menuItems.filter(item => {
    if (item.permission === 'dashboard') return true // Dashboard is always shown
    if (item.permission) return permissions[item.permission as keyof typeof permissions]
    return true
  })

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--theme-background)', color: 'var(--theme-foreground)' }}>
      <div className="flex flex-col">
        {/* Top Navigation Bar */}
        <div className="w-full h-20 mt-0.5 flex items-center justify-between border-b" style={{ background: 'var(--theme-sidebar-bg)', borderColor: 'var(--theme-border)', marginRight: '2px' }}>
          {/* Shop Logo - Left Side */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={() => setShowUserSidebar(true)}
              className="flex flex-col items-center justify-center transition-all duration-200 hover:scale-105"
              title={shopSettings?.shopname || 'زانیاری فرۆشگا'}
            >
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full mb-1 shadow-lg transition-all duration-200 hover:scale-110 overflow-hidden"
                style={{
                  background: 'var(--theme-sidebar-hover)',
                  color: 'var(--theme-sidebar-text)'
                }}
              >
                {shopSettings?.icon && shopSettings.icon.trim() !== '' ? (
                  <img
                    src={shopSettings.icon}
                    alt="Shop Logo"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to store icon
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = 'flex'
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : null}
                <Store className="w-6 h-6" style={{ display: shopSettings?.icon && shopSettings.icon.trim() !== '' ? 'none' : 'flex' }} />
              </div>
              <span
                className="text-xs text-center font-medium max-w-20 sm:max-w-24"
                style={{
                  color: 'var(--theme-sidebar-text)',
                  fontFamily: 'var(--font-uni-salar)'
                }}
              >
                {shopSettings?.shopname || 'فرۆشگا'}
              </span>
            </button>
          </div>

          {/* Navigation Menu - Fill Space */}
          <div className="flex items-center justify-around flex-1 overflow-hidden">
            <div className="flex items-center justify-around w-full gap-x-8 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {filteredMenuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 flex-shrink-0 mt-0.5"
                  >
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full mb-1 transition-all duration-200 ${
                        isActive ? 'bg-blue-600 text-white shadow-lg scale-110' : ''
                      }`}
                      style={{
                        background: isActive ? '#2563eb' : 'var(--theme-sidebar-hover)',
                        color: isActive ? '#ffffff' : 'var(--theme-sidebar-text)'
                      }}
                    >
                      <span className="text-xl mt-1">{item.icon}</span>
                    </div>
                    <span
                      className={`text-xs text-center font-medium transition-colors duration-200 ${
                        isActive ? 'text-blue-600' : ''
                      }`}
                      style={{
                        color: isActive ? '#2563eb' : 'var(--theme-sidebar-text)',
                        fontFamily: 'var(--font-uni-salar)'
                      }}
                    >
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-h-screen w-full">
          <main className="p-4 sm:p-6 lg:p-8 w-full">
            {children}
          </main>
        </div>

        {/* User Profile Sidebar */}
        {showUserSidebar && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowUserSidebar(false)}
            />

            {/* Sidebar */}
            <div
              ref={sidebarRef}
              className="fixed top-0 right-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out"
              style={{ background: 'var(--theme-sidebar-bg)' }}
            >
              <div className="p-6 h-full flex flex-col">
                {/* Close button */}
                <button
                  onClick={() => setShowUserSidebar(false)}
                  className="self-end mb-6 p-2 rounded-full hover:bg-opacity-20"
                  style={{ color: 'var(--theme-sidebar-text)' }}
                >
                  ✕
                </button>

                {/* User Profile Section */}
                <div className="flex flex-col items-center mb-8">
                  <div
                    className="w-20 h-20 rounded-full mb-4 shadow-lg flex items-center justify-center overflow-hidden"
                    style={{
                      background: 'var(--theme-sidebar-hover)',
                      color: 'var(--theme-sidebar-text)'
                    }}
                  >
                    {profile?.image && profile.image.trim() !== '' ? (
                      <img
                        src={profile.image}
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to first letter
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : null}
                    {(!profile?.image || profile.image.trim() === '') && (
                      <span
                        className="text-2xl font-bold"
                        style={{
                          color: 'var(--theme-sidebar-text)',
                          fontFamily: 'var(--font-uni-salar)'
                        }}
                      >
                        {profile?.name?.charAt(0)?.toUpperCase() || user?.email?.split('@')[0]?.charAt(0)?.toUpperCase() || 'ب'}
                      </span>
                    )}
                  </div>
                  <h3
                    className="text-lg font-bold text-center mb-1"
                    style={{
                      color: 'var(--theme-sidebar-text)',
                      fontFamily: 'var(--font-uni-salar)'
                    }}
                  >
                    {profile?.name || user?.email?.split('@')[0] || 'بەکارهێنەر'}
                  </h3>
                  <p
                    className="text-sm opacity-75 text-center"
                    style={{
                      color: 'var(--theme-secondary)',
                      fontFamily: 'var(--font-uni-salar)'
                    }}
                  >
                    {profile?.role?.name || 'ڕۆڵی نەناسراو'}
                  </p>
                </div>

                {/* Theme Toggle Section */}
                <div className="mb-8">
                  <h4
                    className="text-sm font-semibold mb-4 text-center"
                    style={{
                      color: 'var(--theme-sidebar-text)',
                      fontFamily: 'var(--font-uni-salar)'
                    }}
                  >
                    دیاریکردنی ڕەنگ
                  </h4>
                  <div className="flex justify-center gap-3">
                    {[
                      { key: 'white', icon: '☀️', name: 'سپی', color: '#ffffff' },
                      { key: 'colourful', icon: '🌈', name: 'ڕەنگاوڕەنگ', color: '#ff6b6b' },
                      { key: 'black-gold', icon: '👑', name: 'زێڕین', color: '#D4AF37' },
                      { key: 'dark', icon: '🌙', name: 'تاریک', color: '#374151' }
                    ].map((themeOption) => (
                      <button
                        key={themeOption.key}
                        onClick={() => {
                          // This would normally call setTheme, but since we don't have access to theme context here,
                          // we'll just show the UI for now
                          console.log('Theme change requested:', themeOption.key)
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all duration-200 hover:scale-110 shadow-sm"
                        style={{
                          backgroundColor: themeOption.color,
                          color: themeOption.key === 'white' ? '#000000' : '#ffffff'
                        }}
                        title={themeOption.name}
                      >
                        {themeOption.icon}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-xs font-medium" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                      ڕەنگە هەڵبژێردراوەکان
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <div className="mt-auto">
                  <button
                    onClick={() => {
                      setShowUserSidebar(false)
                      handleSignOut()
                    }}
                    className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                    style={{
                      background: 'var(--theme-sidebar-hover)',
                      color: 'var(--theme-sidebar-text)',
                      fontFamily: 'var(--font-uni-salar)'
                    }}
                  >
                    🚪 دەرچوون
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}