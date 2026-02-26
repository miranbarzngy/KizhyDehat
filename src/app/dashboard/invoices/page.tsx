'use client'

import ConfirmModal from '@/components/ConfirmModal'
import { buildInvoiceData, InvoiceTemplate } from '@/components/GlobalInvoiceModal'
import { useToast } from '@/components/Toast'
import { useGlobalInvoiceModal } from '@/hooks/useGlobalInvoiceModal'
import { ActivityActions, EntityTypes, logActivity } from '@/lib/activityLogger'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { FaCog, FaEye, FaFileInvoice, FaFilter, FaQrcode, FaSave, FaSearch, FaTimes, FaUpload } from 'react-icons/fa'
import InvoiceTable from './components/InvoiceTable'

interface InvoiceSettings {
  id?: number
  shop_name: string
  shop_phone: string
  shop_address: string
  thank_you_note: string
  shop_logo: string
  qr_code_url: string
}

// Helper function to format currency in Kurdish numerals
const formatCurrencyKurdish = (value: any): string => {
  if (value === null || value === undefined) return '0'
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)
}

export default function InvoicesPage() {
  const { openModal } = useGlobalInvoiceModal()
  const { showSuccess, showError } = useToast()
  const [activeTab, setActiveTab] = useState<'settings' | 'invoices' | 'pending'>('pending')
  const [formData, setFormData] = useState<InvoiceSettings>({
    shop_name: 'کلیک گروپ',
    shop_phone: '',
    shop_address: '',
    thank_you_note: 'سوپاس بۆ کڕینەکەتان!',
    shop_logo: '',
    qr_code_url: ''
  })
  const [pendingSales, setPendingSales] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [previewLogo, setPreviewLogo] = useState<string>('')
  const [previewQr, setPreviewQr] = useState<string>('')
  
  // Date filter state
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  // Search query state
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  const logoInputRef = useRef<HTMLInputElement>(null)
  const qrInputRef = useRef<HTMLInputElement>(null)
  
  // Confirm modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {}
  })
  const [pendingSaleAction, setPendingSaleAction] = useState<{sale: any, action: string} | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch seller name from profile using user_id
  const fetchSellerName = async (userId: string | null, soldBy: string | null): Promise<string> => {
    // Try user_id first
    if (userId) {
      try {
        const { data, error } = await supabase.from('profiles').select('name').eq('id', userId).single()
        if (data?.name) {
          console.log('fetchSellerName - Found by user_id:', data.name)
          return data.name
        }
      } catch (e) {
        console.log('fetchSellerName - user_id query failed:', e)
      }
    }
    // Try sold_by if user_id didn't work
    if (soldBy) {
      try {
        const { data, error } = await supabase.from('profiles').select('name').eq('id', soldBy).single()
        if (data?.name) {
          console.log('fetchSellerName - Found by sold_by:', data.name)
          return data.name
        }
      } catch (e) {
        console.log('fetchSellerName - sold_by query failed:', e)
      }
    }
    console.log('fetchSellerName - No profile found, userId:', userId, 'soldBy:', soldBy)
    return ''
  }

  // Handle viewing invoice from any tab - uses global modal
  const handleViewInvoice = async (sale: any) => {
    try {
      // Fetch sale items with product info
      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select('*, products(name, unit)')
        .eq('sale_id', sale.id)
      
      if (itemsError) {
        console.error('Error fetching sale items:', itemsError)
      }
      
      // Transform items to include product data in a way that works with our template
      const transformedItems = (saleItems || []).map((item: any) => ({
        ...item,
        products: item.products ? {
          name: item.products.name,
          unit: item.products.unit
        } : null
      }))
      
      // Fetch customer data
      const { data: customerData } = sale.customer_id ? await supabase
        .from('customers')
        .select('name, phone1, location')
        .eq('id', sale.customer_id)
        .single() : { data: null }
      
      // Fetch seller name from profile using user_id
      const sellerName = await fetchSellerName(sale.user_id, sale.sold_by)
      
      const saleData = {
        ...sale,
        customers: customerData || null,
        sale_items: transformedItems || [],
        seller_name: sellerName || sale.sold_by || sale.seller_name || '',
        profiles: { name: sellerName || sale.sold_by || sale.seller_name || '' }
      }
      
      console.log('Invoice Data Debug - handleViewInvoice:', saleData)
      
      // Build invoice data and open global modal
      const invoiceData = buildInvoiceData(saleData, sale)
      openModal(
        invoiceData,
        sale.id,
        `پسوڵە #${sale.invoice_number || sale.id?.slice(0, 8).toUpperCase() || '---'}`
      )
    } catch (error) {
      console.error('Error opening invoice modal:', error)
      // Still open modal even if there's an error, but with empty items
      const saleData = {
        ...sale,
        customers: null,
        sale_items: []
      }
      const invoiceData = buildInvoiceData(saleData, sale)
      openModal(
        invoiceData,
        sale.id,
        `پسوڵە #${sale.invoice_number || sale.id?.slice(0, 8).toUpperCase() || '---'}`
      )
    }
  }

  // Print functionality removed per user request

  // Handle refund invoice
  const handleRefundInvoice = async (sale: any) => {
    if (!confirm('دڵنیایت لە گەڕاندنەوەی ئەم پسوڵەیە؟')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('sales')
        .update({ status: 'refunded' })
        .eq('id', sale.id)
      
      if (error) throw error
      
      showSuccess('پسوڵەکە بە سەرکەوتوویی گەڕێندرایەوە')
      // Refresh data
      await fetchInvoices()
      await fetchPendingSales()
    } catch (error) {
      console.error('Error refunding invoice:', error)
      showError('هەڵە لە گەڕاندنەوەی پسوڵەکە')
    }
  }

  useEffect(() => { fetchPendingSales(); fetchInvoices(); fetchInvoiceSettings() }, [])

  const fetchPendingSales = async () => {
    if (!supabase) return
    try {
      // Build query with optional date filters and search
      let query = supabase.from('sales').select('*, customers(name, phone1, location)').eq('status', 'pending').order('created_at', { ascending: false }).limit(50)
      
      // Apply date filters if provided
      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        // Add one day to include the entire end date
        const endDateObj = new Date(endDate)
        endDateObj.setDate(endDateObj.getDate() + 1)
        query = query.lt('created_at', endDateObj.toISOString())
      }
      
      // Apply search filter if provided - search by customer name (via customers relation) or invoice number
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        // Check if search query is numeric - treat as invoice number
        const isNumeric = /^\d+$/.test(searchQuery)
        
        if (isNumeric) {
          // Search by invoice number
          query = query.eq('invoice_number', parseInt(searchQuery))
        } else {
          // Search by customer name - use text search on customer_id
          // First fetch matching customers
          const { data: matchingCustomers } = await supabase
            .from('customers')
            .select('id')
            .ilike('name', `%${searchLower}%`)
          
          if (matchingCustomers && matchingCustomers.length > 0) {
            const customerIds = matchingCustomers.map(c => c.id)
            query = query.in('customer_id', customerIds)
          } else {
            // No matching customers, return empty
            setPendingSales([])
            return
          }
        }
      }
      
      const { data: salesData } = await query
      
      // For each sale, fetch the seller name using user_id and sold_by
      const mappedData = await Promise.all((salesData || []).map(async (sale: any) => {
        const sellerName = await fetchSellerName(sale.user_id, sale.sold_by)
        return { ...sale, seller_name: sellerName || sale.sold_by || '', profiles: { name: sellerName || sale.sold_by || '' } }
      }))
      
      setPendingSales(mappedData)
    } catch { setPendingSales([]) }
  }

  const fetchInvoices = async () => {
    if (!supabase) return
    try {
      // Build query - show ALL sales regardless of status (completed, pending, refunded, cancelled)
      let query = supabase.from('sales').select('*, customers(name, phone1, location)').order('created_at', { ascending: false })
      
      // Apply date filters if provided
      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        // Add one day to include the entire end date
        const endDateObj = new Date(endDate)
        endDateObj.setDate(endDateObj.getDate() + 1)
        query = query.lt('created_at', endDateObj.toISOString())
      }
      
      // Apply search filter if provided - search by customer name or invoice number
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        // Check if search query is numeric - treat as invoice number
        const isNumeric = /^\d+$/.test(searchQuery)
        
        if (isNumeric) {
          // Search by invoice number
          query = query.eq('invoice_number', parseInt(searchQuery))
        } else {
          // Search by customer name - use text search
          // First fetch matching customers
          const { data: matchingCustomers } = await supabase
            .from('customers')
            .select('id')
            .ilike('name', `%${searchLower}%`)
          
          if (matchingCustomers && matchingCustomers.length > 0) {
            const customerIds = matchingCustomers.map(c => c.id)
            query = query.in('customer_id', customerIds)
          } else {
            // No matching customers, return empty
            setInvoices([])
            return
          }
        }
      }
      
      const { data: salesData } = await query
      
      // For each sale, fetch the seller name using user_id and sold_by
      const mappedData = await Promise.all((salesData || []).map(async (sale: any) => {
        const sellerName = await fetchSellerName(sale.user_id, sale.sold_by)
        return { 
          ...sale, 
          seller_name: sellerName || sale.sold_by || '', 
          profiles: { name: sellerName || sale.sold_by || '' },
          customers: sale.customers || null
        }
      }))
      
      setInvoices(mappedData)
    } catch { setInvoices([]) }
  }

  // Apply filters (date + search)
  const applyFilters = () => {
    fetchPendingSales()
    fetchInvoices()
  }

  // Clear all filters
  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setSearchQuery('')
    fetchPendingSales()
    fetchInvoices()
  }

  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  // Apply search when user types (debounced via button or Enter)
  const applySearch = () => {
    fetchPendingSales()
    fetchInvoices()
  }

  const fetchInvoiceSettings = async () => {
    if (!supabase) return
    try {
      const { data } = await supabase.from('invoice_settings').select('*').maybeSingle()
      if (data) {
        setFormData({
          shop_name: data.shop_name || '',
          shop_phone: data.shop_phone || '',
          shop_address: data.shop_address || '',
          thank_you_note: data.thank_you_note || 'سوپاس بۆ کڕینەکەتان!',
          shop_logo: data.shop_logo || '',
          qr_code_url: data.qr_code_url || ''
        })
        setPreviewLogo(data.shop_logo || '')
        setPreviewQr(data.qr_code_url || '')
      }
    } catch (error) { console.error('Error fetching settings:', error) }
  }

  const saveSettings = async () => {
    if (!supabase) return
    setIsSaving(true)
    try {
      const { data: existing } = await supabase.from('invoice_settings').select('id').maybeSingle()
      const settingsData = {
        shop_name: formData.shop_name,
        shop_phone: formData.shop_phone,
        shop_address: formData.shop_address,
        thank_you_note: formData.thank_you_note,
        shop_logo: formData.shop_logo,
        qr_code_url: formData.qr_code_url,
        updated_at: new Date().toISOString()
      }
      if (existing?.id) {
        await supabase.from('invoice_settings').update(settingsData).eq('id', existing.id)
      } else {
        await supabase.from('invoice_settings').insert(settingsData)
      }
      
      // Log the activity after successful save
      await logActivity(
        null, // userId - will be auto-fetched
        null, // userName - will be auto-fetched (will use 'سوپەر ئادمین' for super admin)
        ActivityActions.UPDATE_INVOICE_SETTINGS,
        'دەستکاری ڕێکخستنەکانی پسوڵەی کرد',
        EntityTypes.INVOICE_SETTINGS,
        existing?.id?.toString()
      )
      
      showSuccess('ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوتکران!')
    } catch (error) {
      console.error('Error saving settings:', error)
      showError('هەڵە لە پاشەکەوتکردن')
    } finally { setIsSaving(false) }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !supabase) return
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `logo_${Date.now()}.${fileExt}`
      const filePath = `invoice-logos/${fileName}`
      const { error: uploadError } = await supabase.storage.from('shop-assets').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('shop-assets').getPublicUrl(filePath)
      setFormData({ ...formData, shop_logo: publicUrl })
      setPreviewLogo(publicUrl)
    } catch (error) { console.error('Error uploading logo:', error) }
  }

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !supabase) return
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `qr_${Date.now()}.${fileExt}`
      const filePath = `invoice-qrcodes/${fileName}`
      const { error: uploadError } = await supabase.storage.from('shop-assets').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('shop-assets').getPublicUrl(filePath)
      setFormData({ ...formData, qr_code_url: publicUrl })
      setPreviewQr(publicUrl)
    } catch (error) { console.error('Error uploading QR:', error) }
  }

  const filteredInvoices = invoices.filter(inv => !searchTerm || inv.customer_id?.toLowerCase().includes(searchTerm.toLowerCase()))

  const previewInvoiceData = {
    invoiceNumber: 12345,
    customerName: 'کڕیاری نموونە',
    date: new Date().toLocaleDateString('ku'),
    time: new Date().toLocaleTimeString('ku'),
    paymentMethod: 'cash',
    seller_name: 'کارمەند',
    items: [
      { name: 'کاڵای یەکەم', unit: 'دانە', quantity: 2, price: 5000, total: 10000 },
      { name: 'کاڵای دووەم', unit: 'کیلۆ', quantity: 1.5, price: 8000, total: 12000 }
    ],
    subtotal: 22000,
    discount: 2000,
    total: 20000,
    shopName: formData.shop_name || 'ناوی فرۆشگا',
    shopPhone: formData.shop_phone,
    shopAddress: formData.shop_address,
    shopLogo: previewLogo,
    qrCodeUrl: previewQr,
    thankYouNote: formData.thank_you_note
  }

  // Check if any filter is active
  const hasActiveFilters = startDate || endDate || searchQuery

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="w-full max-w-[2800px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>پسوڵە و ڕێکخستنەکان</h1>
            <div className="flex items-center space-x-2" style={{ color: 'var(--theme-secondary)' }}>
              <FaFileInvoice style={{ color: 'var(--theme-accent)' }} />
              <span style={{ fontFamily: 'var(--font-uni-salar)' }}>{filteredInvoices.length} پسوڵە</span>
            </div>
          </div>

          {/* Filters UI */}
          <div className="mb-6 p-3 md:p-4 backdrop-blur-xl border shadow-sm rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)' }}>
            {/* Search Bar */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>گەڕان</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                  placeholder="گەڕان بەناوی کڕیار یان ژمارەی پسوڵە..."
                  className="w-full px-3 md:px-4 py-2 md:py-3 pr-10 md:pr-12 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all text-base md:text-lg box-border"
                  style={{ 
                    backgroundColor: 'var(--theme-muted)', 
                    borderColor: 'var(--theme-card-border)', 
                    color: 'var(--theme-foreground)', 
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                />
                <button
                  onClick={applySearch}
                  className="absolute left-1 md:left-2 top-1/2 transform -translate-y-1/2 p-1.5 md:p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  <FaSearch />
                </button>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-end w-full">
              <div className="min-w-0 w-full">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>لە بەرواری</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full max-w-full flex-1 px-3 md:px-4 py-2 md:py-3 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all text-sm md:text-lg box-border"
                  style={{ 
                    backgroundColor: 'var(--theme-muted)', 
                    borderColor: 'var(--theme-card-border)', 
                    color: 'var(--theme-foreground)', 
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                />
              </div>
              <div className="min-w-0 w-full">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>بۆ بەرواری</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full max-w-full flex-1 px-3 md:px-4 py-2 md:py-3 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all text-sm md:text-lg box-border"
                  style={{ 
                    backgroundColor: 'var(--theme-muted)', 
                    borderColor: 'var(--theme-card-border)', 
                    color: 'var(--theme-foreground)', 
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                />
              </div>
              <div className="flex gap-2 w-full md:mt-auto">
                <motion.button
                  onClick={applyFilters}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 md:flex-none py-2 md:py-3 px-4 md:px-6 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                  style={{ background: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                >
                  <FaFilter />
                  <span>فلتەر بکە</span>
                </motion.button>
                <motion.button
                  onClick={clearFilters}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 md:flex-none py-2 md:py-3 px-4 md:px-6 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                  style={{ background: 'var(--theme-muted)', color: 'var(--theme-foreground)', borderColor: 'var(--theme-card-border)', border: '1px solid', fontFamily: 'var(--font-uni-salar)' }}
                >
                  <FaTimes />
                  <span>پاککردنەوە</span>
                </motion.button>
              </div>
            </div>
          </div>

          <div className="flex flex-row overflow-x-auto whitespace-nowrap space-x-2 mb-8 backdrop-blur-xl border shadow-sm rounded-2xl p-2 transition-all duration-300" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)' }}>
            {['pending', 'invoices', 'settings'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300" style={{ fontFamily: 'var(--font-uni-salar)', background: activeTab === tab ? 'var(--theme-accent)' : 'transparent', color: activeTab === tab ? '#ffffff' : 'var(--theme-secondary)' }}>
                {tab === 'pending' ? '⏳ فرۆشتنە چاوەڕوانکراوەکان' : tab === 'invoices' ? '📋 پسوڵەکان' : '⚙️ ڕێکخستنەکان'}
              </button>
            ))}
          </div>

          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="backdrop-blur-xl border shadow-sm rounded-3xl p-6 md:p-8" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)' }}>
                  <div className="flex items-center mb-8">
                    <FaCog className="text-2xl ml-3" style={{ color: 'var(--theme-accent)' }} />
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>ڕێکخستنەکانی پسوڵە</h2>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>ناوی فرۆشگا</label>
                      <input type="text" value={formData.shop_name} onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })} className="w-full px-4 py-3 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all" style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>ژمارەی تەلەفۆن</label>
                      <input type="text" value={formData.shop_phone} onChange={(e) => setFormData({ ...formData, shop_phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all" style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>ناونیشان</label>
                      <input type="text" value={formData.shop_address} onChange={(e) => setFormData({ ...formData, shop_address: e.target.value })} className="w-full px-4 py-3 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all" style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>پەیامی سوپاس</label>
                      <textarea value={formData.thank_you_note} onChange={(e) => setFormData({ ...formData, thank_you_note: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all resize-none" style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>لۆگۆی فرۆشگا</label>
                      <div className="flex items-center gap-4">
                        <button onClick={() => logoInputRef.current?.click()} className="flex items-center gap-2 px-4 py-3 rounded-xl border transition-all hover:opacity-80" style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>
                          <FaUpload /><span>ئەپلۆدکردن</span>
                        </button>
                        <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        {previewLogo && <div className="relative w-16 h-16 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--theme-card-border)' }}><img src={previewLogo} alt="Logo" className="w-full h-full object-cover" /></div>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>وێنەی QR کۆد</label>
                      <div className="flex items-center gap-4">
                        <button onClick={() => qrInputRef.current?.click()} className="flex items-center gap-2 px-4 py-3 rounded-xl border transition-all hover:opacity-80" style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>
                          <FaQrcode /><span>ئەپلۆدکردن</span>
                        </button>
                        <input ref={qrInputRef} type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                        {previewQr && <div className="relative w-16 h-16 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--theme-card-border)' }}><img src={previewQr} alt="QR" className="w-full h-full object-cover" /></div>}
                      </div>
                    </div>
                    <motion.button onClick={saveSettings} disabled={isSaving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 mt-4" style={{ background: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>
                      <FaSave /><span>{isSaving ? 'پاشەکەوتکردن...' : 'پاشەکەوتکردن'}</span>
                    </motion.button>
                  </div>
                </div>

                <div className="xl:sticky xl:top-6 xl:self-start">
                  <div className="flex items-center mb-4">
                    <FaEye className="ml-2" style={{ color: 'var(--theme-accent)' }} />
                    <h3 className="text-xl font-bold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>پیشاندانی  پسوڵە</h3>
                  </div>
                  <div className="rounded-3xl shadow-2xl overflow-hidden" style={{ maxWidth: '400px', margin: '0 auto', backgroundColor: '#ffffff' }}>
                    <InvoiceTemplate data={previewInvoiceData} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'invoices' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <InvoiceTable filteredInvoices={filteredInvoices} onView={handleViewInvoice} onRefund={handleRefundInvoice} />
            </motion.div>
          )}

          {activeTab === 'pending' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-white/80 dark:bg-[#2a2d3e]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-xl rounded-3xl overflow-hidden transition-all duration-300">
                <div className="overflow-x-auto w-full">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#2a2d3e]/60">
                        <th className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>#</th>
                        <th className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>کڕیار</th>
                        <th className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>فرۆشیار</th>
                        <th className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی نرخ</th>
                        <th className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>داشکاندن</th>
                        <th className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی گشتی</th>
                        <th className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>شێواز</th>
                        <th className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>دۆخ</th>
                        <th className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                        <th className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>کردار</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingSales.length > 0 ? pendingSales.map((sale, index) => (
                        <motion.tr
                          key={sale.id}
                          className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-200"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <td className="px-2 py-3 text-gray-900 dark:text-gray-200 font-bold text-center text-xs" style={{ fontFamily: 'sans-serif' }}>
                            #{sale.invoice_number || sale.id?.slice(0, 8).toUpperCase() || '-'}
                          </td>
                          <td className="px-2 py-3 text-gray-900 dark:text-gray-200 text-center text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            {sale.customers?.name || 'کڕیاری نەناسراو'}
                          </td>
                          <td className="px-2 py-3 text-gray-900 dark:text-gray-200 text-center text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            {sale.seller_name || sale.sold_by || '-'}
                          </td>
                          <td className="px-2 py-3 text-gray-900 dark:text-gray-200 text-center text-xs" style={{ fontFamily: 'sans-serif' }}>
                            {formatCurrencyKurdish(sale.subtotal || 0)} د.ع
                          </td>
                          <td className="px-2 py-3 text-red-600 dark:text-red-400 text-center text-xs" style={{ fontFamily: 'sans-serif' }}>
                            -{formatCurrencyKurdish(sale.discount_amount || 0)}
                          </td>
                          <td className="px-2 py-3 text-gray-900 dark:text-gray-200 font-bold text-center text-xs" style={{ fontFamily: 'sans-serif' }}>
                            {formatCurrencyKurdish(sale.total)} د.ع
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                              sale.payment_method === 'cash' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' :
                              sale.payment_method === 'fib' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                              'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300'
                            }`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              {sale.payment_method === 'cash' ? 'کاش' :
                               sale.payment_method === 'fib' ? 'ئۆنلاین' :
                               '📝 قەرز'}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                               چاوەڕوانکراو
                            </span>
                          </td>
                          <td className="px-2 py-3 text-gray-600 dark:text-gray-400 text-center text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            {new Date(sale.date).toLocaleDateString('en-US')}
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex flex-row-reverse gap-1 justify-center">
                              {/* بینین (View) - Blue */}
                              <div className="flex flex-col items-center gap-1">
                                <motion.button
                                  onClick={() => handleViewInvoice(sale)}
                                  className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="بینین"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </motion.button>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>بینین</span>
                              </div>

                              {/* تەواوکردن (Complete) - Green */}
                              <div className="flex flex-col items-center gap-1">
                                <motion.button
                                  onClick={() => {
                                    if (isProcessing) return
                                    setConfirmModalConfig({
                                      title: 'دڵنیایی لە پەسەندکردن',
                                      message: 'ئایا دڵنیایت لە پەسەندکردنی ئەم وەسڵە؟ ئەم کارە کاریگەری لەسەر بڕی کاڵاکان و قەرزی کڕیار دەبێت.',
                                      onConfirm: async () => {
                                        setIsProcessing(true)
                                        try {
                                          const { error } = await supabase?.rpc('approve_sale', { p_sale_id: sale.id });
                                          if (error) throw error;
                                          
                                          // Log activity
                                          const invoiceNum = sale.invoice_number || sale.id?.slice(0, 8).toUpperCase()
                                          await logActivity(
                                            null,
                                            'سیستەم',
                                            ActivityActions.APPROVE_SALE,
                                            `پسوڵەی ژمارە #${invoiceNum} پەسەندکرا`,
                                            EntityTypes.SALE,
                                            sale.id
                                          )
                                          
                                          await fetchPendingSales();
                                          await fetchInvoices();
                                          showSuccess('وەسڵەکە بە سەرکەوتوویی پەسەند کرا')
                                        } catch (err: any) {
                                          console.error('Error approving sale:', err);
                                          showError('هەڵە لە پەسەندکردن: ' + (err.message || 'هەڵەی نەناسراو'))
                                        } finally {
                                          setIsProcessing(false)
                                          setShowConfirmModal(false)
                                        }
                                      }
                                    })
                                    setPendingSaleAction({ sale, action: 'approve' })
                                    setShowConfirmModal(true)
                                  }}
                                  disabled={isProcessing}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${
                                    isProcessing 
                                      ? 'bg-gray-300 cursor-not-allowed' 
                                      : 'bg-green-500 hover:bg-green-600 text-white'
                                  }`}
                                  whileHover={{ scale: isProcessing ? 1 : 1.05 }}
                                  whileTap={{ scale: isProcessing ? 1 : 0.95 }}
                                  title="تەواوکردن"
                                >
                                  {isProcessing ? (
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </motion.button>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>تەواو</span>
                              </div>

                              {/* گەڕاندنەوە (Refund) - Orange */}
                              <div className="flex flex-col items-center gap-1">
                                <motion.button
                                  onClick={() => {
                                    if (isProcessing) return
                                    setConfirmModalConfig({
                                      title: 'دڵنیایی لە گەڕاندنەوە',
                                      message: 'ئایا دڵنیایت لە گەڕاندنەوەی ئەم وەسڵە؟ ئەم کارە کاریگەری لەسەر بڕی کاڵاکان و قەرزی کڕیار دەبێت.',
                                      onConfirm: async () => {
                                        setIsProcessing(true)
                                        try {
                                          await supabase?.rpc('revert_sale_stock', { p_sale_id: sale.id })
                                          await supabase?.from('sales').update({ status: 'refunded' }).eq('id', sale.id)
                                          
                                          // Log activity
                                          const invoiceNum = sale.invoice_number || sale.id?.slice(0, 8).toUpperCase()
                                          await logActivity(
                                            null,
                                            'سیستەم',
                                            ActivityActions.REFUND_SALE,
                                            `پسوڵەی ژمارە #${invoiceNum} گەڕێندرایەوە`,
                                            EntityTypes.SALE,
                                            sale.id
                                          )
                                          
                                          await fetchPendingSales()
                                          await fetchInvoices()
                                          showSuccess('فرۆشتنەکە بە سەرکەوتوویی گەڕێندرایەوە')
                                        } catch (err) {
                                          console.error('Error refunding sale:', err)
                                          showError('هەڵە لە گەڕاندنەوە')
                                        } finally {
                                          setIsProcessing(false)
                                          setShowConfirmModal(false)
                                        }
                                      }
                                    })
                                    setPendingSaleAction({ sale, action: 'refund' })
                                    setShowConfirmModal(true)
                                  }}
                                  disabled={isProcessing}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${
                                    isProcessing 
                                      ? 'bg-gray-300 cursor-not-allowed' 
                                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                                  }`}
                                  whileHover={{ scale: isProcessing ? 1 : 1.05 }}
                                  whileTap={{ scale: isProcessing ? 1 : 0.95 }}
                                  title="گەڕاندنەوە"
                                >
                                  {isProcessing ? (
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                  )}
                                </motion.button>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>گەڕاندن</span>
                              </div>

                              {/* هەڵوەشاندنەوە (Cancel) - Red */}
                              <div className="flex flex-col items-center gap-1">
                                <motion.button
                                  onClick={() => {
                                    if (isProcessing) return
                                    setConfirmModalConfig({
                                      title: 'دڵنیایی لە هەڵوەشاندنەوە',
                                      message: 'ئایا دڵنیایت لە هەڵوەشاندنەوەی ئەم وەسڵە؟ ئەم کارە کاریگەری لەسەر بڕی کاڵاکان و قەرزی کڕیار دەبێت.',
                                      onConfirm: async () => {
                                        setIsProcessing(true)
                                        try {
                                          await supabase?.rpc('revert_sale_stock', { p_sale_id: sale.id })
                                          await supabase?.from('sales').update({ status: 'cancelled' }).eq('id', sale.id)
                                          
                                          // Log activity
                                          const invoiceNum = sale.invoice_number || sale.id?.slice(0, 8).toUpperCase()
                                          await logActivity(
                                            null,
                                            null,
                                            ActivityActions.CANCEL_SALE,
                                            `هەڵوەشاندنەوەی پسوڵەی ژمارە #${invoiceNum}`,
                                            EntityTypes.SALE,
                                            sale.id
                                          )
                                          
                                          await fetchPendingSales()
                                          await fetchInvoices()
                                          showSuccess('فرۆشتنەکە هەڵوەشێنرایەوە')
                                        } catch (err) {
                                          console.error('Error cancelling sale:', err)
                                          showError('هەڵە لە هەڵوەشاندنەوە')
                                        } finally {
                                          setIsProcessing(false)
                                          setShowConfirmModal(false)
                                        }
                                      }
                                    })
                                    setPendingSaleAction({ sale, action: 'cancel' })
                                    setShowConfirmModal(true)
                                  }}
                                  disabled={isProcessing}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${
                                    isProcessing 
                                      ? 'bg-gray-300 cursor-not-allowed' 
                                      : 'bg-red-500 hover:bg-red-600 text-white'
                                  }`}
                                  whileHover={{ scale: isProcessing ? 1 : 1.05 }}
                                  whileTap={{ scale: isProcessing ? 1 : 0.95 }}
                                  title="هەڵوەشاندنەوە"
                                >
                                  {isProcessing ? (
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )}
                                </motion.button>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>هەڵوەش</span>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )) : (
                        <tr>
                          <td colSpan={10} className="px-6 py-12 text-center">
                            <div className="text-gray-500">
                              <p className="text-lg" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                {hasActiveFilters ? 'هیچ ئەنجامێک نەدۆزرایەوە بۆ ئەم گەڕانە' : 'هیچ فرۆشتنێکی چاوەڕوانکراو نیە'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
          {/* No local modal needed - GlobalInvoiceModal is now handled by context */}
        </motion.div>
      </div>
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setShowConfirmModal(false)}
        type="success"
      />
    </div>
  )
}
