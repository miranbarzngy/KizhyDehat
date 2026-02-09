'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'loading' | 'info'
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: Toast['type']) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showLoading: (message: string) => void
  dismiss: (id: number) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [nextId, setNextId] = useState(1)

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = nextId
    setNextId(prev => prev + 1)
    setToasts(prev => [...prev, { id, message, type }])
    
    // Auto-dismiss after 3 seconds (except loading)
    if (type !== 'loading') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 3000)
    }
  }, [nextId])

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success')
  }, [showToast])

  const showError = useCallback((message: string) => {
    showToast(message, 'error')
  }, [showToast])

  const showLoading = useCallback((message: string) => {
    showToast(message, 'loading')
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
      {/* Toast Container */}
      <div
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2"
        style={{ fontFamily: 'var(--font-uni-salar)' }}
      >
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`
                px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px]
                ${toast.type === 'success' ? 'bg-green-500 text-white' : ''}
                ${toast.type === 'error' ? 'bg-red-500 text-white' : ''}
                ${toast.type === 'info' ? 'bg-blue-500 text-white' : ''}
                ${toast.type === 'loading' ? 'bg-gray-800 text-white' : ''}
              `}
            >
              {toast.type === 'loading' && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              )}
              {toast.type === 'success' && <span className="text-xl">✅</span>}
              {toast.type === 'error' && <span className="text-xl">❌</span>}
              {toast.type === 'info' && <span className="text-xl">ℹ️</span>}
              <span className="flex-1">{toast.message}</span>
              {toast.type !== 'loading' && (
                <button
                  onClick={() => dismiss(toast.id)}
                  className="text-white/80 hover:text-white"
                >
                  ✕
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
