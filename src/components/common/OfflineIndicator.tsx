'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Signal, SignalLow, SignalMedium } from 'lucide-react'
import { useEffect, useState } from 'react'

type ConnectionStatus = 'online' | 'offline' | 'slow' | 'fast'

interface OfflineIndicatorProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'header'
}

export default function OfflineIndicator({ position = 'top-right' }: OfflineIndicatorProps) {
  const [status, setStatus] = useState<ConnectionStatus>('online')
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Check initial connection status
    const checkConnection = () => {
      const navigator = window.navigator
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

      if (!navigator.onLine) {
        setStatus('offline')
        setIsVisible(true)
        return
      }

      // Check effective connection type if available
      if (connection) {
        const effectiveType = connection.effectiveType
        if (effectiveType === '2g' || effectiveType === 'slow-2g') {
          setStatus('slow')
          setIsVisible(true)
          return
        } else if (effectiveType === '3g') {
          setStatus('slow')
          setIsVisible(true)
          return
        }
      }

      // Online and likely fast enough
      setStatus('online')
      setIsVisible(false)
    }

    // Initial check
    checkConnection()

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus('online')
      // Keep visible briefly then hide
      setTimeout(() => setIsVisible(false), 2000)
    }

    const handleOffline = () => {
      setStatus('offline')
      setIsVisible(true)
    }

    // Listen for connection changes if available
    const navigator = window.navigator
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    if (connection) {
      const handleChange = () => {
        checkConnection()
      }
      connection.addEventListener('change', handleChange)
      return () => {
        connection.removeEventListener('change', handleChange)
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Don't render if online
  if (status === 'online' && !isVisible) {
    return null
  }

  const getIcon = () => {
    switch (status) {
      case 'offline':
        return <WifiOff className="w-4 h-4" />
      case 'slow':
        return <SignalLow className="w-4 h-4" />
      default:
        return <Signal className="w-4 h-4" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'offline':
        return 'پەیوەست نیە'
      case 'slow':
        return 'خاو'
      default:
        return 'پەیوەستە'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'offline':
        return '#ef4444' // red
      case 'slow':
        return '#f59e0b' // amber
      default:
        return '#22c55e' // green
    }
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'header': 'top-16 right-4'
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`fixed z-50 ${positionClasses[position]}`}
      >
        <motion.button
          onClick={() => setShowDetails(!showDetails)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg backdrop-blur-xl border transition-all"
          style={{
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: getStatusColor(),
            boxShadow: `0 0 10px ${getStatusColor()}40`
          }}
        >
          {/* Status dot */}
          <motion.div
            animate={{ 
              scale: status === 'offline' ? [1, 1.2, 1] : 1,
            }}
            transition={{ 
              duration: status === 'offline' ? 1 : 0,
              repeat: status === 'offline' ? Infinity : 0
            }}
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: getStatusColor() }}
          />
          
          {/* Icon */}
          <span style={{ color: getStatusColor() }}>
            {getIcon()}
          </span>

          {/* Text */}
          <span 
            className="text-sm font-medium hidden sm:inline"
            style={{ 
              color: getStatusColor(),
              fontFamily: 'var(--font-uni-salar)'
            }}
          >
            {getStatusText()}
          </span>
        </motion.button>

        {/* Details tooltip */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute top-full mt-2 right-0 w-48 p-3 rounded-xl shadow-lg backdrop-blur-xl border"
              style={{
                backgroundColor: 'var(--theme-card-bg)',
                borderColor: 'var(--theme-card-border)'
              }}
            >
              <p 
                className="text-sm font-medium"
                style={{ 
                  color: getStatusColor(),
                  fontFamily: 'var(--font-uni-salar)'
                }}
              >
                {status === 'offline' 
                  ? 'ئینتەرنێت بەردەست نیە. تکایە پەیوەستبوونەکەت بپشکنە.' 
                  : status === 'slow'
                  ? 'خاوە. دەتوانیت بەردەوامبیت بەڵام خاوە.'
                  : 'پەیوەست بوو!'
                }
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
