'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function ThemeSync() {
  const { setTheme } = useTheme()
  const searchParams = useSearchParams()
  const themeParam = searchParams?.get('theme')

  useEffect(() => {
    if (themeParam && ['white', 'colorful', 'purple', 'dark'].includes(themeParam)) {
      setTheme(themeParam as 'white' | 'colorful' | 'purple' | 'dark')
      // Clean URL without refresh
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [themeParam, setTheme])

  return null
}
