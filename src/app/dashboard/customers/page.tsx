'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency, toEnglishDigits } from '@/lib/numberUtils'

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
}

interface PurchaseHistoryItem {
  id: string
  date: string
  items: Array<{
    name: string
    quantity: number
    unit: string
    price: number
    total: number
  }>
  total: number
  payment_method: string
  sale_id: string
}

// Customer Image Component - Perfectly Centered
const CustomerImage = ({ customer, className = "" }: { customer: Customer, className?: string }) => {
  return (
    <div
      className={`bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner ${className}`}
    >
      {customer.image ? (
        <img
          src={customer.image}
          alt={customer.name}
          className="w-full h-full object-cover rounded-2xl"
        />
      ) : (
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl flex items-center justify-center">
          <span className="text-white text-2xl font-bold">
            {customer.name.charAt(0)}
          </span>
        </div>
      )}
    </div>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone1: '',
    phone2: '',
    location: '',
    image: null as File | null
  })
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    note: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showEditCustomer, setShowEditCustomer] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)

  // Convert Kurdish numerals to Western numerals
  const convertKurdishToWestern = (kurdishNum: string): string => {
    // Handle Arabic decimal separator (٫) and convert to Western decimal point (.)
    const processedNum = kurdishNum.replace(/٫/g, '.')

    const kurdishToWestern: { [key: string]: string } = {
      '٠': '0',
      '١': '1',
      '٢': '2',
      '٣': '3',
      '٤': '4',
      '٥': '5',
      '٦': '6',
      '٧': '7',
      '٨': '8',
      '٩': '9'
    }

    return processedNum.split('').map(char => kurdishToWestern[char] || char).join('')
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      fetchPaymentHistory(selectedCustomer.id)
    }
  }, [selectedCustomer])

  const fetchCustomers = async () => {
    // Demo mode: show sample customers data when Supabase is not configured
    if (!supabase) {
      const demoCustomers: Customer[] = [
        {
          id: '1',
          name: 'ئەحمەد محەمەد',
          image: '',
          phone1: '0750-123-4567',
          phone2: '0750-987-6543',
          location: 'هەولێر',
          total_debt: 125.50
        },
        {
          id: '2',
          name: 'فاطمە عەلی',
          image: '',
          phone1: '0750-555-1234',
          phone2: '',
          location: 'سلێمانی',
          total_debt: 0
        },
        {
          id: '3',
          name: 'محەمەد کەریم',
          image: '',
          phone1: '0750-777-8888',
          phone2: '0750-999-0000',
          location: 'دهۆک',
          total_debt: 89.25
        },
        {
          id: '4',
          name: 'سارا ئەحمەد',
          image: '',
          phone1: '0750-111-2222',
          phone2: '',
          location: 'هەولێر',
          total_debt: 234.75
        }
      ]
      setCustomers(demoCustomers)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentHistory = async (customerId: string) => {
    if (!supabase) return
    
    const history: PaymentHistory[] = []
    
    try {
      // Get customer payments
      const { data: payments, error: paymentsError } = await supabase
        .from('customer_payments')
        .select('*')
        .eq('customer_id', customerId)
        .order('date', { ascending: false })

      if (paymentsError) {
        console.warn('customer_payments table error (may not exist):', paymentsError)
      } else if (payments) {
        payments.forEach(payment => {
          history.push({
            id: `payment-${payment.id}`,
            date: payment.date,
            amount: -payment.amount,
            items: payment.items || '',
            note: payment.note || 'پارەدان',
            type: 'payment'
          })
        })
      }
    } catch (err) {
      console.warn('Error fetching payments:', err)
    }

    try {
      // Get sales to this customer with simplified query
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id, date, total, payment_method')
        .eq('customer_id', customerId)
        .order('date', { ascending: false })

      if (salesError) {
        console.warn('sales table error (may not exist):', salesError)
      } else if (sales) {
        // Try to get sale items separately if sales exist
        for (const sale of sales) {
          let items = ''
          try {
            const { data: saleItems } = await supabase
              .from('sale_items')
              .select('quantity, unit, item_name')
              .eq('sale_id', sale.id)
            
            if (saleItems && saleItems.length > 0) {
              items = saleItems.map((item: any) => 
                `${item.quantity} ${item.unit} ${item.item_name}`
              ).join(', ')
            }
          } catch (err) {
            // sale_items table may not exist
            items = ''
          }

          history.push({
            id: `sale-${sale.id}`,
            date: sale.date,
            amount: sale.total,
            items,
            note: 'فرۆشتن',
            type: 'sale',
            payment_method: sale.payment_method,
            sale_id: sale.id
          })
        }
      }
    } catch (err) {
      console.warn('Error fetching sales:', err)
    }

    // Sort by date descending
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setPaymentHistory(history)
  }

  const handleImageUpload = async (file: File) => {
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    // File size validation (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      alert('وێنەکە زۆر گەورەیە. دەبێت لە 5MB کەمتر بێت.')
      return
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('جۆری وێنە نادروستە. تکایە JPEG، PNG یان WebP بەکاربهێنە.')
      return
    }

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `customers/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) throw new Error('Failed to get public URL')

      return urlData.publicUrl
    } catch (error) {
      console.error('Image upload failed:', error)
      alert(`هەڵە لە بارکردنی وێنە: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return null
    }
  }

  const addCustomer = async () => {
    if (!newCustomer.name) {
      alert('ناو پێویستە')
      return
    }

    // Phone number validation (10-11 digits)
    const cleanPhone1 = newCustomer.phone1.replace(/\D/g, '')
    if (!cleanPhone1 || cleanPhone1.length < 10 || cleanPhone1.length > 11) {
      alert('ژمارەی تەلەفۆن دەبێت لە نێوان ١٠ بۆ ١١ ژمارە بێت')
      return
    }

    setIsUploading(true)
    try {
      let imageUrl = ''
      if (newCustomer.image) {
        imageUrl = await handleImageUpload(newCustomer.image) || ''
      }

      const { error } = await supabase!
        .from('customers')
        .insert({
          name: newCustomer.name,
          phone1: cleanPhone1,
          phone2: newCustomer.phone2 ? newCustomer.phone2.replace(/\D/g, '') : '',
          location: newCustomer.location,
          image: imageUrl
        })

      if (error) throw error

      setShowAddCustomer(false)
      setNewCustomer({ name: '', phone1: '', phone2: '', location: '', image: null })
      fetchCustomers()
    } catch (error) {
      console.error('Error adding customer:', error)
      alert('هەڵە لە زیادکردنی کڕیار')
    } finally {
      setIsUploading(false)
    }
  }

  const addPayment = async () => {
    if (!selectedCustomer || newPayment.amount <= 0) {
      alert('زانیارییەکان پڕبکەرەوە')
      return
    }

    if (!supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت پارەدان زیاد بکرێت')
      return
    }

    try {
      // Add payment record
      const { error: paymentError } = await supabase
        .from('customer_payments')
        .insert({
          customer_id: selectedCustomer.id,
          date: new Date().toISOString().split('T')[0],
          amount: newPayment.amount,
          note: newPayment.note
        })

      if (paymentError) throw paymentError

      // Update customer debt
      const { error: debtError } = await supabase
        .from('customers')
        .update({
          total_debt: selectedCustomer.total_debt - newPayment.amount
        })
        .eq('id', selectedCustomer.id)

      if (debtError) throw debtError

      setShowAddPayment(false)
      setNewPayment({ amount: 0, note: '' })
      fetchCustomers()
      if (selectedCustomer) {
        fetchPaymentHistory(selectedCustomer.id)
      }
    } catch (error) {
      console.error('Error adding payment:', error)
      alert('هەڵە لە زیادکردنی پارەدان')
    }
  }

  // Filtered customers based on search term
  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    const englishSearch = toEnglishDigits(searchTerm).toLowerCase()

    // Search by name
    if (customer.name.toLowerCase().includes(searchLower)) return true

    // Search by phone (handle both Kurdish and English digits)
    const phone1English = toEnglishDigits(customer.phone1)
    const phone2English = customer.phone2 ? toEnglishDigits(customer.phone2) : ''

    if (phone1English.includes(englishSearch) || phone2English.includes(englishSearch)) return true

    return false
  })

  const editCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setNewCustomer({
      name: customer.name,
      phone1: customer.phone1,
      phone2: customer.phone2 || '',
      location: customer.location,
      image: null // Can't pre-fill file input
    })
    setShowEditCustomer(true)
  }

  const updateCustomer = async () => {
    if (!editingCustomer) return

    if (!newCustomer.name) {
      alert('ناو پێویستە')
      return
    }

    // Phone number validation (10-11 digits)
    const cleanPhone1 = newCustomer.phone1.replace(/\D/g, '')
    if (!cleanPhone1 || cleanPhone1.length < 10 || cleanPhone1.length > 11) {
      alert('ژمارەی تەلەفۆن دەبێت لە نێوان ١٠ بۆ ١١ ژمارە بێت')
      return
    }

    setIsUploading(true)
    try {
      let imageUrl = editingCustomer.image // Keep existing image by default

      // Only upload new image if one is selected
      if (newCustomer.image) {
        imageUrl = await handleImageUpload(newCustomer.image) || editingCustomer.image
      }

      const { error } = await supabase!
        .from('customers')
        .update({
          name: newCustomer.name,
          phone1: cleanPhone1,
          phone2: newCustomer.phone2 ? newCustomer.phone2.replace(/\D/g, '') : '',
          location: newCustomer.location,
          image: imageUrl
        })
        .eq('id', editingCustomer.id)

      if (error) throw error

      setShowEditCustomer(false)
      setEditingCustomer(null)
      setNewCustomer({ name: '', phone1: '', phone2: '', location: '', image: null })
      fetchCustomers()

      // Update selected customer if it was the one being edited
      if (selectedCustomer?.id === editingCustomer.id) {
        setSelectedCustomer({
          ...selectedCustomer,
          name: newCustomer.name,
          phone1: cleanPhone1,
          phone2: newCustomer.phone2 ? newCustomer.phone2.replace(/\D/g, '') : '',
          location: newCustomer.location,
          image: imageUrl
        })
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      alert('هەڵە لە نوێکردنەوەی کڕیار')
    } finally {
      setIsUploading(false)
    }
  }

  const deleteCustomer = async () => {
    if (!customerToDelete) return

    // Debt safety check
    if (customerToDelete.total_debt > 0) {
      alert('ناتوانیت ئەم کڕیارە بسڕیتەوە چونکە قەرزارە')
      setShowDeleteConfirm(false)
      setCustomerToDelete(null)
      return
    }

    try {
      const { error } = await supabase!
        .from('customers')
        .delete()
        .eq('id', customerToDelete.id)

      if (error) throw error

      setShowDeleteConfirm(false)
      setCustomerToDelete(null)
      fetchCustomers()

      // Clear selection if deleted customer was selected
      if (selectedCustomer?.id === customerToDelete.id) {
        setSelectedCustomer(null)
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('هەڵە لە سڕینەوەی کڕیار')
    }
  }

  return (
    <div className="bg-white dark:bg-transparent min-h-screen transition-colors duration-300">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 p-6 pl-0 md:pl-6">بەڕێوەبردنی کڕیاران</h1>

      <div className="mb-6">
        <motion.button
          onClick={() => setShowAddCustomer(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
          style={{ fontFamily: 'var(--font-uni-salar)' }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          زیادکردنی کڕیار
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customers List */}
        <div className="lg:col-span-1">
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                کڕیاران
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>👥</span>
                <span>{filteredCustomers.length}</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </div>
                <input
                  type="text"
                  placeholder="گەڕان بە ناو، تەلەفۆن..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                />
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {filteredCustomers.map((customer, index) => (
                  <motion.div
                    key={customer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedCustomer?.id === customer.id
                        ? 'bg-indigo-100/80 border-2 border-indigo-300 shadow-lg'
                        : 'bg-white/40 hover:bg-white/60 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex items-center space-x-3">
                      <CustomerImage customer={customer} className="w-10 h-10" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          {customer.name}
                        </h3>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {customer.phone1}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${
                          customer.total_debt > 0 ? 'text-red-600' : 'text-green-600'
                        }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                          {formatCurrency(customer.total_debt)}
                        </p>
                        <p className="text-xs text-gray-500">IQD</p>
                      </div>
                    </div>

                    {/* Action Buttons - Permanently Visible */}
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation()
                          editCustomer(customer)
                        }}
                        className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md transition-colors duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="نوێکردنەوە"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </motion.button>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation()
                          setCustomerToDelete(customer)
                          setShowDeleteConfirm(true)
                        }}
                        className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center shadow-md transition-colors duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="سڕینەوە"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredCustomers.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-gray-500 text-lg" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    {searchTerm ? 'هیچ کڕیارێک نەدۆزرایەوە' : 'هیچ کڕیارێک نیە'}
                  </p>
                  {searchTerm && (
                    <p className="text-gray-400 text-sm mt-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      گەڕانەکەت بگۆڕە یان پاکبکە
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Profile View */}
        <AnimatePresence mode="wait">
          {selectedCustomer ? (
            <motion.div
              key={selectedCustomer.id}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Customer Identity Header - Glassmorphism Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(147,197,253,0.1))',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)'
                }}
              >
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl"></div>

                <div className="relative flex items-center space-x-8">
                  {/* Profile Image with Centering Logic */}
                  <motion.div
                    className="flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-xl border-4 border-white/50">
                        {selectedCustomer.image ? (
                          <img
                            src={selectedCustomer.image}
                            alt={selectedCustomer.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-3xl font-bold">
                              {selectedCustomer.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Online status indicator */}
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Customer Details */}
                  <div className="flex-1 space-y-3">
                    <motion.h2
                      className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {selectedCustomer.name}
                    </motion.h2>

                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm">📱</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>تەلەفۆن ١</p>
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-gray-800">{selectedCustomer.phone1}</p>
                              <motion.button
                                onClick={() => window.open(`https://wa.me/${selectedCustomer.phone1.replace(/\D/g, '')}`, '_blank')}
                                className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="پەیوەندی بە WhatsApp"
                              >
                                💬
                              </motion.button>
                            </div>
                          </div>
                        </div>

                        {selectedCustomer.phone2 && (
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 text-sm">📞</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>تەلەفۆن ٢</p>
                              <div className="flex items-center space-x-2">
                                <p className="font-semibold text-gray-800">{selectedCustomer.phone2}</p>
                                <motion.button
                                  onClick={() => window.open(`https://wa.me/${selectedCustomer.phone2.replace(/\D/g, '')}`, '_blank')}
                                  className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="پەیوەندی بە WhatsApp"
                                >
                                  💬
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm">📍</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناونیشان</p>
                            <p className="font-semibold text-gray-800">{selectedCustomer.location || 'نەناسراو'}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Quick Actions */}
                  <motion.div
                    className="flex flex-col space-y-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.button
                      onClick={() => setShowAddPayment(true)}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      💰 پارەدان
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>

              {/* Financial Summary Tiles */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/* Total Purchases */}
                <motion.div
                  className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.05))',
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)'
                  }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی کڕین</p>
                      <p className="text-3xl font-bold text-blue-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {formatCurrency(paymentHistory.filter(h => h.type === 'sale').reduce((sum, h) => sum + h.amount, 0))}
                      </p>
                      <p className="text-xs text-blue-500 mt-1">IQD</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <span className="text-2xl">🛒</span>
                    </div>
                  </div>
                </motion.div>

                {/* Current Debt */}
                <motion.div
                  className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(252, 165, 165, 0.05))',
                    boxShadow: '0 8px 32px rgba(239, 68, 68, 0.1)'
                  }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>قەرزی ئێستا</p>
                      <p className="text-3xl font-bold text-red-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {formatCurrency(selectedCustomer.total_debt)}
                      </p>
                      <p className="text-xs text-red-500 mt-1">IQD</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                      <span className="text-2xl">💳</span>
                    </div>
                  </div>
                </motion.div>

                {/* Last Visit */}
                <motion.div
                  className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(110, 231, 183, 0.05))',
                    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.1)'
                  }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>دواین سەردان</p>
                      <p className="text-2xl font-bold text-green-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {paymentHistory.length > 0
                          ? new Date(Math.max(...paymentHistory.map(h => new Date(h.date).getTime()))).toLocaleDateString('ku')
                          : 'هیچ'
                        }
                      </p>
                      <p className="text-xs text-green-500 mt-1">بەروار</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                      <span className="text-2xl">📅</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Detailed Purchase History Table */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(156,163,175,0.05))',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)'
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    مێژووی کڕینەکان
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>📊</span>
                    <span>{paymentHistory.filter(h => h.type === 'sale').length} فرۆشتن</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200/50">
                        <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                        <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کاڵاکانی کڕدراو</th>
                        <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی گشتی</th>
                        <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>شێوازی پارەدان</th>
                        <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کردارەکان</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.filter(h => h.type === 'sale').map((sale, index) => (
                        <motion.tr
                          key={sale.id}
                          className="border-b border-gray-100/50 hover:bg-white/30 transition-colors duration-200"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <td className="px-6 py-4 text-gray-800 font-medium">
                            {new Date(sale.date).toLocaleDateString('ku')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {sale.items.split(', ').map((item, idx) => (
                                <div key={idx} className="text-sm text-gray-700 bg-gray-50/50 px-3 py-1 rounded-lg inline-block mr-2 mb-1">
                                  {item}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatCurrency(sale.amount)}
                            </span>
                            <span className="text-sm text-gray-500 mr-2">IQD</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              sale.payment_method === 'cash' ? 'bg-green-100 text-green-800' :
                              sale.payment_method === 'fib' ? 'bg-blue-100 text-blue-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {sale.payment_method === 'cash' ? '💵 نەختینە' :
                               sale.payment_method === 'fib' ? '💳 ئۆنلاین' :
                               '📝 قەرز'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <motion.button
                              className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md transition-all duration-200"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                // TODO: Implement receipt viewing
                                alert('فاکتور پیشاندان - بەم زووانە دەکرێت')
                              }}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                      {paymentHistory.filter(h => h.type === 'sale').length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="text-gray-400">
                              <div className="text-4xl mb-4">📦</div>
                              <p className="text-lg" style={{ fontFamily: 'var(--font-uni-salar)' }}>هیچ کڕینێک نیە</p>
                              <p className="text-sm mt-2">کڕیارەکە هیچ کاڵایەکی کڕیوە</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="lg:col-span-2 flex items-center justify-center"
            >
              <div className="text-center p-12 bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20">
                <div className="text-6xl mb-6">👤</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-4" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کڕیارێک هەڵبژێرە
                </h3>
                <p className="text-gray-500 text-lg" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کلیک لە کڕیارێک بکە بۆ بینینی پرۆفایل و مێژووی کڕینەکانی
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white/90 backdrop-blur-xl rounded-3xl w-full max-w-md shadow-2xl border border-white/20"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="p-8">
              <motion.h3
                className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                زیادکردنی کڕیار نوێ
              </motion.h3>

              <div className="space-y-5">
                {/* Name Input with Icon */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    ناو
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      👤
                    </div>
                    <input
                      type="text"
                      placeholder="ناوی کڕیار"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    />
                  </div>
                </motion.div>

                {/* Phone 1 Input with Icon and English Digits */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    تەلەفۆن ١ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      📱
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0750XXXXXXX"
                      value={toEnglishDigits(newCustomer.phone1)}
                      onChange={(e) => {
                        const englishDigits = toEnglishDigits(e.target.value.replace(/\D/g, ''))
                        setNewCustomer(prev => ({ ...prev, phone1: englishDigits }))
                      }}
                      maxLength={11}
                      className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
                      style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    10-11 ژمارە (English digits only)
                  </p>
                </motion.div>

                {/* Phone 2 Input with Icon and English Digits */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    تەلەفۆن ٢
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      📞
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0750XXXXXXX"
                      value={toEnglishDigits(newCustomer.phone2)}
                      onChange={(e) => {
                        const englishDigits = toEnglishDigits(e.target.value.replace(/\D/g, ''))
                        setNewCustomer(prev => ({ ...prev, phone2: englishDigits }))
                      }}
                      maxLength={11}
                      className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
                      style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                    />
                  </div>
                </motion.div>

                {/* Location Input */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    ناونیشان
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      📍
                    </div>
                    <input
                      type="text"
                      placeholder="ناونیشانی کڕیار"
                      value={newCustomer.location}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    />
                  </div>
                </motion.div>

                {/* Image Upload */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    وێنەی کڕیار
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
                    className="w-full px-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </motion.div>
              </div>

              <motion.div
                className="flex justify-end space-x-3 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <motion.button
                  onClick={() => setShowAddCustomer(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  پاشگەزبوونەوە
                </motion.button>
                <motion.button
                  onClick={addCustomer}
                  disabled={isUploading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isUploading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{isUploading ? 'بارکردن...' : 'زیادکردنی کڕیار'}</span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPayment && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">زیادکردنی پارەدان</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="بڕی پارە"
                value={newPayment.amount}
                onChange={(e) => {
                  const westernNum = convertKurdishToWestern(e.target.value)
                  setNewPayment(prev => ({ ...prev, amount: parseFloat(westernNum) || 0 }))
                }}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="تێبینی"
                value={newPayment.note}
                onChange={(e) => setNewPayment(prev => ({ ...prev, note: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowAddPayment(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={addPayment}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                زیادکردن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditCustomer && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white/90 backdrop-blur-xl rounded-3xl w-full max-w-md shadow-2xl border border-white/20"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="p-8">
              <motion.h3
                className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                نوێکردنەوەی کڕیار
              </motion.h3>

              <div className="space-y-5">
                {/* Name Input with Icon */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    ناو
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      👤
                    </div>
                    <input
                      type="text"
                      placeholder="ناوی کڕیار"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    />
                  </div>
                </motion.div>

                {/* Phone 1 Input with Icon and English Digits */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    تەلەفۆن ١ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      📱
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0750XXXXXXX"
                      value={toEnglishDigits(newCustomer.phone1)}
                      onChange={(e) => {
                        const englishDigits = toEnglishDigits(e.target.value.replace(/\D/g, ''))
                        setNewCustomer(prev => ({ ...prev, phone1: englishDigits }))
                      }}
                      maxLength={11}
                      className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
                      style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    10-11 ژمارە (English digits only)
                  </p>
                </motion.div>

                {/* Phone 2 Input with Icon and English Digits */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    تەلەفۆن ٢
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      📞
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0750XXXXXXX"
                      value={toEnglishDigits(newCustomer.phone2)}
                      onChange={(e) => {
                        const englishDigits = toEnglishDigits(e.target.value.replace(/\D/g, ''))
                        setNewCustomer(prev => ({ ...prev, phone2: englishDigits }))
                      }}
                      maxLength={11}
                      className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
                      style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                    />
                  </div>
                </motion.div>

                {/* Location Input */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    ناونیشان
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      📍
                    </div>
                    <input
                      type="text"
                      placeholder="ناونیشانی کڕیار"
                      value={newCustomer.location}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    />
                  </div>
                </motion.div>

                {/* Image Upload */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    وێنەی کڕیار
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
                    className="w-full px-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </motion.div>
              </div>

              <motion.div
                className="flex justify-end space-x-3 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <motion.button
                  onClick={() => {
                    setShowEditCustomer(false)
                    setEditingCustomer(null)
                    setNewCustomer({ name: '', phone1: '', phone2: '', location: '', image: null })
                  }}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  پاشگەزبوونەوە
                </motion.button>
                <motion.button
                  onClick={updateCustomer}
                  disabled={isUploading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isUploading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{isUploading ? 'بارکردن...' : 'نوێکردنەوە'}</span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && customerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white/90 backdrop-blur-xl rounded-3xl w-full max-w-md shadow-2xl border border-white/20"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="p-8">
              <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  دڵنیایی سڕینەوە
                </h3>
                <p className="text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  بە دڵنیاییەوە دەتەوێت کڕیاری <strong>{customerToDelete.name}</strong> بسڕیتەوە؟
                </p>
                {customerToDelete.total_debt > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 font-semibold" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      ⚠️ ناتوانیت ئەم کڕیارە بسڕیتەوە چونکە قەرزارە
                    </p>
                    <p className="text-red-600 text-sm mt-1">
                      قەرزی گشتی: {formatCurrency(customerToDelete.total_debt)} IQD
                    </p>
                  </div>
                )}
              </motion.div>

              <motion.div
                className="flex justify-end space-x-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setCustomerToDelete(null)
                  }}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  پاشگەزبوونەوە
                </motion.button>
                <motion.button
                  onClick={deleteCustomer}
                  disabled={customerToDelete.total_debt > 0}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                  whileHover={{ scale: customerToDelete.total_debt > 0 ? 1 : 1.05, y: customerToDelete.total_debt > 0 ? 0 : -2 }}
                  whileTap={{ scale: customerToDelete.total_debt > 0 ? 1 : 0.95 }}
                >
                  {customerToDelete.total_debt > 0 ? 'ناتوانرێت بسڕدرێتەوە' : 'سڕینەوە'}
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}