'use client'

import { formatCurrency, safeStringToNumber } from '@/lib/numberUtils'
import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useEffect } from 'react'

interface UnitModalProps {
  isOpen: boolean
  item: {
    name: string
    unit: string
    selling_price_per_unit: number
  } | null
  quantity: string
  priceInput: string
  onQuantityChange: (value: string) => void
  onPriceChange: (value: string) => void
  onConfirm: () => void
  onClose: () => void
}

export default function UnitModal({
  isOpen,
  item,
  quantity,
  priceInput,
  onQuantityChange,
  onPriceChange,
  onConfirm,
  onClose
}: UnitModalProps) {
  const priceInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus and select price input when modal opens
  useEffect(() => {
    if (isOpen && priceInputRef.current) {
      setTimeout(() => {
        priceInputRef.current?.focus()
        priceInputRef.current?.select()
      }, 100)
    }
  }, [isOpen])

  if (!isOpen || !item) return null

  // The manual price IS the total (final price for the selected quantity)
  const qty = safeStringToNumber(quantity)
  const price = safeStringToNumber(priceInput)
  // Price input is now the TOTAL, not price per unit
  const total = price // Use manual price directly as total
  const isValid = qty > 0 && price > 0

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-slate-800/95 backdrop-blur-xl rounded-3xl w-full max-w-md shadow-2xl border border-white/20"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="p-6">
            <motion.h3
              className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
              style={{ fontFamily: 'var(--font-uni-salar)' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              زیادکردنی {item.name}
            </motion.h3>

            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-semibold mb-3 text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  یەکەی فرۆشتن
                </label>
                <motion.div
                  className="w-full px-4 py-3 rounded-xl border-0 bg-blue-500/20 backdrop-blur-sm shadow-lg border-2 border-blue-500/30 text-center"
                  whileHover={{ scale: 1.01 }}
                >
                  <span className="text-lg font-bold text-blue-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    {item.unit}
                  </span>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <label className="block text-sm font-semibold mb-3 text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  بڕ
                </label>
                <motion.input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={quantity}
                  onChange={(e) => onQuantityChange(safeStringToNumber(e.target.value).toString())}
                  className="w-full px-4 py-4 rounded-xl border-0 bg-white/5 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:outline-none text-center text-xl font-bold text-gray-100"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  placeholder="0.0"
                  autoFocus
                  whileFocus={{ scale: 1.02 }}
                />
              </motion.div>

              {/* Price Input Field - Selling Price - Large and Easy to Tap */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-semibold mb-3 text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  نرخی فرۆشتن
                </label>
                <motion.input
                  ref={priceInputRef}
                  type="number"
                  step="100"
                  min="0"
                  value={priceInput}
                  onChange={(e) => onPriceChange(safeStringToNumber(e.target.value).toString())}
                  className="w-full px-4 py-5 rounded-xl border-0 bg-white/5 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-purple-500/50 focus:outline-none text-center text-2xl font-bold text-gray-100"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  placeholder="0"
                  whileFocus={{ scale: 1.02 }}
                />
                {/* Helper text in Kurdish */}
                <p className="text-xs text-gray-400 mt-2 text-center" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  تکایە نرخەکە لێرە دیاری بکە
                </p>
              </motion.div>

              {/* Real-time Total Display */}
              <AnimatePresence>
                {quantity && safeStringToNumber(quantity) > 0 && (
                  <motion.div
                    className="p-5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-xl border-2 border-purple-500/30"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: 0.15 }}
                  >
                    <p className="text-2xl font-bold text-white mb-1 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                      کۆی گشتی: {formatCurrency(total)} IQD
                    </p>
                    <p className="text-sm text-gray-300 text-center" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      {price.toLocaleString()} × {qty} {item.unit}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="grid grid-cols-4 gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {[0.25, 0.5, 1, 2].map((qtyValue, index) => (
                  <motion.button
                    key={qtyValue}
                    onClick={() => onQuantityChange(qtyValue.toString())}
                    className="py-4 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-gray-200 font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-lg"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    {qtyValue}
                  </motion.button>
                ))}
              </motion.div>
            </div>

            <motion.div
              className="flex justify-end space-x-3 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <motion.button
                onClick={onClose}
                className="px-6 py-3 text-gray-400 hover:text-gray-200 font-medium rounded-xl hover:bg-white/10 transition-colors duration-200"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                پاشگەزبوونەوە
              </motion.button>
              <motion.button
                onClick={onConfirm}
                disabled={!isValid}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
                whileHover={isValid ? { scale: 1.05, y: -2 } : {}}
                whileTap={isValid ? { scale: 0.95 } : {}}
              >
                زیادکردن
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
