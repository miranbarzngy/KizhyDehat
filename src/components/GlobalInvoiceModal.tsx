'use client'

import { formatCurrency } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import { useEffect, useRef, useState } from 'react'
import { FaFileInvoice, FaPrint, FaMapMarkerAlt, FaPhone } from 'react-icons/fa'

interface InvoiceSettings {
  id: string
  shop_name: string
  shop_phone: string
  shop_address: string
  shop_logo: string
  thank_you_note: string
  qr_code_url: string
}

interface GlobalInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  invoiceData: any
  invoiceId?: string
  title?: string
}

const loadFont = (): Promise<void> => {
  return new Promise((resolve) => {
    if (document.fonts) {
      document.fonts.ready.then(() => resolve())
    } else {
      setTimeout(resolve, 500)
    }
  })
}

// Kurdish numeral formatter
const toKurdishDigits = (value: any): string => {
  if (value === null || value === undefined) return '٠'
  const str = String(value)
  const kurdishDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return str.replace(/[0-9]/g, (digit) => kurdishDigits[parseInt(digit)])
}

  // Format time to 12-hour format with Kurdish numerals
const formatTimeKurdish = (dateStr: string): string => {
  try {
    const date = new Date(dateStr)
    let hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'د.ن' : 'ب.ن'
    hours = hours % 12
    hours = hours ? hours : 12
    const minutesStr = minutes < 10 ? '0' + minutes : minutes
    return `${toKurdishDigits(hours)}:${toKurdishDigits(minutesStr)} ${ampm}`
  } catch {
    return ''
  }
}

// Get inline style for Kurdish text
const kurdishStyle = { fontFamily: "'Uni Salar', var(--font-uni-salar), sans-serif" }
const kurdishNumberStyle = { fontFamily: "'Uni Salar', var(--font-uni-salar), sans-serif", direction: 'ltr' as const }

// Invoice Template Component - Modern Light Design
export function InvoiceTemplate({ data }: { data: any }) {
  // ROBUST ITEM EXTRACTOR
  const items = data?.sale_items || data?.invoice_items || data?.items || (data?.sales && data.sales.sale_items) || []
  
  const getPaymentStatus = () => {
    switch (data?.paymentMethod) {
      case 'cash': return 'نەختینە'
      case 'fib': return 'ئۆنلاین (FIB)'
      case 'debt': return 'قەرز'
      case 'purchase': return 'کڕین'
      default: return 'نەپارەدراو'
    }
  }

  const formatPrice = (value: number) => `${toKurdishDigits(formatCurrency(value || 0))} د.ع`

  // Item field extractors
  const getItemName = (item: any) => item?.product_name || item?.products?.name || item?.product?.name || item?.name || 'دیارنییە'
  const getItemQty = (item: any) => toKurdishDigits(item?.quantity || item?.qty || item?.amount || 0)
  const getItemPrice = (item: any) => formatPrice(item?.price || item?.unit_price || 0)
  const getItemTotal = (item: any) => formatPrice(item?.total || (item?.price || item?.unit_price || 0) * (item?.quantity || item?.qty || item?.amount || 0))
  const getItemUnit = (item: any) => item?.unit || item?.product_unit || 'دانە'

  return (
    <div className="bg-white" style={{ 
      fontFamily: "'Uni Salar', var(--font-uni-salar), sans-serif", 
      direction: 'rtl', 
      width: '100%', 
      maxWidth: '700px', 
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      {/* Header Section - 3 Columns */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '14px' }}>
          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px', ...kurdishStyle }}>ژمارەی پسوڵە</div>
              <div style={{ fontFamily: "'Uni Salar', var(--font-uni-salar), sans-serif", fontWeight: 'bold', color: '#111827', fontSize: '18px', direction: 'ltr' }}>
                {data?.invoiceNumber && data.invoiceNumber > 0 ? `#${toKurdishDigits(data.invoiceNumber)}` : <span style={{ fontFamily: "'Uni Salar', var(--font-uni-salar), sans-serif", fontSize: '12px' }}>پسوڵەی کاتی</span>}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px', ...kurdishStyle }}>کڕیار</div>
              <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '14px', wordBreak: 'break-word', ...kurdishStyle }}>{data?.customerName || 'نەناسراو'}</div>
            </div>
          </div>
          
          {/* Center Column - Shop */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            {data?.shopLogo && (
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #e5e7eb' }}>
                <img src={data.shopLogo} alt={data.shopName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', textAlign: 'center', ...kurdishStyle }}>{data?.shopName || 'فرۆشگا'}</h1>
            {data?.shopAddress && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6b7280', ...kurdishStyle }}>
                <FaMapMarkerAlt style={{ color: '#9ca3af' }} /><span>{data.shopAddress}</span>
              </div>
            )}
            {data?.shopPhone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6b7280', ...kurdishNumberStyle }}>
                <FaPhone style={{ color: '#9ca3af' }} /><span>{toKurdishDigits(data.shopPhone)}</span>
              </div>
            )}
          </div>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px', ...kurdishStyle }}>بەروار</div>
              <div style={{ fontFamily: "'Uni Salar', var(--font-uni-salar), sans-serif", color: '#111827', fontSize: '14px', direction: 'ltr' }}>{toKurdishDigits(data?.date) || '-'}</div>
              {data?.time && (
                <div style={{ fontFamily: "'Uni Salar', var(--font-uni-salar), sans-serif", color: '#6b7280', fontSize: '12px', direction: 'ltr', marginTop: '2px' }}>{data.time}</div>
              )}
            </div>
            {data?.customerPhone && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px', ...kurdishStyle }}>تەلەفۆن</div>
                <div style={{ fontFamily: "'Uni Salar', var(--font-uni-salar), sans-serif", color: '#111827', fontSize: '14px', direction: 'ltr' }}>{toKurdishDigits(data.customerPhone)}</div>
              </div>
            )}
            {data?.sellerName && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px', ...kurdishStyle }}>فرۆشیار</div>
                <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '14px', ...kurdishStyle }}>{data.sellerName}</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Payment Method */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '2px dashed #d1d5db', textAlign: 'center' }}>
          <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px', ...kurdishStyle }}>شێوازی پارەدان</div>
          <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '16px', ...kurdishStyle }}>{getPaymentStatus()}</div>
        </div>
      </div>

      {/* Dashed Divider */}
      <div style={{ textAlign: 'center', margin: '16px 0', color: '#d1d5db', fontSize: '20px', letterSpacing: '-2px' }}>------------------------------</div>

      {/* Items Table - Light Design */}
      <div style={{ marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', fontSize: '12px', backgroundColor: '#ffffff', ...kurdishStyle }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '600', color: '#374151', ...kurdishStyle }}>ناوی کاڵا</th>
              <th style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', fontWeight: '600', color: '#374151', ...kurdishStyle }}>یەکە</th>
              <th style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', fontWeight: '600', color: '#374151', ...kurdishStyle }}>بڕ</th>
              <th style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', fontWeight: '600', color: '#374151', ...kurdishStyle }}>نرخ</th>
            </tr>
          </thead>
          <tbody>
            {items && items.length > 0 ? items.map((item: any, index: number) => (
              <tr key={`inv-item-${index}`} style={{ background: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', color: '#111827', ...kurdishStyle }}>{getItemName(item)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', color: '#374151', ...kurdishStyle }}>{getItemUnit(item)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', ...kurdishNumberStyle, fontWeight: '600', color: '#111827' }}>{getItemQty(item)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', ...kurdishNumberStyle, fontWeight: '600', color: '#111827' }}>{getItemTotal(item)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} style={{ border: '1px solid #e5e7eb', padding: '16px', textAlign: 'center', color: '#6b7280', ...kurdishStyle }}>
                  داتا بوونی نییە
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dashed Divider */}
      <div style={{ textAlign: 'center', margin: '16px 0', color: '#d1d5db', fontSize: '20px', letterSpacing: '-2px' }}>------------------------------</div>

      {/* Footer - Modern Design */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#374151', ...kurdishStyle }}><span>کۆی نرخ:</span><span style={{ ...kurdishNumberStyle }}>{formatPrice(data?.subtotal || 0)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#dc2626', ...kurdishStyle }}><span>داشکاندن:</span><span style={{ ...kurdishNumberStyle, fontWeight: '600' }}>-{formatPrice(data?.discount || 0)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#111827', fontSize: '16px', ...kurdishStyle }}><span>کۆی گشتی:</span><span style={{ ...kurdishNumberStyle }}>{formatPrice(data?.total || 0)}</span></div>
        </div>
        
        {/* Grand Total Highlight - Modern */}
        <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', ...kurdishStyle }}>کۆی گشتی: {formatPrice(data?.total || 0)}</div>
        </div>
        
        {data?.qrCodeUrl && (
          <div style={{ textAlign: 'center' }}>
            <img src={data.qrCodeUrl} alt="QR" style={{ width: '70px', height: '70px' }} />
          </div>
        )}
        
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', fontStyle: 'italic', borderTop: '1px solid #e5e7eb', paddingTop: '12px', ...kurdishStyle }}>
          {data?.thankYouNote || 'سوپاس بۆ کڕینەکەتان!'}
        </div>
        <div style={{ textAlign: 'center', fontSize: '9px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '8px', ...kurdishStyle }}>
          گەشەپێدانی سیستم لە لایەن Click Group<br />07701466787
        </div>
      </div>
    </div>
  )
}

export default function GlobalInvoiceModal({ isOpen, onClose, invoiceData, invoiceId, title = 'وردەکارییەکانی فاکتور' }: GlobalInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null)
  const [captureData, setCaptureData] = useState<any>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      if (!supabase) return
      try {
        const { data, error } = await supabase.from('invoice_settings').select('*').single()
        if (error && error.code !== 'PGRST116') console.error('Error fetching invoice settings:', error)
        setInvoiceSettings(data || null)
      } catch (error) { console.error('Error fetching invoice settings:', error) }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    if (isOpen && invoiceData) {
      const data = {
        ...invoiceData,
        shopName: invoiceData.shopName || invoiceSettings?.shop_name || 'فرۆشگای کوردستان',
        shopPhone: invoiceData.shopPhone || invoiceSettings?.shop_phone || '',
        shopAddress: invoiceData.shopAddress || invoiceSettings?.shop_address || '',
        shopLogo: invoiceData.shopLogo || invoiceSettings?.shop_logo || '',
        qrCodeUrl: invoiceData.qrCodeUrl || invoiceSettings?.qr_code_url || '',
        thankYouNote: invoiceData.thankYouNote || invoiceSettings?.thank_you_note || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
      }
      setCaptureData(data)
    }
  }, [isOpen, invoiceData, invoiceSettings])

  const handlePrint = () => { window.print() }

  const handleDownload = async () => {
    if (!captureData || !captureRef.current) return
    try {
      await loadFont()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const captureElement = captureRef.current
      const originalDisplay = captureElement.style.display
      captureElement.style.display = 'block'
      
      const canvas = await html2canvas(captureElement, { 
        scale: 3, 
        useCORS: true, 
        logging: false, 
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('invoice-capture-area')
          if (el) {
            el.style.display = 'block'
            el.style.backgroundColor = 'white'
          }
        }
      })
      
      captureElement.style.display = originalDisplay
      
      const link = document.createElement('a')
      link.download = `Invoice_${captureData.invoiceNumber || invoiceId || 'temp'}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
    } catch (error) { 
      console.error('Error downloading invoice:', error)
      alert('هەڵە لە داگرتنی وێنەی فاکتور') 
    }
  }

  if (!isOpen || !invoiceData) return null

  const modalKey = `invoice-modal-${invoiceId || 'default'}-${Date.now()}`

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div key={modalKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <FaFileInvoice className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>{title}</h3>
                  {invoiceData.invoiceNumber > 0 && <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>#{invoiceData.invoiceNumber}</p>}
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Invoice Preview */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6" style={{ maxHeight: 'calc(95vh - 180px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <div className="invoice-preview-wrapper" style={{ width: '100%', maxWidth: '700px', backgroundColor: 'white' }}>
                <style jsx>{`
                  .invoice-preview-wrapper { zoom: 0.35; } 
                  @media (min-width: 480px) { .invoice-preview-wrapper { zoom: 0.4; } } 
                  @media (min-width: 640px) { .invoice-preview-wrapper { zoom: 0.5; } } 
                  @media (min-width: 768px) { .invoice-preview-wrapper { zoom: 0.6; } } 
                  @media (min-width: 1024px) { .invoice-preview-wrapper { zoom: 0.7; } } 
                  @media print { .invoice-preview-wrapper { zoom: 1 !important; } }
                `}</style>
                <div ref={invoiceRef}>
                  <InvoiceTemplate data={captureData || invoiceData} />
                </div>
              </div>
            </div>
            
            {/* Footer Buttons */}
            <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 md:p-6 print:hidden">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-right order-2 sm:order-1">
                  <div className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی گشتی</div>
                  <div className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>{formatCurrency(invoiceData.total)} د.ع</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
                  <motion.button onClick={handlePrint} className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    <FaPrint /><span>چاپکردن</span>
                  </motion.button>
                  <motion.button onClick={handleDownload} disabled={!captureData} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span>دابەزاندن</span>
                  </motion.button>
                  <motion.button onClick={onClose} className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-all duration-300" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    <span>داخستن</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Hidden Capture Area */}
      <div ref={captureRef} id="invoice-capture-area" style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -9999, display: 'none', backgroundColor: 'white' }}>
        {captureData && (
          <div style={{ fontFamily: "'Uni Salar', 'var(--font-uni-salar)', sans-serif", direction: 'rtl', width: '800px', minHeight: '1000px', backgroundColor: 'white', padding: '40px', boxSizing: 'border-box', lineHeight: '1.6', fontSize: '18px' }}>
            <InvoiceTemplate data={captureData} />
          </div>
        )}
      </div>
    </AnimatePresence>
  )
}

export function buildInvoiceData(saleData: any, invoice: { id: string; invoice_number?: number; total: number; date: string; payment_method?: string }, settings?: any): any {
  const items = (saleData?.sale_items || []).map((item: any) => ({
    name: item?.products?.name || item?.product_name || item?.name || 'کاڵای سڕاوە',
    unit: item?.products?.unit || item?.product_unit || item?.unit || 'دانە',
    quantity: item?.quantity || item?.qty || 0,
    price: item?.price || item?.product_price || 0,
    total: item?.total || (item?.price || item?.product_price || 0) * (item?.quantity || item?.qty || 0)
  }))
  const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0) + (saleData?.discount_amount || 0)
  // Format time in 12-hour format with Kurdish numerals
  const formattedTime = formatTimeKurdish(invoice.date || new Date().toISOString())
  return {
    invoiceNumber: invoice.invoice_number || 0,
    customerName: saleData?.customers?.name || saleData?.customer_name || 'نەناسراو',
    customerPhone: saleData?.customers?.phone1 || '',
    sellerName: saleData?.sold_by || saleData?.sellerName || 'فرۆشیار',
    date: new Date(invoice.date).toLocaleDateString('ku'),
    time: formattedTime,
    paymentMethod: invoice.payment_method || saleData?.payment_method || 'cash',
    items,
    subtotal,
    discount: saleData?.discount_amount || 0,
    total: invoice.total,
    shopName: settings?.shop_name || 'فرۆشگای کوردستان',
    shopPhone: settings?.shop_phone || '',
    shopAddress: settings?.shop_address || '',
    shopLogo: settings?.shop_logo || '',
    qrCodeUrl: settings?.qr_code_url || '',
    thankYouNote: settings?.thank_you_note || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
  }
}
