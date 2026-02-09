import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  savePendingSubmission,
  getPendingSubmission,
  clearPendingSubmission,
  markSubmissionInProgress,
  isSubmissionInProgress
} from '@/lib/submissionQueue'

interface UsePersistentSubmissionOptions {
  type: 'add_product' | 'update_product' | 'delete_product'
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

export function usePersistentSubmission({ type, onSuccess, onError }: UsePersistentSubmissionOptions) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Execute a single submission
  const executeSubmission = useCallback(async (data: any): Promise<boolean> => {
    console.log('🚀 [PersistentSubmission] Executing:', type, data)
    
    try {
      if (!supabase) {
        console.error('❌ [PersistentSubmission] No supabase client')
        return false
      }

      if (type === 'add_product') {
        const { error } = await supabase.from('products').insert(data)
        if (error) throw error
        console.log('✅ [PersistentSubmission] Product added')
        return true
      }
      
      if (type === 'update_product') {
        const { error } = await supabase.from('products').update(data).eq('id', data.id)
        if (error) throw error
        console.log('✅ [PersistentSubmission] Product updated')
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ [PersistentSubmission] Execution failed:', error)
      return false
    }
  }, [type])

  // Submit with persistence (survives refresh)
  const submit = useCallback(async (data: any): Promise<boolean> => {
    // Save to localStorage first
    const id = savePendingSubmission(type, data)
    markSubmissionInProgress(id)
    
    // Try to execute immediately
    const success = await executeSubmission(data)
    
    if (success) {
      clearPendingSubmission()
      onSuccess?.(data)
      return true
    } else {
      // Will retry on page reload
      setPendingCount(prev => prev + 1)
      onError?.({ message: 'Submission queued for retry', pendingId: id })
      return false
    }
  }, [type, onSuccess, onError, executeSubmission])

  // Retry pending submissions on mount
  useEffect(() => {
    const checkAndRetry = async () => {
      // Check if there's a stuck submission
      const inProgress = isSubmissionInProgress()
      const pending = getPendingSubmission()
      
      if (!inProgress.id && !pending) {
        setPendingCount(0)
        return
      }

      console.log('🔄 [PersistentSubmission] Found pending:', { inProgress, pending })

      // If we have pending data and no current activity, retry
      if (pending && !inProgress.id) {
        setIsRetrying(true)
        
        // Wait a bit for app to settle
        setTimeout(async () => {
          console.log('🔄 [PersistentSubmission] Retrying pending submission...')
          
          const success = await executeSubmission(pending.data)
          
          if (success) {
            console.log('✅ [PersistentSubmission] Retry succeeded!')
            clearPendingSubmission()
            onSuccess?.(pending.data)
          } else {
            // Increment retry count
            pending.retryCount++
            localStorage.setItem('posup_pending_submission', JSON.stringify(pending))
            
            if (pending.retryCount >= 3) {
              console.error('❌ [PersistentSubmission] Max retries reached')
              clearPendingSubmission()
              onError?.({ message: 'Max retries reached', pending })
            }
          }
          
          setIsRetrying(false)
          setPendingCount(0)
        }, 1000)
      }
      
      // If stuck (30+ seconds), clear and allow retry
      if (inProgress.stuck) {
        console.warn('⚠️ [PersistentSubmission] Previous submission was stuck, clearing...')
        clearPendingSubmission()
      }
    }

    checkAndRetry()
  }, [onSuccess, onError, executeSubmission])

  return {
    submit,
    isRetrying,
    pendingCount,
    clearPending: clearPendingSubmission
  }
}
