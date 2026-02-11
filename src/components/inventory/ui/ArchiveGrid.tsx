'use client'

import { Product } from '../types'
import { motion } from 'framer-motion'
import { FaPlus, FaTrash } from 'react-icons/fa'

interface ArchiveGridProps {
  archivedItems: Product[]
  searchTerm: string
  restoreItem: (item: Product) => void
  confirmDelete: (item: Product) => void
}

export default function ArchiveGrid({ archivedItems, searchTerm, restoreItem, confirmDelete }: ArchiveGridProps) {
  const filteredArchived = archivedItems.filter(item => {
    if (!searchTerm) return true
    return item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (filteredArchived.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="col-span-full text-center py-12 text-gray-500"
      >
        <div className="text-6xl mb-4">📦</div>
        <p style={{ fontFamily: 'var(--font-uni-salar)' }}>
          هیچ کاڵایەک لە ئەرشیڤدا نییە
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {filteredArchived.map(item => {
        const totalSold = item.total_sold || 0
        const totalRevenue = item.total_revenue || 0
        const totalDiscounts = item.total_discounts || 0
        const netRevenue = totalRevenue - totalDiscounts
        const totalPurchasePrice = (item.cost_per_unit || 0) * (totalSold + (item.total_amount_bought || 0))
        const realProfit = netRevenue - totalPurchasePrice
        const purchaseDate = item.added_date || item.created_at || '-'

        return (
          <div 
            key={item.id} 
            className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center text-4xl overflow-hidden">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                '📦'
              )}
            </div>
            
            <h3 
              className="text-lg font-bold text-center mb-3" 
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              {item.name}
            </h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                <span 
                  className="text-sm text-gray-600" 
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  کۆی نرخی کڕین:
                </span>
                <span 
                  className="font-bold text-gray-800" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {totalPurchasePrice.toLocaleString()} IQD
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                <span 
                  className="text-sm text-gray-600" 
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  کۆی فرۆشراو:
                </span>
                <span 
                  className="font-bold text-gray-800" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {totalSold} {item.unit}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                <span 
                  className="text-sm text-gray-600" 
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  کۆی داهات:
                </span>
                <span 
                  className="font-bold text-green-600" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {totalRevenue.toLocaleString()} IQD
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                <span 
                  className="text-sm text-gray-600" 
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  کۆی داشکاندن:
                </span>
                <span 
                  className="font-bold text-red-500" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {totalDiscounts > 0 ? `-${totalDiscounts.toLocaleString()}` : '0'} IQD
                </span>
              </div>
              
              <div 
                className="flex justify-between items-center py-2 border-b border-gray-200/50 bg-gray-50/50 rounded-lg px-2"
              >
                <span 
                  className="text-sm text-gray-700" 
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  داهاتی خاوەنەکە:
                </span>
                <span 
                  className="font-bold text-blue-600" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {netRevenue.toLocaleString()} IQD
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span 
                  className="text-sm text-gray-600" 
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  قازانجی ڕاست:
                </span>
                <span 
                  className={`font-bold ${realProfit > 0 ? 'text-green-600' : realProfit < 0 ? 'text-red-600' : 'text-yellow-600'}`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {realProfit >= 0 
                    ? realProfit.toLocaleString() 
                    : `(${Math.abs(realProfit).toLocaleString()})`} IQD
                </span>
              </div>
            </div>
            
            <div 
              className="text-center py-2 mb-3 bg-gray-100/50 rounded-lg"
            >
              <span 
                className="text-xs text-gray-500" 
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                بەرواری کڕین: 
              </span>
              <span 
                className="text-sm font-bold text-gray-700" 
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {new Date(purchaseDate).toLocaleDateString('ku')}
              </span>
            </div>
            
            <div className="flex justify-center space-x-2">
              <button 
                onClick={() => restoreItem(item)}
                className="px-3 py-2 bg-green-100 text-green-600 rounded-lg flex items-center"
              >
                <FaPlus className="ml-1" />
                <span 
                  style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}
                >
                  گەڕاندنەوە
                </span>
              </button>
              <button 
                onClick={() => confirmDelete(item)}
                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg flex items-center"
              >
                <FaTrash className="ml-1" />
                <span 
                  style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}
                >
                  سڕینەوە
                </span>
              </button>
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}
