import { formatCurrency, toEnglishDigits } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'

export interface Invoice {
  id: string
  invoice_number: number
  customer_name: string
  total: number
  status: string
  payment_method: string
  date: string
  items_count: number
}

export interface InvoiceSettings {
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

export interface SaleData {
  customers?: { name: string; phone1?: string }
  sold_by?: string
  subtotal?: number
  discount_amount?: number
  sale_items?: Array<{ products?: { name: string; unit?: string }; quantity: number; price: number; total?: number; unit?: string }>
  payment_method?: string
}

export async function generateInvoiceHTML(saleData: SaleData, invoice: Invoice, settingsData?: InvoiceSettings | null): Promise<string> {
  let settings = settingsData
  if (!settings && supabase) {
    try {
      const { data } = await supabase.from('invoice_settings').select('*').single()
      if (data) settings = data as InvoiceSettings
    } catch { }
  }

  const shopName = settings?.shop_name || 'فرۆشگای کوردستان'
  const shopPhone = settings?.shop_phone || ''
  const shopAddress = settings?.shop_address || ''
  const shopLogo = settings?.shop_logo || ''
  const thankYouNote = settings?.thank_you_note || 'سوپاس بۆ کڕینەکەتان!'
  const qrCodeUrl = settings?.qr_code_url || ''
  const sellerName = saleData.sold_by || 'فرۆشیار'

  const getPaymentStatus = () => {
    switch (invoice.payment_method) {
      case 'cash': return 'کاش'
      case 'fib': return 'ئۆنلاین (FIB)'
      case 'debt': return 'قەرز'
      default: return 'نەپارەدراو'
    }
  }

  const calculatedSubtotal = saleData.sale_items?.reduce((sum, item) => sum + (item.total || item.price * item.quantity), 0) || invoice.total
  const discountAmount = saleData.discount_amount || 0

  return `
    <div style="font-family: var(--font-uni-salar); direction: rtl; width: 100%; max-width: 400px; margin: 0 auto; background: white; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        ${shopLogo ? `<div style="width: 80px; height: 80px; margin: 0 auto 16px; border-radius: 50%; overflow: hidden; border: 4px solid #e5e7eb;"><img src="${shopLogo}" alt="${shopName}" style="width: 100%; height: 100%; object-fit: cover;" /></div>` : ''}
        <h1 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 8px 0;">${shopName}</h1>
        <div style="display: flex; flex-direction: column; gap: 4px; align-items: center; font-size: 12px; color: #6b7280;">
          ${shopPhone ? `<div>📞 ${shopPhone}</div>` : ''}
          ${shopAddress ? `<div>📍 ${shopAddress}</div>` : ''}
        </div>
      </div>
      <div style="text-align: center; margin: 16px 0; color: #d1d5db;">--------------------------</div>
      <div style="margin-bottom: 24px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 12px;">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="text-align: center;"><div style="font-weight: 600; color: #374151;">ژمارەی پسوڵەش</div><div style="font-family: 'Inter'; font-weight: bold; color: #1f2937; font-size: 18px; direction: ltr;">${invoice.invoice_number === 0 ? '' : '#' + toEnglishDigits(invoice.invoice_number.toString())}</div></div>
            <div style="text-align: center;"><div style="font-weight: 600; color: #374151;">کڕیار</div><div style="font-weight: bold; color: #1f2937;">${saleData.customers?.name || 'نەناسراو'}</div></div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="text-align: center;"><div style="font-weight: 600; color: #374151;">بەروار</div><div style="font-family: 'Inter'; color: #1f2937;">${new Date(invoice.date).toLocaleDateString('ku')}</div></div>
            <div style="text-align: center;"><div style="font-weight: 600; color: #374151;">فرۆشیار</div><div style="font-weight: bold; color: #1f2937;">${sellerName}</div></div>
          </div>
        </div>
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center;">
          <div style="font-weight: 600; color: #374151;">شێوازی پارەدان</div>
          <div style="font-weight: bold; color: #1f2937; font-size: 18px;">${getPaymentStatus()}</div>
        </div>
      </div>
      <div style="text-align: center; margin: 16px 0; color: #d1d5db;">--------------------------</div>
      <div style="margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 12px;">
          <thead><tr style="background: #f9fafb;"><th style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">ناو</th><th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">یەکە</th><th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">بڕ</th><th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">نرخ</th></tr></thead>
          <tbody>
            ${saleData.sale_items?.map(item => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${item.products?.name || 'نەناسراو'}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${item.products?.unit || item.unit || ''}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-family: 'Inter';">${toEnglishDigits(item.quantity.toString())}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-family: 'Inter';">${formatCurrency(item.total || item.price * item.quantity)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
      </div>
      <div style="text-align: center; margin: 16px 0; color: #d1d5db;">--------------------------</div>
      <div style="border-top: 2px solid #d1d5db; padding-top: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>کۆی نرخ:</span><span style="font-family: 'Inter';">${formatCurrency(calculatedSubtotal)} IQD</span></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>داشکاندن:</span><span style="font-family: 'Inter'; color: #dc2626;">${formatCurrency(discountAmount)}</span></div>
        <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;"><span>کۆی گشتی:</span><span style="font-family: 'Inter';">${formatCurrency(invoice.total)} IQD</span></div>
      </div>
      ${qrCodeUrl ? `<div style="text-align: center; margin: 16px 0;"><img src="${qrCodeUrl}" alt="QR" style="width: 64px; height: 64px;" /></div>` : ''}
      <div style="text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 12px;">${thankYouNote}</div>
      <div style="text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px;">گەشەپێدانی سیستم لە لایەن Click Group</div>
    </div>
  `
}

export function generateReceiptPreview(shopName: string, shopPhone: string, shopAddress: string, shopLogo: string, thankYouNote: string, qrCodeUrl: string, currentInvoiceNumber: number): string {
  const mockItems = [{ name: 'هەنگوین', unit: 'کیلۆ', quantity: 2, price: 12.50 }, { name: 'سەرکە', unit: 'دانە', quantity: 1, price: 8.00 }]
  const mockTotal = 32.50
  const mockCustomerName = 'نموونەی کڕیار'

  return `
    <div style="font-family: var(--font-uni-salar); direction: rtl; width: 100%; max-width: 320px; margin: 0 auto; background: white; padding: 16px;">
      <div style="text-align: center; margin-bottom: 16px;">
        ${shopLogo ? `<div style="width: 60px; height: 60px; margin: 0 auto 12px; border-radius: 50%; overflow: hidden; border: 3px solid #e5e7eb;"><img src="${shopLogo}" alt="${shopName}" style="width: 100%; height: 100%; object-fit: cover;" /></div>` : ''}
        <h1 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 6px 0;">${shopName || 'فرۆشگا'}</h1>
        <div style="font-size: 10px; color: #6b7280;">${shopPhone}</div>
      </div>
      <div style="text-align: center; margin: 12px 0; color: #d1d5db;">--------------------------</div>
      <div style="margin-bottom: 16px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 10px;">
          <div style="text-align: center;"><div>ژمارەی پسوڵە</div><div style="font-family: 'Inter'; font-weight: bold;">#${toEnglishDigits(currentInvoiceNumber.toString())}</div></div>
          <div style="text-align: center;"><div>کڕیار</div><div style="font-weight: bold;">${mockCustomerName}</div></div>
        </div>
      </div>
      <div style="text-align: center; margin: 12px 0; color: #d1d5db;">--------------------------</div>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 10px;">
        <thead><tr style="background: #f9fafb;"><th style="border: 1px solid #d1d5db; padding: 6px; text-align: right;">ناو</th><th style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">بڕ</th><th style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">نرخ</th></tr></thead>
        <tbody>
          ${mockItems.map(item => `
            <tr><td style="border: 1px solid #d1d5db; padding: 6px; text-align: right;">${item.name}</td><td style="border: 1px solid #d1d5db; padding: 6px; text-align: center; font-family: 'Inter';">${toEnglishDigits(item.quantity.toString())}</td><td style="border: 1px solid #d1d5db; padding: 6px; text-align: center; font-family: 'Inter';">${formatCurrency(item.price * item.quantity)}</td></tr>
          `).join('')}
        </tbody>
      </table>
      <div style="text-align: center; margin: 12px 0; color: #d1d5db;">--------------------------</div>
      <div style="border-top: 2px solid #d1d5db; padding-top: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold;"><span>کۆی گشتی:</span><span style="font-family: 'Inter';">${formatCurrency(mockTotal)} IQD</span></div>
      </div>
      ${qrCodeUrl ? `<div style="text-align: center; margin: 12px 0;"><img src="${qrCodeUrl}" alt="QR" style="width: 48px; height: 48px;" /></div>` : ''}
      <div style="text-align: center; font-size: 10px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 8px;">${thankYouNote || 'سوپاس بۆ کڕینەکەتان!'}</div>
    </div>
  `
}
