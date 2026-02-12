'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { formatCurrency } from '@/lib/numberUtils'
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
  onPaymentMethodChange: (method: 'cash' | 'fib' | 'debt') => void
  onDiscountChange: (discount: number) => void
  onCustomerChange: (customerId: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  onCompleteSale: () => void
  customers: { id: string; name: string }[]
  onCreateCustomer: () => void
}

export default function CartSidebar({
  cart,
  paymentMethod,
  selectedCustomer,
  discount,
  customerRequired,
  onPaymentMethodChange,
  onDiscountChange,
  onCustomerChange,
  onUpdateQuantity,
  onRemove,
  onCompleteSale,
  customers,
  onCreateCustomer
}: CartSidebarProps) {
  const total = cart.reduce((sum, item) => sum + item.total, 0) - discount

  return (
    <div className="h-[30vh] lg:h-full lg:w-96 bg-white dark:bg-transparent backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-white/20 shadow-2xl flex flex-col">
      {/* Cart Header */}
      <div className="p-3 border-b border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/10">
        <motion.h2
          className="text-lg font-bold text-[var(--theme-foreground)]"
          style={{ fontFamily: 'var(--font-uni-salar)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          سەبەتە
        </motion.h2>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-600 dark:text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
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

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-60">
        <AnimatePresence>
          {cart.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemove}
            />
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
            <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              سەبەتەکە بەتاڵە
            </p>
          </motion.div>
        )}
      </div>

      {/* Checkout Section */}
      <div className="bg-gray-50 dark:bg-white/10 backdrop-blur-xl border-t border-gray-200 dark:border-white/20 p-3 space-y-2">
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
            className={`w-full px-2 py-1 rounded border bg-white dark:bg-white/5 shadow-sm focus:ring-1 focus:outline-none transition-all duration-300 text-xs ${
              customerRequired
                ? 'ring-1 ring-red-500 border-red-300 bg-red-50 text-[var(--theme-foreground)]'
                : 'focus:ring-blue-500 border-gray-300 text-[var(--theme-foreground)] dark:text-gray-200'
            }`}
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            <option value="">کڕیار</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Payment Method */}
        <div className="grid grid-cols-3 gap-1">
          {(['cash', 'fib', 'debt'] as const).map((method) => {
            const labels = { cash: '💵 کاش', fib: '💳 ئۆنلاین', debt: '📝 قەرز' }
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
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            داشکاندن (IQD)
          </label>
          <motion.input
            type="text"
            value={discount}
            onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs text-center text-[var(--theme-foreground)] dark:text-gray-200"
            style={{ fontFamily: 'Inter, sans-serif' }}
            placeholder="0"
            whileFocus={{ scale: 1.02 }}
          />
        </motion.div>

        {/* Total */}
        <motion.div
          className="text-center p-2 bg-blue-50 dark:bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-lg border border-gray-200 dark:border-white/10 shadow-lg"
          whileHover={{ scale: 1.01 }}
          animate={{ scale: cart.length > 0 ? [1, 1.01, 1] : 1 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-gray-700 dark:text-gray-300/80 text-xs font-bold mb-0.5" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            کۆی گشتی
          </p>
          <p className="text-[var(--theme-foreground)] text-lg font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
            {formatCurrency(total)} IQD
          </p>
        </motion.div>

        {/* Complete Sale Button */}
        <motion.button
          onClick={onCompleteSale}
          disabled={cart.length === 0 || !selectedCustomer}
          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          style={{ fontFamily: 'var(--font-uni-salar)' }}
          whileHover={{ scale: cart.length > 0 && selectedCustomer ? 1.01 : 1, y: cart.length > 0 && selectedCustomer ? -0.5 : 0 }}
          whileTap={{ scale: cart.length > 0 && selectedCustomer ? 0.99 : 1 }}
        >
          <span className="flex items-center justify-center space-x-1">
            <span>{!selectedCustomer ? 'کڕیار' : 'فرۆشتن'}</span>
            <motion.span
              animate={{ x: (cart.length > 0 && selectedCustomer) ? [0, 3, 0] : 0 }}
              transition={{ duration: 1.5, repeat: (cart.length > 0 && selectedCustomer) ? Infinity : 0 }}
            >
              💰
            </motion.span>
          </span>
        </motion.button>
      </div>
    </div>
  )
}
