'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency, toEnglishDigits } from '@/lib/numberUtils'
import { FaPlus, FaPhone, FaEdit, FaTrash, FaMoneyBillWave, FaSearch, FaTimes, FaUserPlus, FaFileInvoice, FaPrint, FaEye } from 'react-icons/fa'
import { useGlobalInvoiceModal } from '@/hooks/useGlobalInvoiceModal'
import { buildInvoiceData } from '@/components/GlobalInvoiceModal'

interface Customer {
  id: string
  name: string
  image: string
  phone1: string
  phone2: string
  location: string
  total_debt: number
}

interface PaymentHistory {
  id: string
  date: string
  amount: number
  items: string
  note: string
  type: 'sale' | 'payment'
  payment_method?: string
  sale_id?: string
  invoice_number?: number
  subtotal?: number
  discount_amount?: number
}

interface InvoiceSettings {
  id: string
  shop_name: string
  shop_phone: string
  shop_address: string
  shop_logo: string
  thank_you_note: string
  qr_code_url: string
}

interface SaleItem {
  id: string
  item_name: string
  quantity: number
  unit: string
  price: number
  total: number
}

const CustomerImage = ({ customer, className = "" }: { customer: Customer, className?: string }) => (
  <div
    className={`rounded-2xl flex items-center justify-center overflow-hidden shadow-inner ${className}`}
    style={{ backgroundColor: 'var(--theme-muted)' }}
  >
    {customer.image ? (
      <img src={customer.image} alt={customer.name} className="w-full h-full object-cover rounded-2xl" />
    ) : (
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--theme-accent)' }}
      >
        <span className="text-white text-2xl font-bold">{customer.name.charAt(0)}</span>
      </div>
    )}
  </div>
)

// Kurdish numeral formatter
const toKurdishDigits = (value: any): string => {
  if (value === null || value === undefined) return '٠'
  const str = String(value)
  const kurdishDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return str.replace(/[0-9]/g, (digit) => kurdishDigits[parseInt(digit)])
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone1: '', phone2: '', location: '', image: null as File | null })
  const [searchTerm, setSearchTerm] = useState('')
  
  // Use global invoice modal context
  const { openModal } = useGlobalInvoiceModal()
  
  // Invoice data state for building invoice
  const [invoiceItems, setInvoiceItems] = useState<SaleItem[]>([])
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null)

  // Handle clicking on a history item to view invoice
  const handleViewInvoice = async (history: PaymentHistory) => {
    if (!supabase) {
      // Mock data for demo
      const mockItems = [
        { id: '1', item_name: 'کاڵای ١', quantity: 2, unit: 'دانە', price: 10000, total: 20000 },
        { id: '2', item_name: 'کاڵای ٢', quantity: 1, unit: 'دانە', price: 15000, total: 15000 },
      ]
      const mockSettings = {
        shop_name: 'فرۆشگای کوردستان',
        shop_phone: '07501234567',
        shop_address: 'هەولێر',
      }
      const invoiceData = buildInvoiceData(
        { sale_items: mockItems, customers: selectedCustomer },
        { id: history.id, invoice_number: 0, total: history.amount, date: history.date, payment_method: history.payment_method },
        mockSettings
      )
      openModal(invoiceData, history.id, 'پسوڵە')
      return
    }
    
    try {
      // Fetch sale items
      const { data: itemsData } = await supabase
        .from('sale_items')
        .select('id, item_name, quantity, unit, price, total')
        .eq('sale_id', history.id)

      // Fetch invoice settings
      const { data: settingsData } = await supabase
        .from('invoice_settings')
        .select('*')
        .single()

      const invoiceData = buildInvoiceData(
        { sale_items: itemsData || [], customers: selectedCustomer },
        { id: history.id, invoice_number: history.invoice_number, total: history.amount, date: history.date, payment_method: history.payment_method },
        settingsData || undefined
      )
      
      openModal(invoiceData, history.id, 'پسوڵە')
    } catch (error) {
      console.error('Error fetching invoice data:', error)
    }
  }

  // Handle print
  const handlePrint = () => {
    window.print()
  }

  useEffect(() => { fetchCustomers() }, [])

  useEffect(() => {
    if (selectedCustomer) {
      fetchPaymentHistory(selectedCustomer.id)
    } else {
      setPaymentHistory([])
    }
  }, [selectedCustomer])

  const fetchCustomers = async () => {
    if (!supabase) {
      setCustomers([
        { id: '1', name: 'ئەحمەد محەمەد', image: '', phone1: '0750-123-4567', phone2: '', location: 'هەولێر', total_debt: 125.50 },
        { id: '2', name: 'فاطمە عەلی', image: '', phone1: '0750-555-1234', phone2: '', location: 'سلێمانی', total_debt: 0 },
        { id: '3', name: 'محەمەد کەریم', image: '', phone1: '0750-777-8888', phone2: '', location: 'دهۆک', total_debt: 89.25 },
      ])
      setLoading(false)
      return
    }
    try {
      const { data } = await supabase.from('customers').select('*').order('name')
      setCustomers(data || [])
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  const fetchPaymentHistory = async (customerId: string) => {
    if (!supabase) {
      setPaymentHistory([])
      return
    }
    try {
      // Fetch sales for this customer
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, date, total, payment_method, status, created_at, discount_amount, subtotal, invoice_number')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (salesError) {
        console.error('Error fetching sales:', salesError)
        setPaymentHistory([])
        return
      }

      // Fetch sale items for each sale
      const history: PaymentHistory[] = []
      
      if (salesData && salesData.length > 0) {
        for (const sale of salesData) {
          const { data: itemsData } = await supabase
            .from('sale_items')
            .select('item_name, quantity, unit, price, total')
            .eq('sale_id', sale.id)
          
          const items = itemsData?.map(item => `${item.quantity} ${item.unit} ${item.item_name}`).join('، ') || ''
          
          history.push({
            id: sale.id,
            date: sale.date || sale.created_at,
            amount: sale.total,
            items: items,
            note: sale.discount_amount ? `داشکاندن: ${sale.discount_amount}` : '',
            type: sale.payment_method === 'debt' ? 'sale' : 'payment',
            payment_method: sale.payment_method,
            sale_id: sale.id,
            invoice_number: sale.invoice_number
          })
        }
      }
      
      setPaymentHistory(history)
    } catch (error) {
      console.error('Error fetching payment history:', error)
      setPaymentHistory([])
    }
  }

  const filteredCustomers = customers.filter(c => 
    !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone1.includes(searchTerm)
  )

  // Sort payment history by date descending (newest first)
  const sortedPaymentHistory = [...paymentHistory].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--theme-background)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--theme-accent)' }}></div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--theme-background)', minHeight: '100vh' }}>
      <h1 
        className="text-3xl font-bold mb-8 p-6 pl-0"
        style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
      >
        بەڕێوەبردنی کڕیاران
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6">
        {/* Customers List */}
        <div className="lg:col-span-1">
          <div 
            className="rounded-3xl p-6 shadow-lg border"
            style={{ 
              backgroundColor: 'var(--theme-card-bg)',
              borderColor: 'var(--theme-card-border)'
            }}
          >
            {/* New Customer Button - Touch Friendly */}
            <button
              onClick={() => setShowAddCustomer(true)}
              className="w-full mb-6 flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold text-lg transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
              style={{ 
                backgroundColor: 'var(--theme-accent)',
                color: '#ffffff',
                fontFamily: 'var(--font-uni-salar)',
                minHeight: '52px'
              }}
            >
              <FaPlus className="text-xl" />
              <span>زیادکردنی کڕیار</span>
            </button>

            {/* Search Bar - Touch Friendly */}
            <div className="mb-6 relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="گەڕان بەناوی یان تەلەفۆن..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-5 py-4 pr-14 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all text-lg"
                  style={{ 
                    backgroundColor: 'var(--theme-muted)',
                    borderColor: 'var(--theme-card-border)',
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)',
                    minHeight: '52px'
                  }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchTerm ? (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="p-2 rounded-full transition-colors"
                      style={{ 
                        minWidth: '44px', 
                        minHeight: '44px',
                        backgroundColor: 'var(--theme-card-bg)'
                      }}
                    >
                      <FaTimes className="text-lg" style={{ color: 'var(--theme-secondary)' }} />
                    </button>
                  ) : (
                    <FaSearch className="text-lg" style={{ color: 'var(--theme-secondary)' }} />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 
                className="text-xl font-semibold"
                style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
              >
                کڕیاران
              </h2>
              <span style={{ color: 'var(--theme-secondary)' }}>{filteredCustomers.length}</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pb-4">
              {filteredCustomers.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl cursor-pointer transition-all active:scale-[0.98]"
                  style={{ 
                    backgroundColor: selectedCustomer?.id === customer.id ? 'var(--theme-accent)' : 'var(--theme-card-bg)',
                    borderColor: 'var(--theme-card-border)',
                    minHeight: '72px'
                  }}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="flex items-center p-4 gap-3">
                    <CustomerImage customer={customer} className="w-12 h-12 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-medium text-lg truncate"
                        style={{ 
                          color: selectedCustomer?.id === customer.id ? '#ffffff' : 'var(--theme-foreground)',
                          fontFamily: 'var(--font-uni-salar)'
                        }}
                      >
                        {customer.name}
                      </h3>
                      <p 
                        className="text-base"
                        style={{ 
                          color: selectedCustomer?.id === customer.id ? 'rgba(255,255,255,0.8)' : 'var(--theme-secondary)',
                          fontFamily: 'Inter'
                        }}
                      >
                        {customer.phone1}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p 
                        className="text-base font-bold"
                        style={{ 
                          color: selectedCustomer?.id === customer.id ? '#ffffff' : customer.total_debt > 0 ? '#ef4444' : '#22c55e',
                          fontFamily: 'Inter'
                        }}
                      >
                        {formatCurrency(customer.total_debt)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Profile */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedCustomer ? (
              <motion.div
                key={selectedCustomer.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Header Card */}
                <div 
                  className="rounded-3xl p-8 shadow-lg border"
                  style={{ 
                    backgroundColor: 'var(--theme-card-bg)',
                    borderColor: 'var(--theme-card-border)'
                  }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    <CustomerImage customer={selectedCustomer} className="w-24 h-24" />
                    <div className="flex-1">
                      <h2 
                        className="text-3xl font-bold mb-4"
                        style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                      >
                        {selectedCustomer.name}
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm mb-1" style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>تەلەفۆن</p>
                          <a 
                            href={`tel:${selectedCustomer.phone1}`}
                            className="font-semibold text-lg flex items-center gap-2 p-2 -mx-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors"
                            style={{ color: 'var(--theme-accent)', fontFamily: 'Inter' }}
                          >
                            <FaPhone className="text-sm" />
                            {selectedCustomer.phone1}
                          </a>
                        </div>
                        <div>
                          <p className="text-sm mb-1" style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>ناونیشان</p>
                          <p className="font-semibold text-lg" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>{selectedCustomer.location || 'نەناسراو'}</p>
                        </div>
                      </div>
                    </div>
                    <div 
                      className="text-center p-6 rounded-2xl min-w-[160px]"
                      style={{ backgroundColor: 'var(--theme-muted)' }}
                    >
                      <p className="text-lg mb-2" style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>قەرز</p>
                      <p 
                        className="text-4xl font-bold"
                        style={{ color: selectedCustomer.total_debt > 0 ? '#ef4444' : '#22c55e', fontFamily: 'Inter' }}
                      >
                        {formatCurrency(selectedCustomer.total_debt)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons - Touch Friendly */}
                  <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t" style={{ borderColor: 'var(--theme-card-border)' }}>
                    <button
                      onClick={() => alert('دەستکاریکردنی کڕیار')}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all hover:opacity-90 active:scale-95"
                      style={{ 
                        backgroundColor: '#3b82f6', 
                        color: '#ffffff',
                        minHeight: '80px',
                        fontFamily: 'var(--font-uni-salar)'
                      }}
                    >
                      <FaEdit className="text-2xl" />
                      <span className="font-semibold">دەستکاری</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('دڵنیایت لە سڕینەوەی ئەم کڕیارە؟')) {
                          alert('سڕینەوە')
                        }
                      }}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all hover:opacity-90 active:scale-95"
                      style={{ 
                        backgroundColor: '#ef4444', 
                        color: '#ffffff',
                        minHeight: '80px',
                        fontFamily: 'var(--font-uni-salar)'
                      }}
                    >
                      <FaTrash className="text-2xl" />
                      <span className="font-semibold">سڕینەوە</span>
                    </button>
                    <button
                      onClick={() => alert('پارەدانەوەی قەرز')}
                      disabled={selectedCustomer.total_debt <= 0}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        backgroundColor: selectedCustomer.total_debt > 0 ? '#22c55e' : '#9ca3af', 
                        color: '#ffffff',
                        minHeight: '80px',
                        fontFamily: 'var(--font-uni-salar)'
                      }}
                    >
                      <FaMoneyBillWave className="text-2xl" />
                      <span className="font-semibold">پارەدان</span>
                    </button>
                  </div>
                </div>

                {/* Purchase History - Redesigned */}
                <div 
                  className="rounded-3xl p-6 shadow-lg border"
                  style={{ 
                    backgroundColor: 'var(--theme-card-bg)',
                    borderColor: 'var(--theme-card-border)'
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 
                      className="text-xl font-semibold"
                      style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                    >
                      مێژووی کڕینەکان
                    </h3>
                    <span style={{ color: 'var(--theme-secondary)' }}>{sortedPaymentHistory.length}</span>
                  </div>

                  {sortedPaymentHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-5xl mb-3">📋</div>
                      <p style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>
                        هیچ مێژوویەک نیە
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {sortedPaymentHistory.map((history, index) => (
                        <motion.div
                          key={history.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] group"
                          style={{ 
                            backgroundColor: 'var(--theme-muted)',
                            borderColor: 'var(--theme-card-border)',
                            minHeight: '80px'
                          }}
                        >
                          {/* Responsive layout: column on mobile, row on desktop */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            
                            {/* Left Side - Total Price - Bold & Large */}
                            <div className="flex-shrink-0 order-2 sm:order-1">
                              <p 
                                className="text-xl sm:text-2xl font-bold"
                                style={{ 
                                  color: 'var(--theme-foreground)',
                                  fontFamily: 'Inter'
                                }}
                              >
                                {toKurdishDigits(formatCurrency(history.amount))} 
                                <span className="text-sm mr-1" style={{ color: 'var(--theme-secondary)' }}>IQD</span>
                              </p>
                            </div>

                            {/* Center - Date, Invoice ID & Items */}
                            <div className="flex-1 min-w-0 order-1 sm:order-2">
                              {/* Date Badge with Invoice ID */}
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span 
                                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
                                  style={{ 
                                    backgroundColor: 'var(--theme-card-bg)',
                                    color: 'var(--theme-secondary)',
                                    border: '1px solid var(--theme-card-border)',
                                    fontFamily: 'var(--font-uni-salar)'
                                  }}
                                >
                                  {history.date ? toKurdishDigits(new Date(history.date).toLocaleDateString('ku')) : '-'}
                                </span>
                                {history.invoice_number && (
                                  <span 
                                    className="inline-flex items-center px-2 py-1 rounded-lg text-xs"
                                    style={{ 
                                      backgroundColor: 'var(--theme-accent)',
                                      color: '#ffffff',
                                      fontFamily: 'var(--font-uni-salar)',
                                      opacity: 0.9
                                    }}
                                  >
                                    #{toKurdishDigits(history.invoice_number)}
                                  </span>
                                )}
                              </div>
                              {/* Items Summary */}
                              <p 
                                className="text-sm font-medium truncate"
                                style={{ 
                                  color: 'var(--theme-foreground)', 
                                  fontFamily: 'var(--font-uni-salar)' 
                                }}
                              >
                                {history.items || 'کاڵا'}
                              </p>
                              {/* Note */}
                              {history.note && (
                                <p 
                                  className="text-xs mt-1"
                                  style={{ color: '#ef4444', fontFamily: 'var(--font-uni-salar)' }}
                                >
                                  {history.note}
                                </p>
                              )}
                            </div>

                            {/* Right Side - Status & View Button */}
                            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 order-3 flex-shrink-0">
                              {/* Status Badge - Soft Colors */}
                              <span 
                                className="text-xs px-3 py-1.5 rounded-full font-medium"
                                style={{ 
                                  backgroundColor: history.payment_method === 'debt' ? '#fef3c7' : '#dcfce7',
                                  color: history.payment_method === 'debt' ? '#d97706' : '#16a34a',
                                  fontFamily: 'var(--font-uni-salar)'
                                }}
                              >
                                {history.payment_method === 'debt' ? 'قەرز' : history.payment_method === 'cash' ? 'کاش' : 'ئۆنلاین'}
                              </span>
                              {/* View Invoice Button - Circular 40x40px */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewInvoice(history)
                                }}
                                className="rounded-full transition-all hover:opacity-80 active:scale-90 flex items-center justify-center shadow-md group-hover:shadow-lg"
                                style={{ 
                                  backgroundColor: 'var(--theme-accent)',
                                  color: '#ffffff',
                                  width: '40px',
                                  height: '40px',
                                  minWidth: '40px'
                                }}
                                title="بینینی پسوڵە"
                              >
                                <FaEye className="text-lg" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl p-12 text-center shadow-lg border"
                style={{ 
                  backgroundColor: 'var(--theme-card-bg)',
                  borderColor: 'var(--theme-card-border)'
                }}
              >
                <div className="text-6xl mb-4">👤</div>
                <p style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>
                  کڕیارێک هەڵبژێرە
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  )
}
