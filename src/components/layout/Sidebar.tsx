'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { Store, LogOut, X, Sun, Moon, Palette, Crown, User, PlusCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme, Theme } from '@/contexts/ThemeContext'
import { getSupabase } from '@/lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'

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
  const { user, profile: authProfile, signOut } = useAuth()
  const router = useRouter()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch profile data from Supabase - simplified approach
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      
      const supabase = getSupabase()
      if (!supabase) {
        console.log('No supabase client')
        setLoading(false)
        return
      }

      console.log('Sidebar: Fetching profile for user:', user.id)

      try {
        // First try to get profile from auth context
        if (authProfile && authProfile.name) {
          console.log('Using authProfile:', authProfile)
          setProfileData(authProfile as ProfileData)
          setLoading(false)
          return
        }

        // If not available, fetch from database
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        console.log('Sidebar: Profile query result:', profile, error)
        
        if (profile && !error) {
          // Get role name if role_id exists
          let roleName = 'ڕۆڵی نەناسراو'
          if (profile.role_id) {
            try {
              const { data: roleData } = await supabase
                .from('roles')
                .select('name')
                .eq('id', profile.role_id)
                .single()
              if (roleData?.name) {
                roleName = roleData.name
              }
            } catch (roleError) {
              console.log('Role fetch error:', roleError)
            }
          }

          const transformedProfile: ProfileData = {
            id: profile.id,
            name: profile.name || null,
            image: profile.image || null,
            role_id: profile.role_id || null,
            role: { name: roleName, permissions: {} }
          }
          
          console.log('Sidebar: Transformed profile:', transformedProfile)
          setProfileData(transformedProfile)
        } else {
          console.log('Sidebar: No profile found, using user email')
          // No profile exists yet - use user email as fallback
          setProfileData({
            id: user.id,
            name: user.email?.split('@')[0] || null,
            image: null,
            role_id: null,
            role: { name: 'ڕۆڵی نەناسراو', permissions: {} }
          })
        }
      } catch (err) {
        console.error('Sidebar: Profile fetch error:', err)
        // Fallback to email
        setProfileData({
          id: user.id,
          name: user.email?.split('@')[0] || null,
          image: null,
          role_id: null,
          role: { name: 'ڕۆڵی نەناسراو', permissions: {} }
        })
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchProfile()
    }
  }, [user, isOpen, authProfile])

  // Use profileData as primary source (loaded from DB)
  const displayName = profileData?.name || user?.email?.split('@')[0] || 'بەکارهێنەر'
  const displayImage = profileData?.image || null
  const displayRole = profileData?.role?.name || 'ڕۆڵی نەناسراو'

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
          {/* User Profile Section */}
          <div className="flex flex-col items-center py-3">
            {/* Avatar with add-circle style border */}
            <div className="relative">
              <div 
                className="w-20 h-20 rounded-full p-1 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
                }}
              >
                <div 
                  className="w-full h-full rounded-full bg-white/90 flex items-center justify-center overflow-hidden"
                >
                  {loading ? (
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
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
              {/* Add circle indicator */}
              <div 
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                style={{
                  background: 'var(--theme-primary)',
                  color: 'white'
                }}
              >
                <PlusCircle className="w-4 h-4" />
              </div>
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
                background: 'var(--theme-primary)',
                color: 'white',
                fontFamily: 'var(--font-uni-salar)'
              }}
            >
              {loading ? '...' : displayRole}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-black/10" />

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
              className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
              style={{ color: 'var(--theme-sidebar-text)' }}
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
