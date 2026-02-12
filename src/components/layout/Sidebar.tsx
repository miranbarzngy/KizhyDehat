'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { Store, LogOut, X, Sun, Moon, Palette, Crown } from 'lucide-react'
import { motion } from 'framer-motion'

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
  { key: 'purple', name: 'پەڕە سوورەکان', color: '#6b21a8', textColor: '#ffffff', icon: Crown },
  { key: 'dark', name: 'تاریک', color: '#374151', textColor: '#ffffff', icon: Moon }
]

export default function Sidebar({ shopSettings, isOpen, onClose }: SidebarProps) {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const sidebarRef = useRef<HTMLDivElement>(null)

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
        className="fixed top-4 right-4 w-72 max-h-[50vh] z-50 shadow-2xl overflow-hidden rounded-3xl"
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

          {/* Theme Toggle Section */}
          <div className="flex flex-wrap justify-center gap-3">
            {themeOptions.map((themeOption) => {
              const Icon = themeOption.icon
              return (
                <motion.button
                  key={themeOption.key}
                  onClick={() => {
                    const root = document.documentElement
                    switch (themeOption.key) {
                      case 'white':
                        root.style.setProperty('--theme-background', '#f8fafc')
                        root.style.setProperty('--theme-foreground', '#000000')
                        root.style.setProperty('--theme-sidebar-bg', '#ffffff')
                        root.style.setProperty('--theme-sidebar-text', '#1e293b')
                        root.style.setProperty('--theme-sidebar-hover', '#f1f5f9')
                        root.style.setProperty('--theme-primary', '#6366f1')
                        break
                      case 'colorful':
                        root.style.setProperty('--theme-background', 'linear-gradient(to right, #ffecd2, #fcb69f)')
                        root.style.setProperty('--theme-foreground', '#000000')
                        root.style.setProperty('--theme-sidebar-bg', 'rgba(255, 255, 255, 0.9)')
                        root.style.setProperty('--theme-sidebar-text', '#2d3748')
                        root.style.setProperty('--theme-primary', '#ff6b6b')
                        break
                      case 'purple':
                        root.style.setProperty('--theme-background', 'linear-gradient(135deg, #6b21a8 0%, #4c1d95 100%)')
                        root.style.setProperty('--theme-foreground', '#ffffff')
                        root.style.setProperty('--theme-sidebar-bg', 'rgba(0, 0, 0, 0.2)')
                        root.style.setProperty('--theme-sidebar-text', '#ffffff')
                        root.style.setProperty('--theme-primary', '#c084fc')
                        break
                      case 'dark':
                        root.style.setProperty('--theme-background', '#0a192f')
                        root.style.setProperty('--theme-foreground', '#ffffff')
                        root.style.setProperty('--theme-sidebar-bg', 'rgba(0, 0, 0, 0.3)')
                        root.style.setProperty('--theme-sidebar-text', '#d1d5db')
                        root.style.setProperty('--theme-primary', '#60a5fa')
                        break
                    }
                    localStorage.setItem('pos-theme', themeOption.key)
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md border border-white/30"
                  style={{
                    backgroundColor: themeOption.color,
                    color: themeOption.textColor,
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  title={themeOption.name}
                >
                  <Icon className="w-5 h-5" />
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
