'use client'

import { formatCurrency } from '@/lib/numberUtils'
import { SaleData, Invoice } from './invoiceUtils'
import { FaMapMarkerAlt, FaPhone } from 'react-icons/fa'

interface InvoicePreviewProps {
  saleData: SaleData
  invoice: Invoice
  invoiceRef: React.RefObject<HTMLDivElement>
  isCaptureMode?: boolean
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

// Kurdish text style
const kurdishStyle = { fontFamily: "'Uni Salar', var(--font-uni-salar), sans-serif" }
const kurdishNumberStyle = { fontFamily: "'Uni Salar', var(--font-uni-salar), sans-serif", direction: 'ltr' as const }

// Invoice Template Component - Modern Light Design
function InvoiceTemplate({ data }: { data: any }) {
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

  const getItemName = (item: any) => item?.product_name || item?.products?.name || item?.product?.name || item?.name || 'دیارنییە'
  const getItemQty = (item: any) => toKurdishDigits(item?.quantity || item?.qty || item?.amount || 0)
  const getItemPrice = (item: any) => formatPrice(item?.price || item?.unit_price || 0)
  const getItemTotal = (item: any) => formatPrice(item?.total || (item?.price || item?.unit_price || 0) * (item?.quantity || item?.qty || item?.amount || 0))
  const getItemUnit = (item: any) => item?.unit || item?.product_unit || 'دانە'

  return (
    <div className="bg-white" style={{ fontFamily: "'Uni Salar', var(--font-uni-salar), sans-serif", direction: 'rtl', width: '100%', maxWidth: '700px', padding: '24px', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '14px' }}>
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
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '2px dashed #d1d5db', textAlign: 'center' }}>
          <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px', ...kurdishStyle }}>شێوازی پارەدان</div>
          <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '16px', ...kurdishStyle }}>{getPaymentStatus()}</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '16px 0', color: '#d1d5db', fontSize: '20px', letterSpacing: '-2px' }}>------------------------------</div>

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
              <tr key={`prev-item-${index}`} style={{ background: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', color: '#111827', ...kurdishStyle }}>{getItemName(item)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', color: '#374151', ...kurdishStyle }}>{getItemUnit(item)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', ...kurdishNumberStyle, fontWeight: '600', color: '#111827' }}>{getItemQty(item)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', ...kurdishNumberStyle, fontWeight: '600', color: '#111827' }}>{getItemTotal(item)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} style={{ border: '1px solid #e5e7eb', padding: '16px', textAlign: 'center', color: '#6b7280', ...kurdishStyle }}>داتا بوونی نییە</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'center', margin: '16px 0', color: '#d1d5db', fontSize: '20px', letterSpacing: '-2px' }}>------------------------------</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#374151', ...kurdishStyle }}><span>کۆی نرخ:</span><span style={kurdishNumberStyle}>{formatPrice(data?.subtotal || 0)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#dc2626', ...kurdishStyle }}><span>داشکاندن:</span><span style={{ ...kurdishNumberStyle, fontWeight: '600' }}>-{formatPrice(data?.discount || 0)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#111827', fontSize: '16px', ...kurdishStyle }}><span>کۆی گشتی:</span><span style={kurdishNumberStyle}>{formatPrice(data?.total || 0)}</span></div>
        </div>
        <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', ...kurdishStyle }}>کۆی گشتی: {formatPrice(data?.total || 0)}</div>
        </div>
        {data?.qrCodeUrl && <div style={{ textAlign: 'center' }}><img src={data.qrCodeUrl} alt="QR" style={{ width: '70px', height: '70px' }} /></div>}
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', fontStyle: 'italic', borderTop: '1px solid #e5e7eb', paddingTop: '12px', ...kurdishStyle }}>{data?.thankYouNote || 'سوپاس بۆ کڕینەکەتان!'}</div>
        <div style={{ textAlign: 'center', fontSize: '9px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '8px', ...kurdishStyle }}>گەشەپێدانی سیستم لە لایەن Click Group<br />07701466787</div>
      </div>
    </div>
  )
}

function buildInvoiceDataLocal(saleData: SaleData, invoice: Invoice): any {
  const items = (saleData?.sale_items || []).map((item: any) => ({
    name: item?.products?.name || item?.product_name || item?.name || 'کاڵای سڕاوە',
    unit: item?.products?.unit || item?.product_unit || item?.unit || 'دانە',
    quantity: item?.quantity || item?.qty || 0,
    price: item?.price || item?.product_price || 0,
    total: item?.total || (item?.price || item?.product_price || 0) * (item?.quantity || item?.qty || 0)
  }))
  const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0) + (saleData?.discount_amount || 0)
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
    shopName: 'فرۆشگای کوردستان',
    shopPhone: '',
    shopAddress: '',
    shopLogo: '',
    qrCodeUrl: '',
    thankYouNote: 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
  }
}

export default function InvoicePreview({ saleData, invoice, invoiceRef }: InvoicePreviewProps) {
  const invoiceData = buildInvoiceDataLocal(saleData, invoice)

  return (
    <div ref={invoiceRef}>
      <InvoiceTemplate data={invoiceData} />
    </div>
  )
}
