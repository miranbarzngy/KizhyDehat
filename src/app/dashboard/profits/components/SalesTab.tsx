'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, ShoppingBag } from 'lucide-react'
import { SaleItem, SalesTab as SalesTabType } from './types'
import { formatCurrency } from '@/lib/numberUtils'

interface SalesTabProps {
  cashSales: SaleItem[]
  onlineSales: SaleItem[]
  payLaterSales: SaleItem[]
  onViewInvoice: (saleId: string) => void
}

function GlassCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  )
}

function GlassTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[800px] w-full text-xs md:text-sm">
          {children}
        </table>
      </div>
    </div>
  )
}

const tabConfig = {
  cash: { 
    id: 'cash', 
    label: 'کاش', 
    icon: '💵',
    activeBg: 'bg-gradient-to-r from-green-500 to-emerald-500',
    glow: 'shadow-green-500/30'
  },
  online: { 
    id: 'online', 
    label: 'ئۆنلاین', 
    icon: '💳',
    activeBg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    glow: 'shadow-blue-500/30'
  },
  paylater: { 
    id: 'paylater', 
    label: 'قەرز', 
    icon: '⏰',
    activeBg: 'bg-gradient-to-r from-orange-500 to-amber-500',
    glow: 'shadow-orange-500/30'
  }
}

export default function SalesTab({ cashSales, onlineSales, payLaterSales, onViewInvoice }: SalesTabProps) {
  const [activeTab, setActiveTab] = useState<SalesTabType>('cash')

  const getSales = () => {
    switch (activeTab) {
      case 'cash': return cashSales
      case 'online': return onlineSales
      case 'paylater': return payLaterSales
      default: return cashSales
    }
  }

  const currentSales = getSales()
  const currentTabConfig = tabConfig[activeTab as keyof typeof tabConfig]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl font-semibold mb-6 text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>فرۆشتن</h2>
      
      {/* Sub-Tab Navigation - Floating Pill-shaped */}
      <div className="mb-6">
        <nav className="flex flex-row items-center justify-center gap-2 p-1.5 bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm w-fit mx-auto">
          {Object.values(tabConfig).map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SalesTabType)}
              className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 flex-shrink-0 ${
                activeTab === tab.id 
                  ? `${tab.activeBg} text-white shadow-lg ${tab.glow}`
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-800'
              }`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/20 rounded-xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </nav>
      </div>

      {/* Sales Table */}
      <GlassTable>
        <thead className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
          <tr>
            <th className="px-4 py-4 text-right text-xs font-bold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا</th>
            <th className="px-4 py-4 text-right text-xs font-bold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخ</th>
            <th className="px-4 py-4 text-right text-xs font-bold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
            <th className="px-4 py-4 text-right text-xs font-bold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کات</th>
            <th className="px-4 py-4 text-right text-xs font-bold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کڕیار</th>
            <th className="px-4 py-4 text-center text-xs font-bold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کردارەکان</th>
          </tr>
        </thead>
        <tbody>
          {currentSales.map((sale) =>
            (sale.items || []).map((item, itemIndex) => (
              <tr 
                key={`${sale.id}-${itemIndex}`} 
                className="border-t border-gray-100/50 hover:bg-white/60 transition-all duration-200"
              >
                <td className="px-4 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{item.item_name}</td>
                <td className="px-4 py-3 font-semibold" style={{ fontFamily: 'var(--font-uni-salar)', textAlign: 'left' }}>{formatCurrency(item.price)}</td>
                <td className="px-4 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.date}</td>
                <td className="px-4 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.time || '--:--'}</td>
                <td className="px-4 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.customer_name || 'نەناسراو'}</td>
                <td className="px-4 py-3 text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onViewInvoice(sale.id)}
                    className="relative group bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-full shadow-lg hover:shadow-green-500/30 transition-all duration-300"
                    title="پیشاندانی پسوڵە"
                  >
                    <Eye className="w-5 h-5" />
                    {/* Kurdish Label below icon */}
                    <span 
                      className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      بینین
                    </span>
                  </motion.button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </GlassTable>

      {/* Empty State */}
      {currentSales.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl"
        >
          <div className="bg-gray-100/50 p-6 rounded-full mb-4">
            <ShoppingBag className="w-16 h-16 text-gray-300" />
          </div>
          <p 
            className="text-gray-400 text-lg" 
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            هیچ فرۆشتنێک نییە
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
