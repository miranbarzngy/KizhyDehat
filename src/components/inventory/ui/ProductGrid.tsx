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
            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={() => openEditItem(item)}
                className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-lg transition-colors"
                style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
              >
                <FaEdit />
              </button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={() => archiveItem(item)}
                className="w-10 h-10 flex items-center justify-center bg-orange-500 text-white rounded-xl shadow-lg transition-colors"
                style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
              >
                <FaArchive />
              </button>
            </div>
            {!soldProductIds.has(item.id) && (
              <div className="flex flex-col items-center gap-1">
                <button 
                  onClick={() => confirmDelete(item)}
                  className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-xl shadow-lg transition-colors"
                  style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                >
                  <FaTrash />
                </button>
              </div>
            )}
          </div>
          {/* Price Info Below Buttons */}
          <div className="mt-3 pt-3 border-t border-gray-200 text-center">
            <div className="flex justify-center gap-2 text-sm font-bold">
              <span style={{ color: '#dc2626', fontFamily: 'var(--font-uni-salar)' }}>
                کڕین: {item.cost_per_unit?.toLocaleString() || 0}
              </span>
              <span style={{ color: '#059669', fontFamily: 'var(--font-uni-salar)' }}>
                فرۆش: {item.selling_price_per_unit?.toLocaleString() || 0}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              {item.barcode1 && <span>بارکۆد: {item.barcode1}</span>}
              {item.barcode1 && item.barcode4 && <span> | </span>}
              {item.barcode4 && <span>{item.barcode4}</span>}
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  )
}
