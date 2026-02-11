'use client'

import { motion } from 'framer-motion'
import { FaPlus } from 'react-icons/fa'
import ProductImage from './ProductImage'
import { formatCurrency, toEnglishDigits } from '@/lib/numberUtils'

interface ProductCardProps {
  item: {
    id: string
    name: string
    total_amount_bought: number
    unit: string
    selling_price_per_unit: number
    category: string
    image?: string
  }
  onAddToCart: (item: typeof ProductCardProps.prototype.item) => void
}

export default function ProductCard({ item, onAddToCart }: ProductCardProps) {
  return (
    <motion.div
      className="group relative bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-lg hover:shadow-2xl border border-white/20 transition-all duration-500 overflow-hidden flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Product Image */}
      <div className="mb-3 flex justify-center">
        <ProductImage item={item} className="w-20 h-20" />
      </div>

      {/* Product Name */}
      <h3 className="font-bold text-base mb-1 text-gray-100" style={{ fontFamily: 'var(--font-uni-salar)' }}>
        {item.name}
      </h3>

      {/* Price */}
      <p className="text-xl font-bold text-blue-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
        {formatCurrency(item.selling_price_per_unit)} IQD
      </p>

      {/* Stock Level */}
      <div className="flex items-center justify-center gap-1 mb-2">
        <motion.div
          className={`w-2 h-2 rounded-full ${(item.total_amount_bought ?? 0) > 10 ? 'bg-green-400' : (item.total_amount_bought ?? 0) > 5 ? 'bg-yellow-400' : 'bg-red-400'}`}
          animate={{ scale: (item.total_amount_bought ?? 0) > 10 ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.5 }}
        />
        <p className="text-sm text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>
          {toEnglishDigits((item.total_amount_bought ?? 0).toString())} {item.unit}
        </p>
      </div>

      {/* Category Badge */}
      <motion.div
        className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium mb-3 mx-auto border border-blue-500/30"
        style={{ fontFamily: 'var(--font-uni-salar)' }}
        whileHover={{ scale: 1.05 }}
      >
        {item.category}
      </motion.div>

      {/* Add to Cart Button */}
      <motion.button
        onClick={() => onAddToCart(item)}
        className="w-full mt-auto py-3 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 font-bold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center gap-2"
        style={{ fontFamily: 'var(--font-uni-salar)' }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <FaPlus className="text-lg" />
        <span>زیادکردن</span>
      </motion.button>
    </motion.div>
  )
}
