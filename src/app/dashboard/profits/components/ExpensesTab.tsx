'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { PurchaseExpense, ExpenseItem, ExpensesTab as ExpensesTabType } from './types'
import { formatCurrency } from '@/lib/numberUtils'

interface ExpensesTabProps {
  purchaseExpenses: PurchaseExpense[]
  generalExpenses: ExpenseItem[]
  onViewPurchaseInvoice: (purchaseId: string) => void
}

function GlassTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[700px] w-full text-xs md:text-sm">
          {children}
        </table>
      </div>
    </div>
  )
}

export default function ExpensesTab({ purchaseExpenses, generalExpenses, onViewPurchaseInvoice }: ExpensesTabProps) {
  const [activeTab, setActiveTab] = useState<ExpensesTabType>('inventory')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="border-b mb-6 border-gray-200/50">
        <nav className="flex flex-row overflow-x-auto whitespace-nowrap scrollbar-hide px-2">
          {[
            { id: 'inventory', label: 'خەرجی کاڵا', icon: '📦' },
            { id: 'general', label: 'خەرجی گشتی', icon: '📋' }
          ].map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ExpensesTabType)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 flex-shrink-0 ${
                activeTab === tab.id 
                  ? 'border-red-500 text-red-600 bg-red-50/50' 
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

      {activeTab === 'inventory' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 mb-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2 text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی خەرجی کاڵا</h2>
              <p className="text-4xl font-bold text-red-600" style={{ fontFamily: 'Inter, sans-serif' }}>{formatCurrency(purchaseExpenses.reduce((sum, item) => sum + item.total_purchase_price, 0))} IQD</p>
            </div>
          </div>

          <GlassTable>
            <thead className="bg-gradient-to-r from-red-500/10 to-orange-500/10">
              <tr>
                <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا</th>
                <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ</th>
                <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>یەکە</th>
                <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی کۆی</th>
                <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                <th className="px-3 py-4 text-center text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کردارەکان</th>
              </tr>
            </thead>
            <tbody>
              {purchaseExpenses.map((expense) => (
                <tr key={expense.id} className="border-t border-gray-100/50 hover:bg-white/30 transition-colors duration-200">
                  <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.item_name}</td>
                  <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.total_amount_bought.toLocaleString()}</td>
                  <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.unit}</td>
                  <td className="px-3 py-3 font-bold text-red-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(expense.total_purchase_price)}</td>
                  <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.purchase_date}</td>
                  <td className="px-3 py-3 text-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onViewPurchaseInvoice(expense.id)}
                      className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors shadow-md"
                      title="پیشاندانی پسوڵە"
                    >
                      <Eye className="w-4 h-4" />
                    </motion.button>
                  </td>
                </tr>
              ))}
              {purchaseExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>هیچ خەرجی کاڵایەک نیە</td>
                </tr>
              )}
            </tbody>
          </GlassTable>
        </motion.div>
      )}

      {activeTab === 'general' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 mb-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2 text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی خەرجی گشتی</h2>
              <p className="text-4xl font-bold text-red-600" style={{ fontFamily: 'Inter, sans-serif' }}>{formatCurrency(generalExpenses.reduce((sum, item) => sum + item.amount, 0))} IQD</p>
            </div>
          </div>

          <GlassTable>
            <thead className="bg-gradient-to-r from-red-500/10 to-orange-500/10">
              <tr>
                <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>تەوضێحات</th>
                <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ</th>
                <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
              </tr>
            </thead>
            <tbody>
              {generalExpenses.map((expense) => (
                <tr key={expense.id} className="border-t border-gray-100/50 hover:bg-white/30 transition-colors duration-200">
                  <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.description}</td>
                  <td className="px-3 py-3 font-bold text-red-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(expense.amount)}</td>
                  <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.date}</td>
                </tr>
              ))}
              {generalExpenses.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>هیچ خەرجی گشتیەک نیە</td>
                </tr>
              )}
            </tbody>
          </GlassTable>
        </motion.div>
      )}
    </motion.div>
  )
}
