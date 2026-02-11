'use client'

import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { ProfitItem } from './types'
import { formatCurrency } from '@/lib/numberUtils'

interface ProfitsTabProps {
  profits: ProfitItem[]
  totalProfit: number
  onViewInvoice: (saleId: string) => void
}

function GlassTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-xs md:text-sm">
          {children}
        </table>
      </div>
    </div>
  )
}

export default function ProfitsTab({ profits, totalProfit, onViewInvoice }: ProfitsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 mb-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی قازانج</h2>
          <p className={`text-4xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>{formatCurrency(totalProfit)} IQD</p>
          <p className={`text-sm mt-2 ${totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>{totalProfit >= 0 ? 'قازانجی پاک' : 'زیان'}</p>
        </div>
      </div>

      <GlassTable>
        <thead className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <tr>
            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>ژمارەی پسوڵە</th>
            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا</th>
            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی کڕین</th>
            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی فرۆشتن</th>
            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>داشکاندن</th>
            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>قازانج</th>
            <th className="px-3 py-4 text-center text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کردارەکان</th>
          </tr>
        </thead>
        <tbody>
          {profits.map((profit) => (
            <tr key={profit.id} className="border-t border-gray-100/50 hover:bg-white/30 transition-colors duration-200">
              <td className="px-3 py-3 font-mono text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>{profit.invoice_number || '--'}</td>
              <td className="px-3 py-3 font-medium" style={{ fontFamily: 'var(--font-uni-salar)' }}>{profit.item_name}</td>
              <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{profit.date}</td>
              <td className="px-3 py-3 text-red-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(profit.cost_price * profit.quantity)}</td>
              <td className="px-3 py-3 text-blue-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(profit.price * profit.quantity)}</td>
              <td className="px-3 py-3 text-orange-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(profit.item_discount)}</td>
              <td className={`px-3 py-3 font-bold ${profit.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(profit.profit)}</td>
              <td className="px-3 py-3 text-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onViewInvoice(profit.sale_id)}
                  className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors shadow-md"
                  title="پیشاندانی پسوڵە"
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
              </td>
            </tr>
          ))}
          {profits.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-8 text-center text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>هیچ قازانجێک نیە</td>
            </tr>
          )}
        </tbody>
      </GlassTable>
    </motion.div>
  )
}
