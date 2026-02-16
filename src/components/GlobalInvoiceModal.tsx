'use client'

import { formatCurrency } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import { useEffect, useRef, useState } from 'react'
import { FaFileInvoice, FaMapMarkerAlt, FaPhone, FaPrint } from 'react-icons/fa'

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

// 68mm Thermal Printer Invoice Template - Optimized for narrow paper
export function InvoiceTemplate68mm({ data }: { data: any }) {
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

  const formatPrice = (value: number) => `${toKurdishDigits(formatCurrency(value || 0))}`

  // Item field extractors - Use item_name from sale_items directly, fallback to 'کاڵای بێ ناو'
  const getItemName = (item: any) => item?.item_name || item?.product_name || item?.products?.name || item?.product?.name || item?.name || 'کاڵای بێ ناو'
  const getItemQty = (item: any) => toKurdishDigits(item?.quantity || item?.qty || item?.amount || 0)
  const getItemPrice = (item: any) => formatPrice(item?.price || item?.unit_price || 0)
  const getItemTotal = (item: any) => formatPrice(item?.total || (item?.price || item?.unit_price || 0) * (item?.quantity || item?.qty || item?.amount || 0))
  const getItemUnit = (item: any) => item?.unit || item?.product_unit || 'دانە'

  return (
    <div className="invoice-68mm" style={{ 
      fontFamily: "'Uni Salar', var(--font-uni-salar), sans-serif", 
      direction: 'rtl', 
      width: '190mm',  // ~72mm at scale
      minWidth: '190mm',
      maxWidth: '190mm',
      padding: '2mm',
      margin: '0',
      boxSizing: 'border-box',
      fontSize: '9px',
      lineHeight: '1.3',
      backgroundColor: '#ffffff',
      color: '#000000'
    }}>
      {/* Shop Header - Centered */}
      <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
        {data?.shopLogo && (
          <div style={{ width: '30mm', height: '30mm', margin: '0 auto 2mm', borderRadius: '50%', overflow: 'hidden', border: '1px solid #ccc' }}>
            <img src={data.shopLogo} alt={data.shopName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ fontSize: '11px', fontWeight: 'bold', ...kurdishStyle }}>{data?.shopName || 'فرۆشگا'}</div>
        {data?.shopAddress && (
          <div style={{ fontSize: '7px', color: '#666', marginTop: '1mm', ...kurdishStyle }}>
            <FaMapMarkerAlt style={{ fontSize: '6px', marginLeft: '1mm' }} />{data.shopAddress}
          </div>
        )}
        {data?.shopPhone && (
          <div style={{ fontSize: '7px', color: '#666', ...kurdishNumberStyle }}>
            <FaPhone style={{ fontSize: '6px', marginLeft: '1mm' }} />{toKurdishDigits(data.shopPhone)}
          </div>
        )}
      </div>

      {/* Invoice Info */}
      <div style={{ textAlign: 'center', borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '2mm 0', marginBottom: '2mm' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', ...kurdishStyle }}>
          <span><span style={{ ...kurdishNumberStyle }}>{toKurdishDigits(data?.date) || '-'}</span> - <span style={{ ...kurdishNumberStyle }}>{data?.time}</span></span>
          <span style={{ fontWeight: 'bold', fontSize: '10px' }}>
            {data?.invoiceNumber && data.invoiceNumber > 0 ? `#${toKurdishDigits(data.invoiceNumber)}` : 'پسوڵەی کاتی'}
          </span>
        </div>
        <div style={{ fontSize: '8px', marginTop: '1mm', ...kurdishStyle }}>
          <span>{data?.customerName || 'نەناسراو'}</span>
          {data?.customerPhone && <span style={{ ...kurdishNumberStyle, marginRight: '2mm' }}>- {toKurdishDigits(data.customerPhone)}</span>}
        </div>
        <div style={{ fontSize: '8px', ...kurdishStyle }}>
          {data.profiles?.name || data.seller_name || data.sold_by || data.sellerName || 'کارمەند'} - {getPaymentStatus()}
        </div>
      </div>

      {/* Items Header */}
      <div style={{ borderBottom: '1px solid #000', paddingBottom: '1mm', marginBottom: '1mm', fontSize: '7px', fontWeight: 'bold', display: 'flex', ...kurdishStyle }}>
        <div style={{ flex: '3', textAlign: 'right' }}>کاڵا</div>
        <div style={{ flex: '1', textAlign: 'center' }}>بڕ</div>
        <div style={{ flex: '1.5', textAlign: 'left', ...kurdishNumberStyle }}>نرخ</div>
      </div>

      {/* Items List */}
      <div style={{ marginBottom: '2mm' }}>
        {items && items.length > 0 ? items.map((item: any, index: number) => (
          <div key={`inv-item-${index}`} style={{ display: 'flex', fontSize: '8px', padding: '0.5mm 0', alignItems: 'flex-start', ...kurdishStyle }}>
            <div style={{ flex: '3', textAlign: 'right', wordBreak: 'break-word' }}>{getItemName(item)}</div>
            <div style={{ flex: '1', textAlign: 'center', ...kurdishNumberStyle }}>{getItemQty(item)} {getItemUnit(item)}</div>
            <div style={{ flex: '1.5', textAlign: 'left', ...kurdishNumberStyle, fontWeight: '600' }}>{getItemTotal(item)}</div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', fontSize: '8px', color: '#666', ...kurdishStyle }}>داتا بوونی نییە</div>
        )}
      </div>

      {/* Totals */}
      <div style={{ borderTop: '1px dashed #999', paddingTop: '2mm', marginTop: '1mm' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: '1mm', ...kurdishStyle }}>
          <span>کۆی نرخ:</span>
          <span style={{ ...kurdishNumberStyle }}>{formatPrice(data?.subtotal || 0)} د.ع</span>
        </div>
        {data?.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: '1mm', color: '#cc0000', ...kurdishStyle }}>
            <span>داشکاندن:</span>
            <span style={{ ...kurdishNumberStyle }}>-{formatPrice(data?.discount || 0)} د.ع</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', ...kurdishStyle }}>
          <span>کۆی گشتی:</span>
          <span style={{ ...kurdishNumberStyle }}>{formatPrice(data?.total || 0)} د.ع</span>
        </div>
      </div>

      {/* Footer */}
      {data?.qrCodeUrl && (
        <div style={{ textAlign: 'center', marginTop: '2mm' }}>
          <img src={data.qrCodeUrl} alt="QR" style={{ width: '20mm', height: '20mm', objectFit: 'contain' }} />
        </div>
      )}
      
      <div style={{ textAlign: 'center', fontSize: '7px', color: '#666', marginTop: '2mm', ...kurdishStyle }}>
        {data?.thankYouNote || 'سوپاس بۆ کڕینەکەتان!'}
      </div>
      <div style={{ textAlign: 'center', fontSize: '6px', color: '#999', marginTop: '1mm', ...kurdishStyle }}>
        Click Group - 07701466787
      </div>
    </div>
  )
}

// Invoice Template Component - Modern Light Design (Preview)
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

  // Item field extractors - Use item_name from sale_items directly, fallback to 'کاڵای بێ ناو'
  const getItemName = (item: any) => item?.item_name || item?.product_name || item?.products?.name || item?.product?.name || item?.name || 'کاڵای بێ ناو'
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#000000', ...kurdishStyle }}>
                <FaMapMarkerAlt style={{ color: '#000000' }} /><span>{data.shopAddress}</span>
              </div>
            )}
            {data?.shopPhone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#000000', ...kurdishNumberStyle }}>
                <FaPhone style={{ color: '#000000' }} /><span>{toKurdishDigits(data.shopPhone)}</span>
              </div>
            )}
          </div>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#000000', marginBottom: '4px', ...kurdishStyle }}>بەروار</div>
              <div style={{ fontFamily: "'Uni Salar', var(--font-uni-salar), sans-serif", color: '#111827', fontSize: '14px', direction: 'ltr' }}>{toKurdishDigits(data?.date) || '-'}</div>
              {data?.time && (
                <div style={{ fontFamily: "'Uni Salar', var(--font-uni-salar), sans-serif", color: '#000000', fontSize: '12px', direction: 'ltr', marginTop: '2px' }}>{data.time}</div>
              )}
            </div>
            {data?.customerPhone && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px', ...kurdishStyle }}>تەلەفۆن</div>
                <div style={{ fontFamily: "'Uni Salar', var(--font-uni-salar), sans-serif", color: '#111827', fontSize: '14px', direction: 'ltr' }}>{toKurdishDigits(data.customerPhone)}</div>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px', ...kurdishStyle }}>فرۆشیار</div>
              <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '14px', ...kurdishStyle }}>
                {data.profiles?.name || data.seller_name || data.sold_by || data.sellerName || 'کارمەند'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Method */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '2px dashed #d1d5db', textAlign: 'center' }}>
          <div style={{ fontWeight: '100', color: '#374151', marginBottom: '4px', ...kurdishStyle }}>شێوازی پارەدان</div>
          <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '14px', ...kurdishStyle }}>{getPaymentStatus()}</div>
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
                <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', color: '#000000', ...kurdishStyle }}>{getItemName(item)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', color: '#000000', ...kurdishStyle }}>{getItemUnit(item)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', ...kurdishNumberStyle, fontWeight: '600', color: '#000000' }}>{getItemQty(item)}</td>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#030304', ...kurdishStyle }}><span>کۆی نرخ:</span><span style={{ ...kurdishNumberStyle }}>{formatPrice(data?.subtotal || 0)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#000000', ...kurdishStyle }}><span>داشکاندن:</span><span style={{ ...kurdishNumberStyle, fontWeight: '600' }}>{formatPrice(data?.discount || 0)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#111827', fontSize: '16px', ...kurdishStyle }}><span>کۆی گشتی:</span><span style={{ ...kurdishNumberStyle }}>{formatPrice(data?.total || 0)}</span></div>
        </div>
        
        {/* Grand Total Highlight - Modern */}
        <div style={{ textAlign: 'center', padding: '16px'}}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', ...kurdishStyle }}>کۆی گشتی: {formatPrice(data?.total || 0)}</div>
        </div>
        
        {data?.qrCodeUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '12px' }}>
            <img src={data.qrCodeUrl} alt="QR" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
          </div>
        )}
        
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#000000', fontStyle: 'italic', borderTop: '1px solid #e5e7eb', paddingTop: '12px', ...kurdishStyle }}>
          {data?.thankYouNote || 'سوپاس بۆ کڕینەکەتان!'}
        </div>
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#000000', borderTop: '1px solid #e5e7eb', paddingTop: '8px', ...kurdishStyle }}>
          گەشەپێدانی سیستەم لە لایەن Click Group<br />07701466787
        </div>
      </div>
    </div>
  )
}

export default function GlobalInvoiceModal({ isOpen, onClose, invoiceData, invoiceId, title = 'وردەکارییەکانی پسوڵە' }: GlobalInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [captureData, setCaptureData] = useState<any>(null)

  // Fetch settings every time the modal opens to ensure latest data
  useEffect(() => {
    if (!isOpen) return
    
    const fetchSettings = async () => {
      if (!supabase) {
        setSettingsLoading(false)
        return
      }
      try {
        const { data, error } = await supabase.from('invoice_settings').select('*').single()
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching invoice settings:', error)
        }
        setInvoiceSettings(data || null)
      } catch (error) { 
        console.error('Error fetching invoice settings:', error) 
      } finally {
        setSettingsLoading(false)
      }
    }
    fetchSettings()
  }, [isOpen])

  useEffect(() => {
    if (isOpen && invoiceData) {
      // Priority: invoiceData > invoiceSettings (from DB) > fallback
      const data = {
        ...invoiceData,
        shopName: invoiceSettings?.shop_name || invoiceData.shopName || '',
        shopPhone: invoiceSettings?.shop_phone || invoiceData.shopPhone || '',
        shopAddress: invoiceSettings?.shop_address || invoiceData.shopAddress || '',
        shopLogo: invoiceSettings?.shop_logo || invoiceData.shopLogo || '',
        qrCodeUrl: invoiceSettings?.qr_code_url || invoiceData.qrCodeUrl || '',
        thankYouNote: invoiceSettings?.thank_you_note || invoiceData.thankYouNote || ''
      }
      setCaptureData(data)
    }
  }, [isOpen, invoiceData, invoiceSettings])

  const handlePrint = async () => {
    if (!captureData) {
      window.print()
      return
    }
    
    const printWindow = window.open('', '_blank', 'width=300,height=600')
    if (!printWindow) {
      window.print()
      return
    }
    
    const printContent = `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>پسوڵە - Invoice</title>
  <style>
    @font-face { font-family: 'UniSalar'; src: url('/fonts/UniSalar_F_007.otf') format('opentype'); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: 72mm auto; margin: 0; }
    body { font-family: 'UniSalar', 'Noto Naskh Arabic', sans-serif; direction: rtl; width: 68mm; margin: 0; padding: 2mm; font-size: 8px; line-height: 1.4; color: #000; background: #fff; font-weight: bold; }
    .header-section { display: flex; justify-content: space-between; margin-bottom: 2mm; padding-bottom: 2mm; border-bottom: 1px dashed #eee; }
    .header-col { display: flex; flex-direction: column; gap: 1mm; }
    .header-col.left { text-align: right; }
    .header-col.center { text-align: center; }
    .header-col.right { text-align: left; }
    .header-label { font-size: 6px; color: #666; margin-bottom: 0.5mm; }
    .header-value { font-size: 7px; color: #000; }
    .shop-logo { width: 18mm; height: 18mm; margin: 0 auto 1mm; border-radius: 50%; overflow: hidden; border: 1px solid #ddd; }
    .shop-logo img { width: 100%; height: 100%; object-fit: cover; }
    .shop-name { font-size: 9px; font-weight: bold; margin-bottom: 1mm; }
    .shop-info { font-size: 6px; color: #666; }
    .payment-section { text-align: center; margin: 2mm 0; padding: 1mm 0; }
    .payment-label { font-size: 6px; color: #666; margin-bottom: 0.5mm; }
    .payment-value { font-size: 8px; font-weight: bold; }
    .divider { border-top: 1px dashed #eee; margin: 2mm 0; }
    .items-header { display: flex; font-size: 6px; font-weight: bold; padding-bottom: 1mm; margin-bottom: 1mm; border-bottom: 1px solid #ddd; }
    .items-header .col-name { flex: 3; text-align: right; }
    .items-header .col-unit { flex: 1; text-align: center; }
    .items-header .col-qty { flex: 1; text-align: center; }
    .items-header .col-price { flex: 1.5; text-align: left; }
    .item-row { display: flex; font-size: 7px; padding: 0.5mm 0; }
    .item-row .col-name { flex: 3; text-align: right; word-break: break-word; }
    .item-row .col-unit { flex: 1; text-align: center; }
    .item-row .col-qty { flex: 1; text-align: center; }
    .item-row .col-price { flex: 1.5; text-align: left; font-weight: bold; }
    .totals-section { margin-top: 2mm; }
    .total-row { display: flex; justify-content: space-between; font-size: 7px; margin-bottom: 1mm; }
    .total-row.subtotal { justify-content: flex-end; }
    .total-row.discount { color: #cc0000; justify-content: flex-end; }
    .total-row.grand-total { justify-content: flex-end; margin-top: 1mm; }
    .grand-total-box { text-align: center; padding: 2mm; background: #f5f5f5; border-radius: 4px; margin-top: 2mm; }
    .grand-total-box .label { font-size: 7px; margin-bottom: 1mm; }
    .grand-total-box .value { font-size: 9px; font-weight: bold; }
    .qr-section { text-align: center; margin-top: 3mm; }
    .qr-section img { width: 18mm; height: 18mm; object-fit: contain; }
    .footer-thanks { text-align: center; font-size: 7px; margin-top: 3mm; color: #333; }
    .footer-copyright { text-align: center; font-size: 5px; color: #999; margin-top: 2mm; }
    @media print { body { width: 68mm !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header-section">
    <div class="header-col left">
      <div><div class="header-label">بەروار</div><div class="header-value">${captureData.date || '-'} ${captureData.time || ''}</div></div>
      ${captureData.customerPhone ? `<div><div class="header-label">تەلەفۆن</div><div class="header-value">${toKurdishDigits(captureData.customerPhone)}</div></div>` : ''}
      <div><div class="header-label">فرۆشیار</div><div class="header-value">${captureData.profiles?.name || captureData.seller_name || captureData.sold_by || captureData.sellerName || 'کارمەند'}</div></div>
    </div>
    <div class="header-col center">
      ${captureData.shopLogo ? `<div class="shop-logo"><img src="${captureData.shopLogo}" alt="${captureData.shopName || 'فرۆشگا'}" /></div>` : ''}
      <div class="shop-name">${captureData.shopName || 'فرۆشگای کوردستان'}</div>
      ${captureData.shopAddress ? `<div class="shop-info">${captureData.shopAddress}</div>` : ''}
      ${captureData.shopPhone ? `<div class="shop-info">${toKurdishDigits(captureData.shopPhone)}</div>` : ''}
    </div>
    <div class="header-col right">
      <div><div class="header-label">ژمارەی پسوڵە</div><div class="header-value" style="font-size: 9px;">${captureData.invoiceNumber && captureData.invoiceNumber > 0 ? '#' + toKurdishDigits(captureData.invoiceNumber) : 'پسوڵەی کاتی'}</div></div>
      <div><div class="header-label">کڕیار</div><div class="header-value">${captureData.customerName || 'نەناسراو'}</div></div>
    </div>
  </div>
  <div class="payment-section"><div class="payment-label">شێوازی پارەدان</div><div class="payment-value">${getPaymentStatus(captureData)}</div></div>
  <div class="divider"></div>
  <div class="items-header"><div class="col-name">ناوی کاڵا</div><div class="col-unit">یەکە</div><div class="col-qty">بڕ</div><div class="col-price">نرخ</div></div>
  <div class="items-list">${getItemsHtmlNew(captureData)}</div>
  <div class="divider"></div>
  <div class="totals-section">
    <div class="total-row subtotal"><span>کۆی نرخ:</span><span style="margin-right: 3mm;">${toKurdishDigits(formatCurrency(captureData.subtotal || 0))} د.ع</span></div>
    ${captureData.discount > 0 ? `<div class="total-row discount"><span>داشکاندن:</span><span style="margin-right: 3mm;">-${toKurdishDigits(formatCurrency(captureData.discount || 0))} د.ع</span></div>` : ''}
    <div class="grand-total-box"><div class="label">کۆی گشتی</div><div class="value">${toKurdishDigits(formatCurrency(captureData.total || 0))} د.ع</div></div>
  </div>
  ${captureData.qrCodeUrl ? `<div class="qr-section"><img src="${captureData.qrCodeUrl}" alt="QR" /></div>` : ''}
  <div class="footer-thanks">${captureData.thankYouNote || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین'}</div>
  <div class="footer-copyright">گەشەپێدانی سیستەم لە لایەن Click Group<br />07701466787</div>
</body>
</html>`
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }, 300)
    }
  }

  const getPaymentStatus = (data: any) => {
    switch (data?.paymentMethod) {
      case 'cash': return 'نەختینە'
      case 'fib': return 'ئۆنلاین (FIB)'
      case 'debt': return 'قەرز'
      case 'purchase': return 'کڕین'
      default: return 'نەپارەدراو'
    }
  }

  const getItemsHtmlNew = (data: any) => {
    const items = data?.sale_items || data?.invoice_items || data?.items || []
    if (!items || items.length === 0) {
      return '<div style="text-align: center; font-size: 7px; color: #666; padding: 2mm;">داتا بوونی نییە</div>'
    }
    
    return items.map((item: any) => {
      const name = item?.item_name || item?.product_name || item?.products?.name || item?.product?.name || item?.name || 'کاڵای بێ ناو'
      const qty = toKurdishDigits(item?.quantity || item?.qty || item?.amount || 0)
      const unit = item?.unit || item?.product_unit || 'دانە'
      const total = toKurdishDigits(formatCurrency(item?.total || (item?.price || item?.unit_price || 0) * (item?.quantity || item?.qty || item?.amount || 0)))
      
      return `<div class="item-row"><div class="col-name">${name}</div><div class="col-unit">${unit}</div><div class="col-qty">${qty}</div><div class="col-price">${total}</div></div>`
    }).join('')
  }

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
      alert('هەڵە لە داگرتنی وێنەی پسوڵە') 
    }
  }

  if (!isOpen || !invoiceData) return null

  const modalKey = `invoice-modal-${invoiceId || 'default'}`

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div key={modalKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
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

// FIXED: buildInvoiceData function - Correct discount calculation
export function buildInvoiceData(saleData: any, invoice: { id: string; invoice_number?: number; total: number; date: string; payment_method?: string }, settings?: any): any {
  const items = (saleData?.sale_items || []).map((item: any) => ({
    name: item?.item_name || item?.product_name || item?.products?.name || item?.product?.name || item?.name || 'کاڵای بێ ناو',
    unit: item?.products?.unit || item?.product_unit || item?.unit || 'دانە',
    quantity: item?.quantity || item?.qty || 0,
    price: item?.price || item?.product_price || 0,
    total: item?.total || (item?.price || item?.product_price || 0) * (item?.quantity || item?.qty || 0)
  }))
  
  // FIX: Subtotal should be the sum of item totals WITHOUT adding discount
  // Formula: Subtotal = Sum(Item Totals)
  const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0)
  
  // FIX: Total should be Subtotal - Discount
  // Formula: Total = Subtotal - Discount
  const discountAmount = Number(saleData?.discount_amount) || 0
  const total = subtotal - discountAmount
  
  // Format time in 12-hour format with Kurdish numerals
  const formattedTime = formatTimeKurdish(invoice.date || new Date().toISOString())
  
  return {
    invoiceNumber: invoice.invoice_number || 0,
    customerName: saleData?.customers?.name || saleData?.customer_name || 'نەناسراو',
    customerPhone: saleData?.customers?.phone1 || '',
    sellerName: saleData?.seller_name || saleData?.sold_by || saleData?.sellerName || 'کارمەند',
    seller_name: saleData?.seller_name || saleData?.sold_by || saleData?.sellerName || 'کارمەند',
    date: new Date(invoice.date).toLocaleDateString('ku'),
    time: formattedTime,
    paymentMethod: invoice.payment_method || saleData?.payment_method || 'cash',
    items,
    subtotal,
    discount: discountAmount,
    total,
    shopName: settings?.shop_name || 'فرۆشگای کوردستان',
    shopPhone: settings?.shop_phone || '',
    shopAddress: settings?.shop_address || '',
    shopLogo: settings?.shop_logo || '',
    qrCodeUrl: settings?.qr_code_url || '',
    thankYouNote: settings?.thank_you_note || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
  }
}
