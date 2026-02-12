'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'white' | 'colorful' | 'purple' | 'dark'

interface ThemeConfig {
  name: string
  background: string
  foreground: string
  cardBg: string
  cardBorder: string
  primary: string
  secondary: string
  accent: string
  muted: string
  border: string
  sidebarBg: string
  sidebarText: string
  sidebarHover: string
  chartColor: string
}

const themes: Record<Theme, ThemeConfig> = {
  white: {
    name: 'White Mode',
    background: '#ffffff',
    foreground: '#000000',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    cardBorder: '#e5e7eb',
    primary: '#1f2937',
    secondary: '#6b7280',
    accent: '#3b82f6',
    muted: '#f9fafb',
    border: '#d1d5db',
    sidebarBg: '#ffffff',
    sidebarText: '#374151',
    sidebarHover: '#f3f4f6',
    chartColor: '#10b981'
  },
  colorful: {
    name: 'Colorful Mode',
    background: 'linear-gradient(to right, #ffecd2, #fcb69f)',
    foreground: '#000000',
    cardBg: 'rgba(255, 255, 255, 0.7)',
    cardBorder: 'rgba(255, 255, 255, 0.4)',
    primary: '#312e81',
    secondary: '#1f2937',
    accent: '#ff6b6b',
    muted: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.3)',
    sidebarBg: 'rgba(255, 255, 255, 0.95)',
    sidebarText: '#4c1d95',
    sidebarHover: 'rgba(255, 255, 255, 0.8)',
    chartColor: '#ff6b6b'
  },
  purple: {
    name: 'Purple Mode',
    background: 'linear-gradient(135deg, #6b21a8 0%, #4c1d95 100%)',
    foreground: '#ffffff',
    cardBg: 'rgba(255, 255, 255, 0.15)',
    cardBorder: 'rgba(255, 255, 255, 0.3)',
    primary: '#ffffff',
    secondary: '#e9d5ff',
    accent: '#c084fc',
    muted: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.2)',
    sidebarBg: 'rgba(0, 0, 0, 0.2)',
    sidebarText: '#ffffff',
    sidebarHover: 'rgba(255, 255, 255, 0.1)',
    chartColor: '#a78bfa'
  },
  dark: {
    name: 'Dark Mode',
    background: '#0a192f',
    foreground: '#ffffff',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    primary: '#ffffff',
    secondary: '#9ca3af',
    accent: '#60a5fa',
    muted: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.1)',
    sidebarBg: 'rgba(0, 0, 0, 0.3)',
    sidebarText: '#d1d5db',
    sidebarHover: 'rgba(255, 255, 255, 0.1)',
    chartColor: '#10b981'
  }
}

interface ThemeContextType {
  theme: Theme
  themeConfig: ThemeConfig
  setTheme: (theme: Theme) => void
  themes: Record<Theme, ThemeConfig>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Load theme from localStorage on mount
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('pos-theme') as Theme
      return (savedTheme && themes[savedTheme]) ? savedTheme : 'white'
    }
    return 'white'
  })

  // Apply theme to CSS variables and document
  useEffect(() => {
    const config = themes[theme]

    // Set CSS custom properties
    const root = document.documentElement
    root.style.setProperty('--theme-background', config.background)
    root.style.setProperty('--theme-foreground', config.foreground)
    root.style.setProperty('--theme-card-bg', config.cardBg)
    root.style.setProperty('--theme-card-border', config.cardBorder)
    root.style.setProperty('--theme-primary', config.primary)
    root.style.setProperty('--theme-secondary', config.secondary)
    root.style.setProperty('--theme-accent', config.accent)
    root.style.setProperty('--theme-muted', config.muted)
    root.style.setProperty('--theme-border', config.border)
    root.style.setProperty('--theme-sidebar-bg', config.sidebarBg)
    root.style.setProperty('--theme-sidebar-text', config.sidebarText)
    root.style.setProperty('--theme-sidebar-hover', config.sidebarHover)
    root.style.setProperty('--theme-chart-color', config.chartColor)

    // Set background for body
    if (config.background.includes('gradient')) {
      document.body.style.background = config.background
    } else {
      document.body.style.backgroundColor = config.background
    }
    document.body.style.color = config.foreground

    // Save to localStorage
    localStorage.setItem('pos-theme', theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const value = {
    theme,
    themeConfig: themes[theme],
    setTheme,
    themes
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
