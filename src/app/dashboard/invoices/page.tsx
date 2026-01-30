'use client'

import InvoiceTemplate from '@/components/InvoiceTemplate'
import { formatCurrency, toEnglishDigits } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import { useEffect, useRef, useState } from 'react'
import { FaCog, FaEye, FaFileInvoice, FaImage, FaMapMarkerAlt, FaPhone, FaPrint, FaQrcode, FaSearch, FaStore } from 'react-icons/fa'

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
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'settings' | 'invoices'>('settings')
  const [settings, setSettings] = useState<InvoiceSettings | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)

  // Settings form state
  const [formData, setFormData] = useState({
    shop_name: '',
    shop_phone: '',
    shop_address: '',
    shop_logo: null as File | null,
    thank_you_note: '',
    qr_code_url: '',
    qr_code_file: null as File | null
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
          qr_code_file: null
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
          qr_code_file: null
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
      // First, check if invoice_number column exists
      let hasInvoiceNumberColumn = false
      try {
        const testQuery = await supabase
          .from('sales')
          .select('invoice_number')
          .limit(1)

        hasInvoiceNumberColumn = !testQuery.error
      } catch (columnError) {
        console.log('invoice_number column not available yet, using fallback numbering')
      }

      // First, fetch basic sales data
      let selectFields = `
        id,
        total,
        payment_method,
        date,
        customers!inner(name)
      `

      if (hasInvoiceNumberColumn) {
        selectFields = `
          id,
          invoice_number,
          total,
          payment_method,
          date,
          customers!inner(name)
        `
      }

      const { data, error } = await supabase
        .from('sales')
        .select(selectFields)
        .order(hasInvoiceNumberColumn ? 'invoice_number' : 'date', { ascending: false, nullsFirst: false })

      if (error) {
        console.error('Error fetching invoices:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2),
          stack: error.stack
        })
        // Don't throw error, just return empty array to prevent crashes
        setInvoices([])
        return
      }

      // Transform data and handle invoice numbers gracefully
      const transformedInvoices: Invoice[] = (data || []).map((sale: any, index: number) => ({
        id: sale.id,
        invoice_number: hasInvoiceNumberColumn ? (sale.invoice_number || (1000 + index)) : (1000 + index),
        customer_name: sale.customers?.name || 'نەناسراو',
        total: sale.total,
        payment_method: sale.payment_method,
        date: sale.date,
        items_count: 0 // Will be populated when viewing details
      }))

      setInvoices(transformedInvoices)
    } catch (error) {
      console.error('Error fetching invoices:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        fullError: JSON.stringify(error, null, 2)
      })
      // Set empty invoices array on error to prevent crashes
      setInvoices([])
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
      if (formData.qr_code_file) {
        qrUrl = await handleImageUpload(formData.qr_code_file) || qrUrl
      }

      const settingsData = {
        shop_name: formData.shop_name,
        shop_phone: formData.shop_phone,
        shop_address: formData.shop_address,
        shop_logo: logoUrl,
        thank_you_note: formData.thank_you_note,
        qr_code_url: qrUrl,
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

  const viewInvoiceDetails = async (invoice: Invoice) => {
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    try {
      // First, fetch the basic sale data with customer info
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          customers(name, phone1)
        `)
        .eq('id', invoice.id)
        .single()

      if (saleError) {
        console.error('Sale query error:', saleError)
        throw new Error(`Sale record not found: ${saleError.message}`)
      }

      // Then fetch the sale items
      const { data: saleItemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          id,
          quantity,
          price,
          total,
          unit,
          item_id
        `)
        .eq('sale_id', invoice.id)

      if (itemsError) {
        console.error('Sale items query error:', itemsError)
        // Continue with empty items if this fails
      }

      // Fetch inventory item names for each sale item
      const saleItemsWithNames = await Promise.all(
        (saleItemsData || []).map(async (item: any) => {
          try {
            const { data: inventoryData, error: inventoryError } = await supabase
              .from('inventory')
              .select('item_name')
              .eq('id', item.item_id)
              .single()

            return {
              ...item,
              products: {
                name: inventoryData?.item_name || 'نەناسراو',
                unit: item.unit
              }
            }
          } catch (error) {
            console.error('Error fetching inventory item:', error)
            return {
              ...item,
              products: {
                name: 'نەناسراو',
                unit: item.unit
              }
            }
          }
        })
      )

      setSelectedInvoice(invoice)
      setInvoiceDetails({
        ...saleData,
        sale_items: saleItemsWithNames
      })
      setShowInvoiceModal(true)
    } catch (error) {
      console.error('Error fetching invoice details:', error)
      alert(`هەڵە لە بارکردنی وردەکارییەکانی فاکتور: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const downloadInvoice = async () => {
    if (!invoiceRef.current || !selectedInvoice) return

    try {
      // Wait 800ms for QR image and UniSalar fonts to fully render
      await new Promise(resolve => setTimeout(resolve, 800))

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        backgroundColor: '#ffffff',
        width: invoiceRef.current.offsetWidth,
        height: invoiceRef.current.offsetHeight
      })

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `Invoice_${selectedInvoice.invoice_number}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }, 'image/png', 1.0)
    } catch (error) {
      console.error('Error downloading invoice:', error)
      alert('هەڵە لە داگرتنی وێنەی فاکتور')
    }
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
          <div style="width: 100%; height: 70px; margin: 0 auto 8px;     display: flex; align-items: center; justify-content: center;">
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
          <div style="display: flex; justify-content: center; align-items: center; margin: 12px 0;">
            <img src="${qrCodeUrl}" alt="QR Code" style="width: 55px; height: 55px; border: 2px solid #000; border-radius: 4px;" />
          </div>
        ` : ''}

        <div style="font-size: 7px; color: #adb5bd; margin-top: 6px; border-top: 1px solid #dee2e6; padding-top: 4px; text-align: center;">
          گەشەپێدانی سیستم لە لایەن Click Group<br>
          07701466787
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
                          زانیاری فاکتور
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
                                className="w-16 h-16 object-contain"
                              />
                            </div>
                          )}
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

                        {/* QR Code for Social Media */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            QR کۆد   
                          </label>
                          <div className="relative">
                            <FaQrcode className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setFormData(prev => ({ ...prev, qr_code_file: e.target.files?.[0] || null }))}
                              className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            وێنەی QR کۆد دابنێ   
                          </p>
                          {settings?.qr_code_url && (
                            <div className="mt-2">
                              <img
                                src={settings.qr_code_url}
                                alt="Current QR Code"
                                className="w-16 h-16 object-contain border rounded"
                              />
                            </div>
                          )}
                        </div>

                        {/* Thank You Note */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            دانانی پەیام 
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

                      {/* Invoice Preview Container */}
                      <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/30 max-w-2xl mx-auto">
                        <div className="text-center mb-4">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded" style={{ fontFamily: 'Inter, sans-serif' }}>
                            پێشبینینی فاکتور
                          </span>
                        </div>

                        {/* Invoice Preview */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <InvoiceTemplate
                            data={{
                              invoiceNumber: 2066,
                              customerName: 'نموونەی کڕیار',
                              customerPhone: '07501234567',
                              sellerName: 'کارمەند',
                              date: new Date().toLocaleDateString('ku'),
                              time: new Date().toLocaleTimeString('ku'),
                              paymentMethod: 'cash',
                              items: [
                                { name: 'هەنگوین', unit: 'کیلۆ', quantity: 2, price: 12.50, total: 25.00 },
                                { name: 'سەرکە', unit: 'دانە', quantity: 1, price: 8.00, total: 8.00 }
                              ],
                              subtotal: 33.00,
                              discount: 0,
                              total: 33.00,
                              shopName: formData.shop_name || 'فرۆشگای کوردستان',
                              shopPhone: formData.shop_phone,
                              shopAddress: formData.shop_address,
                              shopLogo: settings?.shop_logo,
                              qrCodeUrl: formData.qr_code_url || settings?.qr_code_url,
                              thankYouNote: formData.thank_you_note || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
                            }}
                          />
                        </div>
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
                            <td colSpan={7} className="px-6 py-12 text-center">
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

      {/* Invoice Details Modal */}
      <AnimatePresence>
        {showInvoiceModal && invoiceDetails && selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowInvoiceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <FaFileInvoice className="text-blue-500 text-2xl" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      وردەکارییەکانی فاکتور #{selectedInvoice.invoice_number}
                    </h3>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {new Date(selectedInvoice.date).toLocaleDateString('ku')} - {invoiceDetails.customers?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaEye className="text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Invoice Preview */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div ref={invoiceRef}>
                    <InvoiceTemplate
                      data={{
                        invoiceNumber: selectedInvoice.invoice_number,
                        customerName: invoiceDetails.customers?.name || 'نەناسراو',
                        customerPhone: invoiceDetails.customers?.phone1,
                        sellerName: invoiceDetails.sold_by,
                        date: new Date(selectedInvoice.date).toLocaleDateString('ku'),
                        time: new Date(selectedInvoice.date).toLocaleTimeString('ku'),
                        paymentMethod: selectedInvoice.payment_method,
                        items: invoiceDetails.sale_items?.map((item: any) => ({
                          name: item.products?.name || 'نەناسراو',
                          unit: item.products?.unit || item.unit,
                          quantity: item.quantity,
                          price: item.price || 0,
                          total: (item.price || 0) * item.quantity
                        })) || [],
                        subtotal: selectedInvoice.total,
                        discount: invoiceDetails.discount_amount || 0,
                        total: selectedInvoice.total,
                        shopName: settings?.shop_name || 'فرۆشگای کوردستان',
                        shopPhone: settings?.shop_phone,
                        shopAddress: settings?.shop_address,
                        shopLogo: settings?.shop_logo,
                        qrCodeUrl: settings?.qr_code_url,
                        thankYouNote: settings?.thank_you_note || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
                      }}
                      isPrint={true}
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Modal Footer */}
              <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-lg p-4 print:hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Total Amount Display */}
                  <div className="text-center sm:text-right">
                    <div className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      کۆی گشتی
                    </div>
                    <div className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>
                      {formatCurrency(selectedInvoice.total)} IQD
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <motion.button
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 print:hidden"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>چاپکردن</span>
                    </motion.button>

                    <motion.button
                      onClick={downloadInvoice}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 print:hidden"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>داگرتن</span>
                    </motion.button>

                    <motion.button
                      onClick={() => setShowInvoiceModal(false)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 print:hidden"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>داخستن</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function generateInvoiceHTML(saleData: any, invoice: Invoice) {
  const shopName = 'فرۆشگای کوردستان' // This should come from settings
  const shopPhone = '' // This should come from settings
  const shopAddress = '' // This should come from settings
  const shopLogo = '' // This should come from settings
  const thankYouNote = 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.' // This should come from settings
  const qrCodeUrl = '' // This should come from settings

  return `
    <!-- 1. Header Section (Visual Brand) -->
    <div style="text-align: center; margin-bottom: 10px;">
      ${shopLogo ? `
        <div style="width: 100%; height: 70px; margin: 0 auto 8px;     display: flex; align-items: center; justify-content: center;">
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
          <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600; text-align: left; direction: ltr;">#${invoice.invoice_number}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; color: #495057;">بەروار/کات:</span>
          <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600; text-align: left; direction: ltr;">${new Date(invoice.date).toLocaleString('ku')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; color: #495057;">کڕیار:</span>
          <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600; text-align: left; direction: ltr;">${saleData.customers?.name || 'نەناسراو'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; color: #495057;">تەلەفۆن:</span>
          <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600; text-align: left; direction: ltr;">${saleData.customers?.phone || ''}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; grid-column: span 2;">
          <span style="font-weight: bold; color: #495057;">شێوازی پارەدان:</span>
          <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600; text-align: left; direction: ltr;">${invoice.payment_method === 'cash' ? 'نەختینە' : invoice.payment_method === 'fib' ? 'ئۆنلاین' : 'قەرز'}</span>
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
        ${saleData.sale_items?.map((item: any) => `
          <tr>
            <td style="padding: 4px 2px; border-bottom: 1px dotted #adb5bd; text-align: right; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">${item.products?.name || 'نەناسراو'}</td>
            <td style="padding: 4px 2px; border-bottom: 1px dotted #adb5bd; text-align: center; min-width: 25px; font-weight: 500;">${item.products?.unit || ''}</td>
            <td style="padding: 4px 2px; border-bottom: 1px dotted #adb5bd; text-align: right; min-width: 25px; font-family: 'JetBrains Mono', monospace; font-weight: bold; direction: ltr;">${item.quantity}</td>
            <td style="padding: 4px 2px; border-bottom: 1px dotted #adb5bd; text-align: right; min-width: 40px; font-family: 'JetBrains Mono', monospace; font-weight: bold; direction: ltr; padding-left: 5px;">${item.price.toFixed(2)}</td>
          </tr>
        `).join('') || ''}
      </tbody>
    </table>

    <div style="text-align: center; margin: 8px 0; font-size: 8px; color: #6c757d; letter-spacing: -1px;">--------------------------</div>

    <!-- 4. Financial Summary (The Totals) -->
    <div style="margin: 10px 0; border-top: 2px solid #000; padding-top: 6px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0; font-size: 10px;">
        <span style="font-weight: bold; color: #495057;">کۆی گشتی:</span>
        <span style="font-family: 'JetBrains Mono', monospace; font-weight: bold; text-align: right; direction: ltr;">${formatCurrency(invoice.total)} IQD</span>
      </div>
    </div>

    <!-- Grand Total Highlight -->
    <div style="color: #000000; padding: 10px 15px; text-align: center; font-size: 15px; font-weight: 900; margin: 12px 0; font-family: 'JetBrains Mono', monospace; border-radius: 6px; letter-spacing: 1px;">
      کۆی گشتی: ${formatCurrency(invoice.total)} IQD
    </div>

    <!-- 5. Footer & Social -->
    <div style="text-align: center; margin-top: 10px;">
      <div style="font-size: 9px; margin: 8px 0; font-style: italic; text-align: center; color: #6c757d;">
        ${thankYouNote}
      </div>

      ${qrCodeUrl ? `
        <div style="display: flex; justify-content: center; align-items: center; margin: 12px 0;">
          <img src="${qrCodeUrl}" alt="QR Code" style="width: 55px; height: 55px; border: 2px solid #000; border-radius: 4px;" />
        </div>
      ` : ''}

      <div style="font-size: 7px; color: #adb5bd; margin-top: 6px; border-top: 1px solid #dee2e6; padding-top: 4px; text-align: center;">
        گەشەپێدانی سیستم لە لایەن Click Group<br>
        07701466787
      </div>
    </div>
  `
}