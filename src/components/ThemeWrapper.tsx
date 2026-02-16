'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { ReactNode } from 'react'

export default function ThemeWrapper({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  
  // The key={theme} is the magic part that forces a full UI refresh in React
  // This ensures instant theme switching without page refresh
  return (
    <div 
      key={theme} 
      className="min-h-screen transition-all duration-300"
      style={{ 
        background: 'var(--theme-background)',
        color: 'var(--theme-foreground)'
      }}
    >
      {children}
    </div>
  )
}
