'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { Store } from 'lucide-react'

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
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
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
            onClick={onClose}
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
              <span 
                className="text-xs font-medium" 
                style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}
              >
                ڕەنگە هەڵبژێردراوەکان
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-auto">
            <button
              onClick={() => {
                onClose()
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
  )
}
