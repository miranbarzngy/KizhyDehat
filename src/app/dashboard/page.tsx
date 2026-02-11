'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import StatCards from './_components/StatCards'
import DashboardCharts from './_components/DashboardCharts'
import RecentSalesTable from './_components/RecentSalesTable'

interface ChartData {
  date: string
  sales: number
  expenses: number
  profit: number
}

interface RecentOrder {
  id: string
  customer_name: string
  total_price: number
  status: string
}

interface ShopSettings {
  id: string
  shopname: string
  icon: string
  phone: string
  location: string
  qrcodeimage: string
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { theme } = useTheme()
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    totalExpenses: 0,
    netProfit: 0,
    todaySales: 0,
    totalCustomers: 0,
    lowStockCount: 0
  })
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)

  const fetchStats = async () => {
    if (!supabase) {
      setStats({
        totalSales: 12500,
        pendingOrders: 8,
        totalExpenses: 8750,
        netProfit: 3750,
        todaySales: 2450,
        totalCustomers: 47,
        lowStockCount: 3
      })
      return
    }

    try {
      const { data: salesData } = await supabase.from('sales').select('total, subtotal, discount_amount')
      const totalSales = salesData?.reduce((sum, sale) => sum + sale.total, 0) || 0

      const { data: inventoryData } = await supabase.from('sale_items').select('quantity, cost_price')
      const inventoryExpenses = inventoryData?.reduce((sum, item) => 
        sum + (item.cost_price || 0) * (item.quantity || 0), 0) || 0

      const { data: expensesData } = await supabase.from('expenses').select('amount')
      const generalExpenses = expensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0
      const totalExpenses = inventoryExpenses + generalExpenses
      const netProfit = totalSales - totalExpenses

      const today = new Date().toISOString().split('T')[0]
      const { data: todaySalesData } = await supabase.from('sales').select('total, date').eq('date', today)
      const todaySales = todaySalesData?.reduce((sum, sale) => sum + sale.total, 0) || 0

      const { count: totalCustomers } = await supabase.from('customers').select('*', { count: 'exact', head: true })

      const { data: inventoryThresholdData } = await supabase.from('inventory').select('quantity, low_stock_threshold')
      const lowStockCount = inventoryThresholdData?.filter(item => item.quantity <= item.low_stock_threshold).length || 0

      setStats({
        totalSales: Math.round(totalSales),
        pendingOrders: 0,
        totalExpenses: Math.round(totalExpenses),
        netProfit: Math.round(netProfit),
        todaySales: Math.round(todaySales),
        totalCustomers: totalCustomers || 0,
        lowStockCount
      })

      const chartDataPoints: ChartData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        const { data: daySales } = await supabase.from('sales').select('total').eq('date', dateStr)
        const daySalesTotal = daySales?.reduce((sum, sale) => sum + sale.total, 0) || 0

        const { data: dayExpenses } = await supabase.from('expenses').select('amount').eq('date', dateStr)
        const dayExpensesTotal = dayExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0
        const dayProfit = daySalesTotal - dayExpensesTotal

        chartDataPoints.push({
          date: dateStr,
          sales: Math.round(daySalesTotal),
          expenses: Math.round(dayExpensesTotal),
          profit: Math.round(dayProfit)
        })
      }

      const { data: recentSalesData } = await supabase
        .from('sales')
        .select('id, total, payment_method, date, customers(name)')
        .order('created_at', { ascending: false })
        .limit(5)

      const transformedRecentSales = recentSalesData?.map(sale => ({
        id: sale.id,
        customer_name: sale.customers?.[0]?.name || 'نەناسراو',
        total_price: sale.total,
        status: sale.payment_method === 'cash' ? 'paid' : sale.payment_method === 'fib' ? 'paid' : 'debt'
      })) || []

      setRecentOrders(transformedRecentSales)
      setChartData(chartDataPoints)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({
        totalSales: 12500,
        pendingOrders: 8,
        totalExpenses: 8750,
        netProfit: 3750,
        todaySales: 2450,
        totalCustomers: 47,
        lowStockCount: 3
      })
    }
  }

  const fetchShopSettings = async () => {
    if (!supabase) {
      setShopSettings({
        id: 'demo-shop',
        shopname: 'فرۆشگای کوردستان',
        icon: '',
        phone: '+964 750 123 4567',
        location: 'هەولێر، کوردستان',
        qrcodeimage: ''
      })
      return
    }

    try {
      const { data, error } = await supabase.from('shop_settings').select('*').single()
      if (error && error.code !== 'PGRST116') throw error
      setShopSettings(data || null)
    } catch (error) {
      console.error('Error fetching shop settings:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!supabase) return

    const channels = [
      { name: 'sales_changes', table: 'sales' },
      { name: 'expenses_changes', table: 'expenses' },
      { name: 'customers_changes', table: 'customers' },
      { name: 'inventory_changes', table: 'inventory' }
    ]

    const subscriptions = channels.map(({ name, table }) =>
      supabase.channel(name).on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        fetchStats()
      }).subscribe()
    )

    return () => subscriptions.forEach(sub => sub.unsubscribe())
  }

  useEffect(() => {
    fetchStats()
    fetchShopSettings()
    const cleanup = setupRealtimeSubscription()
    return cleanup
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                داشبۆردی دارایی
              </h1>
              <p className="text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                پێشبینینی گشتیی کاروباری فرۆشگاکەت
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-400">
                {new Date().toLocaleDateString('ku')}
              </p>
            </div>
          </div>

          {/* Quick Action & Main Stats Cards */}
          <StatCards stats={stats} />

          {/* Charts & Additional Stats */}
          <DashboardCharts chartData={chartData} stats={{ todaySales: stats.todaySales, totalCustomers: stats.totalCustomers, lowStockCount: stats.lowStockCount }} />

          {/* Recent Sales Table */}
          <RecentSalesTable />
        </motion.div>
      </div>
    </div>
  )
}
