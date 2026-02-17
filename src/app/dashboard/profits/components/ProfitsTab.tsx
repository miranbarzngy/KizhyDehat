'use client'

import { formatCurrency } from '@/lib/numberUtils'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, BarChart2, Eye, TrendingUp } from 'lucide-react'
import { ProfitItem } from './types'

interface ProfitsTabProps {
  profits: ProfitItem[]
  totalProfit: number
  onViewInvoice: (saleId: string) => void
}

function GlassTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-xs md:text-sm">
          {children}
        </table>
      </div>
    </div>
  )
}

export default function ProfitsTab({ profits, totalProfit, onViewInvoice }: ProfitsTabProps) {
  // Calculate total for current filtered list
  const listTotalProfit = profits.reduce((sum, p) => sum + p.profit, 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Summarized Profit Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-6 shadow-sm"
      >
        <div className="text-center">
          <h3 
            className="text-sm font-medium mb-2 text-gray-600" 
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            کۆی قازانجی ئەم لیستە
          </h3>
          <p 
            className={`text-4xl font-bold ${listTotalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {formatCurrency(listTotalProfit)} IQD
          </p>
        </div>
      </motion.div>

      <GlassTable>
        <thead className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
          <tr>
            <th className="px-4 py-4 text-center text-sm font-bold text-gray-700 whitespace-nowrap" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا</th>
            <th className="px-4 py-4 text-center text-sm font-bold text-gray-700 whitespace-nowrap" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
            <th className="px-4 py-4 text-center text-sm font-bold text-gray-700 whitespace-nowrap" style={{ fontFamily: 'var(--font-uni-salar)' }}>کات</th>
            <th className="px-4 py-4 text-center text-sm font-bold text-gray-700 whitespace-nowrap" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی کڕین</th>
            <th className="px-4 py-4 text-center text-sm font-bold text-gray-700 whitespace-nowrap" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی فرۆشتن</th>
            <th className="px-4 py-4 text-center text-sm font-bold text-gray-700 whitespace-nowrap" style={{ fontFamily: 'var(--font-uni-salar)' }}>داشکاندن</th>
            <th className="px-4 py-4 text-center text-sm font-bold text-gray-700 whitespace-nowrap" style={{ fontFamily: 'var(--font-uni-salar)' }}>قازانج</th>
            <th className="px-4 py-4 text-center text-sm font-bold text-gray-700 whitespace-nowrap" style={{ fontFamily: 'var(--font-uni-salar)' }}>بینین</th>
          </tr>
        </thead>
        <tbody>
          {profits.map((profit) => (
            <tr 
              key={profit.id} 
              className="border-t border-gray-100/50 hover:bg-white/60 transition-all duration-200"
            >
              <td className="px-4 py-4 font-medium text-lg text-center" style={{ fontFamily: 'var(--font-uni-salar)' }}>{profit.item_name}</td>
              <td className="px-4 py-4 text-lg text-center" style={{ fontFamily: 'Inter, sans-serif' }}>{profit.date}</td>
              <td className="px-4 py-4 text-lg text-center" style={{ fontFamily: 'Inter, sans-serif' }}>{profit.time || '--:--'}</td>
              
              {/* Cost Price - Red with ArrowDownRight */}
              <td className="px-4 py-4 text-lg text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                <span className="text-red-500 inline-flex items-center gap-1 text-base font-semibold">
                  <ArrowDownRight className="w-4 h-4" />
                  {formatCurrency(profit.cost_price * profit.quantity)}
                </span>
              </td>
              
              {/* Sale Price - Blue with ArrowUpRight */}
              <td className="px-4 py-4 text-lg text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                <span className="text-blue-500 inline-flex items-center gap-1 text-base font-semibold">
                  <ArrowUpRight className="w-4 h-4" />
                  {formatCurrency(profit.price * profit.quantity)}
                </span>
              </td>
              
              {/* Discount - Orange */}
              <td className="px-4 py-4 text-orange-500 text-lg font-semibold text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                {formatCurrency(profit.item_discount)}
              </td>
              
              {/* Profit - Emerald with TrendingUp */}
              <td className="px-4 py-4 text-lg text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                {profit.profit >= 0 ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50/50 rounded-lg text-emerald-600 font-bold text-base">
                    <TrendingUp className="w-4 h-4" />
                    {formatCurrency(profit.profit)}
                  </span>
                ) : (
                  <span className="text-red-500 font-bold text-base">
                    {formatCurrency(profit.profit)}
                  </span>
                )}
              </td>
              
              <td className="px-4 py-3 text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onViewInvoice(profit.sale_id)}
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
          ))}
        </tbody>
      </GlassTable>

      {/* Empty State */}
      {profits.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl"
        >
          <div className="bg-gray-100/50 p-6 rounded-full mb-4">
            <BarChart2 className="w-16 h-16 text-gray-300" />
          </div>
          <p 
            className="text-gray-400 text-lg" 
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            تا ئێستا هیچ قازانجێک تۆمار نەکراوە
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
