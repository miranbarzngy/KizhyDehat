'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Store } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface UserProfilePopupProps {
  isOpen: boolean
  onClose: () => void
  shopSettings: {
    shopname: string
    icon: string
  } | null
}

const themeOptions = [
  { key: 'white', name: 'سپی', color: '#ffffff', textColor: '#000000' },
  { key: 'colourful', name: 'ڕەنگاوڕەنگ', color: '#ff6b6b', textColor: '#ffffff' },
  { key: 'black-gold', name: 'زێڕین', color: '#D4AF37', textColor: '#ffffff' },
  { key: 'dark', name: 'تاریک', color: '#374151', textColor: '#ffffff' }
]

export default function UserProfilePopup({ isOpen, onClose, shopSettings }: UserProfilePopupProps) {
  const { user, profile, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    onClose()
  }

  const handleThemeChange = (themeKey: string) => {
    const root = document.documentElement
    
    switch (themeKey) {
      case 'white':
        root.style.setProperty('--theme-background', '#f8fafc')
        root.style.setProperty('--theme-foreground', '#1e293b')
        root.style.setProperty('--theme-sidebar-bg', '#ffffff')
        root.style.setProperty('--theme-sidebar-text', '#1e293b')
        root.style.setProperty('--theme-sidebar-hover', '#f1f5f9')
        root.style.setProperty('--theme-primary', '#6366f1')
        root.style.setProperty('--theme-secondary', '#64748b')
        break
      case 'colourful':
        root.style.setProperty('--theme-background', 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)')
        root.style.setProperty('--theme-foreground', '#2d3748')
        root.style.setProperty('--theme-sidebar-bg', 'rgba(255, 255, 255, 0.9)')
        root.style.setProperty('--theme-sidebar-text', '#2d3748')
        root.style.setProperty('--theme-sidebar-hover', 'rgba(255, 255, 255, 0.5)')
        root.style.setProperty('--theme-primary', '#ff6b6b')
        root.style.setProperty('--theme-secondary', '#718096')
        break
      case 'black-gold':
        root.style.setProperty('--theme-background', 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)')
        root.style.setProperty('--theme-foreground', '#f5f5f5')
        root.style.setProperty('--theme-sidebar-bg', 'rgba(30, 30, 30, 0.95)')
        root.style.setProperty('--theme-sidebar-text', '#f5f5f5')
        root.style.setProperty('--theme-sidebar-hover', 'rgba(212, 175, 55, 0.2)')
        root.style.setProperty('--theme-primary', '#D4AF37')
        root.style.setProperty('--theme-secondary', '#a0aec0')
        break
      case 'dark':
        root.style.setProperty('--theme-background', '#111827')
        root.style.setProperty('--theme-foreground', '#f9fafb')
        root.style.setProperty('--theme-sidebar-bg', '#1f2937')
        root.style.setProperty('--theme-sidebar-text', '#f9fafb')
        root.style.setProperty('--theme-sidebar-hover', '#374151')
        root.style.setProperty('--theme-primary', '#6366f1')
        root.style.setProperty('--theme-secondary', '#9ca3af')
        break
    }
    
    localStorage.setItem('pos-theme', themeKey)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-transparent z-40"
          />

          {/* Popup Modal - Top Right Position */}
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-16 right-4 w-72 z-50"
            style={{ 
              background: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-black/8 text-sm"
              style={{ color: 'var(--theme-sidebar-text)' }}
            >
              ✕
            </button>

            <div className="flex flex-col items-center p-4">
              {/* Shop Branding Section */}
              <div className="flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center overflow-hidden bg-white"
                >
                  {shopSettings?.icon && shopSettings.icon.trim() !== '' ? (
                    <img
                      src={shopSettings.icon}
                      alt="Shop Logo"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <Store 
                      className="w-5 h-5" 
                      style={{ color: 'var(--theme-sidebar-text)' }}
                    />
                  )}
                </div>
                <h2 
                  className="text-sm font-bold text-center mt-2"
                  style={{ 
                    color: 'var(--theme-sidebar-text)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  {shopSettings?.shopname || 'فرۆشگای کوردستان'}
                </h2>
              </div>

              {/* Divider */}
              <div className="h-px w-full my-3" style={{ background: 'rgba(0, 0, 0, 0.08)' }} />

              {/* User Profile Section */}
              <div className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'var(--theme-sidebar-hover)',
                    color: 'var(--theme-sidebar-text)'
                  }}
                >
                  {profile?.image && profile.image.trim() !== '' ? (
                    <img
                      src={profile.image}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="text-base font-bold"
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
                  className="text-sm font-bold text-center mt-2"
                  style={{
                    color: 'var(--theme-sidebar-text)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  {profile?.name || user?.email?.split('@')[0] || 'بەکارهێنەر'}
                </h3>
                <p 
                  className="text-xs opacity-70 text-center"
                  style={{
                    color: 'var(--theme-secondary)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  {profile?.role?.name || 'ڕۆڵی نەناسراو'}
                </p>
              </div>

              {/* Divider */}
              <div className="h-px w-full my-3" style={{ background: 'rgba(0, 0, 0, 0.08)' }} />

              {/* Theme Section */}
              <div className="flex flex-col items-center">
                <h4 
                  className="text-xs font-semibold text-center mb-2"
                  style={{
                    color: 'var(--theme-sidebar-text)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  ڕووکار
                </h4>
                <div className="flex justify-center gap-2">
                  {themeOptions.map((theme) => (
                    <button
                      key={theme.key}
                      onClick={() => handleThemeChange(theme.key)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-200 hover:scale-110 shadow-md"
                      style={{
                        backgroundColor: theme.color,
                        color: theme.textColor,
                      }}
                      title={theme.name}
                    >
                      {theme.key === 'white' && '☀️'}
                      {theme.key === 'colourful' && '🌈'}
                      {theme.key === 'black-gold' && '👑'}
                      {theme.key === 'dark' && '🌙'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full py-2 px-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center gap-2 mt-3"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-uni-salar)'
                }}
              >
                <span>🚪</span>
                <span>چوونە دەرەوە</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
