'use client'

import { motion } from 'framer-motion'
import { FaPlus } from 'react-icons/fa'
import { Product } from '../types'

interface ArchiveGridProps {
  archivedItems: Product[]
  searchTerm: string
  restoreItem: (item: Product) => void
}

export default function ArchiveGrid({ archivedItems, searchTerm, restoreItem }: ArchiveGridProps) {
  const filteredArchived = archivedItems.filter(item => {
    if (!searchTerm) return true
    return item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

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
        // New logic: Profit only from sold items = (Quantity Sold × Sale Price) - (Quantity Sold × Purchase Price) - Discounts
        const costOfSoldItems = (item.cost_per_unit || 0) * totalSold
        const realProfit = netRevenue - costOfSoldItems
        // Total purchase price: original investment in the stock (cost per unit × amount originally bought)
        const totalPurchasePrice = (item.cost_per_unit || 0) * (item.total_amount_bought + totalSold)
        const purchaseDate = item.added_date || item.created_at || '-'
        const soldOutDate = item.last_sale_date || item.updated_at || item.created_at || '-'

        return (
          <div 
            key={item.id} 
            className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all relative overflow-hidden"
          >
            {/* Red "تەواو بووە" Badge */}
            <div 
              className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-xs font-bold z-10"
              style={{ 
                backgroundColor: '#ef4444',
                fontFamily: 'var(--font-uni-salar)'
              }}
            >
              تەواو بووە
            </div>
            
            <div className="h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center text-4xl overflow-hidden grayscale">
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
              <div className="flex justify-between items-center py-2 border-b border-gray-200/50 bg-orange-50/50 rounded-lg px-2">
                <span className="text-sm text-orange-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کۆی نرخی کڕین:
                </span>
                <span className="font-bold text-orange-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {totalPurchasePrice.toLocaleString()} IQD
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  نرخی کڕین بۆ فرۆشراوەکان:
                </span>
                <span className="font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {costOfSoldItems.toLocaleString()} IQD
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کۆی فرۆشراو:
                </span>
                <span className="font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {totalSold} {item.unit}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کۆی داهات:
                </span>
                <span className="font-bold text-green-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {totalRevenue.toLocaleString()} IQD
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کۆی داشکاندن:
                </span>
                <span className="font-bold text-red-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {totalDiscounts > 0 ? `-${totalDiscounts.toLocaleString()}` : '0'} IQD
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200/50 bg-gray-50/50 rounded-lg px-2">
                <span className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  داهاتی ڕاستەقینە:
                </span>
                <span className="font-bold text-blue-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {netRevenue.toLocaleString()} IQD
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  قازانجی ڕاستەقینە:
                </span>
                <span className={`font-bold ${realProfit > 0 ? 'text-green-600' : realProfit < 0 ? 'text-red-600' : 'text-yellow-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                  {realProfit >= 0 ? realProfit.toLocaleString() : `(${Math.abs(realProfit).toLocaleString()})`} IQD
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-center py-2 bg-gray-100/50 rounded-lg">
                <span className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەرواری کڕین: </span>
                <span className="text-sm font-bold text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {new Date(purchaseDate).toLocaleDateString('ku')}
                </span>
              </div>
              
              <div className="text-center py-2 bg-red-50/50 rounded-lg border border-red-100">
                <span className="text-xs text-red-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەرواری تەواوبوون: </span>
                <span className="text-sm font-bold text-red-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {new Date(soldOutDate).toLocaleDateString('ku')}
                </span>
              </div>
            </div>
            
            {/* Barcode Display - Fixed with Inter font and LTR direction */}
            {(item.barcode1 || item.barcode4) && (
              <div className="text-center py-2 mt-2 text-xs text-gray-500" style={{ fontFamily: 'Inter, system-ui, sans-serif', direction: 'ltr' }}>
                {item.barcode1 && <span>بارکۆد: {item.barcode1}</span>}
                {item.barcode1 && item.barcode4 && <span> | </span>}
                {item.barcode4 && <span>{item.barcode4}</span>}
              </div>
            )}
            
            {/* Restore button - show if total_amount_bought > 0 (has remaining quantity) */}
            <div className="flex justify-center mt-4">
              {item.total_amount_bought > 0 && (
                <button 
                  onClick={() => restoreItem(item)}
                  className="px-4 py-2 bg-green-100 text-green-600 rounded-lg flex items-center"
                >
                  <FaPlus className="ml-1" />
                  <span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>دووبارە گەڕاندنەوە بۆ بەشی کاڵاکان</span>
                </button>
              )}
            </div>
            
          </div>
        )
      })}
    </motion.div>
  )
}
