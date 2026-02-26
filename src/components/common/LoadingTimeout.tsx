'use client'

import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

interface LoadingTimeoutProps {
  timeout?: number // in milliseconds, default 10000ms (10 seconds)
  onRetry?: () => void
  message?: string
  showRetryAfter?: number // after how many seconds to show retry button
}

export default function LoadingTimeout({
  timeout = 10000,
  onRetry,
  message = 'چاوەڕوانبە...',
  showRetryAfter = 8 // Show retry button 2 seconds before timeout
}: LoadingTimeoutProps) {
  const [elapsed, setElapsed] = useState(0)
  const [showRetry, setShowRetry] = useState(false)

  useEffect(() => {
    // Update elapsed time every 100ms for smooth progress
    const interval = setInterval(() => {
      setElapsed(prev => {
        const newElapsed = prev + 100
        if (newElapsed >= showRetryAfter * 1000 && !showRetry) {
          setShowRetry(true)
        }
        return newElapsed
      })
    }, 100)

    // Set timeout to trigger retry state
    const timeoutId = setTimeout(() => {
      setShowRetry(true)
    }, timeout)

    return () => {
      clearInterval(interval)
      clearTimeout(timeoutId)
    }
  }, [timeout, showRetryAfter, showRetry])

  const progress = Math.min((elapsed / timeout) * 100, 100)
  const remainingSeconds = Math.max(Math.ceil((timeout - elapsed) / 1000), 0)

  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center p-8">
      {/* Progress Circle */}
      <div className="relative w-20 h-20 mb-4">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="var(--theme-muted)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="var(--theme-accent)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={{ duration: 0.1 }}
            style={{
              strokeDasharray: `${2 * Math.PI * 40}`,
              strokeDashoffset: `${2 * Math.PI * 40 * (1 - progress / 100)}`
            }}
          />
        </svg>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {showRetry ? (
            <RefreshCw className="w-6 h-6" style={{ color: 'var(--theme-accent)' }} />
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 border-2 rounded-full"
              style={{
                borderColor: 'var(--theme-accent)',
                borderTopColor: 'transparent'
              }}
            />
          )}
        </div>
      </div>

      {/* Message */}
      <p 
        className="text-center mb-2"
        style={{ 
          color: 'var(--theme-foreground)',
          fontFamily: 'var(--font-uni-salar)'
        }}
      >
        {showRetry ? 'کات بەسەرچوو' : message}
      </p>

      {/* Time remaining or Retry button */}
      {showRetry ? (
        <div className="text-center">
          <p 
            className="text-sm mb-3"
            style={{ 
              color: 'var(--theme-secondary)',
              fontFamily: 'var(--font-uni-salar)'
            }}
          >
            ئینتەرنێتەکە خاوە
          </p>
          {onRetry && (
            <motion.button
              onClick={onRetry}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 rounded-xl font-bold flex items-center gap-2 mx-auto"
              style={{ 
                background: 'var(--theme-accent)',
                color: '#ffffff',
                fontFamily: 'var(--font-uni-salar)'
              }}
            >
              <RefreshCw className="w-4 h-4" />
              هەوڵدانەوە
            </motion.button>
          )}
        </div>
      ) : (
        <p 
          className="text-sm"
          style={{ 
            color: 'var(--theme-secondary)',
            fontFamily: 'var(--font-uni-salar)'
          }}
        >
          {remainingSeconds}چرکە
        </p>
      )}
    </div>
  )
}
