'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { Store, LogOut, X, Sun, Moon, Palette, Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme, Theme } from '@/contexts/ThemeContext'

interface SidebarProps {
  shopSettings: {
    id: string
    shopname: string
    icon: string
    phone: string
    location: string
    qrcodeimage: string
  } | null
  isOpen: boolean
  onClose: () => void
}

const themeOptions = [
  { key: 'white', name: 'سپی', color: '#ffffff', textColor: '#000000', icon: Sun },
  { key: 'colorful', name: 'ڕەنگاوڕەنگ', color: '#ff6b6b', textColor: '#ffffff', icon: Palette },
  { key: 'purple', name: 'مۆر', color: '#6b21a8', textColor: '#ffffff', icon: Crown },
  { key: 'dark', name: 'تاریک', color: '#374151', textColor: '#ffffff', icon: Moon }
]

export default function Sidebar({ shopSettings, isOpen, onClose }: SidebarProps) {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/10 z-40"
        onClick={onClose}
      />

      {/* Floating Sidebar Panel */}
      <motion.div
        ref={sidebarRef}
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-4 right-4 w-80 max-h-[50vh] z-50 shadow-2xl overflow-hidden rounded-3xl"
        style={{ 
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div className="p-4 flex flex-col gap-4">
          {/* Header with Close button */}
          <div className="flex items-center justify-between">
            <h4
              className="text-sm font-semibold"
              style={{
                color: 'var(--theme-sidebar-text)',
                fontFamily: 'var(--font-uni-salar)'
              }}
            >
              دیاریکردنی ڕەنگ
            </h4>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
              style={{ color: 'var(--theme-sidebar-text)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Theme Toggle Section - All in one row */}
          <div className="flex justify-between items-start gap-2">
            {themeOptions.map((themeOption) => {
              const Icon = themeOption.icon
              const isSelected = theme === themeOption.key
              return (
                <motion.button
                  key={themeOption.key}
                  onClick={() => {
                    setTheme(themeOption.key as Theme)
                    onClose()
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-1 p-1 rounded-xl transition-all flex-1"
                  title={themeOption.name}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all"
                    style={{
                      backgroundColor: themeOption.color,
                      color: themeOption.textColor,
                      boxShadow: isSelected 
                        ? `0 0 0 3px var(--theme-accent), 0 0 15px ${themeOption.color}` 
                        : 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span 
                    className="text-xs font-medium"
                    style={{ 
                      color: isSelected ? 'var(--theme-accent)' : 'var(--theme-sidebar-text)',
                      fontFamily: 'var(--font-uni-salar)'
                    }}
                  >
                    {themeOption.name}
                  </span>
                </motion.button>
              )
            })}
          </div>

          {/* Divider */}
          <div className="h-px bg-black/10" />

          {/* Logout Button */}
          <motion.button
            onClick={() => {
              onClose()
              handleSignOut()
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#dc2626',
              fontFamily: 'var(--font-uni-salar)',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            <LogOut className="w-4 h-4" />
            دەرچوون
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}
