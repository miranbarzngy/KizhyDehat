'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, createContext, useContext, ReactNode, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Store, Camera } from 'lucide-react'
import { Theme, useTheme } from '@/contexts/ThemeContext'

// Shop Settings Context
interface ShopSettings {
  id: string
  shop_name: string
  logo_url: string
  address: string
  currency: string
  tax_rate: number
}

interface ShopSettingsContextType {
  shopSettings: ShopSettings | null
  refreshShopSettings: () => Promise<void>
}

const ShopSettingsContext = createContext<ShopSettingsContextType | undefined>(undefined)

export const useShopSettings = () => {
  const context = useContext(ShopSettingsContext)
  if (context === undefined) {
    throw new Error('useShopSettings must be used within a ShopSettingsProvider')
  }
  return context
}

function ShopSettingsProvider({ children }: { children: ReactNode }) {
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)

  const fetchShopSettings = async () => {
    // Demo mode: show sample shop settings data when Supabase is not configured
    if (!supabase) {
      const demoSettings: ShopSettings = {
        id: 'demo-shop',
        shop_name: 'سیستمی فرۆشتن',
        logo_url: '',
        address: 'هەولێر، کوردستان',
        currency: 'IQD',
        tax_rate: 0
      }
      setShopSettings(demoSettings)
      updateDocumentBranding(demoSettings)
      return
    }

    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error

      const settings = data || {
        id: 'default-shop',
        shop_name: 'سیستمی فرۆشتن',
        logo_url: '',
        address: 'هەولێر، کوردستان',
        currency: 'IQD',
        tax_rate: 0
      }

      setShopSettings(settings)
      updateDocumentBranding(settings)
    } catch (error) {
      console.error('Error fetching shop settings:', error)
      // Fallback to default settings
      const defaultSettings: ShopSettings = {
        id: 'default-shop',
        shop_name: 'سیستمی فرۆشتن',
        logo_url: '',
        address: 'هەولێر، کوردستان',
        currency: 'IQD',
        tax_rate: 0
      }
      setShopSettings(defaultSettings)
      updateDocumentBranding(defaultSettings)
    }
  }

  const updateDocumentBranding = (settings: ShopSettings) => {
    // Update document title
    document.title = settings.shop_name || 'سیستمی فرۆشتن'

    // Update favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (favicon) {
      if (settings.logo_url && settings.logo_url.trim() !== '') {
        favicon.href = settings.logo_url
      } else {
        // Default favicon - Click Group logo
        favicon.href = '/favicon.ico' // or your default favicon path
      }
    }
  }

  const refreshShopSettings = async () => {
    await fetchShopSettings()
  }

  useEffect(() => {
    fetchShopSettings()
  }, [])

  return (
    <ShopSettingsContext.Provider value={{ shopSettings, refreshShopSettings }}>
      {children}
    </ShopSettingsContext.Provider>
  )
}

const menuItems = [
  { name: 'داشبۆرد', href: '/dashboard', icon: '📊' },
  { name: 'فرۆشتن', href: '/dashboard/sales', icon: '💰', permission: 'sales' },
  { name: 'کۆگا', href: '/dashboard/inventory', icon: '📦', permission: 'inventory' },
  { name: 'کڕیاران', href: '/dashboard/customers', icon: '👥', permission: 'customers' },
  { name: 'دابینکەران', href: '/dashboard/suppliers', icon: '🏭', permission: 'suppliers' },
  { name: 'فاکتورەکان', href: '/dashboard/invoices', icon: '🧾', permission: 'sales' },
  { name: 'خەرجییەکان', href: '/dashboard/expenses', icon: '💸', permission: 'expenses' },
  { name: 'قازانج', href: '/dashboard/profits', icon: '📈', permission: 'profits' },
  { name: 'یارمەتی', href: '/dashboard/help', icon: '❓', adminOnly: true },
  { name: 'بەڕێوەبەران', href: '/dashboard/admin', icon: '⚙️', adminOnly: true },
]

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { shopSettings } = useShopSettings()
  const { theme, setTheme } = useTheme()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [userPopupOpen, setUserPopupOpen] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const themeIcons = {
    white: '☀️',
    colourful: '🌈',
    'black-gold': '👑',
    dark: '🌙'
  }

  const themeNames = {
    white: 'سپی',
    colourful: 'ڕەنگاوڕەنگ',
    'black-gold': 'زێڕین',
    dark: 'تاریک'
  }

  const themeColors = {
    white: '#ffffff',
    colourful: '#ff6b6b',
    'black-gold': '#D4AF37',
    dark: '#374151'
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
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
  // Check for admin access - support role ID, Kurdish, English role names, case-insensitive
  const isAdmin = profile?.role_id === '6dc4d359-8907-4815-baa7-9e003b662f2a' ||
                  profile?.role?.name?.toLowerCase() === 'ئادمین' ||
                  profile?.role?.name?.toLowerCase() === 'admin' ||
                  profile?.role?.name?.toLowerCase() === 'administrator' ||
                  !profile?.role || user // Fallback for recovery

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly) return isAdmin
    if (item.permission) return permissions[item.permission as keyof typeof permissions]
    return true
  })

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setUploadingImage(true)
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `profiles/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images') // Using existing bucket
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) throw new Error('Failed to get public URL')

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ image: urlData.publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Refresh profile data to update UI
      await refreshProfile()

    } catch (error) {
      console.error('Error uploading image:', error)
      alert(`هەڵە لە بارکردنی وێنە: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploadingImage(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--theme-background)', color: 'var(--theme-foreground)' }}>
      {/* Top Navigation Bar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16 relative">
            {/* Logo and Shop Name - Clickable - Positioned on the right */}
            <button
              onClick={() => setUserPopupOpen(!userPopupOpen)}
              className="absolute right-0 flex items-center pr-4 hover:opacity-80 transition-opacity"
            >
              <div className="flex flex-col items-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg flex items-center justify-center">
                  {(shopSettings?.logo_url && shopSettings.logo_url.trim() !== '') ? (
                    <img
                      src={shopSettings.logo_url}
                      alt="Shop Logo"
                      className="w-6 h-6 object-cover rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <Store
                    className={`w-6 h-6 text-white ${shopSettings?.logo_url && shopSettings.logo_url.trim() !== '' ? 'hidden' : ''}`}
                  />
                </div>
                <h1 className="text-sm font-bold text-gray-800 hidden sm:block text-center" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  {shopSettings?.shop_name || 'سیستمی فرۆشتن'}
                </h1>
              </div>
            </button>

            {/* Navigation - Centered on all screens */}
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
              {filteredMenuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-all duration-200 group flex-shrink-0 ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm mb-1 transition-all duration-200 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 group-hover:bg-blue-100 group-hover:text-blue-600'
                    }`}>
                      {item.icon}
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>



            {/* User/Shop Popup */}
            {userPopupOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                  onClick={() => setUserPopupOpen(false)}
                />

                {/* Popup */}
                <div className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  {/* User Profile Section - Top */}
                  <div className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-visible mb-3">
                        {uploadingImage ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          </div>
                        ) : profile?.image ? (
                          <img
                            src={profile.image}
                            alt="User Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">👤</span>
                        )}

                        {/* Pin overlay */}
                        <button
                          onClick={handleCameraClick}
                          disabled={uploadingImage}
                          className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-12 h-12 bg-blue-500 border-4 border-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50 z-50"
                          title="گۆڕینی وێنە"
                          style={{ fontFamily: 'var(--font-uni-salar)' }}
                        >
                          <Camera className="w-5 h-5 text-white" />
                        </button>
                      </div>

                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />

                      <div>
                        <h4 className="font-medium text-gray-800 text-base" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          {profile?.name || user?.email?.split('@')[0] || 'بەکارهێنەر'}
                        </h4>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          {profile?.role?.name || 'ڕۆڵی نەناسراو'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100"></div>

                  {/* Theme Options Section */}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 text-center" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      دیاریکردنی ڕەنگ
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(Object.keys(themeColors) as Theme[]).map((themeKey) => (
                        <button
                          key={themeKey}
                          onClick={() => handleThemeChange(themeKey)}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                            theme === themeKey
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-lg mb-1 shadow-sm"
                            style={{
                              backgroundColor: themeColors[themeKey],
                              color: themeKey === 'white' ? '#000000' : '#ffffff'
                            }}
                          >
                            {themeIcons[themeKey]}
                          </div>
                          <span className="text-xs font-medium text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            {themeNames[themeKey]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100"></div>

                  {/* Logout Button - Bottom */}
                  <div className="p-4">
                    <button
                      onClick={() => {
                        handleSignOut()
                        setUserPopupOpen(false)
                      }}
                      className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <span className="mr-2">🚪</span>
                      دەرچوون
                    </button>

                    {/* Install Button for Mobile */}
                    {showInstallButton && (
                      <div className="mt-2">
                        <button
                          onClick={handleInstallClick}
                          className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          <span className="mr-2">📱</span>
                          دامەزراندنی ئەپ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
          </>
        )}
      </nav>

      {/* Main content */}
      <main className="min-h-screen pt-6 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ShopSettingsProvider>
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </ShopSettingsProvider>
  )
}