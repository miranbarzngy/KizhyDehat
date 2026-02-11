'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaEye, FaShoppingCart } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/numberUtils'
import InvoiceTemplate from '@/components/InvoiceTemplate'

interface PendingSale {
  id: string
  total: number
  payment_method: string
  date: string
  invoice_number?: number
  customers?: { name: string } | null
  display_customer_name?: string
}

interface InvoiceSettings {
  id: string
  shop_name: string
  shop_phone: string
  shop_address: string
  shop_logo: string
  thank_you_note: string
  qr_code_url: string
}

interface RecentSalesTableProps {
  onOrderClick?: (orderId: string) => void
}

// Invoice Preview Component
function InvoicePreview({ saleData, invoice, settings }: { saleData: any, invoice: any, settings: any }) {
  const invoiceData = {
    invoiceNumber: invoice.invoice_number || 0,
    customerName: saleData.customers?.name || 'نەناسراو',
    customerPhone: saleData.customers?.phone1 || '',
    sellerName: saleData.sold_by || 'فرۆشیار',
    date: new Date(invoice.date).toLocaleDateString('ku'),
    time: new Date().toLocaleTimeString('ku'),
    paymentMethod: invoice.payment_method || 'cash',
    items: saleData.sale_items?.map((item: any) => ({
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
    thankYouNote: settings?.thank_you_note || 'سوپاس بۆ کڕینەکەتان!'
  }

  return <InvoiceTemplate data={invoiceData} />
}

export default function RecentSalesTable({ onOrderClick }: RecentSalesTableProps) {
  const router = useRouter()
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [recentOrders, setRecentOrders] = useState<PendingSale[]>([])
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PendingSale | null>(null)
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null)
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPendingSales = async () => {
    if (!supabase) {
      setRecentOrders([])
      setLoading(false)
      return
    }

    try {
      let hasStatusColumn = false
      try {
        const testQuery = await supabase.from('sales').select('status').limit(1)
        hasStatusColumn = !testQuery.error
      } catch {
        hasStatusColumn = false
      }

      if (!hasStatusColumn) {
        setRecentOrders([])
        setLoading(false)
        return
      }

      // Query with left join using customer_id foreign key
      let data: any[] | null = null
      let joinFailed = false

      const { data: joinData, error: joinError } = await supabase
        .from('sales')
        .select(`
          *,
          customers:customer_id (
            name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10)

      if (joinError) {
        console.error('Error fetching pending sales with join:', joinError.message, joinError.code, joinError.hint)
        joinFailed = true
      } else {
        data = joinData
      }

      // Fallback: fetch without join if join failed
      if (joinFailed) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('sales')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10)

        if (fallbackError) {
          console.error('Error fetching pending sales (fallback):', fallbackError.message, fallbackError.code, fallbackError.hint)
          setRecentOrders([])
          setLoading(false)
          return
        }
        data = fallbackData
      }

      // Map data with display_customer_name from join
      const transformedOrders: PendingSale[] = (data || []).map(sale => {
        const customer = joinFailed ? null : (sale.customers || null)
        return {
          id: sale.id,
          total: sale.total,
          payment_method: sale.payment_method || 'cash',
          date: sale.date,
          invoice_number: sale.invoice_number,
          customers: customer,
          display_customer_name: customer?.name || 'کڕیاری گشتی'
        }
      })

      setRecentOrders(transformedOrders)
    } catch (error) {
      console.error('Error fetching pending sales:', error)
      setRecentOrders([])
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoiceSettings = async () => {
    if (!supabase) return
    try {
      const { data } = await supabase.from('invoice_settings').select('*').single()
      setInvoiceSettings(data)
    } catch (error) {
      console.error('Error fetching invoice settings:', error)
    }
  }

  const viewOrderDetails = async (order: PendingSale) => {
    if (!supabase) return

    try {
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(`*, customers(name, phone1)`)
        .eq('id', order.id)
        .single()

      if (saleError) throw new Error('Sale not found')

      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select(`id, quantity, price, unit, item_id`)
        .eq('sale_id', order.id)

      if (itemsError) console.error('Error fetching sale items:', itemsError)

      const saleItemsWithNames = await Promise.all(
        (saleItems || []).map(async (item: any) => {
          try {
            const { data: inventoryData } = await supabase.from('inventory').select('item_name').eq('id', item.item_id).single()
            return { ...item, products: { name: inventoryData?.item_name || 'نەناسراو' } }
          } catch {
            return { ...item, products: { name: 'نەناسراو' } }
          }
        })
      )

      setSelectedOrder(order)
      setInvoiceDetails({ ...saleData, sale_items: saleItemsWithNames })
      setShowInvoiceModal(true)
    } catch (error) {
      console.error('Error fetching order details:', error)
      alert('هەڵە لە بارکردنی وردەکارییەکان')
    }
  }

  // Setup real-time subscription for pending sales
  useEffect(() => {
    fetchPendingSales()
    fetchInvoiceSettings()

    if (!supabase) return

    const subscription = supabase
      .channel('pending_sales_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sales',
        filter: 'status=eq.pending'
      }, () => {
        fetchPendingSales()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-gray-200 text-gray-600'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'گەیشت'
      case 'shipped': return 'نێردرا'
      case 'paid': return 'پارەدراو'
      case 'pending': return 'چاوەڕوان'
      case 'completed': return 'تەواو'
      case 'cancelled': return 'هەڵوەشێنراو'
      default: return 'چاوەڕوان'
    }
  }


  if (loading) {
    return (
      <motion.div
        className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaEye className="text-green-500 text-2xl" />
            <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              فرۆشتنە چاوەڕوانکراوەکان
            </h3>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>بارکردن...</p>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaEye className="text-green-500 text-2xl" />
            <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              فرۆشتنە چاوەڕوانکراوەکان
            </h3>
          </div>
          <motion.button
            onClick={() => router.push('/dashboard/invoices')}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            بینینی هەمووی
          </motion.button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200/50">
                <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کڕیار</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>دۆخ</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کردار</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    className="border-b border-gray-100/50 hover:bg-white/30 transition-colors duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="px-6 py-4 text-gray-800 font-medium" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      <span style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        {order.display_customer_name || 'کڕیاری گشتی'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.payment_method)}`}>{getStatusText(order.payment_method)}</span></td>
                    <td className="px-6 py-4 text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>{new Date(order.date).toLocaleDateString('ku')}</td>
                    <td className="px-6 py-4 text-center">
                      <motion.button
                        onClick={() => viewOrderDetails(order)}
                        className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md transition-colors duration-200 mx-auto"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="بینین"
                      >
                        <FaEye className="w-5 h-5" />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <FaShoppingCart className="text-4xl mx-auto mb-4" />
                      <p className="text-lg" style={{ fontFamily: 'var(--font-uni-salar)' }}>هیچ فرۆشتنێکی چاوەڕوانکراو نیە</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoiceModal && invoiceDetails && selectedOrder && (
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
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <FaEye className="text-blue-500 text-2xl" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>وردەکارییەکان</h3>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>{invoiceDetails.customers?.name || 'کڕیاری گشتی'}</p>
                  </div>
                </div>
                <motion.button onClick={() => setShowInvoiceModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
              <div className="overflow-y-auto max-h-[60vh] p-4 flex justify-center">
                <div style={{ zoom: 0.5 }}>
                  <InvoicePreview saleData={invoiceDetails} invoice={selectedOrder} settings={invoiceSettings} />
                </div>
              </div>
              <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی گشتی</p>
                    <p className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>{formatCurrency(selectedOrder.total)} IQD</p>
                  </div>
                  <motion.button
                    onClick={() => setShowInvoiceModal(false)}
                    className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    داخستن
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
