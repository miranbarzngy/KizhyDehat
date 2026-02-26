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
      className="group relative rounded-2xl p-4 shadow-lg hover:shadow-2xl border backdrop-blur-md transition-all duration-500 overflow-hidden flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.02 }}
      style={{ 
        background: 'var(--theme-card-bg)',
        borderColor: 'var(--theme-card-border)'
      }}
    >
      {/* Product Image */}
      <div className="mb-3 flex justify-center">
        <ProductImage item={item} className="w-20 h-20" />
      </div>

      {/* Product Name */}
      <h3 
        className="font-bold text-base mb-1 text-center"
        style={{ 
          color: 'var(--theme-foreground)',
          fontFamily: 'var(--font-uni-salar)' 
        }}
      >
        {item.name}
      </h3>

      {/* Price */}
      <p 
        className="text-xl font-extrabold text-center mb-2"
        style={{ 
          color: 'var(--theme-accent)',
          fontFamily: 'Inter, sans-serif' 
        }}
      >
        {formatCurrency(item.selling_price_per_unit)} IQD
      </p>

      {/* Stock Level */}
      <div className="flex items-center justify-center gap-1">
        <motion.div
          className={`w-2 h-2 rounded-full ${(item.total_amount_bought ?? 0) > 10 ? 'bg-green-500' : (item.total_amount_bought ?? 0) > 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
          animate={{ scale: (item.total_amount_bought ?? 0) > 10 ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.5 }}
        />
        <p 
          className="text-sm"
          style={{ 
            color: 'var(--theme-secondary)',
            fontFamily: 'var(--font-uni-salar)' 
          }}
        >
          {toEnglishDigits((item.total_amount_bought ?? 0).toString())} {item.unit}
        </p>
      </div>

      {/* Add to Cart Button */}
      <motion.button
        onClick={() => onAddToCart(item)}
        className="w-full mt-auto py-3 backdrop-blur-md border rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
        style={{ 
          background: 'var(--theme-accent)',
          borderColor: 'var(--theme-card-border)',
          color: '#ffffff',
          fontFamily: 'var(--font-uni-salar)',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)'
        }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <FaPlus className="text-lg" />
        <span>زیادکردن</span>
      </motion.button>
    </motion.div>
  )
}
