'use client'

import { formatCurrency } from '@/lib/numberUtils'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Globe, Store } from 'lucide-react'
import { useState } from 'react'
import { FaFacebook, FaWhatsapp } from 'react-icons/fa'
import CartItem from './CartItem'

interface CartItemType {
  id: string
  item: {
    name: string
  }
  quantity: number
  unit: string
  price: number
  total: number
}

interface CartSidebarProps {
  cart: CartItemType[]
  paymentMethod: 'cash' | 'fib' | 'debt'
  selectedCustomer: string
  discount: number
  customerRequired: boolean
  orderSource: string
  onPaymentMethodChange: (method: 'cash' | 'fib' | 'debt') => void
  onDiscountChange: (discount: number) => void
  onCustomerChange: (customerId: string) => void
  onOrderSourceChange: (source: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  onCompleteSale: () => void
  customers: { id: string; name: string }[]
  onCreateCustomer: () => void
  isProcessing?: boolean
}

// Brand icon components with proper colors and larger sizes (32px+)
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="url(#instagram-gradient)">
    <defs>
      <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E4405F"/>
        <stop offset="25%" stopColor="#F77737"/>
        <stop offset="50%" stopColor="#FCAF45"/>
        <stop offset="75%" stopColor="#E6683C"/>
        <stop offset="100%" stopColor="#C13584"/>
      </linearGradient>
    </defs>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
)

// Order source options with Kurdish labels and brand icons
const ORDER_SOURCE_OPTIONS = [
  { 
    value: 'Instagram', 
    label: 'ئینستاگرام', 
    icon: InstagramIcon,
    iconClassName: 'w-7 h-7'
  },
  { 
    value: 'Facebook', 
    label: 'فەیسبووک', 
    icon: FaFacebook,
    iconClassName: 'w-7 h-7',
    iconColor: '#1877F2'
  },
  { 
    value: 'TikTok', 
    label: 'تیکتۆک', 
    icon: TikTokIcon,
    iconClassName: 'w-7 h-7',
    iconColor: '#000000'
  },
  { 
    value: 'WhatsApp', 
    label: 'وەتسئەپ', 
    icon: FaWhatsapp,
    iconClassName: 'w-7 h-7',
    iconColor: '#25D366'
  },
  { 
    value: 'In-Store', 
    label: 'فرۆشگا', 
    icon: Store,
    iconClassName: 'w-7 h-7',
    iconColor: '#6B7280'
  },
  { 
    value: 'Other', 
    label: 'تر', 
    icon: Globe,
    iconClassName: 'w-7 h-7',
    iconColor: '#6B7280'
  },
]

export default function CartSidebar({
  cart,
  paymentMethod,
  selectedCustomer,
  discount,
  customerRequired,
  orderSource,
  onPaymentMethodChange,
  onDiscountChange,
  onCustomerChange,
  onOrderSourceChange,
  onUpdateQuantity,
  onRemove,
  onCompleteSale,
  customers,
  onCreateCustomer,
  isProcessing = false
}: CartSidebarProps) {
  const total = cart.reduce((sum, item) => sum + item.total, 0) - discount
  const [showOrderSourceModal, setShowOrderSourceModal] = useState(false)

  // Get the current order source label and icon
  const currentSource = ORDER_SOURCE_OPTIONS.find(opt => opt.value === orderSource)
  const currentSourceLabel = currentSource ? currentSource.label : 'سەرچاوەی داواکاری'
  const CurrentIcon = currentSource ? currentSource.icon : Globe

  // Handle order source selection
  const handleOrderSourceSelect = (source: string) => {
    onOrderSourceChange(source)
    setShowOrderSourceModal(false)
  }

  return (
    <div 
      className="h-[45vh] md:h-[50vh] lg:h-full lg:w-96 backdrop-blur-xl border-t lg:border-t-0 lg:border-l shadow-2xl flex flex-col"
      style={{ 
        backgroundColor: 'var(--theme-card-bg)',
        borderColor: 'var(--theme-border)'
      }}
    >
      {/* Cart Header */}
      <div 
        className="p-3 border-b flex-shrink-0"
        style={{ 
          borderColor: 'var(--theme-border)',
          backgroundColor: 'var(--theme-muted)'
        }}
      >
        <motion.h2
          className="text-lg font-bold text-[var(--theme-foreground)]"
          style={{ fontFamily: 'var(--font-uni-salar)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          سەبەتە
        </motion.h2>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs" style={{ color: 'var(--theme-secondary)', fontFamily: 'Inter, sans-serif' }}>
            {cart.length} کاڵا
          </span>
          <motion.div
            className="w-6 h-6 bg-blue-600 dark:bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
            animate={{ scale: cart.length > 0 ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-white text-xs font-bold">{cart.length}</span>
          </motion.div>
        </div>
      </div>

      {/* Cart Items - Scrollable container with minimum height */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[120px] lg:min-h-0 pb-32">
        <AnimatePresence>
          {cart.map((item) => (
            <div key={item.id} className="pb-2">
              <CartItem
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
              />
            </div>
          ))}
        </AnimatePresence>

        {cart.length === 0 && (
          <motion.div
            className="text-center py-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-3xl mb-2">🛒</div>
            <p className="text-sm" style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>
              سەبەتەکە بەتاڵە
            </p>
          </motion.div>
        )}
      </div>

      {/* Checkout Section - shrink-0 to prevent taking too much space */}
      <div 
        className="backdrop-blur-xl border-t p-3 space-y-2 flex-shrink-0"
        style={{ 
          backgroundColor: 'var(--theme-muted)',
          borderColor: 'var(--theme-border)'
        }}
      >
        {/* Customer Selection */}
        <motion.div
          className={`space-y-1 ${customerRequired ? 'animate-pulse' : ''}`}
          animate={customerRequired ? {
            boxShadow: ['0 0 0 0 rgba(239, 68, 68, 0.7)', '0 0 0 4px rgba(239, 68, 68, 0)', '0 0 0 0 rgba(239, 68, 68, 0.7)']
          } : {}}
          transition={{ duration: 1.5, repeat: customerRequired ? Infinity : 0 }}
        >
          <select
            value={selectedCustomer}
            onChange={(e) => onCustomerChange(e.target.value)}
            className="w-full px-2 py-2 rounded border shadow-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-300 text-xs h-10"
            style={{ 
              backgroundColor: 'var(--theme-card-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-foreground)',
              fontFamily: 'var(--font-uni-salar)'
            }}
          >
            <option value="">کڕیار</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Order Source Selection - Touch-friendly button with ChevronDown - consistent height */}
        <motion.div
          className="space-y-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <motion.button
            onClick={() => setShowOrderSourceModal(true)}
            className="w-full px-3 py-2 rounded-xl border shadow-sm transition-all duration-300 flex items-center justify-between h-10"
            style={{ 
              backgroundColor: 'var(--theme-card-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-foreground)',
              fontFamily: 'var(--font-uni-salar)'
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <span className="flex items-center gap-2">
              <CurrentIcon className={`${currentSource?.iconClassName || 'w-5 h-5'}`} style={{ color: currentSource?.iconColor }} />
              <span className="text-sm">{currentSourceLabel}</span>
            </span>
            <ChevronDown className="w-4 h-4 opacity-60" />
          </motion.button>
        </motion.div>

        {/* Order Source Modal */}
        <AnimatePresence>
          {showOrderSourceModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center p-4 z-[99999]"
            >
              {/* Backdrop - Darker with blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowOrderSourceModal(false)}
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
                style={{
                  background: 'var(--theme-card-bg)',
                  border: '1px solid var(--theme-card-border)'
                }}
              >
                {/* Header */}
                <div 
                  className="p-3 pb-2 border-b text-center"
                  style={{ borderColor: 'var(--theme-card-border)' }}
                >
                  <h3 
                    className="text-base font-bold"
                    style={{ 
                      color: 'var(--theme-foreground)',
                      fontFamily: 'var(--font-uni-salar)' 
                    }}
                  >
                    سەرچاوەی داواکاری هەڵبژێرە
                  </h3>
                </div>

                {/* Options Grid with compact layout */}
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {ORDER_SOURCE_OPTIONS.map((option) => {
                      const isSelected = orderSource === option.value
                      const IconComponent = option.icon
                      return (
                        <motion.button
                          key={option.value}
                          onClick={() => handleOrderSourceSelect(option.value)}
                          className={`p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-1 relative ${
                            isSelected 
                              ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/30' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{ 
                            backgroundColor: isSelected ? undefined : 'var(--theme-muted)',
                          }}
                        >
                          <IconComponent className={option.iconClassName} style={{ color: option.iconColor }} />
                          <span 
                            className={`text-sm font-bold ${isSelected ? 'text-purple-600 dark:text-purple-400' : ''}`}
                            style={{ 
                              color: isSelected ? undefined : 'var(--theme-foreground)',
                              fontFamily: 'var(--font-uni-salar)' 
                            }}
                          >
                            {option.label}
                          </span>
                          {isSelected && (
                            <span className="absolute top-1 right-1 text-purple-500 text-xs">✓</span>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Close Button with bottom margin */}
                <div className="p-3 pt-0 mb-2">
                  <motion.button
                    onClick={() => setShowOrderSourceModal(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl font-bold transition-all"
                    style={{ 
                      backgroundColor: 'var(--theme-muted)',
                      color: 'var(--theme-foreground)',
                      fontFamily: 'var(--font-uni-salar)'
                    }}
                  >
                    داخستن
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Method */}
        <div className="grid grid-cols-3 gap-1">
          {(['cash', 'fib', 'debt'] as const).map((method) => {
            const labels = { cash: 'کاش', fib: 'ئۆنلاین', debt: 'قەرز' }
            const colors = {
              cash: paymentMethod === 'cash' ? 'bg-green-600 border-green-500 text-white' : 'bg-white border-gray-300 hover:bg-green-50 text-gray-800',
              fib: paymentMethod === 'fib' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white border-gray-300 hover:bg-blue-50 text-gray-800',
              debt: paymentMethod === 'debt' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-white border-gray-300 hover:bg-orange-50 text-gray-800'
            }
            return (
              <motion.button
                key={method}
                onClick={() => onPaymentMethodChange(method)}
                className={`p-1 rounded-lg border transition-all duration-300 text-xs ${colors[method as keyof typeof colors]}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-center">
                  <div className="text-sm mb-0.5">{labels[method as keyof typeof labels].split(' ')[0]}</div>
                  <div className="text-xs font-bold">{labels[method as keyof typeof labels].split(' ').slice(1).join(' ')}</div>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Discount */}
        <motion.div
          className="space-y-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-xs font-medium" style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>
            داشکاندن (IQD)
          </label>
          <motion.input
            type="text"
            value={discount}
            onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
            className="w-full px-2 py-1 rounded border shadow-sm focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs text-center"
            style={{ 
              borderColor: 'var(--theme-border)', 
              backgroundColor: 'var(--theme-card-bg)',
              color: 'var(--theme-foreground)',
              fontFamily: 'Inter, sans-serif'
            }}
            placeholder="0"
            whileFocus={{ scale: 1.02 }}
          />
        </motion.div>

        {/* Total */}
        <motion.div
          className="text-center p-2 backdrop-blur-md rounded-lg border shadow-lg"
          whileHover={{ scale: 1.01 }}
          animate={{ scale: cart.length > 0 ? [1, 1.01, 1] : 1 }}
          transition={{ duration: 0.5 }}
          style={{ 
            backgroundColor: 'var(--theme-muted)',
            borderColor: 'var(--theme-border)'
          }}
        >
          <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>
            کۆی گشتی
          </p>
          <p className="text-[var(--theme-foreground)] text-lg font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
            {formatCurrency(total)} IQD
          </p>
        </motion.div>

        {/* Complete Sale Button */}
        <motion.button
          onClick={onCompleteSale}
          disabled={cart.length === 0 || !selectedCustomer || isProcessing}
          className="w-full py-5 px-3 bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          style={{ fontFamily: 'var(--font-uni-salar)' }}
          whileHover={{ scale: (cart.length > 0 && selectedCustomer && !isProcessing) ? 1.01 : 1, y: (cart.length > 0 && selectedCustomer && !isProcessing) ? -0.5 : 0 }}
          whileTap={{ scale: (cart.length > 0 && selectedCustomer && !isProcessing) ? 0.99 : 1 }}
        >
          <span className="flex items-center justify-center space-x-1">
            {isProcessing ? (
              <>
                <span>چاوەڕوانبە...</span>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  ⏳
                </motion.span>
              </>
            ) : (
              <>
                <span>{!selectedCustomer ? 'کڕیار' : 'فرۆشتن'}</span>
                <motion.span
                  animate={{ x: (cart.length > 0 && selectedCustomer) ? [0, 3, 0] : 0 }}
                  transition={{ duration: 1.5, repeat: (cart.length > 0 && selectedCustomer) ? Infinity : 0 }}
                >
                  💰
                </motion.span>
              </>
            )}
          </span>
        </motion.button>
      </div>
    </div>
  )
}
