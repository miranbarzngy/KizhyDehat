'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartData {
  date: string
  profit: number
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    grossProfit: 0,
    totalExpenses: 0,
    netProfit: 0,
    todaySales: 0,
    totalCustomers: 0,
    lowStockCount: 0
  })
  const [chartData, setChartData] = useState<ChartData[]>([])

  const fetchStats = async () => {
    // Demo mode: show sample data when Supabase is not configured
    if (!supabase) {
      setStats({
        grossProfit: 12500.50,
        totalExpenses: 8750.25,
        netProfit: 3750.25,
        todaySales: 2450.75,
        totalCustomers: 47,
        lowStockCount: 3
      })

      // Sample chart data for last 7 days
      const chartDataPoints: ChartData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        chartDataPoints.push({
          date: dateStr,
          profit: Math.floor(Math.random() * 1000) + 200 // Random profit between 200-1200
        })
      }
      setChartData(chartDataPoints)
      return
    }

    try {
      // Get date range for last 7 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 6)

      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      // Gross Profit: Total Sales - Cost of Goods
      const { data: salesData } = await supabase
        .from('sale_items')
        .select('price, cost_price, quantity')

      const totalSales = salesData?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
      const costOfGoods = salesData?.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0) || 0
      const grossProfit = totalSales - costOfGoods

      // Total Expenses: Salaries + General Expenses
      const { data: paidPayroll } = await supabase
        .from('payroll')
        .select('paid_amount')
        .eq('status', 'paid')

      const salaryExpenses = paidPayroll?.reduce((sum, p) => sum + p.paid_amount, 0) || 0

      const { data: generalExpenses } = await supabase
        .from('expenses')
        .select('amount')

      const otherExpenses = generalExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0
      const totalExpenses = salaryExpenses + otherExpenses

      const netProfit = grossProfit - totalExpenses

      // Today's sales
      const today = new Date().toISOString().split('T')[0]
      const { data: todaySalesData } = await supabase
        .from('sales')
        .select('total')
        .eq('date', today)

      const todaySales = todaySalesData?.reduce((sum, sale) => sum + sale.total, 0) || 0

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
        grossProfit,
        totalExpenses,
        netProfit,
        todaySales,
        totalCustomers: totalCustomers || 0,
        lowStockCount
      })

      // Chart data for last 7 days
      const chartDataPoints: ChartData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        const { data: daySales } = await supabase
          .from('sale_items')
          .select('price, cost_price, quantity, sales!inner(date)')
          .eq('sales.date', dateStr)

        const dayProfit = daySales?.reduce((sum, item) =>
          sum + (item.price - item.cost_price) * item.quantity, 0
        ) || 0

        chartDataPoints.push({
          date: dateStr,
          profit: dayProfit
        })
      }
      setChartData(chartDataPoints)

    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">داشبۆردی دارایی</h1>

      {/* Main Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">قازانجی گشتی</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.grossProfit.toFixed(2)} د.ع</p>
          <p className="text-sm text-gray-600">فرۆشتن - نرخی کڕین</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-l-4 border-red-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">کۆی خەرجییەکان</h3>
          <p className="text-3xl font-bold text-red-600">{stats.totalExpenses.toFixed(2)} د.ع</p>
          <p className="text-sm text-gray-600">مووچە + خەرجییەکان</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">قازانجی پوخت</h3>
          <p className={`text-3xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.netProfit.toFixed(2)} د.ع
          </p>
          <p className="text-sm text-gray-600">قازانجی گشتی - خەرجییەکان</p>
        </div>
      </div>

      {/* Profit Trend Chart */}
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">تەوەری قازانج (٧ ڕۆژی ڕابردوو)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('ku')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString('ku')}
                formatter={(value: number | undefined) => [`${(value || 0).toFixed(2)} د.ع`, 'قازانج']}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">فرۆشتنی ئەمڕۆ</h3>
          <p className="text-2xl font-bold text-indigo-600">{stats.todaySales.toFixed(2)} د.ع</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">کڕیاران</h3>
          <p className="text-2xl font-bold text-green-600">{stats.totalCustomers}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">کەم کۆگا</h3>
          <p className="text-2xl font-bold text-orange-600">{stats.lowStockCount}</p>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">زانیاری بەکارهێنەر</h2>
        <div className="space-y-2">
          <p><strong>ناو:</strong> {profile?.role?.name}</p>
          <p><strong>ڕۆڵ:</strong> {profile?.role?.name}</p>
          <p><strong>مۆڵەتەکان:</strong> {Object.keys(profile?.role?.permissions || {}).filter(key => profile?.role?.permissions[key]).join(', ')}</p>
        </div>
      </div>
    </div>
  )
}
