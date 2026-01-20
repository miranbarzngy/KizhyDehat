/**
 * Utility functions for handling numbers in Kurdish POS system
 * Ensures all calculations use standard English digits (0-9)
 */

/**
 * Kurdish to English numeral mapping
 */
const kurdishToEnglishMap: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9'
}

/**
 * Converts Kurdish numerals to English numerals
 * @param input - String that may contain Kurdish numerals
 * @returns String with English numerals only
 */
export function convertKurdishToEnglish(input: string): string {
  if (!input || typeof input !== 'string') return input

  let result = input
  Object.entries(kurdishToEnglishMap).forEach(([kurdish, english]) => {
    result = result.replace(new RegExp(kurdish, 'g'), english)
  })

  return result
}

/**
 * Validates that a string contains only English digits and decimal point
 * @param input - String to validate
 * @returns True if valid, false otherwise
 */
export function isValidEnglishNumber(input: string): boolean {
  if (!input || typeof input !== 'string') return false

  // Allow only English digits, decimal point, and minus sign
  const englishNumberRegex = /^-?\d*\.?\d*$/
  return englishNumberRegex.test(input)
}

/**
 * Sanitizes numeric input by converting Kurdish numerals and validating
 * @param input - Raw input string
 * @returns Sanitized string with English numerals
 */
export function sanitizeNumericInput(input: string): string {
  if (!input || typeof input !== 'string') return ''

  // First convert any Kurdish numerals to English
  const converted = convertKurdishToEnglish(input)

  // Remove any non-numeric characters except decimal point and minus
  const sanitized = converted.replace(/[^0-9.-]/g, '')

  return sanitized
}

/**
 * Safely converts a string to number, handling Kurdish numerals
 * @param input - String to convert
 * @returns Number value or 0 if invalid
 */
export function safeStringToNumber(input: string): number {
  if (!input || typeof input !== 'string') return 0

  const sanitized = sanitizeNumericInput(input)

  if (!isValidEnglishNumber(sanitized)) return 0

  const num = parseFloat(sanitized)
  return isNaN(num) ? 0 : num
}

/**
 * Formats a number for display (ensures English digits)
 * @param num - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted string with English digits
 */
export function formatNumber(num: number, decimals: number = 2): string {
  if (typeof num !== 'number' || isNaN(num)) return '0.00'

  return num.toFixed(decimals)
}

/**
 * Validates phone number input (allows only English digits and common separators)
 * @param input - Phone number string
 * @returns Sanitized phone number
 */
export function sanitizePhoneNumber(input: string): string {
  if (!input || typeof input !== 'string') return ''

  // Convert Kurdish numerals first
  const converted = convertKurdishToEnglish(input)

  // Allow digits, spaces, hyphens, plus signs, and parentheses
  const sanitized = converted.replace(/[^0-9\s\-\+\(\)]/g, '')

  return sanitized
}

/**
 * Validates barcode input (allows only English digits and common barcode characters)
 * @param input - Barcode string
 * @returns Sanitized barcode
 */
export function sanitizeBarcode(input: string): string {
  if (!input || typeof input !== 'string') return ''

  // Convert Kurdish numerals first
  const converted = convertKurdishToEnglish(input)

  // Allow digits and common barcode characters (no spaces or special chars except hyphen)
  const sanitized = converted.replace(/[^0-9\-]/g, '')

  return sanitized
}

/**
 * Forces display of English digits by ensuring the value is properly converted
 * This is used for display purposes to override font-based digit conversion
 * @param value - Any value that should display as English digits
 * @returns String with guaranteed English digits
 */
export function toEnglishDigits(value: any): string {
  if (value === null || value === undefined) return ''

  const stringValue = String(value)

  // Convert any Kurdish numerals to English
  return convertKurdishToEnglish(stringValue)
}

/**
 * Formats a number with thousands separators (commas) for display
 * @param value - Number or string to format
 * @returns Formatted string with commas (e.g., "3,000")
 */
export function formatCurrency(value: any): string {
  if (value === null || value === undefined) return '0'

  // Convert to number first
  const num = safeStringToNumber(String(value))

  // Use Intl.NumberFormat for proper formatting
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

/**
 * Formats a number with thousands separators and decimals for display
 * @param value - Number or string to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with commas and decimals (e.g., "3,000.00")
 */
export function formatCurrencyWithDecimals(value: any, decimals: number = 2): string {
  if (value === null || value === undefined) return '0.00'

  // Convert to number first
  const num = safeStringToNumber(String(value))

  // Use Intl.NumberFormat for proper formatting
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
}

/**
 * Unit conversion factors (relative to base unit)
 * All conversions are to the base unit (e.g., KG for weight, Piece for count)
 */
export const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  // Weight conversions (base: KG)
  'kg': {
    'kg': 1,
    'g': 1000,
    'gram': 1000,
    'کیلۆ': 1,
    'گرام': 1000,
    'دانە': 1, // For items sold by weight but counted as pieces
  },
  'g': {
    'kg': 0.001,
    'g': 1,
    'gram': 1,
    'کیلۆ': 0.001,
    'گرام': 1,
    'دانە': 0.001,
  },
  'gram': {
    'kg': 0.001,
    'g': 1,
    'gram': 1,
    'کیلۆ': 0.001,
    'گرام': 1,
    'دانە': 0.001,
  },
  'کیلۆ': {
    'kg': 1,
    'g': 1000,
    'gram': 1000,
    'کیلۆ': 1,
    'گرام': 1000,
    'دانە': 1,
  },
  'گرام': {
    'kg': 0.001,
    'g': 1,
    'gram': 1,
    'کیلۆ': 0.001,
    'گرام': 1,
    'دانە': 0.001,
  },

  // Count conversions (base: Piece)
  'piece': {
    'piece': 1,
    'pieces': 1,
    'box': 1, // Assuming 1 box = 1 piece for simplicity
    'pack': 1,
    'package': 1,
    'دانە': 1,
    'پاکێت': 1,
    'قوتو': 1,
  },
  'pieces': {
    'piece': 1,
    'pieces': 1,
    'box': 1,
    'pack': 1,
    'package': 1,
    'دانە': 1,
    'پاکێت': 1,
    'قوتو': 1,
  },
  'box': {
    'piece': 1,
    'pieces': 1,
    'box': 1,
    'pack': 1,
    'package': 1,
    'دانە': 1,
    'پاکێت': 1,
    'قوتو': 1,
  },
  'pack': {
    'piece': 1,
    'pieces': 1,
    'box': 1,
    'pack': 1,
    'package': 1,
    'دانە': 1,
    'پاکێت': 1,
    'قوتو': 1,
  },
  'package': {
    'piece': 1,
    'pieces': 1,
    'box': 1,
    'pack': 1,
    'package': 1,
    'دانە': 1,
    'پاکێت': 1,
    'قوتو': 1,
  },
  'دانە': {
    'piece': 1,
    'pieces': 1,
    'box': 1,
    'pack': 1,
    'package': 1,
    'دانە': 1,
    'پاکێت': 1,
    'قوتو': 1,
  },
  'پاکێت': {
    'piece': 1,
    'pieces': 1,
    'box': 1,
    'pack': 1,
    'package': 1,
    'دانە': 1,
    'پاکێت': 1,
    'قوتو': 1,
  },
  'قوتو': {
    'piece': 1,
    'pieces': 1,
    'box': 1,
    'pack': 1,
    'package': 1,
    'دانە': 1,
    'پاکێت': 1,
    'قوتو': 1,
  },
}

/**
 * Converts a quantity from one unit to another
 * @param quantity - The quantity to convert
 * @param fromUnit - The source unit
 * @param toUnit - The target unit
 * @returns Converted quantity in the target unit
 */
export function convertUnits(quantity: number, fromUnit: string, toUnit: string): number {
  if (quantity === 0) return 0

  const fromUnitLower = fromUnit.toLowerCase()
  const toUnitLower = toUnit.toLowerCase()

  // If units are the same, no conversion needed
  if (fromUnitLower === toUnitLower) {
    return quantity
  }

  // Find conversion factors
  const fromConversions = UNIT_CONVERSIONS[fromUnitLower]
  const toConversions = UNIT_CONVERSIONS[toUnitLower]

  if (!fromConversions || !toConversions) {
    console.warn(`Unit conversion not found for: ${fromUnit} -> ${toUnit}`)
    return quantity // Return original quantity if conversion not found
  }

  // Convert to base unit first, then to target unit
  // We need a common base unit. Let's use KG for weight and Piece for count
  let baseUnit = ''
  let baseQuantity = 0

  // Determine base unit based on fromUnit
  if (['kg', 'g', 'gram', 'کیلۆ', 'گرام'].includes(fromUnitLower)) {
    baseUnit = 'kg'
    baseQuantity = quantity / (fromConversions[baseUnit] || 1)
  } else if (['piece', 'pieces', 'box', 'pack', 'package', 'دانە', 'پاکێت', 'قوتو'].includes(fromUnitLower)) {
    baseUnit = 'piece'
    baseQuantity = quantity / (fromConversions[baseUnit] || 1)
  } else {
    console.warn(`Unknown unit type: ${fromUnit}`)
    return quantity
  }

  // Convert from base unit to target unit
  const targetConversion = toConversions[baseUnit] || 1
  return baseQuantity * targetConversion
}

/**
 * Gets available sale units for a given base unit
 * @param baseUnit - The base unit stored in inventory
 * @returns Array of available sale units
 */
export function getAvailableSaleUnits(baseUnit: string): string[] {
  const baseUnitLower = baseUnit.toLowerCase()

  if (['kg', 'g', 'gram', 'کیلۆ', 'گرام'].includes(baseUnitLower)) {
    // Weight-based items
    return ['KG', 'Gram', 'کیلۆ', 'گرام']
  } else if (['piece', 'pieces', 'box', 'pack', 'package', 'دانە', 'پاکێت', 'قوتو'].includes(baseUnitLower)) {
    // Count-based items
    return ['Piece', 'Box', 'Pack', 'دانە', 'قوتو', 'پاکێت']
  } else {
    // Default fallback
    return [baseUnit]
  }
}

/**
 * Calculates price for a specific unit based on base price and unit conversion
 * @param basePrice - Price per base unit
 * @param baseUnit - The base unit
 * @param saleUnit - The sale unit
 * @param quantity - Quantity in sale unit
 * @returns Price for the given quantity in sale unit
 */
export function calculateUnitPrice(basePrice: number, baseUnit: string, saleUnit: string, quantity: number): number {
  if (quantity === 0) return 0

  // Convert quantity to base unit
  const baseQuantity = convertUnits(quantity, saleUnit, baseUnit)

  // Calculate total price
  return baseQuantity * basePrice
}
