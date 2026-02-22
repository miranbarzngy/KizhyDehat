'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Theme, useTheme } from '@/contexts/ThemeContext'
import { getSupabase } from '@/lib/supabase'
import { logActivity } from '@/lib/activityLogger'
import { motion } from 'framer-motion'
import { Crown, LogOut, Moon, Palette, PlusCircle, Sun, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

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

interface ProfileData {
  id: string
  name: string | null
  image: string | null
  role_id: string | null
  role?: {
    name: string
    permissions: Record<string, boolean>
  }
}

export default function Sidebar({ shopSettings, isOpen, onClose }: SidebarProps) {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use profile from AuthContext directly
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow profile to load from auth context
      const timer = setTimeout(() => {
        setLoading(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, profile])

  // Use profile from auth context
  const displayName = profile?.name || user?.email?.split('@')[0] || 'بەکارهێنەر'
  const displayImage = profile?.image || null
  const displayRole = profile?.role?.name || 'ڕۆڵی نەناسراو'

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // Handle profile image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('تکایە وێنەیەکی دروستختار هەڵبژێرە (JPEG, PNG, WebP)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('وێنەکە گەورەیە (زیاتر لە 5MB)')
      return
    }

    setUploading(true)

    try {
      const supabase = getSupabase()
      if (!supabase) {
        alert('Supabase not configured')
        return
      }

      // Create unique filename: profile_{userId}_{timestamp}.{ext}
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `profile_${user.id}_${Date.now()}.${fileExt}`

      // Upload to profile-images bucket
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('هەڵە لە ئەپلۆدکردنی وێنە')
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName)

      if (!urlData?.publicUrl) {
        alert('هەڵە لە وەرگرتنی URL')
        return
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ image: urlData.publicUrl })
        .eq('id', user.id)

      if (updateError) {
        console.error('Update error:', updateError)
        alert('هەڵە لە نوێکردنەوەی پرۆفایل')
        return
      }

      // Log activity
      await logActivity(
        null,
        null,
        'update_user',
        'گۆڕینی وێنەی پرۆفایل',
        'user',
        user.id
      )

      // Update local profile state - manually trigger a refresh
      // The auth context will automatically pick up changes on next refresh
      window.location.reload()

    } catch (error) {
      console.error('Error uploading image:', error)
      alert('هەڵە')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
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
          background: 'var(--theme-sidebar-bg)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid var(--theme-border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div className="p-4 flex flex-col gap-4">
          {/* User Profile Section */}
          <div className="flex flex-col items-center py-3">
            {/* Avatar with add-circle style border */}
            <div className="relative">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <div 
                className="w-20 h-20 rounded-full p-1 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
                }}
              >
              <div 
                className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: 'var(--theme-card-bg)' }}
              >
                {loading || uploading ? (
                  <div 
                    className="w-8 h-8 border-2 rounded-full animate-spin"
                    style={{ 
                      borderColor: 'var(--theme-border)',
                      borderTopColor: 'var(--theme-primary)'
                    }}
                  />
                  ) : displayImage && displayImage.trim() !== '' ? (
                    <img
                      src={displayImage}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span 
                      className="text-2xl font-bold"
                      style={{ 
                        color: 'var(--theme-primary)',
                        fontFamily: 'var(--font-uni-salar)'
                      }}
                    >
                      {displayName?.charAt(0)?.toUpperCase() || 'ب'}
                    </span>
                  )}
                </div>
              </div>
              {/* Add circle indicator - clickable */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-md disabled:opacity-50"
                style={{
                  background: 'black',
                  color: 'white',
                }}
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <PlusCircle className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {/* User Name */}
            <h3 
              className="text-base font-bold mt-3 text-center"
              style={{
                color: 'var(--theme-sidebar-text)',
                fontFamily: 'var(--font-uni-salar)'
              }}
            >
              {loading ? '...' : displayName}
            </h3>
            
            {/* User Role */}
            <div 
              className="mt-1 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                
                color: 'var(--theme-sidebar-text)',
                fontFamily: 'var(--font-uni-salar)'
              }}
            >
              {loading ? '...' : displayRole}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px" style={{ backgroundColor: 'var(--theme-border)' }} />

          {/* Header with Close button */}
          <div className="flex items-center justify-between pt-2">
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
              className="p-1.5 rounded-full transition-colors"
              style={{ 
                color: 'var(--theme-sidebar-text)',
                backgroundColor: 'var(--theme-sidebar-hover)'
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Theme Toggle Section */}
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
          <div className="h-px" style={{ backgroundColor: 'var(--theme-border)' }} />

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
              background: 'var(--theme-muted)',
              color: '#dc2626',
              fontFamily: 'var(--font-uni-salar)',
              border: '1px solid var(--theme-border)'
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
