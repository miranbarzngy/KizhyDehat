'use client'

import InvoiceTemplate from '@/components/InvoiceTemplate'
import { supabase } from '@/lib/supabase'
import { toEnglishDigits } from '@/lib/numberUtils'
import { SaleData, Invoice } from './invoiceUtils'
import { useEffect, useState } from 'react'

interface InvoicePreviewProps {
  saleData: SaleData
  invoice: Invoice
  invoiceRef: React.RefObject<HTMLDivElement>
}

interface PreviewSettings {
  shop_name: string
  shop_phone: string
  shop_address: string
  shop_logo: string
  thank_you_note: string
  qr_code_url: string
}

export default function InvoicePreview({ saleData, invoice, invoiceRef }: InvoicePreviewProps) {
  const [settings, setSettings] = useState<PreviewSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!supabase) {
          setSettings({
            shop_name: 'فرۆشگای کوردستان',
            shop_phone: '',
            shop_address: '',
            shop_logo: '',
            thank_you_note: 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.',
            qr_code_url: ''
          })
          return
        }

        const { data, error } = await supabase
          .from('invoice_settings')
          .select('*')
          .single()

        if (!error && data) {
          setSettings(data)
        } else {
          setSettings({
            shop_name: 'فرۆشگای کوردستان',
            shop_phone: '',
            shop_address: '',
            shop_logo: '',
            thank_you_note: 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.',
            qr_code_url: ''
          })
        }
      } catch (error) {
        console.error('Error fetching invoice settings:', error)
        setSettings({
          shop_name: 'فرۆشگای کوردستان',
          shop_phone: '',
          shop_address: '',
          shop_logo: '',
          thank_you_note: 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.',
          qr_code_url: ''
        })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  // For pending sales (invoice_number === 0), show placeholder instead of #0
  const displayInvoiceNumber = invoice.invoice_number && invoice.invoice_number > 0 
    ? invoice.invoice_number 
    : undefined

  const invoiceData = {
    invoiceNumber: displayInvoiceNumber || 0,
    customerName: saleData.customers?.name || 'نەناسراو',
    customerPhone: saleData.customers?.phone1 || '',
    sellerName: saleData.sold_by || 'فرۆشیار',
    date: new Date(invoice.date).toLocaleDateString('ku'),
    time: new Date().toLocaleTimeString('ku'),
    paymentMethod: invoice.payment_method || 'cash',
    items: saleData.sale_items?.map((item) => ({
      name: item.products?.name || 'نەناسراو',
      unit: item.products?.unit || item.unit || 'دانە',
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    })) || [],
    subtotal: saleData.subtotal || invoice.total,
    discount: saleData.discount_amount || 0,
    total: invoice.total,
    shopName: settings?.shop_name || 'فرۆشگای کوردستان',
    shopPhone: settings?.shop_phone || '',
    shopAddress: settings?.shop_address || '',
    shopLogo: settings?.shop_logo || '',
    qrCodeUrl: settings?.qr_code_url || '',
    thankYouNote: settings?.thank_you_note || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
  }

  return (
    <div ref={invoiceRef}>
      <InvoiceTemplate data={invoiceData} />
    </div>
  )
}
