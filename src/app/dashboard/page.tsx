'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import DashboardCharts from './_components/DashboardCharts.tsx'
import RecentSalesTable from './_components/RecentSalesTable.tsx'
import StatCards from './_components/StatCards.tsx'

// Gradient Clock Widget Component
function GradientClockWidget() {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Get hours, minutes, seconds and AM/PM
  const hours = currentTime.getHours()
  const minutes = currentTime.getMinutes()
  const seconds = currentTime.getSeconds()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  
  // Convert to 12-hour format
  const displayHours = hours % 12 || 12
  const displayMinutes = minutes.toString().padStart(2, '0')
  const displaySeconds = seconds.toString().padStart(2, '0')

  // Format date in Kurdish - week day and date on same line
  const kurdishDays = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە']
  const dayName = kurdishDays[currentTime.getDay()]
  const dayNumber = currentTime.getDate()
  const monthNumber = currentTime.getMonth() + 1
  const formattedDate = `${dayNumber}-${monthNumber} ~~ ${dayName}`

  return (
    <div 
      className="px-6 py-4 rounded-2xl shadow-lg"
      style={{
        background: 'linear-gradient(145deg, #0f1729, #1a1f35)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        minWidth: '200px'
      }}
    >
      {/* Time Display */}
      <div dir="ltr" className="flex items-start justify-center gap-1">
        {/* Hours */}
        <span 
          className="text-4xl md:text-5xl font-bold"
          style={{
            background: 'linear-gradient(90deg, #67e8f9, #a855f7, #f472b6, #fb923c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          {displayHours}
        </span>

        {/* Colon */}
        <span 
          className="text-4xl md:text-5xl font-bold mt-1"
          style={{
            background: 'linear-gradient(90deg, #67e8f9, #a855f7, #f472b6, #fb923c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          :
        </span>

        {/* Minutes */}
        <span 
          className="text-4xl md:text-5xl font-bold"
          style={{
            background: 'linear-gradient(90deg, #67e8f9, #a855f7, #f472b6, #fb923c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          {displayMinutes}
        </span>

        {/* Comma and Seconds */}
        <span 
          className="text-2xl md:text-3xl font-bold mt-2"
          style={{
            background: 'linear-gradient(90deg, #67e8f9, #a855f7, #f472b6, #fb923c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
           :{displaySeconds}
        </span>

        {/* AM/PM */}
        <span 
          className="text-sm font-semibold mt-2 mr-1"
          style={{
            color: '#fbbf24',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          {ampm}
        </span>
      </div>

      {/* Date Display */}
      <div className="mt-2 text-center">
        <span 
          className="text-sm md:text-base"
          style={{
            background: 'linear-gradient(90deg, #c084fc, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: 'var(--font-uni-salar)'
          }}
        >
          {formattedDate}
        </span>
      </div>
    </div>
  )
}

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
  const [currentTime, setCurrentTime] = useState(new Date())
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
      // Get current month as YYYY-MM strings
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
      const currentMonthStr = `${currentYear}-${currentMonth}`
      
      console.log('Looking for current month:', currentMonthStr)

      // Fetch ALL sales
      const { data: allSalesData, error: salesError } = await supabase.from('sales')
        .select('total, subtotal, discount_amount, date, status')
      
      if (salesError) {
        console.error('Error fetching sales:', salesError)
      }
      console.log('Total sales fetched:', allSalesData?.length || 0)
      console.log('Sample sales:', allSalesData?.slice(0, 3))
      
      // Filter by comparing YYYY-MM strings (avoid timezone issues)
      const completedStatuses = ['completed', 'delivered', 'sold', null, undefined, '']
      
      const monthlySales = allSalesData?.filter((sale: any) => {
        if (!sale.date) return false
        // Extract YYYY-MM from the date
        const saleMonth = sale.date.substring(0, 7)
        const isInMonth = saleMonth === currentMonthStr
        // Include sales with any status that's considered "completed" OR no status at all (legacy data)
        const isCompleted = !sale?.status || completedStatuses.includes(sale?.status)
        return isInMonth && isCompleted
      }) || []
      
      console.log('Monthly sales found:', monthlySales.length, 'month:', currentMonthStr)
      const totalSales = monthlySales.reduce((sum, sale) => sum + (sale.total || 0), 0)
      console.log('Total sales value:', totalSales)

      // Count pending orders
      const pendingOrders = allSalesData?.filter((sale: any) => sale.status === 'pending').length || 0

      // Get all sale_items
      const { data: allSaleItems } = await supabase.from('sale_items')
        .select('quantity, cost_price, sales!inner(status, date)')
      
      // Filter for completed sales in this month
      const monthlySaleItems = allSaleItems?.filter((item: any) => {
        if (!item.sales?.date) return false
        const saleMonth = item.sales.date.substring(0, 7)
        const isInMonth = saleMonth === currentMonthStr
        const isCompleted = !item.sales?.status || completedStatuses.includes(item.sales.status)
        return isInMonth && isCompleted
      }) || []
      
      const inventoryExpenses = monthlySaleItems.reduce((sum, item) => 
        sum + ((item.cost_price || 0) * (item.quantity || 0)), 0)

      // Get all expenses
      const { data: allExpenses } = await supabase.from('expenses')
        .select('amount, date')
      
      const monthlyExpenses = allExpenses?.filter((expense: any) => {
        if (!expense.date) return false
        const expenseMonth = expense.date.substring(0, 10) // YYYY-MM-DD
        return expenseMonth.startsWith(currentMonthStr)
      }) || []
      
      const generalExpenses = monthlyExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
      const totalExpenses = inventoryExpenses + generalExpenses
      const netProfit = totalSales - totalExpenses
      console.log('Total expenses:', totalExpenses, 'Net profit:', netProfit)

      // Get today's date as YYYY-MM-DD
      const todayStr = `${currentYear}-${currentMonth}-${String(now.getDate()).padStart(2, '0')}`
      
      // Filter client-side for today's date
      const todaySalesList = allSalesData?.filter((sale: any) => {
        if (!sale.date) return false
        // Extract YYYY-MM-DD from the date
        const saleDate = sale.date.substring(0, 10)
        const isCompleted = !sale?.status || completedStatuses.includes(sale?.status)
        return saleDate === todayStr && isCompleted
      }) || []
      
      const todaySales = todaySalesList.reduce((sum, sale) => sum + (sale.total || 0), 0)
      console.log('Today sales found:', todaySalesList.length, 'Date:', todayStr, 'Total:', todaySales)

      const { count: totalCustomers } = await supabase.from('customers').select('*', { count: 'exact', head: true })

      // Query products table for low stock items (count items with total_amount_bought <= 10)
      let lowStockCount = 0
      try {
        // Get all products with total_amount_bought, exclude null/empty
        const { data: productsData, error } = await supabase.from('products')
          .select('total_amount_bought')
          .not('total_amount_bought', 'is', null)
          .neq('total_amount_bought', 0)
        
        if (error) {
          console.log('Error fetching products:', error.message)
          lowStockCount = 0
        } else {
          console.log('Products data sample:', productsData?.slice(0, 10))
          console.log('All product stock amounts:', productsData?.map(i => i.total_amount_bought))
          
          // Count items with total_amount_bought between 1 and 10 (positive stock only)
          lowStockCount = productsData?.filter(item => {
            // Convert to number explicitly to handle string values from database
            const qty = Number(item.total_amount_bought)
            // Only count POSITIVE stock between 1 and 10
            if (isNaN(qty) || qty <= 0) return false
            // Threshold of 10
            return qty <= 10
          }).length || 0
        }
        console.log('Low stock count:', lowStockCount)
      } catch (err) {
        console.log('Error fetching low stock:', err)
        lowStockCount = 0
      }

      setStats({
        totalSales: Math.round(totalSales),
        pendingOrders: pendingOrders || 0,
        totalExpenses: Math.round(totalExpenses),
        netProfit: Math.round(netProfit),
        todaySales: Math.round(todaySales),
        totalCustomers: totalCustomers || 0,
        lowStockCount
      })

      // Prepare chart data - filter for completed sales (including legacy records with no status)
      const chartSales = allSalesData?.filter((sale: any) => 
        !sale?.status || completedStatuses.includes(sale?.status)
      ) || []
      const chartExpenses = allExpenses || []
      console.log('Chart sales (all time):', chartSales.length)
      
      // Build chart data for last 7 days using string comparison
      const chartDataPoints: ChartData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        
        // Build date string in YYYY-MM-DD format
        const dateYear = date.getFullYear()
        const dateMonth = String(date.getMonth() + 1).padStart(2, '0')
        const dateDay = String(date.getDate()).padStart(2, '0')
        const dateStr = `${dateYear}-${dateMonth}-${dateDay}`
        
        // Filter sales using string comparison
        const daySales = chartSales.filter((sale: any) => {
          if (!sale.date) return false
          return sale.date.substring(0, 10) === dateStr
        })
        const daySalesTotal = daySales.reduce((sum, sale) => sum + (sale.total || 0), 0)
        
        // Filter expenses using string comparison
        const dayExpensesList = chartExpenses.filter((expense: any) => {
          if (!expense.date) return false
          return expense.date.substring(0, 10) === dateStr
        })
        const dayExpensesTotal = dayExpensesList.reduce((sum, expense) => sum + (expense.amount || 0), 0)
        
        const dayProfit = daySalesTotal - dayExpensesTotal

        chartDataPoints.push({
          date: dateStr,
          sales: Math.round(daySalesTotal),
          expenses: Math.round(dayExpensesTotal),
          profit: Math.round(dayProfit)
        })
      }
      console.log('Chart data:', chartDataPoints)

      const { data: recentSalesData } = await supabase
        .from('sales')
        .select('id, total, payment_method, date, status, customers(name)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5)

      const transformedRecentSales = recentSalesData?.map(sale => ({
        id: sale.id,
        customer_name: sale.customers?.[0]?.name || 'نەناسراو',
        total_price: sale.total,
        status: sale.status === 'pending' ? 'pending' : sale.status === 'completed' ? (sale.payment_method === 'cash' ? 'paid' : sale.payment_method === 'fib' ? 'paid' : 'debt') : 'refunded'
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
        shopname: 'کلیک گروپ',
        icon: '',
        phone: '+964 750 123 4567',
        location: 'هەولێر، کوردستان',
        qrcodeimage: ''
      })
      return
    }

    try {
      // Use invoice_settings table (shop_settings was deleted)
      const { data, error } = await supabase.from('invoice_settings').select('*').single()
      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        // Map invoice_settings to shopSettings format
        setShopSettings({
          id: data.id,
          shopname: data.shop_name || '',
          icon: data.shop_logo || '',
          phone: data.shop_phone || '',
          location: data.shop_address || '',
          qrcodeimage: data.qr_code_url || ''
        })
      } else {
        setShopSettings(null)
      }
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

  // Real-time clock - update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Format time in 12-hour format
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })

  // Format date in Kurdish
  const formattedDate = currentTime.toLocaleDateString('ku')

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 
              className="text-4xl font-bold mb-2"
              style={{ 
                color: 'var(--theme-foreground)',
                fontFamily: 'var(--font-uni-salar)' 
              }}
            >
              داشبۆردی دارایی
            </h1>
            <p 
              style={{ 
                color: 'var(--theme-secondary)',
                fontFamily: 'var(--font-uni-salar)' 
              }}
            >
              پێشبینینی گشتیی کاروباری فرۆشگاکەت
            </p>
          </div>
          {/* Gradient Clock Widget */}
          <GradientClockWidget />
        </div>

        {/* Quick Action & Main Stats Cards */}
        <StatCards stats={stats} />

        {/* Charts & Additional Stats */}
        <DashboardCharts chartData={chartData} stats={{ todaySales: stats.todaySales, totalCustomers: stats.totalCustomers, lowStockCount: stats.lowStockCount, pendingSales: stats.pendingOrders }} />

        {/* Recent Sales Table */}
        <RecentSalesTable />
      </motion.div>
    </div>
  )
}
