'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
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
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[800px] w-full text-xs md:text-sm">
          {children}
        </table>
      </div>
    </div>
  )
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl font-semibold mb-6 text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>فرۆشتن</h2>
      
      <div className="border-b mb-6 border-gray-200/50">
        <nav className="flex flex-row overflow-x-auto whitespace-nowrap scrollbar-hide px-2">
          {[
            { id: 'cash', label: 'کاش', icon: '💵' },
            { id: 'online', label: 'ئۆنلاین', icon: '💳' },
            { id: 'paylater', label: 'قەرز', icon: '⏰' }
          ].map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SalesTabType)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 flex-shrink-0 ${
                activeTab === tab.id 
                  ? 'border-green-500 text-green-600 bg-green-50/50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <span className="ml-2 text-lg">{tab.icon}</span>
              {tab.label}
            </motion.button>
          ))}
        </nav>
      </div>

      <GlassTable>
        <thead className="bg-gradient-to-r from-green-500/10 to-emerald-500/10">
          <tr>
            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا</th>
            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخ</th>
            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کات</th>
            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کڕیار</th>
            <th className="px-3 py-4 text-center text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کردارەکان</th>
          </tr>
        </thead>
        <tbody>
          {currentSales.map((sale) =>
            (sale.items || []).map((item, itemIndex) => (
              <tr key={`${sale.id}-${itemIndex}`} className="border-t border-gray-100/50 hover:bg-white/30 transition-colors duration-200">
                <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{item.item_name}</td>
                <td className="px-3 py-3 font-semibold" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(item.price)}</td>
                <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.date}</td>
                <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.time || '--:--'}</td>
                <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.customer_name || 'نەناسراو'}</td>
                <td className="px-3 py-3 text-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onViewInvoice(sale.id)}
                    className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors shadow-md"
                    title="پیشاندانی پسوڵە"
                  >
                    <Eye className="w-4 h-4" />
                  </motion.button>
                </td>
              </tr>
            ))
          )}
          {currentSales.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>هیچ فرۆشتنێک نیە</td>
            </tr>
          )}
        </tbody>
      </GlassTable>
    </motion.div>
  )
}
