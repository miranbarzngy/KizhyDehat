'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface ShopSettings {
  id: string
  shopname: string
  icon: string
  phone: string
  location: string
  qrcodeimage: string
}

interface ShopSettingsContextType {
  shopSettings: ShopSettings | null
  loading: boolean
  refreshSettings: () => Promise<void>
}

const ShopSettingsContext = createContext<ShopSettingsContextType | undefined>(undefined)

// Cache with timestamp for staleness detection
let cachedSettings: ShopSettings | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes - settings don't change often

export function ShopSettingsProvider({ children }: { children: ReactNode }) {
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch shop settings with caching
  const fetchSettings = useCallback(async (force = false) => {
    // Return cached data if still valid
    if (!force && cachedSettings && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      setShopSettings(cachedSettings)
      setLoading(false)
      return
    }

    setLoading(true)

    if (!supabase) {
      // Demo mode fallback
      const demoSettings: ShopSettings = {
        id: 'demo-shop',
        shopname: 'فرۆشگای کوردستان',
        icon: '',
        phone: '+964 750 123 4567',
        location: 'هەولێر، کوردستان',
        qrcodeimage: ''
      }
      cachedSettings = demoSettings
      cacheTimestamp = Date.now()
      setShopSettings(demoSettings)
      setLoading(false)
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

      if (data) {
        const settings: ShopSettings = {
          id: data.id,
          shopname: data.shopname || 'فرۆشگای کوردستان',
          icon: data.icon || '',
          phone: data.phone || '',
          location: data.location || '',
          qrcodeimage: data.qrcodeimage || ''
        }
        
        cachedSettings = settings
        cacheTimestamp = Date.now()
        setShopSettings(settings)
      }
    } catch (error) {
      // Keep cached data if available, otherwise use demo
      if (cachedSettings) {
        setShopSettings(cachedSettings)
      } else {
        const demoSettings: ShopSettings = {
          id: 'demo-shop',
          shopname: 'فرۆشگای کوردستان',
          icon: '',
          phone: '+964 750 123 4567',
          location: 'هەولێر، کوردستان',
          qrcodeimage: ''
        }
        cachedSettings = demoSettings
        cacheTimestamp = Date.now()
        setShopSettings(demoSettings)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch ONLY - no visibility listeners to avoid re-renders
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return (
    <ShopSettingsContext.Provider value={{ shopSettings, loading, refreshSettings: fetchSettings }}>
      {children}
    </ShopSettingsContext.Provider>
  )
}

export function useShopSettings() {
  const context = useContext(ShopSettingsContext)
  
  if (!context) {
    // Return demo settings if context not available
    return {
      shopSettings: {
        id: 'demo-shop',
        shopname: 'فرۆشگای کوردستان',
        icon: '',
        phone: '+964 750 123 4567',
        location: 'هەولێر، کوردستان',
        qrcodeimage: ''
      },
      loading: false,
      refreshSettings: async () => {}
    }
  }
  
  return context
}
