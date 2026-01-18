'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartData {
  date: string
  profit: number
}

interface RecentOrder {
  id: string
  customer_name: string
  total_price: number
  status: string
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

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>داشبۆردی دارایی</h1>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => router.push('/dashboard/sales')}
          className="p-2 rounded-xl shadow-md backdrop-blur-md border transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.3)',
            color: '#3b82f6'
          }}
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xl">🛒</span>
            <div className="text-center">
              <div className="text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>تۆمارکردنی فرۆشتن</div>
              <div className="text-xs opacity-75">New Order</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/dashboard/inventory')}
          className="p-2 rounded-xl shadow-md backdrop-blur-md border transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            color: '#10b981'
          }}
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xl">📦</span>
            <div className="text-center">
              <div className="text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>زیادکردنی کاڵا</div>
              <div className="text-xs opacity-75">Add Product</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/dashboard/expenses')}
          className="p-2 rounded-xl shadow-md backdrop-blur-md border transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#ef4444'
          }}
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xl">💸</span>
            <div className="text-center">
              <div className="text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>خەرجی نوێ</div>
              <div className="text-xs opacity-75">Add Expense</div>
            </div>
          </div>
        </button>
      </div>

      {/* Main Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`p-6 rounded-2xl shadow-lg backdrop-blur-md border text-center ${theme === 'colourful' ? 'colourful-card' : ''}`} style={{
          background: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          color: '#3b82f6'
        }}>
          <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی فرۆشتن</h3>
          <p className="numerical-value text-2xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '1.15em' }}>{Math.round(stats.totalSales)} د.ع</p>
          <p className="text-sm opacity-75">Total sales</p>
        </div>

        <div className={`p-6 rounded-2xl shadow-lg backdrop-blur-md border text-center ${theme === 'colourful' ? 'colourful-card' : ''}`} style={{
          background: 'rgba(251, 191, 36, 0.1)',
          borderColor: 'rgba(251, 191, 36, 0.3)',
          color: '#f59e0b'
        }}>
          <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>داواکارییە نوێیەکان</h3>
          <p className="numerical-value text-2xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '1.15em' }}>{stats.pendingOrders}</p>
          <p className="text-sm opacity-75">Pending Orders</p>
        </div>

        <div className={`p-6 rounded-2xl shadow-lg backdrop-blur-md border text-center ${theme === 'colourful' ? 'colourful-card' : ''}`} style={{
          background: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          color: '#ef4444'
        }}>
          <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی خەرجییەکان</h3>
          <p className="numerical-value text-2xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '1.15em' }}>{Math.round(stats.totalExpenses)} د.ع</p>
          <p className="text-sm opacity-75">Total Expenses</p>
        </div>

        <div className={`p-6 rounded-2xl shadow-lg backdrop-blur-md border text-center ${theme === 'colourful' ? 'colourful-card' : ''}`} style={{
          background: stats.netProfit >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderColor: stats.netProfit >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
          color: stats.netProfit >= 0 ? '#10b981' : '#ef4444'
        }}>
          <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>قازانجی پاک</h3>
          <p className={`numerical-value text-2xl font-bold ${theme === 'black-gold' ? 'gold-text-glow' : ''}`} style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '1.15em' }}>
            {Math.round(stats.netProfit)} د.ع
          </p>
          <p className="text-sm opacity-75">Net Profit</p>
        </div>
      </div>

      {/* Profit Trend Chart */}
      <div className="backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-8" style={{ background: 'var(--theme-card-bg)' }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--theme-primary)' }}>تەوەری قازانج (٧ ڕۆژی ڕابردوو)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('ku')}
                stroke="var(--theme-secondary)"
              />
              <YAxis stroke="var(--theme-secondary)" />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString('ku')}
                formatter={(value: number | undefined) => [`${Math.round(value || 0)} د.ع`, 'قازانج']}
                contentStyle={{
                  backgroundColor: 'var(--theme-card-bg)',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '8px',
                  color: 'var(--theme-primary)'
                }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="var(--theme-chart-color)"
                strokeWidth={3}
                dot={{ fill: 'var(--theme-chart-color)', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-lg shadow-md ${theme === 'colourful' ? 'colourful-card' : ''}`} style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
          <h3 className="text-lg font-semibold accessible-secondary">فرۆشتنی ئەمڕۆ</h3>
          <p className={`numerical-value ${theme === 'black-gold' ? 'gold-text-glow' : ''}`} style={{ color: 'var(--theme-accent)', fontFamily: 'var(--font-uni-salar)', fontSize: '1.15em' }}>{Math.round(stats.todaySales)} د.ع</p>
        </div>

        <div className={`p-6 rounded-lg shadow-md ${theme === 'colourful' ? 'colourful-card' : ''}`} style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
          <h3 className="text-lg font-semibold accessible-secondary">کڕیاران</h3>
          <p className="numerical-value text-green-600">{stats.totalCustomers}</p>
        </div>

        <div className={`p-6 rounded-lg shadow-md ${theme === 'colourful' ? 'colourful-card' : ''}`} style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
          <h3 className="text-lg font-semibold accessible-secondary">کەم کۆگا</h3>
          <p className="numerical-value text-orange-600">{stats.lowStockCount}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className={`p-6 rounded-2xl shadow-lg backdrop-blur-md mt-8 ${theme === 'colourful' ? 'colourful-card' : ''}`} style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
        <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>دوایین داواکارییەکان (فرۆشتن)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>ناوی کڕیار</th>
                <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>بڕی گشتی</th>
                <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>دۆخ</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order, index) => (
                  <tr key={order.id} style={{ borderBottom: index < recentOrders.length - 1 ? '1px solid var(--theme-border)' : 'none' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                      {order.customer_name || 'کڕیاری نەناسراو'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="numerical-value font-semibold" style={{ color: 'var(--theme-accent)', fontFamily: 'var(--font-uni-salar)', fontSize: '1.15em' }}>
                        {Math.round(order.total_price)} د.ع
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: order.status === 'delivered' ? '#d1fae5' :
                                         order.status === 'shipped' ? '#dbeafe' :
                                         order.status === 'paid' ? '#d1fae5' : '#fef3c7',
                          color: order.status === 'delivered' ? '#10b981' :
                                order.status === 'shipped' ? '#3b82f6' :
                                order.status === 'paid' ? '#10b981' : '#f59e0b'
                        }}
                      >
                        {order.status === 'delivered' ? 'گەیشت' :
                         order.status === 'shipped' ? 'نێردرا' :
                         order.status === 'paid' ? 'پارەدراو' : 'چاوەڕوان'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    هیچ داواکارییەک نیە
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
