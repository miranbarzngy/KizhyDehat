'use client'

import { motion } from 'framer-motion'
import { Package } from 'lucide-react'

interface ProductImageProps {
  item: {
    image?: string
    name: string
  }
  className?: string
}

export default function ProductImage({ item, className = "" }: ProductImageProps) {
  return (
    <motion.div
      className={`bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center overflow-hidden shadow-inner border border-white/20 ${className}`}
      whileHover={{ rotate: 5, scale: 1.1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover rounded-2xl"
        />
      ) : (
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
          <Package className="w-6 h-6 text-blue-400" />
        </div>
      )}
    </motion.div>
  )
}
