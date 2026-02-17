import { useCallback } from 'react'
import { sanitizeNumericInput, sanitizePhoneNumber, sanitizeBarcode } from '@/lib/numberUtils'

/**
 * Hook for handling numeric input with automatic Kurdish to English conversion
 * Use this for any number input field to prevent Kurdish numbers
 */
export function useNumericInput() {
  const handleNumberChange = useCallback((value: string): number => {
    const sanitized = sanitizeNumericInput(value)
    return Number(sanitized) || 0
  }, [])

  return { handleNumberChange }
}

/**
 * Hook for handling phone input with automatic Kurdish to English conversion
 */
export function usePhoneInput() {
  const handlePhoneChange = useCallback((value: string): string => {
    return sanitizePhoneNumber(value)
  }, [])

  return { handlePhoneChange }
}

/**
 * Hook for handling barcode input with automatic Kurdish to English conversion
 */
export function useBarcodeInput() {
  const handleBarcodeChange = useCallback((value: string): string => {
    return sanitizeBarcode(value)
  }, [])

  return { handleBarcodeChange }
}
