'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'loading' | 'info'
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: Toast['type'], duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showLoading: (message: string) => void
  dismiss: (id: number) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [nextId, setNextId] = useState(1)
  const [theme, setTheme] = useState<string>('white')

  // Get current theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('pos-theme') || 'white'
    setTheme(savedTheme)
    
    // Listen for theme changes
    const handleStorageChange = () => {
      const newTheme = localStorage.getItem('pos-theme') || 'white'
      setTheme(newTheme)
    }
    
    window.addEventListener('storage', handleStorageChange)
    // Also check periodically for theme changes (since page reload changes theme)
    const interval = setInterval(() => {
      const newTheme = localStorage.getItem('pos-theme') || 'white'
      if (newTheme !== theme) {
        setTheme(newTheme)
      }
    }, 500)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Get theme-aware colors
  const getThemeColors = () => {
    switch (theme) {
      case 'purple':
        return {
          successBg: 'rgba(192, 132, 252, 0.25)',
          successBorder: 'rgba(192, 132, 252, 0.5)',
          successText: '#e9d5ff',
          successIcon: '#c084fc',
          errorBg: 'rgba(239, 68, 68, 0.25)',
          errorBorder: 'rgba(239, 68, 68, 0.5)',
          errorText: '#fca5a5',
          infoBg: 'rgba(147, 51, 234, 0.25)',
          infoBorder: 'rgba(147, 51, 234, 0.5)',
          infoText: '#e9d5ff',
        }
      case 'dark':
        return {
          successBg: 'rgba(34, 197, 94, 0.25)',
          successBorder: 'rgba(34, 197, 94, 0.5)',
          successText: '#86efac',
          successIcon: '#22c55e',
          errorBg: 'rgba(239, 68, 68, 0.25)',
          errorBorder: 'rgba(239, 68, 68, 0.5)',
          errorText: '#fca5a5',
          infoBg: 'rgba(96, 165, 250, 0.25)',
          infoBorder: 'rgba(96, 165, 250, 0.5)',
          infoText: '#bfdbfe',
        }
      case 'colorful':
        return {
          successBg: 'rgba(34, 197, 94, 0.2)',
          successBorder: 'rgba(34, 197, 94, 0.4)',
          successText: '#166534',
          successIcon: '#22c55e',
          errorBg: 'rgba(220, 38, 38, 0.2)',
          errorBorder: 'rgba(220, 38, 38, 0.4)',
          errorText: '#991b1b',
          infoBg: 'rgba(59, 130, 246, 0.2)',
          infoBorder: 'rgba(59, 130, 246, 0.4)',
          infoText: '#1e40af',
        }
      default: // white
        return {
          successBg: 'rgba(34, 197, 94, 0.15)',
          successBorder: 'rgba(34, 197, 94, 0.4)',
          successText: '#166534',
          successIcon: '#22c55e',
          errorBg: 'rgba(239, 68, 68, 0.15)',
          errorBorder: 'rgba(239, 68, 68, 0.4)',
          errorText: '#991b1b',
          infoBg: 'rgba(59, 130, 246, 0.15)',
          infoBorder: 'rgba(59, 130, 246, 0.4)',
          infoText: '#1e40af',
        }
    }
  }

  const colors = getThemeColors()

  const showToast = useCallback((message: string, type: Toast['type'] = 'info', duration: number = 3000) => {
    const id = nextId
    setNextId(prev => prev + 1)
    setToasts(prev => [...prev, { id, message, type, duration }])
    
    // Auto-dismiss after specified duration (except loading)
    if (type !== 'loading') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }, [nextId])

  const showSuccess = useCallback((message: string, duration: number = 2000) => {
    showToast(message, 'success', duration)
  }, [showToast])

  const showError = useCallback((message: string, duration: number = 3000) => {
    showToast(message, 'error', duration)
  }, [showToast])

  const showLoading = useCallback((message: string) => {
    showToast(message, 'loading', 0) // 0 = never auto-dismiss
  }, [showToast])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, showSuccess, showError, showLoading, dismiss, dismissAll }}>
      {children}
      {/* Toast Container - Center Top Position */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-3"
        style={{ fontFamily: 'var(--font-uni-salar)' }}
      >
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md min-w-[320px] max-w-[90vw]"
              style={{
                backgroundColor: toast.type === 'success' ? colors.successBg : 
                                 toast.type === 'error' ? colors.errorBg : 
                                 toast.type === 'loading' ? 'rgba(30, 30, 46, 0.95)' : colors.infoBg,
                border: `1px solid ${toast.type === 'success' ? colors.successBorder : 
                                   toast.type === 'error' ? colors.errorBorder : 
                                   toast.type === 'loading' ? 'rgba(255, 255, 255, 0.2)' : colors.infoBorder}`,
              }}
            >
              {toast.type === 'loading' && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              )}
              {toast.type === 'success' && (
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: colors.successIcon }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {toast.type === 'error' && (
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              {toast.type === 'info' && (
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              <span 
                className="flex-1 text-base font-medium"
                style={{ 
                  color: toast.type === 'loading' ? '#ffffff' : 
                         toast.type === 'success' ? colors.successText : 
                         toast.type === 'error' ? colors.errorText : colors.infoText 
                }}
              >
                {toast.message}
              </span>
              {toast.type !== 'loading' && (
                <button
                  onClick={() => dismiss(toast.id)}
                  className="p-1 rounded-lg hover:bg-black/10 transition-colors flex-shrink-0"
                  style={{ 
                    color: toast.type === 'success' ? colors.successText : 
                           toast.type === 'error' ? colors.errorText : colors.infoText 
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Return no-op functions if not in provider
    return {
      toasts: [],
      showToast: () => {},
      showSuccess: () => {},
      showError: () => {},
      showLoading: () => {},
      dismiss: () => {},
      dismissAll: () => {},
    }
  }
  return context
}
