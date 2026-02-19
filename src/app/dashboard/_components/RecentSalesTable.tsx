'use client'

import { buildInvoiceData } from '@/components/GlobalInvoiceModal'
import { useGlobalInvoiceModal } from '@/hooks/useGlobalInvoiceModal'
import { formatCurrency } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { memo, useEffect, useState } from 'react'
import { FaEye, FaShoppingCart } from 'react-icons/fa'

interface PendingSale {
  id: string
  total: number
  payment_method: string
  date: string
  status: string
  invoice_number?: number
  customers?: { name: string } | null
  display_customer_name?: string
  user_id?: string | null
  sold_by?: string | null
  seller_name?: string
  profiles?: { name: string } | null
}

interface RecentSalesTableProps {
  onOrderClick?: (orderId: string) => void
}

function RecentSalesTable({ onOrderClick }: RecentSalesTableProps) {
  const router = useRouter()
  const { openModal } = useGlobalInvoiceModal()
  const [recentOrders, setRecentOrders] = useState<PendingSale[]>([])
  const [loading, setLoading] = useState(true)

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

      // Query with left join using customer_id foreign key - show completed and recent
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
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)

      if (joinError) {
        console.error('Error fetching recent sales with join:', joinError.message, joinError.code, joinError.hint)
        joinFailed = true
      } else {
        data = joinData
      }

      // Fallback: fetch without join if join failed
      if (joinFailed) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('sales')
          .select('*')
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10)

        if (fallbackError) {
          console.error('Error fetching recent sales (fallback):', fallbackError.message, fallbackError.code, fallbackError.hint)
          setRecentOrders([])
          setLoading(false)
          return
        }
        data = fallbackData
      }

      // Map data with display_customer_name and seller name from profiles
      const transformedOrders: PendingSale[] = await Promise.all((data || []).map(async (sale: any) => {
        const customer = joinFailed ? null : (sale.customers || null)
        
        // Fetch seller name from profile
        const sellerName = await fetchSellerName(sale.user_id, sale.sold_by)
        
        return {
          id: sale.id,
          total: sale.total,
          payment_method: sale.payment_method || 'cash',
          date: sale.date,
          status: sale.status || 'completed',
          invoice_number: sale.invoice_number,
          customers: customer,
          display_customer_name: customer?.name || 'کڕیاری گشتی',
          user_id: sale.user_id,
          sold_by: sale.sold_by,
          seller_name: sellerName || sale.sold_by || '',
          profiles: { name: sellerName || sale.sold_by || '' }
        }
      }))

      setRecentOrders(transformedOrders)
    } catch (error) {
      console.error('Error fetching pending sales:', error)
      setRecentOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Handle approving a sale (complete and decrement quantities)
  const approveOrder = async (order: PendingSale) => {
    if (!supabase) return
    
    if (!confirm('دڵنیایت لە تەواوکردنی ئەم فرۆشتنە؟')) {
      return
    }
    
    try {
      // Use RPC call to atomically approve sale and decrement quantities
      const { error } = await supabase.rpc('approve_sale', { p_sale_id: order.id })
      if (error) throw error
      
      alert('فرۆشتنەکە بە سەرکەوتوویی تەواوکرا!')
      fetchPendingSales()
    } catch (error) {
      console.error('Error approving sale:', error)
      alert('هەڵە لە تەواوکردنی فرۆشتنەکە')
    }
  }

  // Handle viewing invoice using global modal
  const viewOrderDetails = async (order: PendingSale) => {
    if (!supabase) return

    try {
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select('*, customers(name, phone1)')
        .eq('id', order.id)
        .single()

      if (saleError) throw new Error('Sale not found')

      // Fetch sale items
      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', order.id)

      if (itemsError) {
        console.error('Error fetching sale items:', itemsError.message, itemsError.code, itemsError.hint)
      }

      // Fetch product names separately using item_ids (manual mapping)
      let productsData: any[] | null = null
      const itemIds = (saleItems || []).map((item: any) => item.item_id).filter(Boolean)
      if (itemIds.length > 0) {
        const { data: prodData, error: prodError } = await supabase
          .from('products')
          .select('id, name')
          .in('id', itemIds)
        if (prodError) {
          console.error('Error fetching product names:', prodError.message, prodError.code, prodError.hint)
        }
        productsData = prodData
      }

      // Manual mapping: match product name to each sale item
      const saleItemsWithNames = (saleItems || []).map((item: any) => ({
        ...item,
        products: {
          name: productsData?.find((prod: any) => prod.id === item.item_id)?.name || 'کاڵای سڕاوە'
        }
      }))

      // Fetch seller name from profile
      const sellerName = await fetchSellerName(order.user_id || saleData?.user_id, order.sold_by || saleData?.sold_by)

      // Build the sale data with profiles for seller name display
      const saleDataWithSeller = {
        ...saleData,
        sale_items: saleItemsWithNames,
        seller_name: sellerName || order.seller_name || saleData?.sold_by || '',
        profiles: { name: sellerName || order.seller_name || saleData?.sold_by || '' }
      }

      // Build invoice data and open global modal
      const invoiceData = buildInvoiceData(saleDataWithSeller, order)
      openModal(invoiceData, order.id, 'وردەکارییەکانی پسوڵە')
    } catch (error) {
      console.error('Error fetching order details:', error)
      alert('هەڵە لە بارکردنی وردەکارییەکان')
    }
  }

  // Setup real-time subscription for pending sales
  useEffect(() => {
    fetchPendingSales()

    if (!supabase) return

    const subscription = supabase
      .channel('recent_sales_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sales',
        filter: 'status=eq.completed'
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
        className="backdrop-blur-xl rounded-3xl p-6 shadow-lg border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        style={{ 
          background: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-card-border)'
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaEye className="text-2xl" style={{ color: 'var(--theme-accent)' }} />
            <h3 
              className="text-xl font-bold"
              style={{ 
                color: 'var(--theme-foreground)',
                fontFamily: 'var(--font-uni-salar)' 
              }}
            >
              فرۆشتنەکانی ئەمڕۆ
            </h3>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 rounded-full mx-auto mb-4" style={{ borderColor: 'var(--theme-accent)' }}></div>
          <p 
            style={{ 
              color: 'var(--theme-secondary)',
              fontFamily: 'var(--font-uni-salar)' 
            }}
          >
            بارکردن...
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        className="backdrop-blur-xl rounded-3xl p-6 shadow-lg border w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        style={{ 
          background: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-card-border)'
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaEye className="text-2xl" style={{ color: 'var(--theme-accent)' }} />
            <h3 
              className="text-xl font-bold"
              style={{ 
                color: 'var(--theme-foreground)',
                fontFamily: 'var(--font-uni-salar)' 
              }}
            >
              فرۆشتنەکانی ئەمڕۆ
            </h3>
          </div>
          <motion.button
            onClick={() => router.push('/dashboard/invoices')}
            className="px-4 py-2 backdrop-blur-md border shadow-lg transition-all duration-300"
            style={{ 
              background: 'var(--theme-accent)',
              borderColor: 'var(--theme-card-border)',
              color: '#ffffff',
              fontFamily: 'var(--font-uni-salar)'
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            بینینی هەمووی
          </motion.button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr 
                className="border-b"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                <th 
                  className="px-6 py-4 text-right font-bold"
                  style={{ 
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)' 
                  }}
                >
                  کڕیار
                </th>
                <th 
                  className="px-6 py-4 text-right font-bold"
                  style={{ 
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)' 
                  }}
                >
                  بڕ
                </th>
                <th 
                  className="px-6 py-4 text-right font-bold"
                  style={{ 
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)' 
                  }}
                >
                  دۆخ
                </th>
                <th 
                  className="px-6 py-4 text-right font-bold"
                  style={{ 
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)' 
                  }}
                >
                  بەروار
                </th>
                <th 
                  className="px-6 py-4 text-center font-bold"
                  style={{ 
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)' 
                  }}
                >
                  کردار
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    className="border-b transition-colors duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{ 
                      borderColor: 'var(--theme-border)',
                      backgroundColor: 'transparent'
                    }}
                  >
                    <td 
                      className="px-6 py-4 font-medium"
                      style={{ 
                        color: 'var(--theme-foreground)',
                        fontFamily: 'var(--font-uni-salar)' 
                      }}
                    >
                      {order.display_customer_name || 'کڕیاری گشتی'}
                    </td>
                    <td 
                      className="px-6 py-4 font-bold"
                      style={{ 
                        color: 'var(--theme-foreground)',
                        fontFamily: 'Inter, sans-serif' 
                      }}
                    >
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className={`px-1.5 py-0.5 rounded-full text-[0.5rem] sm:text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          order.status === 'refunded' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status === 'completed' ? '✓تەواو' : 
                         order.status === 'pending' ? '⏳چاوەڕوان' : 
                         order.status === 'refunded' ? '↩️گەڕایەوە' : 
                         order.payment_method === 'cash' ? '💵نەخت' : 
                         order.payment_method === 'fib' ? '💳ئۆنلاین' : 
                         '📝 قەرز'}
                      </span>
                    </td>
                    <td 
                      className="px-6 py-4"
                      style={{ 
                        color: 'var(--theme-secondary)',
                        fontFamily: 'Inter, sans-serif' 
                      }}
                    >
                      {new Date(order.date).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <motion.button
                        onClick={() => viewOrderDetails(order)}
                        className="w-10 h-10 backdrop-blur-md border shadow-md transition-colors duration-200 mx-auto"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="بینین"
                        style={{ 
                          background: 'var(--theme-accent)',
                          borderColor: 'var(--theme-card-border)',
                          color: '#ffffff',
                          borderRadius: '0.75rem'
                        }}
                      >
                        <FaEye className="w-5 h-5 mx-auto" />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div 
                      style={{ 
                        color: 'var(--theme-secondary)'
                      }}
                    >
                      <FaShoppingCart className="text-4xl mx-auto mb-4" />
                      <p 
                        className="text-lg"
                        style={{ fontFamily: 'var(--font-uni-salar)' }}
                      >
                        هیچ فرۆشتنێک تۆمارنەکراوە
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
      {/* No local modal - GlobalInvoiceModal is handled by context in layout */}
    </>
  )
}

export default memo(RecentSalesTable)
