'use client'

import { ReactNode, useEffect, useState, useRef, useCallback } from 'react'
import LoadingTimeout from './LoadingTimeout'

interface DataFetchWrapperProps {
  children: ReactNode
  fetchFn: () => Promise<void>
  timeout?: number
  loadingComponent?: ReactNode
  errorComponent?: ReactNode
  fallbackComponent?: ReactNode
  onError?: (error: Error) => void
}

export default function DataFetchWrapper({
  children,
  fetchFn,
  timeout = 10000,
  loadingComponent,
  errorComponent,
  fallbackComponent,
  onError,
}: DataFetchWrapperProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  const executeFetch = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setRetrying(true)
    }
    
    setError(null)
    
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current && !dataLoaded) {
        console.warn('Data fetch timeout reached')
      }
    }, timeout)

    try {
      await fetchFn()
      if (mountedRef.current) {
        setDataLoaded(true)
        setLoading(false)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        if (onError) {
          onError(error)
        }
        setLoading(false)
      }
    } finally {
      if (mountedRef.current) {
        setRetrying(false)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }
  }, [fetchFn, timeout, onError, dataLoaded])

  const handleRetry = useCallback(() => {
    setLoading(true)
    executeFetch(true)
  }, [executeFetch])

  useEffect(() => {
    mountedRef.current = true
    executeFetch()

    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [executeFetch])

  if (loading) {
    if (fallbackComponent && !error) {
      return (
        <div>
          {fallbackComponent}
          <LoadingTimeout 
            timeout={timeout} 
            onRetry={handleRetry}
            message="ئامادەکردن..."
            showRetryAfter={8000}
          />
        </div>
      )
    }
    
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }
    
    return <LoadingTimeout timeout={timeout} onRetry={handleRetry} />
  }

  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>
    }
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">⚠️</div>
          <p 
            className="text-lg font-bold mb-2"
            style={{ 
              color: 'var(--theme-foreground)',
              fontFamily: 'var(--font-uni-salar)'
            }}
          >
            هەڵە لە ئامادەکردن
          </p>
          <p 
            className="text-sm"
            style={{ 
              color: 'var(--theme-secondary)',
              fontFamily: 'var(--font-uni-salar)'
            }}
          >
            {error.message || 'تکایە هەوڵبدەرەوە'}
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="px-6 py-2 rounded-xl font-bold"
          style={{ 
            background: 'var(--theme-accent)',
            color: '#ffffff',
            fontFamily: 'var(--font-uni-salar)'
          }}
        >
          هەوڵدانەوە
        </button>
      </div>
    )
  }

  return <>{children}</>
}

export function ProgressiveWrapper({ 
  children, 
  isLoading,
  minimumLoadTime = 500 
}: { 
  children: ReactNode
  isLoading: boolean
  minimumLoadTime?: number
}) {
  const [showSkeleton, setShowSkeleton] = useState(true)
  
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowSkeleton(false)
      }, minimumLoadTime)
      return () => clearTimeout(timer)
    } else {
      setShowSkeleton(true)
    }
  }, [isLoading, minimumLoadTime])

  if (showSkeleton && isLoading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-4 w-3/4 mb-4"></div>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-4 w-1/2 mb-4"></div>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32 w-full"></div>
      </div>
    )
  }

  return <>{children}</>
}
