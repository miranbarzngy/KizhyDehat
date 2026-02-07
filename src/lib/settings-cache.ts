'use client'

import Cookies from 'js-cookie'

export interface ShopSettingsData {
  id: string
  shopname: string
  icon: string
  phone: string
  location: string
  qrcodeimage: string
  [key: string]: any
}

const SETTINGS_CACHE_KEY = 'shop_settings_cache'
const SETTINGS_CACHE_TIMESTAMP = 'shop_settings_timestamp'
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export function getCachedShopSettings(): ShopSettingsData | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = Cookies.get(SETTINGS_CACHE_KEY)
    const timestamp = Cookies.get(SETTINGS_CACHE_TIMESTAMP)

    if (!cached || !timestamp) return null

    const age = Date.now() - parseInt(timestamp)
    if (age > CACHE_DURATION) {
      // Cache expired, clear it
      clearShopSettingsCache()
      return null
    }

    return JSON.parse(cached)
  } catch (error) {
    console.error('Error reading cached shop settings:', error)
    return null
  }
}

export function setCachedShopSettings(settings: ShopSettingsData): void {
  if (typeof window === 'undefined') return

  try {
    Cookies.set(SETTINGS_CACHE_KEY, JSON.stringify(settings), {
      expires: 7, // 7 days
      path: '/',
      sameSite: 'lax'
    })
    Cookies.set(SETTINGS_CACHE_TIMESTAMP, Date.now().toString(), {
      expires: 7,
      path: '/',
      sameSite: 'lax'
    })
  } catch (error) {
    console.error('Error caching shop settings:', error)
  }
}

export function clearShopSettingsCache(): void {
  if (typeof window === 'undefined') return

  Cookies.remove(SETTINGS_CACHE_KEY, { path: '/' })
  Cookies.remove(SETTINGS_CACHE_TIMESTAMP, { path: '/' })
}
