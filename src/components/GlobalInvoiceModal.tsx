'use client'

import { formatCurrency } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import InvoiceTemplate from '@/components/InvoiceTemplate'
import { AnimatePresence, motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import { useEffect, useRef, useState } from 'react'
import { FaFileInvoice, FaPrint } from 'react-icons/fa'

interface InvoiceSettings {
  id: string
  shop_name: string
  shop_phone: string
  shop_address: string
  shop_logo: string
  thank_you_note: string
  qr_code_url: string
}

interface InvoiceItem {
  name: string
  unit: string
  quantity: number
  price: number
  total: number
}

interface InvoiceData {
  invoiceNumber: number
  customerName: string
  customerPhone?: string
  sellerName?: string
  date: string
  time: string
  paymentMethod: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  total: number
  shopName: string
  shopPhone?: string
  shopAddress?: string
  shopLogo?: string
  qrCodeUrl?: string
  thankYouNote: string
}

interface GlobalInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  invoiceData: InvoiceData | null
  invoiceId?: string
  title?: string
}

export default function GlobalInvoiceModal({
  isOpen,
  onClose,
  invoiceData,
  invoiceId,
  title = 'وردەکارییەکانی فاکتور'
}: GlobalInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch invoice settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from('invoice_settings')
          .select('*')
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching invoice settings:', error)
        }
        setInvoiceSettings(data || null)
      } catch (error) {
        console.error('Error fetching invoice settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Handle print
  const handlePrint = () => {
    window.print()
  }

  // Handle download
  const handleDownload = async () => {
    if (!invoiceRef.current || !invoiceData) return

    try {
      // Wait for fonts and images to fully render
      await new Promise(resolve => setTimeout(resolve, 800))

      // Create a temporary container with fixed width for consistent capture
      const tempContainer = document.createElement('div')
      tempContainer.style.cssText = 'width: 800px; margin: 0 auto; background-color: white; direction: rtl; font-family: var(--font-uni-salar);'
      
      // Clone the invoice content
      const clone = invoiceRef.current.cloneNode(true) as HTMLElement
      clone.id = 'invoice-container'
      clone.style.width = '800px'
      clone.style.margin = '0 auto'
      clone.style.backgroundColor = 'white'
      clone.style.padding = '20px'
      tempContainer.appendChild(clone)
      
      // Temporarily add to body (hidden)
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '0'
      document.body.appendChild(tempContainer)

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        width: 800,
        windowWidth: 800,
        logging: false,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const clonedContainer = clonedDoc.getElementById('invoice-container')
          if (clonedContainer) {
            clonedContainer.style.display = 'block'
            clonedContainer.style.width = '800px'
            clonedContainer.style.margin = '0 auto'
            clonedContainer.style.backgroundColor = 'white'
          }
        }
      })

      // Remove temporary container
      document.body.removeChild(tempContainer)

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `Invoice_${invoiceData.invoiceNumber || invoiceId || 'temp'}.png`
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

  if (!isOpen || !invoiceData) return null

  // Merge invoice settings with invoice data
  const mergedInvoiceData = {
    ...invoiceData,
    shopName: invoiceData.shopName || invoiceSettings?.shop_name || 'فرۆشگای کوردستان',
    shopPhone: invoiceData.shopPhone || invoiceSettings?.shop_phone || '',
    shopAddress: invoiceData.shopAddress || invoiceSettings?.shop_address || '',
    shopLogo: invoiceData.shopLogo || invoiceSettings?.shop_logo || '',
    qrCodeUrl: invoiceData.qrCodeUrl || invoiceSettings?.qr_code_url || '',
    thankYouNote: invoiceData.thankYouNote || invoiceSettings?.thank_you_note || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <FaFileInvoice className="text-white text-lg" />
                </div>
                <div>
                  <h3 
                    className="text-xl font-bold text-gray-800" 
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    {title}
                  </h3>
                  {invoiceData.invoiceNumber > 0 && (
                    <p 
                      className="text-sm text-gray-600" 
                      style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                    >
                      #{invoiceData.invoiceNumber}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable Invoice */}
            <div 
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6"
              style={{ 
                maxHeight: 'calc(95vh - 180px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start'
              }}
            >
              <div className="invoice-preview-wrapper" style={{ width: '100%', maxWidth: '700px' }}>
                <style jsx>{`
                  .invoice-preview-wrapper {
                    zoom: 0.35;
                  }
                  @media (min-width: 480px) {
                    .invoice-preview-wrapper {
                      zoom: 0.4;
                    }
                  }
                  @media (min-width: 640px) {
                    .invoice-preview-wrapper {
                      zoom: 0.5;
                    }
                  }
                  @media (min-width: 768px) {
                    .invoice-preview-wrapper {
                      zoom: 0.6;
                    }
                  }
                  @media (min-width: 1024px) {
                    .invoice-preview-wrapper {
                      zoom: 0.7;
                    }
                  }
                  @media print {
                    .invoice-preview-wrapper {
                      zoom: 1 !important;
                    }
                  }
                `}</style>
                <div ref={invoiceRef}>
                  <InvoiceTemplate data={mergedInvoiceData} />
                </div>
              </div>
            </div>

            {/* Sticky Modal Footer */}
            <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-2 border-gray-200/50 shadow-lg p-4 md:p-6 print:hidden">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Total Amount Display */}
                <div className="text-center sm:text-right order-2 sm:order-1">
                  <div 
                    className="text-sm text-gray-600 mb-1" 
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    کۆی گشتی
                  </div>
                  <div 
                    className="text-xl font-bold text-gray-800" 
                    style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                  >
                    {formatCurrency(invoiceData.total)} IQD
                  </div>
                </div>

                {/* Action Buttons - Glassmorphism Style */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
                  {/* Print Button - Emerald Glass */}
                  <motion.button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 font-bold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>چاپکردن</span>
                  </motion.button>

                  {/* Download Button - Blue Glass */}
                  <motion.button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-400 font-bold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>دابەزاندن</span>
                  </motion.button>

                  {/* Close Button - Rose Glass */}
                  <motion.button
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-400 font-bold rounded-xl shadow-lg hover:shadow-rose-500/25 transition-all duration-300"
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
  )
}

// Helper function to build invoice data from sale details with manual product name mapping
export function buildInvoiceData(
  saleData: any,
  invoice: { id: string; invoice_number?: number; total: number; date: string; payment_method?: string },
  settings?: { shop_name?: string; shop_phone?: string; shop_address?: string; shop_logo?: string; thank_you_note?: string; qr_code_url?: string } | null
): InvoiceData {
  // Fetch product names separately if needed (manual mapping)
  const items = (saleData.sale_items || []).map((item: any) => ({
    name: item.products?.name || item.item_name || 'کاڵای سڕاوە',
    unit: item.products?.unit || item.unit || 'دانە',
    quantity: item.quantity,
    price: item.price,
    total: item.total || (item.price * item.quantity)
  }))

  // Calculate subtotal
  const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0) + (saleData.discount_amount || 0)

  return {
    invoiceNumber: invoice.invoice_number || 0,
    customerName: saleData.customers?.name || saleData.customer_name || 'نەناسراو',
    customerPhone: saleData.customers?.phone1 || '',
    sellerName: saleData.sold_by || saleData.sellerName || 'فرۆشیار',
    date: new Date(invoice.date).toLocaleDateString('ku'),
    time: new Date().toLocaleTimeString('ku'),
    paymentMethod: invoice.payment_method || saleData.payment_method || 'cash',
    items,
    subtotal,
    discount: saleData.discount_amount || 0,
    total: invoice.total,
    shopName: settings?.shop_name || 'فرۆشگای کوردستان',
    shopPhone: settings?.shop_phone || '',
    shopAddress: settings?.shop_address || '',
    shopLogo: settings?.shop_logo || '',
    qrCodeUrl: settings?.qr_code_url || '',
    thankYouNote: settings?.thank_you_note || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
  }
}
