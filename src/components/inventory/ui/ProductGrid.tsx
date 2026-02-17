'use client'

import { motion } from 'framer-motion'
import { FaArchive, FaEdit, FaPlus, FaTrash } from 'react-icons/fa'
import { Product } from '../types'

interface ProductGridProps {
  products: Product[]
  soldProductIds: Set<string>
  openEditItem: (item: Product) => void
  confirmDelete: (item: Product) => void
  archiveItem: (item: Product) => void
  onAddProduct?: () => void
}

export default function ProductGrid({ products, soldProductIds, openEditItem, confirmDelete, archiveItem, onAddProduct }: ProductGridProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6"
    >
      {/* Add Product Card - Always show first */}
      {onAddProduct && (
        <button
          onClick={onAddProduct}
          className="p-6 rounded-2xl bg-blue-50 border-2 border-dashed border-blue-300 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col items-center justify-center min-h-[300px]"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <FaPlus className="text-blue-600 text-2xl" />
          </div>
          <h3 
            className="font-bold text-blue-700" 
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            کاڵای نوێ زیادبکە
          </h3>
        </button>
      )}
      
      {/* Show products */}
      {products.map(item => (
        <div 
          key={item.id} 
          className="p-6 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-4xl overflow-hidden">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              '📦'
            )}
          </div>
          <h3 
            className="text-lg font-bold text-center text-slate-950 mb-2" 
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            {item.name}
          </h3>
          <div className="text-center mb-4">
            <span 
              className="text-2xl font-bold" 
              style={{ color: item.total_amount_bought <= 5 ? '#dc2626' : '#059669' }}
            >
              {item.total_amount_bought} {item.unit}
            </span>
            {item.category && (
              <div className="text-sm text-gray-600">{item.category}</div>
            )}
          </div>
          {/* Action Buttons - Always Visible & Touch Friendly */}
          <div className="flex justify-center gap-3 mt-4 pt-3 border-t border-gray-200">
            <button 
              onClick={() => openEditItem(item)}
              className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              title="دەستکاری"
            >
              <FaEdit />
            </button>
            <button 
              onClick={() => archiveItem(item)}
              className="w-10 h-10 flex items-center justify-center bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md"
              title="ئەرشیڤ"
            >
              <FaArchive />
            </button>
            {!soldProductIds.has(item.id) && (
              <button 
                onClick={() => confirmDelete(item)}
                className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                title="سڕینەوە"
              >
                <FaTrash />
              </button>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  )
}
