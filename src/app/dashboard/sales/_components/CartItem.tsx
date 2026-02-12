'use client'

import { motion } from 'framer-motion'
import { FaPlus } from 'react-icons/fa'
import { formatCurrency, toEnglishDigits } from '@/lib/numberUtils'

interface CartItemProps {
  item: {
    id: string
    item: {
      name: string
    }
    quantity: number
    unit: string
    price: number
    total: number
  }
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <motion.div
      className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-2 shadow-sm border border-gray-200 dark:border-white/10 hover:shadow-md transition-all duration-300"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50, scale: 0.8 }}
      whileHover={{ scale: 1.01, y: -0.5 }}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs truncate" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            {item.item.name}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
            {toEnglishDigits(item.quantity.toString())} {item.unit} × {formatCurrency(item.price)}
          </p>
        </div>
        <div className="flex items-center gap-2 mr-2">
          <motion.button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="w-8 h-8 bg-red-100 dark:bg-red-500/20 backdrop-blur-md border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center font-bold transition-colors duration-200 shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="کەمکردن"
          >
            <span className="text-lg">−</span>
          </motion.button>
          <span className="font-bold text-sm min-w-[2rem] text-center px-1 text-gray-800 dark:text-gray-200" style={{ fontFamily: 'Inter, sans-serif' }}>
            {toEnglishDigits(item.quantity.toString())}
          </span>
          <motion.button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 bg-green-100 dark:bg-green-500/20 backdrop-blur-md border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center font-bold transition-colors duration-200 shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="زیادکردن"
          >
            <FaPlus className="text-sm" />
          </motion.button>
          <motion.button
            onClick={() => onRemove(item.id)}
            className="w-8 h-8 bg-gray-100 dark:bg-rose-500/20 backdrop-blur-md border border-gray-200 dark:border-rose-500/30 text-gray-600 dark:text-rose-400 rounded-xl flex items-center justify-center transition-colors duration-200 shadow-sm"
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            title="سڕینەوە"
          >
            <span className="text-sm">✕</span>
          </motion.button>
        </div>
      </div>
      <div className="text-right mt-1">
        <motion.span
          className="font-bold text-sm text-gray-800 dark:text-gray-200"
          style={{ fontFamily: 'Inter, sans-serif' }}
          whileHover={{ scale: 1.05 }}
        >
          {formatCurrency(item.total)}
        </motion.span>
      </div>
    </motion.div>
  )
}
