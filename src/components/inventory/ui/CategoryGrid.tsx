'use client'

import { Category } from '../types'
import { motion } from 'framer-motion'
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa'

interface CategoryGridProps {
  categories: Category[]
  products: { category: string }[]
  onAddCategory: () => void
  onEditCategory: (category: Category) => void
  onDeleteCategory: (category: Category) => void
}

export default function CategoryGrid({ categories, products, onAddCategory, onEditCategory, onDeleteCategory }: CategoryGridProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {/* Add Category Card */}
      <button
        onClick={onAddCategory}
        className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-dashed border-green-300/50 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col items-center justify-center min-h-[180px]"
      >
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
          <FaPlus className="text-green-600 text-xl" />
        </div>
        <h3 
          className="font-bold text-green-700" 
          style={{ fontFamily: 'var(--font-uni-salar)' }}
        >
          زیادکردنی پۆل
        </h3>
      </button>

      {categories.map(category => {
        const count = products.filter(p => p.category === category.name).length
        return (
          <motion.div 
            key={category.id}
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 shadow-lg relative group"
          >
            <div className="text-4xl mb-2">🏷️</div>
            <h3 
              className="font-bold mb-1" 
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              {category.name}
            </h3>
            <p className="text-sm text-gray-500">{count} کاڵا</p>
            
            {/* Action Buttons - Always Visible & Touch Friendly */}
            <div className="flex justify-center gap-3 mt-4 pt-3 border-t border-gray-200/50">
              <button
                onClick={() => onEditCategory(category)}
                className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                title="دەستکاری"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => onDeleteCategory(category)}
                className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                title="سڕینەوە"
              >
                <FaTrash />
              </button>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
