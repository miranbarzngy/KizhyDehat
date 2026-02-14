'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Box, FileText, Receipt } from 'lucide-react'
import { PurchaseExpense, ExpenseItem, ExpensesTab as ExpensesTabType } from './types'
import { formatCurrency } from '@/lib/numberUtils'

interface ExpensesTabProps {
  purchaseExpenses: PurchaseExpense[]
  generalExpenses: ExpenseItem[]
  onViewPurchaseInvoice: (purchaseId: string) => void
}

function GlassTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[700px] w-full text-xs md:text-sm">
          {children}
        </table>
      </div>
    </div>
  )
}

const tabConfig = {
  inventory: { 
    id: 'inventory', 
    label: 'خەرجی کاڵا', 
    icon: '📦',
    activeBg: 'bg-gradient-to-r from-red-500 to-orange-500',
    glow: 'shadow-red-500/30'
  },
  general: { 
    id: 'general', 
    label: 'خەرجی گشتی', 
    icon: '📋',
    activeBg: 'bg-gradient-to-r from-orange-500 to-amber-500',
    glow: 'shadow-orange-500/30'
  }
}

export default function ExpensesTab({ purchaseExpenses, generalExpenses, onViewPurchaseInvoice }: ExpensesTabProps) {
  const [activeTab, setActiveTab] = useState<ExpensesTabType>('inventory')

  const totalInventoryExpenses = purchaseExpenses.reduce((sum, item) => sum + item.total_purchase_price, 0)
  const totalGeneralExpenses = generalExpenses.reduce((sum, item) => sum + item.amount, 0)

  const currentTabConfig = tabConfig[activeTab as keyof typeof tabConfig]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Sub-Tab Navigation - Floating Pill-shaped */}
      <div className="mb-6">
        <nav className="flex flex-row items-center justify-center gap-2 p-1.5 bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm w-fit mx-auto">
          {Object.values(tabConfig).map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ExpensesTabType)}
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
                  layoutId="expensesTab"
                  className="absolute inset-0 bg-white/20 rounded-xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
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
          {/* Summary Card - Frosted Glass */}
          <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-6 shadow-sm">
            <div className="text-center">
              <h2 
                className="text-xl font-semibold mb-2 text-gray-800" 
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                کۆی خەرجی کاڵا
              </h2>
              <p 
                className="text-4xl font-bold text-red-600" 
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {formatCurrency(totalInventoryExpenses)} IQD
              </p>
            </div>
          </div>

          <GlassTable>
            <thead className="bg-gradient-to-r from-orange-500/10 via-red-500/10 to-rose-500/10">
              <tr>
                <th className="px-4 py-4 text-right text-xs font-bold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>یەکە</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی کۆی</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
              </tr>
            </thead>
            <tbody>
              {purchaseExpenses.map((expense) => (
                <tr 
                  key={expense.id} 
                  className="border-t border-gray-100/50 hover:bg-white/60 transition-all duration-200"
                >
                  <td className="px-4 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    <span className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-orange-500" />
                      {expense.item_name}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ fontFamily: 'var(--font-uni-salar)', textAlign: 'left' }}>
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100/50 rounded-lg text-gray-700 text-xs">
                      {expense.total_amount_bought.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ fontFamily: 'var(--font-uni-salar)', textAlign: 'left' }}>
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100/50 rounded-lg text-gray-600 text-xs">
                      {expense.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-red-600" style={{ fontFamily: 'var(--font-uni-salar)', textAlign: 'left' }}>
                    {formatCurrency(expense.total_purchase_price)}
                  </td>
                  <td className="px-4 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.purchase_date}</td>
                </tr>
              ))}
            </tbody>
          </GlassTable>

          {/* Empty State */}
          {purchaseExpenses.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl"
            >
              <div className="bg-gray-100/50 p-6 rounded-full mb-4">
                <Receipt className="w-16 h-16 text-gray-300" />
              </div>
              <p 
                className="text-gray-400 text-lg" 
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                هیچ خەرجییەک لەم بەشەدا نییە
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {activeTab === 'general' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Summary Card - Frosted Glass */}
          <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-6 shadow-sm">
            <div className="text-center">
              <h2 
                className="text-xl font-semibold mb-2 text-gray-800" 
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                کۆی خەرجی گشتی
              </h2>
              <p 
                className="text-4xl font-bold text-red-600" 
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {formatCurrency(totalGeneralExpenses)} IQD
              </p>
            </div>
          </div>

          <GlassTable>
            <thead className="bg-gradient-to-r from-orange-500/10 via-red-500/10 to-rose-500/10">
              <tr>
                <th className="px-4 py-4 text-right text-xs font-bold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>تەوضێحات</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
              </tr>
            </thead>
            <tbody>
              {generalExpenses.map((expense) => (
                <tr 
                  key={expense.id} 
                  className="border-t border-gray-100/50 hover:bg-white/60 transition-all duration-200"
                >
                  <td className="px-4 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-400" />
                      {expense.description}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ fontFamily: 'var(--font-uni-salar)', textAlign: 'left' }}>
                    <span className="inline-flex items-center px-3 py-1 bg-red-50/50 rounded-lg text-red-600 font-bold">
                      {formatCurrency(expense.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.date}</td>
                </tr>
              ))}
            </tbody>
          </GlassTable>

          {/* Empty State */}
          {generalExpenses.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl"
            >
              <div className="bg-gray-100/50 p-6 rounded-full mb-4">
                <Receipt className="w-16 h-16 text-gray-300" />
              </div>
              <p 
                className="text-gray-400 text-lg" 
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                هیچ خەرجییەک لەم بەشەدا نییە
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
