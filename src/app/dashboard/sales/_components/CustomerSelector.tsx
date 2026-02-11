'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { formatCurrency } from '@/lib/numberUtils'

interface CustomerSelectorProps {
  searchTerm: string
  showDropdown: boolean
  filteredCustomers: { id: string; name: string; phone1?: string; total_debt?: number }[]
  selectedCustomerData: { name: string; phone1?: string; total_debt?: number } | null
  onSearchChange: (value: string) => void
  onSelect: (customer: { id: string; name: string; phone1?: string; total_debt?: number }) => void
  onDropdownChange: (show: boolean) => void
  onCreateNew: () => void
}

export default function CustomerSelector({
  searchTerm,
  showDropdown,
  filteredCustomers,
  selectedCustomerData,
  onSearchChange,
  onSelect,
  onDropdownChange,
  onCreateNew
}: CustomerSelectorProps) {
  return (
    <motion.div
      className="mb-2 relative customer-search-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <motion.div
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10"
            whileHover={{ scale: 1.1 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </motion.div>
          <motion.input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value)
              onDropdownChange(true)
            }}
            onFocus={() => onDropdownChange(true)}
            placeholder="گەڕان بۆ کڕیار"
            className="w-full px-4 py-2 pr-10 rounded-xl border-0 bg-white/5 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:outline-none text-sm text-gray-200 placeholder-gray-500"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
            whileFocus={{ scale: 1.01 }}
          />

          <AnimatePresence>
            {showDropdown && searchTerm && (
              <motion.div
                className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 z-50 max-h-48 overflow-y-auto"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer, index) => (
                    <motion.button
                      key={customer.id}
                      onClick={() => onSelect(customer)}
                      className="w-full px-3 py-2 text-right hover:bg-white/10 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl text-sm"
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="text-left">
                          <div className="text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {customer.phone1}
                          </div>
                          {customer.total_debt && customer.total_debt > 0 && (
                            <div className="text-xs text-red-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                              قەرز: {formatCurrency(customer.total_debt)} IQD
                            </div>
                          )}
                        </div>
                        <div className="font-bold text-gray-200 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          {customer.name}
                        </div>
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    هیچ کڕیارێک نەدۆزرایەوە
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          onClick={onCreateNew}
          className="px-3 py-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center"
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          title="کڕیاری نوێ زیادبکە"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </motion.button>
      </div>

      <AnimatePresence>
        {selectedCustomerData && (
          <motion.div
            className="mt-3 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md rounded-xl border border-white/10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <motion.div
                  className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <span className="text-white text-sm font-bold">👤</span>
                </motion.div>
                <div>
                  <div className="font-bold text-gray-100" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    {selectedCustomerData.name}
                  </div>
                  <div className="text-sm text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {selectedCustomerData.phone1}
                  </div>
                </div>
              </div>
              {selectedCustomerData.total_debt && selectedCustomerData.total_debt > 0 && (
                <div className="text-right">
                  <div className="text-sm text-red-400 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                    قەرزی ئێستا
                  </div>
                  <motion.div
                    className="text-lg font-bold text-red-400"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {formatCurrency(selectedCustomerData.total_debt)} IQD
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
