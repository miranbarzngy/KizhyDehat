'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/lib/numberUtils'
import { FaShoppingCart, FaBox, FaDollarSign, FaUsers, FaChartLine, FaExclamationTriangle, FaEye, FaArrowUp, FaArrowDown, FaStore, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa'

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
  const router = useRouter()
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
    // Demo mode: show sample data when Supabase is not configured
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
      // Total Sales: Sum of total_price from orders table where status is 'delivered' OR 'paid'
      const { data: salesOrders } = await supabase
        .from('orders')
        .select('total_price')
        .in('status', ['delivered', 'paid'])

      const totalSales = salesOrders?.reduce((sum, order) => sum + order.total_price, 0) || 0

      // Pending Orders: Count rows in orders table where status is 'pending'
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Total Expenses: Sum of amount from the expenses table (includes all categories)
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount')

      const totalExpenses = expensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0

      // Net Profit: Calculate (Total Sales - Total Expenses)
      const netProfit = totalSales - totalExpenses

      // Today's sales (for additional stats)
      const today = new Date().toISOString().split('T')[0]
      const { data: todaySalesData } = await supabase
        .from('orders')
        .select('total_price')
        .in('status', ['delivered', 'paid'])
        .eq('date', today)

      const todaySales = todaySalesData?.reduce((sum, order) => sum + order.total_price, 0) || 0

      // Total customers
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })

      // Low stock count
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('quantity, low_stock_threshold')

      const lowStockCount = inventoryData?.filter(item =>
        item.quantity <= item.low_stock_threshold
      ).length || 0

      setStats({
        totalSales: Math.round(totalSales),
        pendingOrders: pendingOrders || 0,
        totalExpenses: Math.round(totalExpenses),
        netProfit: Math.round(netProfit),
        todaySales: Math.round(todaySales),
        totalCustomers: totalCustomers || 0,
        lowStockCount
      })

      // Chart data for last 7 days (Daily Total Sales - Daily Expenses)
      const chartDataPoints: ChartData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        // Daily sales (delivered or paid orders)
        const { data: daySales } = await supabase
          .from('orders')
          .select('total_price')
          .in('status', ['delivered', 'paid'])
          .eq('date', dateStr)

        const daySalesTotal = daySales?.reduce((sum, order) => sum + order.total_price, 0) || 0

        // Daily expenses
        const { data: dayExpenses } = await supabase
          .from('expenses')
          .select('amount')
          .eq('date', dateStr)

        const dayExpensesTotal = dayExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0

        // Daily profit = Daily Sales - Daily Expenses
        const dayProfit = daySalesTotal - dayExpensesTotal

        chartDataPoints.push({
          date: dateStr,
          sales: Math.round(daySalesTotal),
          expenses: Math.round(dayExpensesTotal),
          profit: Math.round(dayProfit)
        })
      }

      // Recent Orders: Fetch the top 5 most recent rows from the orders table, sorted by created_at DESC
      const { data: recentOrdersData } = await supabase
        .from('orders')
        .select('id, customer_name, total_price, status')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentOrders(recentOrdersData || [])
      setChartData(chartDataPoints)

    } catch (error) {
      console.error('Error fetching stats:', error)
      // Fallback to demo data if there's an error
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
    // Demo mode: show sample shop settings data when Supabase is not configured
    if (!supabase) {
      const demoSettings: ShopSettings = {
        id: 'demo-shop',
        shopname: 'فرۆشگای کوردستان',
        icon: '',
        phone: '+964 750 123 4567',
        location: 'هەولێر، کوردستان',
        qrcodeimage: ''
      }
      setShopSettings(demoSettings)
      return
    }

    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setShopSettings(data || null)
    } catch (error) {
      console.error('Error fetching shop settings:', error)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchShopSettings()
    setupRealtimeSubscription()
  }, [])

  // Real-time subscription setup
  const setupRealtimeSubscription = () => {
    if (!supabase) return

    // Subscribe to orders table changes
    const ordersSubscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        console.log('Orders table changed:', payload)
        // Refresh financial stats when orders data changes
        fetchStats()
      })
      .subscribe()

    // Subscribe to expenses table changes
    const expensesSubscription = supabase
      .channel('expenses_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expenses'
      }, (payload) => {
        console.log('Expenses table changed:', payload)
        // Refresh financial stats when expenses data changes
        fetchStats()
      })
      .subscribe()

    // Subscribe to customers table changes
    const customersSubscription = supabase
      .channel('customers_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'customers'
      }, (payload) => {
        console.log('Customers table changed:', payload)
        // Refresh customer count when customers data changes
        fetchStats()
      })
      .subscribe()

    // Subscribe to inventory table changes
    const inventorySubscription = supabase
      .channel('inventory_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inventory'
      }, (payload) => {
        console.log('Inventory table changed:', payload)
        // Refresh low stock count when inventory data changes
        fetchStats()
      })
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      ordersSubscription.unsubscribe()
      expensesSubscription.unsubscribe()
      customersSubscription.unsubscribe()
      inventorySubscription.unsubscribe()
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  const hoverVariants = {
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                داشبۆردی دارایی
              </h1>
              <p className="text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                پێشبینینی گشتیی کاروباری فرۆشگاکەت
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                

                </p>
                <p className="text-lg font-bold text-blue-600">
                  {new Date().toLocaleDateString('ku')}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              className="group bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:shadow-2xl border border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer"
              onClick={() => router.push('/dashboard/sales')}
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FaShoppingCart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  فرۆشتن نوێ
                </h3>
                <p className="text-gray-600 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  تۆمارکردنی فرۆشتنی نوێ
                </p>
              </div>
            </motion.div>

            <motion.div
              className="group bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:shadow-2xl border border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer"
              onClick={() => router.push('/dashboard/inventory')}
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FaBox className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کاڵاکان
                </h3>
                <p className="text-gray-600 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  بەڕێوەبردنی کۆگا
                </p>
              </div>
            </motion.div>

            <motion.div
              className="group bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:shadow-2xl border border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer"
              onClick={() => router.push('/dashboard/customers')}
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FaUsers className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کڕیاران
                </h3>
                <p className="text-gray-600 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  بەڕێوەبردنی کڕیاران
                </p>
              </div>
            </motion.div>

            <motion.div
              className="group bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:shadow-2xl border border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer"
              onClick={() => router.push('/dashboard/expenses')}
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FaDollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  خەرجییەکان
                </h3>
                <p className="text-gray-600 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  تۆمارکردنی خەرجییەکان
                </p>
              </div>
            </motion.div>
          </div>

          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center">
                  <FaShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  <FaArrowUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500 font-medium">+12%</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                کۆی فرۆشتن
              </h3>
              <p className="text-3xl font-bold text-blue-600 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                {formatCurrency(stats.totalSales)}
              </p>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                لەم مانگەدا
              </p>
            </motion.div>

            <motion.div
              className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center">
                  <FaCalendarAlt className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  <FaArrowDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-500 font-medium">-5%</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                داواکارییەکان
              </h3>
              <p className="text-3xl font-bold text-yellow-600 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                {stats.pendingOrders}
              </p>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                چاوەڕوانکراو
              </p>
            </motion.div>

            <motion.div
              className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl flex items-center justify-center">
                  <FaMoneyBillWave className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  <FaArrowUp className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-500 font-medium">+8%</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                خەرجییەکان
              </h3>
              <p className="text-3xl font-bold text-red-600 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                {formatCurrency(stats.totalExpenses)}
              </p>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                لەم مانگەدا
              </p>
            </motion.div>

            <motion.div
              className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stats.netProfit >= 0 ? 'bg-gradient-to-br from-green-400 to-green-500' : 'bg-gradient-to-br from-red-400 to-red-500'}`}>
                  <FaChartLine className={`w-6 h-6 text-white`} />
                </div>
                <div className="flex items-center space-x-1">
                  <FaArrowUp className={`w-4 h-4 ${stats.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm font-medium ${stats.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats.netProfit >= 0 ? '+15%' : '-10%'}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                قازانج
              </h3>
              <p className={`text-3xl font-bold mb-1 ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                {formatCurrency(Math.abs(stats.netProfit))}
              </p>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                {stats.netProfit >= 0 ? 'قازانجی پاک' : 'زیان'}
              </p>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Profit Trend Chart */}
            <motion.div
              className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <FaChartLine className="text-blue-500 text-2xl" />
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  تەوەری قازانج
                </h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => new Date(date).toLocaleDateString('ku', { month: 'short', day: 'numeric' })}
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      labelFormatter={(date) => new Date(date).toLocaleDateString('ku')}
                      formatter={(value: number | undefined) => [`${formatCurrency(Math.abs(value || 0))}`, value && value >= 0 ? 'قازانج' : 'زیان']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Additional Stats */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              {/* Today's Sales */}
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center">
                      <FaMoneyBillWave className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        فرۆشتنی ئەمڕۆ
                      </h4>
                      <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        کۆی فرۆشتن
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {formatCurrency(stats.todaySales)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customers */}
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center">
                      <FaUsers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        کڕیاران
                      </h4>
                      <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        کڕیاری تۆمارکراو
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {stats.totalCustomers}
                    </p>
                  </div>
                </div>
              </div>

              {/* Low Stock Alert */}
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center">
                      <FaExclamationTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        کەم کۆگا
                      </h4>
                      <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        کاڵای کەم کۆگا
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {stats.lowStockCount}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Orders */}
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
                  دوایین فرۆشتنەکان
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
                    <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      کڕیار
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      بڕ
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      دۆخ
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      بەروار
                    </th>
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
                          {order.customer_name || 'نەناسراو'}
                        </td>
                        <td className="px-6 py-4 text-gray-800 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {formatCurrency(order.total_price)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'paid' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status === 'delivered' ? 'گەیشت' :
                             order.status === 'shipped' ? 'نێردرا' :
                             order.status === 'paid' ? 'پارەدراو' :
                             'چاوەڕوان'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {new Date().toLocaleDateString('ku')}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="text-gray-400">
                          <FaShoppingCart className="text-4xl mx-auto mb-4" />
                          <p className="text-lg" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            هیچ فرۆشتنێک نیە
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
