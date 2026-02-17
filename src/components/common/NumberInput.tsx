'use client'

import React, { useCallback } from 'react'

// Kurdish to English number converter
const convertKurdishToEnglish = (input: string): string => {
  if (!input || typeof input !== 'string') return input
  const kurdishToEnglishMap: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  }
  let result = input
  Object.entries(kurdishToEnglishMap).forEach(([kurdish, english]) => {
    result = result.replace(new RegExp(kurdish, 'g'), english)
  })
  return result
}

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string | number | undefined
  onChange: (value: number) => void
}

export default function NumberInput({ 
  value, 
  onChange, 
  ...props 
}: NumberInputProps) {
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert Kurdish numbers to English first
    const converted = convertKurdishToEnglish(e.target.value)
    // Remove any non-numeric characters except decimal point and minus
    const sanitized = converted.replace(/[^0-9.-]/g, '')
    // Convert to number
    const num = Number(sanitized)
    onChange(isNaN(num) ? 0 : num)
  }, [onChange])

  // Format the display value - convert Kurdish to English for display
  const displayValue = value === undefined || value === null || value === '' 
    ? '' 
    : convertKurdishToEnglish(String(value))

  return (
    <input
      type="number"
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  )
}

// Phone input with Kurdish number conversion
interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  onChange: (value: string) => void
}

export function PhoneInput({ value, onChange, ...props }: PhoneInputProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert Kurdish numbers to English first
    const converted = convertKurdishToEnglish(e.target.value)
    // Allow digits, spaces, hyphens, plus signs, and parentheses
    const sanitized = converted.replace(/[^0-9\s\-\+\(\)]/g, '')
    onChange(sanitized)
  }, [onChange])

  // Format the display value - convert Kurdish to English for display
  const displayValue = value ? convertKurdishToEnglish(value) : ''

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  )
}

// Barcode input with Kurdish number conversion  
interface BarcodeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  onChange: (value: string) => void
}

export function BarcodeInput({ value, onChange, ...props }: BarcodeInputProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert Kurdish numbers to English first
    const converted = convertKurdishToEnglish(e.target.value)
    // Allow digits and common barcode characters (no spaces or special chars except hyphen)
    const sanitized = converted.replace(/[^0-9\-]/g, '')
    onChange(sanitized)
  }, [onChange])

  // Format the display value - convert Kurdish to English for display
  const displayValue = value ? convertKurdishToEnglish(value) : ''

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  )
}
