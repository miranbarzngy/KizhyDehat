'use client'

import { Theme, useTheme } from '@/contexts/ThemeContext'
import { useEffect, useRef, useState } from 'react'

const themeIcons = {
  white: '☀️',
  colorful: '🎨',
  purple: '👑',
  dark: '🌙'
}

const themeNames = {
  white: 'سپی',
  colorful: 'ڕەنگاوڕەنگ',
  purple: 'مۆر',
  dark: 'تاریک'
}

const themeColors = {
  white: '#ffffff',
  colorful: '#ff6b6b',
  purple: '#6b21a8',
  dark: '#374151'
}

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleThemeChange = (newTheme: Theme) => {
    console.log('🎨 ThemeToggle clicked:', newTheme)
    // Direct theme change - instant update via DOM manipulation
    setTheme(newTheme)
    setIsOpen(false)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="fixed top-4 left-4 z-50" ref={menuRef}>
      {/* Theme Toggle Button - Opens menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-lg border border-white/30 shadow-lg flex items-center justify-center text-lg"
        title="دیاریکردنی ڕەنگ - Theme Settings"
      >
        🎨
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-12 left-0 bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30 shadow-2xl min-w-[200px]">
          <h3 className="text-sm font-bold text-center mb-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
            دیاریکردنی ڕەنگ
          </h3>

          <div className="flex justify-center gap-3 mb-3">
            {(Object.keys(themeColors) as Theme[]).map((themeKey) => (
              <button
                key={themeKey}
                onClick={() => handleThemeChange(themeKey)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200 hover:scale-110 shadow-sm ${
                  theme === themeKey ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''
                }`}
                style={{
                  backgroundColor: themeColors[themeKey],
                  color: themeKey === 'white' ? '#000000' : '#ffffff',
                  boxShadow: theme === themeKey ? `0 0 12px ${themeColors[themeKey]}60` : 'none'
                }}
                title={`${themeNames[themeKey]} (${themeKey})`}
              >
                {themeIcons[themeKey]}
              </button>
            ))}
          </div>

          <div className="text-center border-t border-white/20 pt-2">
            <span className="text-xs font-medium" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
              {themeNames[theme]}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
