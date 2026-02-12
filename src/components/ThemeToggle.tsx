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
  purple: 'پەڕە سوورەکان',
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
      {/* Main Toggle Button */}
  

      {/* Slide-out Menu */}
      <div
        className={`absolute top-0 left-16 transition-all duration-500 ease-out ${
          isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-3 border border-white/30 shadow-2xl min-w-[180px]">
          <h3 className="text-xs font-bold text-center mb-2" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
            دیاریکردنی ڕەنگ
          </h3>

          <div className="flex justify-center gap-2">
            {(Object.keys(themeColors) as Theme[]).map((themeKey) => (
              <button
                key={themeKey}
                onClick={() => handleThemeChange(themeKey)}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm transition-all duration-200 hover:scale-110 shadow-sm ${
                  theme === themeKey ? 'ring-1 ring-white ring-offset-1 ring-offset-transparent' : ''
                }`}
                style={{
                  backgroundColor: themeColors[themeKey],
                  color: themeKey === 'white' ? '#000000' : '#ffffff',
                  boxShadow: theme === themeKey ? `0 0 8px ${themeColors[themeKey]}40` : 'none'
                }}
                title={themeNames[themeKey]}
              >
                {themeIcons[themeKey]}
              </button>
            ))}
          </div>

          <div className="mt-3 text-center">
            <span className="text-xs font-medium" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
              {themeNames[theme]}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
