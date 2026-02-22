'use client'

import ConfirmModal from '@/components/ConfirmModal'
import { buildInvoiceData } from '@/components/GlobalInvoiceModal'
import { useToast } from '@/components/Toast'
import { useGlobalInvoiceModal } from '@/hooks/useGlobalInvoiceModal'
import { formatCurrency } from '@/lib/numberUtils'
import { uploadFile } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FaCamera, FaEdit, FaEye, FaMoneyBillWave, FaPhone, FaPlus, FaSearch, FaTimes, FaTrash, FaUserPlus } from 'react-icons/fa'
import { logActivity, ActivityActions, EntityTypes } from '@/lib/activityLogger'

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
  seller_name?: string
  sold_by?: string
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

// Force English digits (no Kurdish conversion)
const toKurdishDigits = (value: any): string => {
  if (value === null || value === undefined) return '0'
  return String(value)
}

// Kurdish to English number converter
const convertKurdishToEnglish = (input: string): string => {
  if (!input || typeof input !== 'string') return ''
  const map: Record<string, string> = {'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'}
  return input.replace(/[٠-٩]/g, m => map[m])
}

export default function CustomersPage() {
  // Toast notifications
  const { showSuccess, showError } = useToast()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone1: '', phone2: '', location: '', image: null as File | null, existingImage: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  
  // Use callback ref to avoid the ref object error
  let fileInputRef: HTMLInputElement | null = null
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [customerPayments, setCustomerPayments] = useState<any[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  })
  const [editingPayment, setEditingPayment] = useState<any>(null)

  // Confirm modal state for delete operations
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {}
  })
  const [pendingDeleteCustomer, setPendingDeleteCustomer] = useState<Customer | null>(null)

  // Handle add customer form submission
  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      alert('ناو پێویستە')
      return
    }

    setIsUploading(true)
    try {
      let imageUrl = ''
      
      // Upload image if selected
      if (newCustomer.image) {
        try {
          const uploadedUrl = await uploadFile(newCustomer.image, 'customers')
          if (uploadedUrl) {
            imageUrl = uploadedUrl
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
        }
      }

      if (!supabase) {
        // Mock for demo
        const mockCustomer: Customer = {
          id: Date.now().toString(),
          name: newCustomer.name,
          image: imageUrl,
          phone1: newCustomer.phone1,
          phone2: newCustomer.phone2,
          location: newCustomer.location,
          total_debt: 0
        }
        setCustomers(prev => [...prev, mockCustomer])
        setShowAddCustomer(false)
        setNewCustomer({ name: '', phone1: '', phone2: '', location: '', image: null, existingImage: '' })
        setImagePreview(null)
        showSuccess('کڕیارەکە زیادکرا')
        return
      }

      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: newCustomer.name,
          phone1: newCustomer.phone1,
          phone2: newCustomer.phone2,
          location: newCustomer.location,
          image: imageUrl || null,
          total_debt: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding customer:', error)
        showError('هەڵە لە زیادکردنی کڕیار')
        return
      }

      if (data) {
        setCustomers(prev => [...prev, data as Customer])
        setShowAddCustomer(false)
        setNewCustomer({ name: '', phone1: '', phone2: '', location: '', image: null, existingImage: '' })
        setImagePreview(null)
        showSuccess('کڕیارەکە زیادکرا')
        
        // Log the activity
        await logActivity(
          null,
          'سیستەم',
          ActivityActions.ADD_CUSTOMER,
          `کڕیاری ${newCustomer.name} زیادکرا`,
          EntityTypes.CUSTOMER,
          data.id
        )
      }
    } catch (error) {
      console.error('Error:', error)
      showError('هەڵە لە زیادکردنی کڕیار')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
        alert('تکایە وێنەیەکی دروست هەڵبژێرە')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('قەبارەی وێنەکە دەبێت کەمتر بێت لە 5 مێگابایت')
        return
      }
      setNewCustomer(prev => ({ ...prev, image: file }))
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Clear image selection
  const clearImage = () => {
    setNewCustomer(prev => ({ ...prev, image: null }))
    setImagePreview(null)
    if (fileInputRef) {
      fileInputRef.value = ''
    }
  }

  // Open edit modal with customer data
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setNewCustomer({
      name: customer.name,
      phone1: customer.phone1,
      phone2: customer.phone2 || '',
      location: customer.location || '',
      image: null,
      existingImage: customer.image || ''
    })
    setImagePreview(customer.image || null)
    setIsEditing(true)
    setShowAddCustomer(true)
  }

  // Handle update customer
  const handleUpdateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      alert('ناو پێویستە')
      return
    }

    if (!editingCustomer) return

    setIsUploading(true)
    try {
      let imageUrl = editingCustomer.image || ''

      // Upload new image if selected
      if (newCustomer.image) {
        try {
          const uploadedUrl = await uploadFile(newCustomer.image, 'customers')
          if (uploadedUrl) {
            imageUrl = uploadedUrl
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
        }
      }

      if (!supabase) {
        // Mock for demo
        const updatedCustomer = {
          ...editingCustomer,
          name: newCustomer.name,
          phone1: newCustomer.phone1,
          phone2: newCustomer.phone2,
          location: newCustomer.location,
          image: imageUrl
        }
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? updatedCustomer : c))
        setSelectedCustomer(updatedCustomer)
        setShowAddCustomer(false)
        setIsEditing(false)
        setEditingCustomer(null)
        resetForm()
        showSuccess('کڕیارەکە نوێکرایەوە')
        return
      }

      const { data, error } = await supabase
        .from('customers')
        .update({
          name: newCustomer.name,
          phone1: newCustomer.phone1,
          phone2: newCustomer.phone2,
          location: newCustomer.location,
          image: imageUrl || null
        })
        .eq('id', editingCustomer.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating customer:', error)
        showError('هەڵە لە نوێکردنەوەی کڕیار')
        return
      }

      if (data) {
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? data as Customer : c))
        setSelectedCustomer(data as Customer)
        
        // Log the activity
        await logActivity(
          null,
          null,
          'update_customer',
          `دەستکاریکردنی زانیارییەکانی کڕیار: ${newCustomer.name}`,
          'customer',
          editingCustomer.id
        )
        
        setShowAddCustomer(false)
        setIsEditing(false)
        setEditingCustomer(null)
        resetForm()
        showSuccess('کڕیارەکە نوێکرایەوە')
      }
    } catch (error) {
      console.error('Error:', error)
      showError('هەڵە لە نوێکردنەوەی کڕیار')
    } finally {
      setIsUploading(false)
    }
  }

  // Reset form when modal closes
  const resetForm = () => {
    setNewCustomer({ name: '', phone1: '', phone2: '', location: '', image: null, existingImage: '' })
    setImagePreview(null)
    setShowAddCustomer(false)
    setIsEditing(false)
    setEditingCustomer(null)
  }

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
        { sale_items: mockItems, customers: selectedCustomer, discount_amount: history.discount_amount, sold_by: history.sold_by },
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
        { 
          sale_items: itemsData || [], 
          customers: selectedCustomer,
          discount_amount: history.discount_amount,
          sold_by: history.sold_by
        },
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
      setCustomers((data as Customer[]) || [])
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  // State for pending sales count
  const [pendingSalesCount, setPendingSalesCount] = useState(0)

  const fetchPaymentHistory = async (customerId: string) => {
    // Clear previous history and show loading
    setPaymentHistory([])
    setHistoryLoading(true)
    
    if (!supabase) {
      setHistoryLoading(false)
      return
    }
    try {
      // First, fetch pending sales count for this customer
      const { data: pendingData } = await supabase
        .from('sales')
        .select('id', { count: 'exact' })
        .eq('customer_id', customerId)
        .eq('status', 'pending')
      
      setPendingSalesCount(pendingData?.length || 0)

      // Fetch ONLY completed sales for the purchase history (approved/completed only)
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, date, total, payment_method, status, created_at, discount_amount, subtotal, invoice_number, sold_by, user_id')
        .eq('customer_id', customerId)
        .in('status', ['completed', 'approved'])
        .order('created_at', { ascending: false })

      if (salesError) {
        console.error('Error fetching sales:', salesError)
        setPaymentHistory([])
        setHistoryLoading(false)
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
          
          // Try to get seller name from profiles table using user_id
          let sellerName = sale.sold_by || ''
          if (sale.user_id) {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', sale.user_id)
                .single()
              if (profileData?.name) {
                sellerName = profileData.name
              }
            } catch (e) {
              console.log('Could not fetch profile:', e)
            }
          }
          
          history.push({
            id: sale.id,
            date: sale.date || sale.created_at || '',
            amount: sale.total,
            items: items,
            note: sale.discount_amount ? `داشکاندن: ${sale.discount_amount}` : '',
            type: sale.payment_method === 'debt' ? 'sale' : 'payment',
            payment_method: sale.payment_method || undefined,
            sale_id: sale.id,
            invoice_number: sale.invoice_number || undefined,
            discount_amount: sale.discount_amount || undefined,
            sold_by: sellerName
          })
        }
      }
      
      setPaymentHistory(history)
    } catch (error) {
      console.error('Error fetching payment history:', error)
      setPaymentHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  // Fetch customer payments for the payment modal
  const fetchCustomerPayments = async (customerId: string) => {
    setLoadingPayments(true)
    if (!supabase) {
      setLoadingPayments(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('customer_payments')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setCustomerPayments(data || [])
    } catch (error) {
      console.error('Error fetching customer payments:', error)
      setCustomerPayments([])
    } finally {
      setLoadingPayments(false)
    }
  }

  // Handle adding a new payment
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || !paymentForm.amount || !paymentForm.date) {
      alert('تکایە هەموو زانیارییە پێویستەکان پڕبکەرەوە')
      return
    }
    
    const amount = parseFloat(paymentForm.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('تکایە بڕی پارە بە دروستی بنووسە')
      return
    }

    setSubmittingPayment(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      const response = await fetch('/api/customer-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          amount: parseFloat(paymentForm.amount),
          date: paymentForm.date,
          note: paymentForm.note || '',
          user_id: user?.id
        })
      })
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        alert(result.error || 'هەڵە لە تۆمارکردن')
        return
      }

      // Refresh payments
      fetchCustomerPayments(selectedCustomer.id)
      
      // Update customer debt in UI
      const updatedCustomer = { ...selectedCustomer, total_debt: result.newDebt }
      setSelectedCustomer(updatedCustomer)
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updatedCustomer : c))
      
      // Reset form
      setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
      showSuccess('پارەدانەکە بە سەرکەوتوویی تۆمارکرا!')
    } catch (error) {
      console.error('Error adding payment:', error)
      showError('هەڵە لە تۆمارکردن')
    } finally {
      setSubmittingPayment(false)
    }
  }

  // Handle updating a payment
  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || !editingPayment || !paymentForm.amount || !paymentForm.date) return

    setSubmittingPayment(true)
    try {
      const response = await fetch('/api/customer-payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPayment.id,
          customer_id: selectedCustomer.id,
          amount: parseFloat(paymentForm.amount),
          date: paymentForm.date,
          note: paymentForm.note
        })
      })
      const result = await response.json()
      
      if (!response.ok) {
        alert(result.error || 'هەڵە لە نوێکردنەوە')
        return
      }

      // Refresh payments
      fetchCustomerPayments(selectedCustomer.id)
      
      // Update customer debt
      if (result.newDebt !== undefined) {
        const updatedCustomer = { ...selectedCustomer, total_debt: result.newDebt }
        setSelectedCustomer(updatedCustomer)
        setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updatedCustomer : c))
      }
      
      // Reset form
      setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
      setEditingPayment(null)
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('هەڵە لە نوێکردنەوە')
    } finally {
      setSubmittingPayment(false)
    }
  }

  // Handle deleting a payment
  const handleDeletePayment = async (payment: any) => {
    if (!selectedCustomer) return
    
    const confirmed = window.confirm('دڵنیایت لە سڕینەوەی ئەم پارەدانە؟')
    if (!confirmed) return

    try {
      const response = await fetch(`/api/customer-payments?id=${payment.id}&customer_id=${selectedCustomer.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'هەڵە لە سڕینەوە' }))
        alert(errorData.error || 'هەڵە لە سڕینەوە')
        return
      }

      const result = await response.json()
      
      // Refresh payments
      fetchCustomerPayments(selectedCustomer.id)
      
      // Update customer debt
      if (result.newDebt !== undefined) {
        const updatedCustomer = { ...selectedCustomer, total_debt: result.newDebt }
        setSelectedCustomer(updatedCustomer)
        setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updatedCustomer : c))
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('هەڵە لە سڕینەوە')
    }
  }

  // Edit a payment
  const handleEditPayment = (payment: any) => {
    setEditingPayment(payment)
    setPaymentForm({
      amount: payment.amount.toString(),
      date: payment.date,
      note: payment.note || ''
    })
  }

  // Cancel edit payment
  const cancelEditPayment = () => {
    setEditingPayment(null)
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
  }

  // Execute delete customer
  const executeDeleteCustomer = async (customer: Customer) => {
    if (!supabase) {
      showError('هەڵە لە پەیوەستبوون بە داتابەیس')
      setShowConfirmModal(false)
      return
    }

    try {
      // Check if customer has related sales
      let hasSales = false
      try {
        const { data: salesData, count: salesCount } = await supabase
          .from('sales')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customer.id)
        hasSales = (salesCount || 0) > 0
      } catch (e) {
        console.warn('Could not check sales:', e)
      }

      if (hasSales) {
        showError('ناتوانرێت ئەم کڕیارە بسڕدرێتەوە چونکە پێشتر کاڵای کڕیوە')
        setShowConfirmModal(false)
        return
      }

      const { error } = await supabase.from('customers').delete().eq('id', customer.id)

      if (error) {
        console.error('Error deleting customer:', error)
        // Check for foreign key constraint errors
        const errorStr = JSON.stringify(error)
        if (errorStr.includes('foreign key') || errorStr.includes('constraint')) {
          showError('ناتوانرێت ئەم کڕیارە بسڕدرێتەوە - ڕەنگە پەیوەست بێت بە زانیارییەکانی تر')
        } else {
          showError('هەڵە لە سڕینەوە: ' + (error.message || 'هەڵەی نەزانراو'))
        }
        setShowConfirmModal(false)
        return
      }

      // Remove customer from the list
      setCustomers(prev => prev.filter(c => c.id !== customer.id))
      
      // If this was the selected customer, clear selection
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(null)
      }
      
      // Log the activity
      await logActivity(
        null,
        'سیستەم',
        ActivityActions.DELETE_CUSTOMER,
        `کڕیاری ${customer.name} سڕایەوە`,
        EntityTypes.CUSTOMER,
        customer.id
      )
      
      showSuccess('کڕیارەکە سڕایەوە')
    } catch (error: any) {
      console.error('Error deleting customer:', error)
      const errorStr = error?.toString() || ''
      if (errorStr.includes('foreign key') || errorStr.includes('constraint')) {
        showError('ناتوانرێت ئەم کڕیارە بسڕدرێتەوە - ڕەنگە پەیوەست بێت بە زانیارییەکانی تر')
      } else {
        showError('هەڵە لە سڕینەوە')
      }
    } finally {
      setShowConfirmModal(false)
      setPendingDeleteCustomer(null)
    }
  }

  // Close payment modal
  const closePaymentModal = () => {
    setShowPaymentModal(false)
    setCustomerPayments([])
    setEditingPayment(null)
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
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
              onClick={() => {
                console.log('Add customer button clicked')
                setShowAddCustomer(true)
              }}
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
                          fontFamily: 'sans-serif'
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
                          fontFamily: 'var(--font-uni-salar)'
                        }}
                      >
                        <span style={{ fontFamily: 'sans-serif' }}>{formatCurrency(customer.total_debt)}</span>
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
                            style={{ color: 'var(--theme-accent)', fontFamily: 'sans-serif' }}
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
                        style={{ color: selectedCustomer.total_debt > 0 ? '#ef4444' : '#22c55e', fontFamily: 'var(--font-uni-salar)' }}
                      >
                        <span style={{ fontFamily: 'sans-serif' }}>{formatCurrency(selectedCustomer.total_debt)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons - Touch Friendly */}
                  <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t" style={{ borderColor: 'var(--theme-card-border)' }}>
                    <button
                      onClick={() => handleEditCustomer(selectedCustomer)}
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
                        setPendingDeleteCustomer(selectedCustomer)
                        setConfirmModalConfig({
                          title: 'سڕینەوەی کڕیار',
                          message: `دڵنیایت لە سڕینەوەی "${selectedCustomer.name}"؟`,
                          onConfirm: () => executeDeleteCustomer(selectedCustomer)
                        })
                        setShowConfirmModal(true)
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
                      onClick={() => {
                        if (selectedCustomer) {
                          setShowPaymentModal(true)
                          fetchCustomerPayments(selectedCustomer.id)
                        }
                      }}
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

                {/* Purchase History - High-End Table Design */}
                <div 
                  className="rounded-3xl p-6 shadow-lg border overflow-hidden"
                  style={{ 
                    backgroundColor: 'var(--theme-card-bg)',
                    borderColor: 'var(--theme-card-border)'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 
                      className="text-xl font-semibold"
                      style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                    >
                      مێژووی کڕینەکان
                    </h3>
                    {historyLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: 'var(--theme-accent)' }}></div>
                    ) : (
                      <span style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>{sortedPaymentHistory.length}</span>
                    )}
                  </div>

                  {/* Pending Sales Notice */}
                  {pendingSalesCount > 0 && (
                    <div 
                      className="mb-4 p-3 rounded-xl flex items-center gap-2"
                      style={{ 
                        backgroundColor: 'rgb(255, 16, 16)',
                        border: '1px solid rgb(231, 0, 0)'
                      }}
                    >
                      <span style={{ color: '#f50b0b', fontFamily: 'var(--font-uni-salar)' }}>⏳</span>
                      <span 
                        className="text-sm"
                        style={{ color: '#000000', fontFamily: 'var(--font-uni-salar)' }}
                      >
                        {toKurdishDigits(pendingSalesCount)} فرۆشتنی چاوەڕوانکراو {pendingSalesCount === 1 } 
                      </span>
                    </div>
                  )}

                  {historyLoading ? (
                    // Skeleton Loader
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div 
                          key={i}
                          className="h-16 rounded-xl animate-pulse"
                          style={{ backgroundColor: 'var(--theme-muted)' }}
                        />
                      ))}
                    </div>
                  ) : sortedPaymentHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: 'var(--theme-muted)' }}
                      >
                        <span className="text-4xl">📋</span>
                      </div>
                      <p style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)', fontSize: '1.1rem' }}>
                        هیچ مێژوویەکی کڕین نییە
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr 
                            className="text-sm"
                            style={{ 
                              color: 'var(--theme-secondary)',
                              borderBottom: '2px solid var(--theme-card-border)'
                            }}
                          >
                            <th className="text-right pb-3 pr-2 font-medium" style={{ fontFamily: 'var(--font-uni-salar)' }}>#</th>
                            <th className="text-right pb-3 pr-2 font-medium" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                            <th className="text-right pb-3 pr-2 font-medium" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی گشتی</th>
                            <th className="text-right pb-3 pr-2 font-medium" style={{ fontFamily: 'var(--font-uni-salar)' }}>داشکاندن</th>
                            <th className="text-right pb-3 pr-2 font-medium" style={{ fontFamily: 'var(--font-uni-salar)' }}>جۆری پارەدان</th>
                            <th className="text-center pb-3 font-medium" style={{ fontFamily: 'var(--font-uni-salar)' }}>کردار</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedPaymentHistory.map((history, index) => (
                            <motion.tr
                              key={history.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.03 }}
                              className="group cursor-pointer"
                              style={{ 
                                borderBottom: '1px solid var(--theme-card-border)',
                                minHeight: '60px'
                              }}
                              onClick={() => handleViewInvoice(history)}
                            >
                              <td className="py-4 pr-2">
                                <span 
                                  className="font-bold"
                                  style={{ 
                                    color: 'var(--theme-accent)',
                                    fontFamily: 'sans-serif',
                                    fontSize: '1.1rem'
                                  }}
                                >
                                  {history.invoice_number ? `#${history.invoice_number}` : '-'}
                                </span>
                              </td>
                              <td className="py-4 pr-2">
                                <span 
                                  style={{ color: 'var(--theme-foreground)', fontFamily: 'sans-serif', fontSize: '1.1rem' }}
                                >
                                  {history.date ? new Date(history.date).toLocaleDateString('en-US') : '-'}
                                </span>
                              </td>
                              <td className="py-4 pr-2">
                                <span 
                                  className="font-bold"
                                  style={{ 
                                    color: 'var(--theme-foreground)',
                                    fontFamily: 'sans-serif',
                                    fontSize: '1.1rem'
                                  }}
                                >
                                  {formatCurrency(history.amount)}
                                  <span className="text-xs mr-1" style={{ color: 'var(--theme-secondary)' }}>د.ع</span>
                                </span>
                              </td>
                              <td className="py-4 pr-2">
                                {history.discount_amount && history.discount_amount > 0 ? (
                                  <span 
                                    className="font-medium"
                                    style={{ color: '#ef4444', fontFamily: 'sans-serif', fontSize: '1.1rem' }}
                                  >
                                    -{formatCurrency(history.discount_amount)}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--theme-secondary)', fontFamily: 'sans-serif', fontSize: '1.1rem' }}>-</span>
                                )}
                              </td>
                              <td className="py-4 pr-2">
                                <span 
                                  className="inline-flex items-center px-3 py-1.5 rounded-full font-medium"
                                  style={{ 
                                    backgroundColor: history.payment_method === 'cash' ? '#dcfce7' : history.payment_method === 'debt' ? '#fef3c7' : '#dbeafe',
                                    color: history.payment_method === 'cash' ? '#16a34a' : history.payment_method === 'debt' ? '#d97706' : '#2563eb',
                                    fontFamily: 'var(--font-uni-salar)',
                                    fontSize: '1rem'
                                  }}
                                >
                                  {history.payment_method === 'cash' ? 'کاش' : history.payment_method === 'debt' ? 'قەرز' : 'ئۆنلاین'}
                                </span>
                              </td>
                              <td className="py-4 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewInvoice(history)
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95"
                                  style={{ 
                                    backgroundColor: 'var(--theme-accent)',
                                    color: '#ffffff',
                                    fontFamily: 'var(--font-uni-salar)',
                                    fontSize: '1rem'
                                  }}
                                >
                                  <FaEye className="text-base" />
                                  <span>بینینی وەسڵ</span>
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
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

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAddCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowAddCustomer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
              style={{ 
                backgroundColor: 'var(--theme-card-bg)',
                borderColor: 'var(--theme-card-border)',
                borderWidth: '1px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 max-h-[90vh] overflow-y-auto">
                <h3 
                  className="text-2xl font-bold mb-6 text-center"
                  style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                >
                  {isEditing ? 'دەستکاریکردنی کڕیار' : 'زیادکردنی کڕیار'}
                </h3>

                {/* Circular Image Upload */}
                <div className="mb-8">
                  <label 
                    className="block text-sm font-medium mb-3 text-center"
                    style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    وێنەی کڕیار
                  </label>
                  <input 
                    type="file" 
                    ref={(el) => { fileInputRef = el }}
                    accept="image/*" 
                    onChange={handleImageSelect} 
                    className="hidden" 
                  />
                  <div className="flex justify-center">
                    {!imagePreview ? (
                      <div
                        onClick={() => fileInputRef?.click()}
                        className="relative w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-all hover:opacity-90"
                        style={{
                          backgroundColor: 'var(--theme-muted)',
                          border: '2px dashed var(--theme-card-border)',
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <FaCamera className="text-2xl" style={{ color: 'var(--theme-secondary)' }} />
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div 
                          className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-2"
                          style={{
                            backgroundColor: 'var(--theme-muted)',
                            borderColor: 'var(--theme-card-border)'
                          }}
                        >
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <button
                          onClick={clearImage}
                          className="absolute -top-2 -right-2 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                          style={{ 
                            minWidth: '36px', 
                            minHeight: '36px',
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            borderRadius: '50%'
                          }}
                        >
                          <FaTimes size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                    >
                      ناو *
                    </label>
                    <div className="relative">
                      <div 
                        className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                        style={{ color: 'var(--theme-secondary)' }}
                      >
                        <FaUserPlus />
                      </div>
                      <input
                        type="text"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="ناوی کڕیار"
                        className="w-full px-4 py-4 pr-10 rounded-xl border transition-all focus:ring-2 outline-none"
                        style={{
                          backgroundColor: 'var(--theme-muted)',
                          borderColor: 'var(--theme-card-border)',
                          color: 'var(--theme-foreground)',
                          fontFamily: 'var(--font-uni-salar)',
                          minHeight: '48px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Phone 1 Field - WITH KURDISH CONVERSION */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                    >
                      تەلەفۆن
                    </label>
                    <div className="relative">
                      <div 
                        className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                        style={{ color: 'var(--theme-secondary)' }}
                      >
                        <FaPhone />
                      </div>
                      <input
                        type="text"
                        value={newCustomer.phone1}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, phone1: convertKurdishToEnglish(e.target.value) }))}
                        placeholder="ژمارەی تەلەفۆن"
                        className="w-full px-4 py-4 pr-10 rounded-xl border transition-all focus:ring-2 outline-none"
                        style={{
                          backgroundColor: 'var(--theme-muted)',
                          borderColor: 'var(--theme-card-border)',
                          color: 'var(--theme-foreground)',
                          fontFamily: 'sans-serif',
                          minHeight: '48px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Phone 2 Field - WITH KURDISH CONVERSION */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                    >
                      تەلەفۆن ٢
                    </label>
                    <div className="relative">
                      <div 
                        className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                        style={{ color: 'var(--theme-secondary)' }}
                      >
                        <FaPhone />
                      </div>
                      <input
                        type="text"
                        value={newCustomer.phone2}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, phone2: convertKurdishToEnglish(e.target.value) }))}
                        placeholder="ژمارەی تەلەفۆن ٢"
                        className="w-full px-4 py-4 pr-10 rounded-xl border transition-all focus:ring-2 outline-none"
                        style={{
                          backgroundColor: 'var(--theme-muted)',
                          borderColor: 'var(--theme-card-border)',
                          color: 'var(--theme-foreground)',
                          fontFamily: 'sans-serif',
                          minHeight: '48px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Location Field */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                    >
                      ناونیشان
                    </label>
                    <div className="relative">
                      <div 
                        className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                        style={{ color: 'var(--theme-secondary)' }}
                      >
                        <FaSearch />
                      </div>
                      <input
                        type="text"
                        value={newCustomer.location}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="ناونیشان"
                        className="w-full px-4 py-4 pr-10 rounded-xl border transition-all focus:ring-2 outline-none"
                        style={{
                          backgroundColor: 'var(--theme-muted)',
                          borderColor: 'var(--theme-card-border)',
                          color: 'var(--theme-foreground)',
                          fontFamily: 'var(--font-uni-salar)',
                          minHeight: '48px'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons - Larger and more prominent */}
                <div className="flex justify-end space-x-4 mt-10">
                  <button
                    onClick={resetForm}
                    className="px-8 py-4 rounded-xl transition-all hover:opacity-80 font-semibold text-lg"
                    style={{ 
                      backgroundColor: 'transparent', 
                      color: 'var(--theme-secondary)',
                      fontFamily: 'var(--font-uni-salar)',
                      border: '2px solid var(--theme-card-border)',
                      minHeight: '52px'
                    }}
                  >
                    پاشگەزبوونەوە
                  </button>
                  <button
                    onClick={isEditing ? handleUpdateCustomer : handleAddCustomer}
                    disabled={isUploading}
                    className="px-10 py-4 rounded-xl font-bold flex items-center gap-3 transition-all hover:opacity-90 shadow-lg disabled:opacity-50"
                    style={{ 
                      background: 'var(--theme-accent)', 
                      color: '#ffffff',
                      fontFamily: 'var(--font-uni-salar)',
                      minHeight: '52px',
                      minWidth: '140px',
                      justifyContent: 'center'
                    }}
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span className="text-lg">تکایە...</span>
                      </>
                    ) : (
                      <span className="text-lg">{isEditing ? 'نوێکردنەوە' : 'زیادکردن'}</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Payment Modal - DESIGN MATCHES SUPPLIER MODAL */}
      <AnimatePresence>
        {showPaymentModal && selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
            onClick={closePaymentModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              style={{ 
                background: 'rgba(30, 30, 46, 0.95)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: '1px',
                backdropFilter: 'blur(20px)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Debt Badge - Matches Supplier Modal */}
              <div 
                className="p-6 border-b flex justify-between items-start"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              >
                <div>
                  <h3 
                    className="text-xl font-bold"
                    style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    مێژووی پارەدانەکان
                  </h3>
                  <p 
                    className="text-sm mt-1"
                    style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    {selectedCustomer.name}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Current Debt Badge - Matches Supplier Modal */}
                  <div 
                    className="px-4 py-2 rounded-xl"
                    style={{ 
                      background: selectedCustomer.total_debt && selectedCustomer.total_debt > 0 
                        ? 'rgba(220, 38, 38, 0.2)' 
                        : 'rgba(22, 163, 74, 0.2)',
                      border: `1px solid ${selectedCustomer.total_debt && selectedCustomer.total_debt > 0 
                        ? 'rgba(220, 38, 38, 0.5)' 
                        : 'rgba(22, 163, 74, 0.5)'}`
                    }}
                  >
                    <span 
                      className="text-xs block"
                      style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}
                    >
                      {selectedCustomer.total_debt && selectedCustomer.total_debt > 0 ? 'قەرزی ئێستا' : 'دۆخی قەرز'}
                    </span>
                    <span 
                      className="text-lg font-bold"
                      style={{ 
                        color: selectedCustomer.total_debt && selectedCustomer.total_debt > 0 
                          ? '#fca5a5' 
                          : '#86efac', 
                        fontFamily: 'var(--font-uni-salar)' 
                      }}
                    >
                      {selectedCustomer.total_debt && selectedCustomer.total_debt > 0 
                        ? `${(selectedCustomer.total_debt || 0).toLocaleString()} د.ع`
                        : ' قەرز ✓'}
                    </span>
                  </div>
                  <button
                    onClick={closePaymentModal}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {/* Top Section: Add/Edit Payment Form - Matches Supplier Modal */}
                <div 
                  className="p-4 rounded-xl border"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <h4 
                    className="text-lg font-semibold mb-4"
                    style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    {editingPayment ? 'دەستکاری پارەدان' : 'زیادکردنی پارەدان'}
                  </h4>
                  <form onSubmit={editingPayment ? handleUpdatePayment : handleAddPayment} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Amount Input - Matches Supplier Modal */}
                      <div>
                        <label 
                          className="block text-sm mb-1"
                          style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}
                        >
                          بڕی پارە (IQD)
                        </label>
                        <input
                          type="number"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          placeholder="0"
                          required
                          className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2"
                          style={{ 
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            fontFamily: 'var(--font-uni-salar)'
                          }}
                        />
                      </div>
                      
                      {/* Date Input - Matches Supplier Modal */}
                      <div>
                        <label 
                          className="block text-sm mb-1"
                          style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}
                        >
                          بەروار
                        </label>
                        <input
                          type="date"
                          value={paymentForm.date}
                          onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                          required
                          className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2"
                          style={{ 
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            fontFamily: 'var(--font-uni-salar)'
                          }}
                        />
                      </div>
                      
                      {/* Note Input - Matches Supplier Modal */}
                      <div>
                        <label 
                          className="block text-sm mb-1"
                          style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}
                        >
                          تێبینی
                        </label>
                        <input
                          type="text"
                          value={paymentForm.note}
                          onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                          placeholder="تێبینی..."
                          className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2"
                          style={{ 
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            fontFamily: 'var(--font-uni-salar)'
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Submit Button - Matches Supplier Modal */}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submittingPayment}
                        className="px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                        style={{ 
                          background: 'var(--theme-accent)',
                          color: '#ffffff',
                          fontFamily: 'var(--font-uni-salar)'
                        }}
                      >
                        {submittingPayment ? '...' : editingPayment ? 'نوێکردنەوە' : 'تۆمارکردن'}
                      </button>
                      {editingPayment && (
                        <button
                          type="button"
                          onClick={cancelEditPayment}
                          className="px-6 py-2 rounded-lg font-semibold transition-colors"
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontFamily: 'var(--font-uni-salar)'
                          }}
                        >
                          هەڵوەشاندنەوە
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Bottom Section: Payments List - Matches Supplier Modal */}
                <div>
                  <h4 
                    className="text-lg font-semibold mb-4"
                    style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    لیستی پارەدانەکان
                  </h4>
                  {loadingPayments ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--theme-accent)' }}></div>
                    </div>
                  ) : customerPayments.length > 0 ? (
                    <div className="space-y-2">
                      {customerPayments.map((payment) => (
                        <div 
                          key={payment.id}
                          className="flex items-center justify-between p-3 mb-2 rounded-xl"
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center min-w-[80px]">
                              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.75rem' }}>بەروار</div>
                              <div style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>
                                {new Date(payment.date).toLocaleDateString('ar-IQ')}
                              </div>
                            </div>
                            <div className="text-center min-w-[100px]">
                              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.75rem' }}>بڕی پارە</div>
                              <div style={{ color: '#86efac', fontFamily: 'var(--font-uni-salar)', fontWeight: 'bold' }}>
                                {payment.amount.toLocaleString()} د.ع
                              </div>
                            </div>
                            <div className="min-w-[120px]">
                              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.75rem' }}>تێبینی</div>
                              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'var(--font-uni-salar)' }}>
                                {payment.note || '-'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditPayment(payment)}
                              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                              title="دەستکاری"
                              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                            >
                              <FaEdit size={14} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                            </button>
                            <button
                              onClick={() => handleDeletePayment(payment)}
                              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                              title="سڕینەوە"
                              style={{ background: 'rgba(255, 100, 100, 0.1)' }}
                            >
                              <FaTrash size={14} style={{ color: 'rgba(255, 100, 100, 0.8)' }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div 
                      className="text-center py-8 rounded-xl"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <div className="text-4xl mb-2">💰</div>
                      <p style={{ fontFamily: 'var(--font-uni-salar)', color: 'rgba(255, 255, 255, 0.5)' }}>
                        هیچ پارەدانێک نەکراوە
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal for delete operations */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setShowConfirmModal(false)}
        type="danger"
      />

    </div>
  )
}
