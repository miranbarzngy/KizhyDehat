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

export default function CategoryGrid({ categories, products, onAddCategory, onEditCategory, onDeleteCategory: confirmDeleteCategory }: CategoryGridProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4"
    >
      {/* Add Category Card - Always show first */}
      <button
        onClick={onAddCategory}
        className="p-6 rounded-2xl border-2 border-dashed shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col items-center justify-center min-h-[180px]"
        style={{ 
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-card-border)'
        }}
      >
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
          style={{ backgroundColor: 'var(--theme-muted)' }}
        >
          <FaPlus className="text-xl" style={{ color: 'var(--theme-accent)' }} />
        </div>
        <h3 
          className="font-bold" 
          style={{ 
            fontFamily: 'var(--font-uni-salar)',
            color: 'var(--theme-foreground)'
          }}
        >
          زیادکردنی پۆل
        </h3>
      </button>

      {/* Show categories or empty message */}
      {categories.length > 0 ? (
        categories.map(category => {
          const count = products.filter(p => p.category === category.name).length
          return (
            <motion.div 
              key={category.id}
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-2xl shadow-lg relative group"
              style={{ 
                backgroundColor: 'var(--theme-card-bg)',
                borderColor: 'var(--theme-card-border)',
                borderWidth: '1px'
              }}
            >
              <div className="text-4xl mb-2">🏷️</div>
              <h3 
                className="font-bold mb-1" 
                style={{ 
                  fontFamily: 'var(--font-uni-salar)',
                  color: 'var(--theme-foreground)'
                }}
              >
                {category.name}
              </h3>
              <p style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }} className="text-sm">{count} کاڵا</p>
              
              {/* Action Buttons - Always Visible & Touch Friendly */}
              <div className="flex justify-center gap-3 mt-4 pt-3" style={{ borderColor: 'var(--theme-card-border)', borderTopWidth: '1px' }}>
                <motion.button
                  onClick={() => onEditCategory(category)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl shadow-lg transition-colors"
                  style={{ backgroundColor: 'var(--theme-accent)', color: 'white' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaEdit />
                </motion.button>
              <motion.button
                onClick={() => confirmDeleteCategory(category)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl shadow-lg transition-colors"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaTrash />
                </motion.button>
              </div>
            </motion.div>
          )
        })
      ) : (
        <div 
          className="col-span-full p-12 rounded-2xl shadow-lg text-center"
          style={{ 
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-card-border)',
            borderWidth: '1px'
          }}
        >
          <div className="text-6xl mb-4">🏷️</div>
          <p style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '1.2rem', color: 'var(--theme-secondary)' }}>
            هیچ پۆلێک نەدۆزرایەوە
          </p>
        </div>
      )}
    </motion.div>
  )
}
