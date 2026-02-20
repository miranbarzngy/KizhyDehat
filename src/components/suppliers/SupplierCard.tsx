'use client'

import { formatCurrency, toEnglishDigits } from '@/lib/numberUtils'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'

interface SupplierCardProps {
  supplier: {
    id: string
    name: string
    company?: string
    phone: string
    supplier_image?: string
    balance: number
    total_debt?: number
  }
  onEdit: () => void
  onDelete: () => void
  onHistory: () => void
  onPayment: () => void
  onViewProducts?: () => void
}

export default function SupplierCard({ supplier, onEdit, onDelete, onHistory, onPayment, onViewProducts }: SupplierCardProps) {
  const { themeConfig } = useTheme()
  // Use total_debt if available, fallback to balance
  const displayDebt = supplier.total_debt !== undefined ? supplier.total_debt : supplier.balance
  
  // Get theme-aware colors
  const getCardBg = () => themeConfig.cardBg
  const getCardBorder = () => themeConfig.cardBorder
  const getPrimaryText = () => themeConfig.primary
  const getSecondaryText = () => themeConfig.secondary
  const getAccentColor = () => themeConfig.accent
  
  return (
    <div
      className="relative p-6 rounded-2xl backdrop-blur-md border"
      style={{
        background: getCardBg(),
        borderColor: getCardBorder(),
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="text-center mb-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${getAccentColor()}20, ${getAccentColor()}10)`,
            border: `2px solid ${getCardBorder()}`
          }}
        >
          {supplier.supplier_image ? (
            <img
              src={supplier.supplier_image}
              alt={supplier.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <span className="text-2xl">🏢</span>
          )}
        </div>
        <h3 className="text-lg font-bold mt-2" style={{ fontFamily: 'var(--font-uni-salar)', color: getPrimaryText() }}>
          {supplier.name}
        </h3>
        {supplier.company && (
          <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)', color: getSecondaryText() }}>{supplier.company}</p>
        )}
        <p className="text-sm opacity-75" style={{ fontFamily: 'sans-serif', color: getSecondaryText() }} dir="ltr">📞 {toEnglishDigits(supplier.phone)}</p>
      </div>

      <div className="text-center mb-4">
        {displayDebt > 0 ? (
          <>
            <div className="text-2xl font-bold" style={{ color: '#dc2626', fontFamily: 'var(--font-uni-salar)' }}>
              {formatCurrency(displayDebt)} د.ع
            </div>
            <div className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)', color: getSecondaryText() }}>کۆی قەرز</div>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold" style={{ color: '#16a34a', fontFamily: 'var(--font-uni-salar)' }}>
               قەرز ✓
            </div>
            <div className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)', color: getSecondaryText() }}>هیچ قەرزێک نییە</div>
          </>
        )}
      </div>

      {/* Action Buttons - Permanently Visible */}
      <div className="flex items-center justify-center gap-2 pt-4 border-t" style={{ borderColor: getCardBorder() }}>
        {/* Edit Button - Blue */}
        <div className="flex flex-col items-center group cursor-pointer" onClick={onEdit}>
          <motion.button
            className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md transition-colors duration-200"
            title="دەستکاری"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </motion.button>
          <span className="text-[10px] mt-1 group-hover:opacity-100 transition-opacity" style={{ fontFamily: 'var(--font-uni-salar)', color: getSecondaryText(), opacity: 0.7 }}>دەستکاری</span>
        </div>

        {/* Delete Button - Red */}
        <div className="flex flex-col items-center group cursor-pointer" onClick={onDelete}>
          <motion.button
            className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center shadow-md transition-colors duration-200"
            title="سڕینەوە"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </motion.button>
          <span className="text-[10px] mt-1 group-hover:opacity-100 transition-opacity" style={{ fontFamily: 'var(--font-uni-salar)', color: getSecondaryText(), opacity: 0.7 }}>سڕینەوە</span>
        </div>

        {/* History Button - Purple */}
        <div className="flex flex-col items-center group cursor-pointer" onClick={onHistory}>
          <motion.button
            className="w-10 h-10 bg-purple-500 hover:bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-md transition-colors duration-200"
            title="مێژوو"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.button>
          <span className="text-[10px] mt-1 group-hover:opacity-100 transition-opacity" style={{ fontFamily: 'var(--font-uni-salar)', color: getSecondaryText(), opacity: 0.7 }}>مێژوو</span>
        </div>

        {/* View Products Button - Indigo */}
        {onViewProducts && (
          <div className="flex flex-col items-center group cursor-pointer" onClick={onViewProducts}>
            <motion.button
              className="w-10 h-10 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md transition-colors duration-200"
              title="بینینی کاڵاکان"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </motion.button>
            <span className="text-[10px] mt-1 group-hover:opacity-100 transition-opacity" style={{ fontFamily: 'var(--font-uni-salar)', color: getSecondaryText(), opacity: 0.7 }}>کاڵاکان</span>
          </div>
        )}
      </div>
    </div>
  )
}
