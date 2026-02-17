'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { formatCurrency } from '@/lib/numberUtils'
import { useState, useEffect } from 'react'

interface Customer {
  id: string
  name: string
  phone1?: string
  total_debt?: number
  image?: string
}

interface CustomerSelectorProps {
  searchTerm: string
  showDropdown: boolean
  filteredCustomers: Customer[]
  selectedCustomerData: { name: string; phone1?: string; total_debt?: number; image?: string } | null
  onSearchChange: (value: string) => void
  onSelect: (customer: Customer) => void
  onDropdownChange: (show: boolean) => void
  onCreateNew: () => void
}

// Avatar component with fallback
function CustomerAvatar({ name, image, size = 40 }: { name: string; image?: string | null; size?: number }) {
  const [imgError, setImgError] = useState(false)
  
  const initial = name?.charAt(0)?.toUpperCase() || 'ک'
  
  // Generate a consistent color based on name
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500'
  ]
  const colorIndex = name.charCodeAt(0) % colors.length
  const bgColor = colors[colorIndex]

  // Check if image exists and is a valid URL (not empty/null/undefined)
  const hasValidImage = image && image.trim() !== '' && image.length > 0

  if (hasValidImage && !imgError) {
    return (
      <div 
        className="rounded-full overflow-hidden flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <img 
          src={image} 
          alt={name || 'Customer'}
          className="w-full h-full object-cover"
          onError={() => {
            console.log('Image failed to load:', image)
            setImgError(true)
          }}
        />
      </div>
    )
  }

  return (
    <div 
      className={`rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${bgColor}`}
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  )
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
  const [isSearching, setIsSearching] = useState(false)

  // Simulate searching state
  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true)
      const timer = setTimeout(() => setIsSearching(false), 300)
      return () => clearTimeout(timer)
    } else {
      setIsSearching(false)
    }
  }, [searchTerm])

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
            className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10"
            style={{ color: 'var(--theme-secondary)' }}
            whileHover={{ scale: 1.1 }}
          >
            {isSearching ? (
              <div 
                className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ 
                  borderColor: 'var(--theme-accent)',
                  borderTopColor: 'transparent'
                }}
              />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
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
            className="w-full px-4 py-2 pr-10 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:outline-none text-sm"
            style={{ 
              backgroundColor: 'var(--theme-card-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-foreground)',
              fontFamily: 'var(--font-uni-salar)'
            }}
            whileFocus={{ scale: 1.01 }}
          />

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                className="absolute top-full left-0 right-0 mt-1 backdrop-blur-xl rounded-xl shadow-2xl border z-50 max-h-60 overflow-y-auto overflow-x-hidden"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{ 
                  backgroundColor: 'var(--theme-card-bg)',
                  borderColor: 'var(--theme-border)'
                }}
              >
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer, index) => (
                    <motion.button
                      key={customer.id}
                      onClick={() => onSelect(customer)}
                      className="w-full px-3 py-2 text-right transition-colors duration-200 first:rounded-t-xl customer-row overflow-hidden"
                      style={{ 
                        backgroundColor: 'transparent',
                        fontFamily: 'var(--font-uni-salar)'
                      }}
                      whileHover={{ scale: 1.01, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex justify-between items-center min-w-0">
                        {/* Right Side (RTL): Avatar + Name */}
                        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
                          <CustomerAvatar 
                            name={customer.name} 
                            image={customer.image}
                            size={40}
                          />
                          <span 
                            className="font-bold text-sm truncate"
                            style={{ 
                              color: 'var(--theme-foreground)',
                              fontFamily: 'var(--font-uni-salar)'
                            }}
                          >
                            {customer.name}
                          </span>
                        </div>
                        
                        {/* Left Side (RTL): Phone + Debt */}
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                          <span 
                            className="text-xs"
                            style={{ 
                              color: 'var(--theme-secondary)',
                              fontFamily: 'Inter, sans-serif'
                            }}
                          >
                            {customer.phone1 || '---'}
                          </span>
                          {customer.total_debt && customer.total_debt > 0 && (
                            <span 
                              className="text-xs font-medium"
                              style={{ 
                                color: '#ef4444',
                                fontFamily: 'Inter, sans-serif'
                              }}
                            >
                              قەرز: {formatCurrency(customer.total_debt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div 
                    className="px-3 py-4 text-center text-sm"
                    style={{ 
                      color: 'var(--theme-secondary)',
                      fontFamily: 'var(--font-uni-salar)'
                    }}
                  >
                    هیچ کڕیارێک نەدۆزرایەوە
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          onClick={onCreateNew}
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 border border-emerald-200 text-white rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center"
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
            className="mt-3 p-3 backdrop-blur-md rounded-xl border"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ 
              backgroundColor: 'var(--theme-muted)',
              borderColor: 'var(--theme-border)'
            }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <CustomerAvatar 
                  name={selectedCustomerData.name}
                  image={selectedCustomerData.image}
                  size={36}
                />
                <div>
                  <div 
                    className="font-bold"
                    style={{ 
                      color: 'var(--theme-foreground)',
                      fontFamily: 'var(--font-uni-salar)' 
                    }}
                  >
                    {selectedCustomerData.name}
                  </div>
                  <div 
                    className="text-sm"
                    style={{ 
                      color: 'var(--theme-secondary)', 
                      fontFamily: 'Inter, sans-serif' 
                    }}
                  >
                    {selectedCustomerData.phone1}
                  </div>
                </div>
              </div>
              {selectedCustomerData.total_debt && selectedCustomerData.total_debt > 0 && (
                <div className="text-right">
                  <div 
                    className="text-sm font-medium"
                    style={{ 
                      color: '#ef4444',
                      fontFamily: 'var(--font-uni-salar)'
                    }}
                  >
                    قەرزی ئێستا
                  </div>
                  <motion.div
                    className="text-lg font-bold"
                    style={{ 
                      color: '#ef4444',
                      fontFamily: 'Inter, sans-serif'
                    }}
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
