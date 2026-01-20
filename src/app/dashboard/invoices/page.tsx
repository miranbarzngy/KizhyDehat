'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency, toEnglishDigits } from '@/lib/numberUtils'
import { FaSearch, FaEye, FaPrint, FaCog, FaStore, FaPhone, FaMapMarkerAlt, FaImage, FaQrcode, FaFileInvoice } from 'react-icons/fa'

interface InvoiceSettings {
  id: string
  shop_name: string
  shop_phone: string
  shop_address: string
  shop_logo: string
  thank_you_note: string
  qr_code_url: string
  starting_invoice_number: number
  current_invoice_number: number
}

interface Invoice {
  id: string
  invoice_number: number
  customer_name: string
  total: number
  payment_method: string
  date: string
  items_count: number
}

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'invoices'>('settings')
  const [settings, setSettings] = useState<InvoiceSettings | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Settings form state
  const [formData, setFormData] = useState({
    shop_name: '',
    shop_phone: '',
    shop_address: '',
    shop_logo: null as File | null,
    thank_you_note: '',
    qr_code_url: '',
    starting_invoice_number: 1000
  })

  useEffect(() => {
    fetchSettings()
    fetchInvoices()
  }, [])

  const fetchSettings = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setSettings(data)
        setFormData({
          shop_name: data.shop_name,
          shop_phone: data.shop_phone || '',
          shop_address: data.shop_address || '',
          shop_logo: null,
          thank_you_note: data.thank_you_note,
          qr_code_url: data.qr_code_url || '',
          starting_invoice_number: data.starting_invoice_number
        })
      } else {
        // Create default settings
        const defaultSettings = {
          shop_name: 'فرۆشگای کوردستان',
          shop_phone: '',
          shop_address: '',
          shop_logo: null,
          thank_you_note: 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.',
          qr_code_url: '',
          starting_invoice_number: 1000
        }
        setFormData(defaultSettings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchInvoices = async () => {
    if (!supabase) return

    try {
      // Get sales with customer info and item counts
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          total,
          payment_method,
          date,
          customers!inner(name),
          sale_items(count)
        `)
        .order('date', { ascending: false })

      if (error) throw error

      // Transform data and add invoice numbers
      const transformedInvoices: Invoice[] = (data || []).map((sale: any, index: number) => ({
        id: sale.id,
        invoice_number: 1000 + index, // Temporary numbering, will be replaced with proper invoice numbers
        customer_name: sale.customers?.name || 'نەناسراو',
        total: sale.total,
        payment_method: sale.payment_method,
        date: sale.date,
        items_count: sale.sale_items?.length || 0
      }))

      setInvoices(transformedInvoices)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
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

  const saveSettings = async () => {
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    setSaving(true)
    try {
      let logoUrl = settings?.shop_logo || ''
      let qrUrl = settings?.qr_code_url || ''

      // Upload new logo if provided
      if (formData.shop_logo) {
        logoUrl = await handleImageUpload(formData.shop_logo) || logoUrl
      }

      // Upload new QR code if provided
      if (formData.qr_code_url && formData.qr_code_url !== settings?.qr_code_url) {
        // For QR code, we'll assume it's already a URL or handle file upload
        qrUrl = formData.qr_code_url
      }

      const settingsData = {
        shop_name: formData.shop_name,
        shop_phone: formData.shop_phone,
        shop_address: formData.shop_address,
        shop_logo: logoUrl,
        thank_you_note: formData.thank_you_note,
        qr_code_url: qrUrl,
        starting_invoice_number: formData.starting_invoice_number,
        current_invoice_number: Math.max(formData.starting_invoice_number, settings?.current_invoice_number || 1000),
        updated_at: new Date().toISOString()
      }

      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from('invoice_settings')
          .update(settingsData)
          .eq('id', settings.id)

        if (error) throw error
      } else {
        // Create new settings
        const { error } = await supabase
          .from('invoice_settings')
          .insert(settingsData)

        if (error) throw error
      }

      await fetchSettings()
      alert('ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کران!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('هەڵە لە پاشەکەوتکردنی ڕێکخستنەکان')
    } finally {
      setSaving(false)
    }
  }

  const reprintInvoice = (invoice: Invoice) => {
    // TODO: Implement invoice reprinting
    alert(`دووبارە چاپکردنی فاکتور ${invoice.invoice_number}`)
  }

  const viewInvoiceDetails = (invoice: Invoice) => {
    // TODO: Implement invoice details view
    alert(`پیشاندانی وردەکارییەکانی فاکتور ${invoice.invoice_number}`)
  }

  const generateReceiptPreview = () => {
    // Use current form data for real-time preview
    const shopName = formData.shop_name || 'فرۆشگای کوردستان'
    const shopPhone = formData.shop_phone || ''
    const shopAddress = formData.shop_address || ''
    const shopLogo = settings?.shop_logo || ''
    const thankYouNote = formData.thank_you_note || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
    const qrCodeUrl = formData.qr_code_url || ''

    // Mock data for preview
    const mockItems = [
      { name: 'هەنگوین', unit: 'کیلۆ', quantity: 2, price: 12.50 },
      { name: 'سەرکە', unit: 'دانە', quantity: 1, price: 8.00 }
    ]
    const mockTotal = 32.50
    const mockInvoiceNumber = 2066
    const mockCustomerName = 'نموونەی کڕیار'
    const mockCustomerPhone = '07501234567'

    return `
      <!-- 1. Header Section (Visual Brand) -->
      <div style="text-align: center; margin-bottom: 10px;">
        ${shopLogo ? `
          <div style="width: 70px; height: 70px; margin: 0 auto 8px; border-radius: 6px; overflow: hidden; background: #f8f9fa; border: 2px solid #e9ecef; display: flex; align-items: center; justify-content: center;">
            <img src="${shopLogo}" alt="${shopName}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
        ` : ''}
        <div style="font-size: 15px; font-weight: bold; margin: 6px 0 4px; text-transform: uppercase; letter-spacing: 1px;">${shopName}</div>
        ${shopPhone ? `<div style="font-size: 9px; margin: 3px 0; color: #495057; display: flex; align-items: center; justify-content: center; gap: 4px;">📞 ${shopPhone}</div>` : ''}
        ${shopAddress ? `<div style="font-size: 9px; margin: 3px 0; color: #495057; display: flex; align-items: center; justify-content: center; gap: 4px;">📍 ${shopAddress}</div>` : ''}
      </div>

      <div style="text-align: center; margin: 8px 0; font-size: 8px; color: #6c757d; letter-spacing: -1px;">--------------------------</div>

      <!-- 2. Invoice Meta Details -->
      <div style="margin: 8px 0; font-size: 9px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 8px; margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: #495057;">ژمارەی فاکتور:</span>
            <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600; text-align: left; direction: ltr;">#${mockInvoiceNumber}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: #495057;">بەروار/کات:</span>
            <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600; text-align: left; direction: ltr;">${new Date().toLocaleString('ku')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: #495057;">کڕیار:</span>
            <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600; text-align: left; direction: ltr;">${mockCustomerName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: #495057;">تەلەفۆن:</span>
            <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600; text-align: left; direction: ltr;">${mockCustomerPhone}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; grid-column: span 2;">
            <span style="font-weight: bold; color: #495057;">شێوازی پارەدان:</span>
            <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600; text-align: left; direction: ltr;">نەختینە</span>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin: 8px 0; font-size: 8px; color: #6c757d; letter-spacing: -1px;">--------------------------</div>

      <!-- 3. Itemized List (The Grid) -->
      <table style="margin: 10px 0; border-collapse: collapse; width: 100%; font-size: 9px;">
        <thead>
          <tr>
            <th style="border-bottom: 2px solid #000; padding: 4px 2px; text-align: right; font-weight: bold; font-size: 8px; background: #f8f9fa;">ناوی کاڵا</th>
            <th style="border-bottom: 2px solid #000; padding: 4px 2px; text-align: center; font-weight: bold; font-size: 8px; background: #f8f9fa;">یەکە</th>
            <th style="border-bottom: 2px solid #000; padding: 4px 2px; text-align: right; font-weight: bold; font-size: 8px; background: #f8f9fa;">بڕ</th>
            <th style="border-bottom: 2px solid #000; padding: 4px 2px; text-align: right; font-weight: bold; font-size: 8px; background: #f8f9fa;">نرخ</th>
          </tr>
        </thead>
        <tbody>
          ${mockItems.map(item => `
            <tr>
              <td style="padding: 4px 2px; border-bottom: 1px dotted #adb5bd; text-align: right; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">${item.name}</td>
              <td style="padding: 4px 2px; border-bottom: 1px dotted #adb5bd; text-align: center; min-width: 25px; font-weight: 500;">${item.unit}</td>
              <td style="padding: 4px 2px; border-bottom: 1px dotted #adb5bd; text-align: right; min-width: 25px; font-family: 'JetBrains Mono', monospace; font-weight: bold; direction: ltr;">${item.quantity}</td>
              <td style="padding: 4px 2px; border-bottom: 1px dotted #adb5bd; text-align: right; min-width: 40px; font-family: 'JetBrains Mono', monospace; font-weight: bold; direction: ltr; padding-left: 5px;">${item.price.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="text-align: center; margin: 8px 0; font-size: 8px; color: #6c757d; letter-spacing: -1px;">--------------------------</div>

      <!-- 4. Financial Summary (The Totals) -->
      <div style="margin: 10px 0; border-top: 2px solid #000; padding-top: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0; font-size: 10px;">
          <span style="font-weight: bold; color: #495057;">کۆی بە باج:</span>
          <span style="font-family: 'JetBrains Mono', monospace; font-weight: bold; text-align: right; direction: ltr;">${mockTotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0; font-size: 10px;">
          <span style="font-weight: bold; color: #495057;">کۆی گشتی:</span>
          <span style="font-family: 'JetBrains Mono', monospace; font-weight: bold; text-align: right; direction: ltr;">${mockTotal.toFixed(2)}</span>
        </div>
      </div>

      <!-- Grand Total Highlight -->
      <div style="background: #000; color: #fff; padding: 10px 15px; text-align: center; font-size: 15px; font-weight: 900; margin: 12px 0; font-family: 'JetBrains Mono', monospace; border-radius: 6px; letter-spacing: 1px;">
        کۆی گشتی: ${mockTotal.toFixed(2)} IQD
      </div>

      <!-- 5. Footer & Social -->
      <div style="text-align: center; margin-top: 10px;">
        <div style="font-size: 9px; margin: 8px 0; font-style: italic; text-align: center; color: #6c757d;">
          ${thankYouNote}
        </div>

        ${qrCodeUrl ? `
          <div style="text-align: center; margin: 10px 0;">
            <img src="${qrCodeUrl}" alt="QR Code" style="width: 55px; height: 55px; border: 2px solid #000; border-radius: 4px;" />
          </div>
        ` : ''}

        <div style="font-size: 7px; color: #adb5bd; margin-top: 6px; border-top: 1px solid #dee2e6; padding-top: 4px;">
          سیستم بەرهەم هێنراوە لە لایەن Click Group
        </div>
      </div>
    `
  }

  const filteredInvoices = invoices.filter(invoice => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      invoice.customer_name.toLowerCase().includes(searchLower) ||
      invoice.invoice_number.toString().includes(searchTerm) ||
      invoice.payment_method.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="text-center">چاوەڕوانبە...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              فاکتورەکان و ڕێکخستنەکان
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FaFileInvoice className="text-blue-500" />
              <span>{filteredInvoices.length} فاکتور</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-white/60 backdrop-blur-xl rounded-2xl p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'settings'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <FaCog className="inline ml-2" />
              ڕێکخستنەکان
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'invoices'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <FaFileInvoice className="inline ml-2" />
              فاکتورەکان
            </button>
          </div>

          {/* Settings Tab */}
          <AnimatePresence mode="wait">
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Side-by-Side Layout: Settings Form + Live Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Side: Settings Form */}
                  <div className="space-y-6">
                    {/* Invoice Branding Section */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                      <div className="flex items-center mb-6">
                        <FaStore className="text-blue-500 text-2xl ml-3" />
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          براندی فاکتور
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        {/* Shop Name */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            ناوی فرۆشگا
                          </label>
                          <div className="relative">
                            <FaStore className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={formData.shop_name}
                              onChange={(e) => setFormData(prev => ({ ...prev, shop_name: e.target.value }))}
                              className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              style={{ fontFamily: 'var(--font-uni-salar)' }}
                              placeholder="ناوی فرۆشگاکەت"
                            />
                          </div>
                        </div>

                        {/* Shop Phone */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            ژمارەی تەلەفۆن
                          </label>
                          <div className="relative">
                            <FaPhone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={toEnglishDigits(formData.shop_phone)}
                              onChange={(e) => setFormData(prev => ({ ...prev, shop_phone: toEnglishDigits(e.target.value.replace(/\D/g, '')) }))}
                              className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
                              style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                              placeholder="0750XXXXXXX"
                            />
                          </div>
                        </div>

                        {/* Shop Address */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            ناونیشان
                          </label>
                          <div className="relative">
                            <FaMapMarkerAlt className="absolute right-3 top-3 text-gray-400" />
                            <textarea
                              value={formData.shop_address}
                              onChange={(e) => setFormData(prev => ({ ...prev, shop_address: e.target.value }))}
                              className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                              style={{ fontFamily: 'var(--font-uni-salar)' }}
                              placeholder="ناونیشانی فرۆشگاکەت"
                              rows={3}
                            />
                          </div>
                        </div>

                        {/* Shop Logo */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            لۆگۆی فرۆشگا
                          </label>
                          <div className="relative">
                            <FaImage className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setFormData(prev => ({ ...prev, shop_logo: e.target.files?.[0] || null }))}
                              className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                          {settings?.shop_logo && (
                            <div className="mt-2">
                              <img
                                src={settings.shop_logo}
                                alt="Current logo"
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                            </div>
                          )}
                        </div>

                        {/* QR Code URL */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            QR کۆد (بۆ واتسئەپ یان ناونیشان)
                          </label>
                          <div className="relative">
                            <FaQrcode className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="url"
                              value={formData.qr_code_url}
                              onChange={(e) => setFormData(prev => ({ ...prev, qr_code_url: e.target.value }))}
                              className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              placeholder="https://wa.me/964XXXXXXXXX"
                            />
                          </div>
                        </div>

                        {/* Thank You Note */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            پەیامی سوپاس
                          </label>
                          <textarea
                            value={formData.thank_you_note}
                            onChange={(e) => setFormData(prev => ({ ...prev, thank_you_note: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                            style={{ fontFamily: 'var(--font-uni-salar)' }}
                            placeholder="پەیامی سوپاس بۆ کڕیار"
                            rows={2}
                          />
                        </div>

                        {/* Starting Invoice Number */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            ژمارەی دەستپێکردنی فاکتور
                          </label>
                          <input
                            type="number"
                            value={formData.starting_invoice_number}
                            onChange={(e) => setFormData(prev => ({ ...prev, starting_invoice_number: parseInt(e.target.value) || 1000 }))}
                            className="w-full px-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
                            style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                            min="1"
                          />
                        </div>
                      </div>

                      {/* Save Button */}
                      <motion.button
                        onClick={saveSettings}
                        disabled={saving}
                        className="w-full mt-8 py-4 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: 'var(--font-uni-salar)' }}
                        whileHover={{ scale: saving ? 1 : 1.02, y: saving ? 0 : -2 }}
                        whileTap={{ scale: saving ? 1 : 0.98 }}
                        animate={{
                          backgroundPosition: saving ? '0% 50%' : ['0% 50%', '100% 50%', '0% 50%']
                        }}
                        transition={{
                          backgroundPosition: { duration: 3, repeat: saving ? 0 : Infinity, ease: "linear" }
                        }}
                      >
                        <span className="flex items-center justify-center space-x-2">
                          <span>{saving ? 'پاشەکەوتکردن...' : 'پاشەکەوتکردنی ڕێکخستنەکان'}</span>
                          {saving && (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Right Side: Live Receipt Preview */}
                  <div className="space-y-6">
                    <div className="sticky top-6">
                      <div className="flex items-center mb-6">
                        <FaFileInvoice className="text-green-500 text-2xl ml-3" />
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          پێشبینینی فاکتور
                        </h2>
                      </div>

                      {/* Receipt Preview Container */}
                      <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/30 max-w-sm mx-auto">
                        <div className="text-center mb-4">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded" style={{ fontFamily: 'Inter, sans-serif' }}>
                            80mm Thermal Receipt Preview
                          </span>
                        </div>

                        {/* Receipt Preview */}
                        <div
                          className="bg-white border border-gray-200 rounded-lg p-3 text-xs"
                          style={{
                            fontFamily: 'UniSalar_F_007, sans-serif',
                            fontWeight: 'bold',
                            letterSpacing: '0.5px',
                            lineHeight: '1.4',
                            direction: 'rtl',
                            width: '300px',
                            margin: '0 auto'
                          }}
                          dangerouslySetInnerHTML={{
                            __html: generateReceiptPreview()
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <motion.div
                key="invoices"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="گەڕان بە ژمارەی فاکتور، کڕیار، یان شێوازی پارەدان..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    />
                  </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200/50 bg-gray-50/50">
                          <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            ژمارەی فاکتور
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            کڕیار
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            بەروار
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            کۆی گشتی
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            شێوازی پارەدان
                          </th>
                          <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            کردارەکان
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.map((invoice, index) => (
                          <motion.tr
                            key={invoice.id}
                            className="border-b border-gray-100/50 hover:bg-white/30 transition-colors duration-200"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <td className="px-6 py-4 text-gray-800 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                              #{invoice.invoice_number}
                            </td>
                            <td className="px-6 py-4 text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              {invoice.customer_name}
                            </td>
                            <td className="px-6 py-4 text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {new Date(invoice.date).toLocaleDateString('ku')}
                            </td>
                            <td className="px-6 py-4 text-gray-800 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatCurrency(invoice.total)} IQD
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                invoice.payment_method === 'cash' ? 'bg-green-100 text-green-800' :
                                invoice.payment_method === 'fib' ? 'bg-blue-100 text-blue-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {invoice.payment_method === 'cash' ? '💵 نەختینە' :
                                 invoice.payment_method === 'fib' ? '💳 ئۆنلاین' :
                                 '📝 قەرز'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <motion.button
                                  onClick={() => viewInvoiceDetails(invoice)}
                                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="بینینی وردەکارییەکان"
                                >
                                  <FaEye />
                                </motion.button>
                                <motion.button
                                  onClick={() => reprintInvoice(invoice)}
                                  className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="دووبارە چاپکردن"
                                >
                                  <FaPrint />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                        {filteredInvoices.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center">
                              <div className="text-gray-400">
                                <FaFileInvoice className="text-4xl mx-auto mb-4" />
                                <p className="text-lg" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                  {searchTerm ? 'هیچ فاکتورێک نەدۆزرایەوە' : 'هیچ فاکتورێک نیە'}
                                </p>
                                {searchTerm && (
                                  <p className="text-sm mt-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                    گەڕانەکەت بگۆڕە یان پاکبکە
                                  </p>
                                )}
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
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
