'use client'

import { InvoiceTemplate } from '@/components/GlobalInvoiceModal'
import InvoiceModal from '@/components/shared/InvoiceModal'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { FaCog, FaEye, FaFileInvoice, FaQrcode, FaSave, FaUpload } from 'react-icons/fa'
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
  if (value === null || value === undefined) return '٠'
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0
  return new Intl.NumberFormat('ku-IQ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)
}

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'invoices' | 'pending'>('pending')
  const [formData, setFormData] = useState<InvoiceSettings>({
    shop_name: 'فرۆشگای کوردستان',
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
  
  // Modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null)
  
  const logoInputRef = useRef<HTMLInputElement>(null)
  const qrInputRef = useRef<HTMLInputElement>(null)

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

  // Handle viewing invoice from any tab
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
        .select('name, phone1')
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
      
      setSelectedInvoice(sale)
      setInvoiceDetails(saleData)
      setShowInvoiceModal(true)
    } catch (error) {
      console.error('Error opening invoice modal:', error)
      // Still open modal even if there's an error, but with empty items
      setSelectedInvoice(sale)
      setInvoiceDetails({
        ...sale,
        customers: null,
        sale_items: []
      })
      setShowInvoiceModal(true)
    }
  }

  const handleCloseInvoiceModal = () => {
    setShowInvoiceModal(false)
    setSelectedInvoice(null)
    setInvoiceDetails(null)
  }

  // Handle printing invoice (reprint)
  const handlePrintInvoice = async (sale: any) => {
    try {
      // Fetch sale items with product info
      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select('*, products(name, unit)')
        .eq('sale_id', sale.id)
      
      if (itemsError) {
        console.error('Error fetching sale items:', itemsError)
      }
      
      // Transform items
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
        .select('name, phone1')
        .eq('id', sale.customer_id)
        .single() : { data: null }
      
      // Fetch seller name from profile
      const sellerName = await fetchSellerName(sale.user_id, sale.sold_by)
      
      const saleData = {
        ...sale,
        customers: customerData || null,
        sale_items: transformedItems || [],
        seller_name: sellerName || sale.sold_by || sale.seller_name || '',
        profiles: { name: sellerName || sale.sold_by || sale.seller_name || '' }
      }
      
      setSelectedInvoice(sale)
      setInvoiceDetails(saleData)
      setShowInvoiceModal(true)
    } catch (error) {
      console.error('Error printing invoice:', error)
      alert('هەڵە لە کردنەوەی پسوڵە بۆ چاپکردن')
    }
  }

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
      
      alert('پسوڵەکە بە سەرکەوتوویی گەڕێندرایەوە')
      // Refresh data
      await fetchInvoices()
      await fetchPendingSales()
    } catch (error) {
      console.error('Error refunding invoice:', error)
      alert('هەڵە لە گەڕاندنەوەی پسوڵەکە')
    }
  }

  useEffect(() => { fetchPendingSales(); fetchInvoices(); fetchInvoiceSettings() }, [])

  const fetchPendingSales = async () => {
    if (!supabase) return
    try {
      // Fetch sales with customer data
      const { data: salesData } = await supabase.from('sales').select('*, customers(name, phone1)').eq('status', 'pending').order('created_at', { ascending: false }).limit(50)
      
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
      // Fetch all sales
      const { data: salesData } = await supabase.from('sales').select('*').order('created_at', { ascending: false })
      
      // For each sale, fetch the seller name using user_id and sold_by
      const mappedData = await Promise.all((salesData || []).map(async (sale: any) => {
        const sellerName = await fetchSellerName(sale.user_id, sale.sold_by)
        return { ...sale, seller_name: sellerName || sale.sold_by || '', profiles: { name: sellerName || sale.sold_by || '' } }
      }))
      
      setInvoices(mappedData)
    } catch { setInvoices([]) }
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
      alert('✅ ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوتکران!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('❌ هەڵە لە پاشەکەوتکردن')
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
                    <h3 className="text-xl font-bold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>پیشاندانی ڕاستەقینەی پسوڵە</h3>
                  </div>
                  <div className="bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <InvoiceTemplate data={previewInvoiceData} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'invoices' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <input type="text" placeholder="گەڕان..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full mb-6 px-4 py-3 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }} />
              <InvoiceTable filteredInvoices={filteredInvoices} onView={handleViewInvoice} onReprint={handlePrintInvoice} onRefund={handleRefundInvoice} />
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
                          <td className="px-2 py-3 text-gray-900 dark:text-gray-200 font-bold text-center text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            #{sale.invoice_number || sale.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-2 py-3 text-gray-900 dark:text-gray-200 text-center text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            {sale.customers?.name || 'کڕیاری نەناسراو'}
                          </td>
                          <td className="px-2 py-3 text-gray-900 dark:text-gray-200 text-center text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            {sale.seller_name || sale.sold_by || '-'}
                          </td>
                          <td className="px-2 py-3 text-gray-900 dark:text-gray-200 text-center text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            {formatCurrencyKurdish(sale.subtotal || 0)} د.ع
                          </td>
                          <td className="px-2 py-3 text-red-600 dark:text-red-400 text-center text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            -{formatCurrencyKurdish(sale.discount_amount || 0)}
                          </td>
                          <td className="px-2 py-3 text-gray-900 dark:text-gray-200 font-bold text-center text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            {formatCurrencyKurdish(sale.total)} د.ع
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                              sale.payment_method === 'cash' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' :
                              sale.payment_method === 'fib' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                              'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300'
                            }`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              {sale.payment_method === 'cash' ? '💵 کاش' :
                               sale.payment_method === 'fib' ? '💳 ئۆنلاین' :
                               '📝 قەرز'}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              ⏳ چاوەڕوانکراو
                            </span>
                          </td>
                          <td className="px-2 py-3 text-gray-600 dark:text-gray-400 text-center text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            {new Date(sale.date).toLocaleDateString('ku')}
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
                                  onClick={() => { if (confirm('دڵنیایت لە تەواوکردنی ئەم فرۆشتنە؟')) { supabase?.from('sales').update({ status: 'completed' }).eq('id', sale.id).then(() => fetchPendingSales()) } }}
                                  className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="تەواوکردن"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </motion.button>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>تەواو</span>
                              </div>

                              {/* گەڕاندنەوە (Refund) - Orange */}
                              <div className="flex flex-col items-center gap-1">
                                <motion.button
                                  onClick={() => { if (confirm('دڵنیایت لە گەڕاندنەوەی ئەم فرۆشتنە؟')) { supabase?.from('sales').update({ status: 'refunded' }).eq('id', sale.id).then(() => fetchPendingSales()) } }}
                                  className="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="گەڕاندنەوە"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                  </svg>
                                </motion.button>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>گەڕاندن</span>
                              </div>

                              {/* هەڵوەشاندنەوە (Cancel) - Red */}
                              <div className="flex flex-col items-center gap-1">
                                <motion.button
                                  onClick={() => { if (confirm('دڵنیایت لە هەڵوەشاندنەوەی ئەم فرۆشتنە؟')) { supabase?.from('sales').update({ status: 'cancelled' }).eq('id', sale.id).then(() => fetchPendingSales()) } }}
                                  className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="هەڵوەشاندنەوە"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
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
                                هیچ فرۆشتنێکی چاوەڕوانکراو نیە
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

          {/* Invoice Details Modal */}
          <InvoiceModal
            showModal={showInvoiceModal}
            setShowModal={setShowInvoiceModal}
            selectedInvoice={selectedInvoice}
            invoiceDetails={invoiceDetails}
          />
        </motion.div>
      </div>
    </div>
  )
}
