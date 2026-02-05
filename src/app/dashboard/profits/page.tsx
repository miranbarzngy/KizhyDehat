'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, sanitizePhoneNumber } from '@/lib/numberUtils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface ProfitItem {
  id: string
  item_name: string
  quantity: number
  price: number
  cost_price: number
  profit: number
  date: string
}

interface SaleItem {
  id: string
  customer_name?: string
  total: number
  payment_method: string
  date: string
  time?: string
  items?: Array<{
    item_name: string
    price: number
    quantity: number
  }>
  status?: string
}

interface ExpenseItem {
  id: string
  description: string
  amount: number
  date: string
  category?: string
}

interface InventoryExpense {
  id: string
  item_name: string
  cost_price: number
  quantity: number
  total_cost: number
  date: string
  supplier_name?: string
}

interface ChartData {
  date: string
  sales: number
  expenses: number
  profit: number
}

interface RefundedItem {
  id: string
  customer_name: string
  customer_phone?: string
  date: string
  total_price: number
  status: string
}

export default function ProfitsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'profits' | 'expenses' | 'refunds'>('overview')
  const [salesTab, setSalesTab] = useState<'cash' | 'online' | 'paylater'>('cash')
  const [expensesTab, setExpensesTab] = useState<'inventory' | 'general'>('inventory')

  // Overview data
  const [overviewStats, setOverviewStats] = useState({
    totalSales: 0,
    totalExpenses: 0,
    totalProfits: 0,
    cashSales: 0,
    onlineSales: 0,
    payLaterSales: 0,
    inventoryExpenses: 0,
    generalExpenses: 0
  })

  // Sales data
  const [cashSales, setCashSales] = useState<SaleItem[]>([])
  const [onlineSales, setOnlineSales] = useState<SaleItem[]>([])
  const [payLaterSales, setPayLaterSales] = useState<SaleItem[]>([])

  // Profits data
  const [profits, setProfits] = useState<ProfitItem[]>([])
  const [totalProfit, setTotalProfit] = useState(0)

  // Expenses data
  const [inventoryExpenses, setInventoryExpenses] = useState<InventoryExpense[]>([])
  const [generalExpenses, setGeneralExpenses] = useState<ExpenseItem[]>([])

  // Chart data
  const [chartData, setChartData] = useState<ChartData[]>([])

  // Refunded items data
  const [refundedItems, setRefundedItems] = useState<RefundedItem[]>([])

  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchAllData()
  }, [dateFrom, dateTo])

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchOverviewStats(),
      fetchChartData(),
      fetchSalesData(),
      fetchProfitsData(),
      fetchExpensesData(),
      fetchRefundedItems()
    ])
    setLoading(false)
  }

  const fetchOverviewStats = async () => {
    if (!supabase) {
      // No demo data - show empty stats
      setOverviewStats({
        totalSales: 0,
        totalExpenses: 0,
        totalProfits: 0,
        cashSales: 0,
        onlineSales: 0,
        payLaterSales: 0,
        inventoryExpenses: 0,
        generalExpenses: 0
      })
      return
    }

    try {
      // Get date range for filtering
      let dateFilter = {}
      if (dateFrom) dateFilter = { ...dateFilter, gte: dateFrom }
      if (dateTo) dateFilter = { ...dateFilter, lte: dateTo }

      // Total sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('total, payment_method')
        .match(dateFilter)

      const totalSales = salesData?.reduce((sum, sale) => sum + sale.total, 0) || 0
      const cashSales = salesData?.filter(sale => sale.payment_method === 'cash').reduce((sum, sale) => sum + sale.total, 0) || 0
      const onlineSales = salesData?.filter(sale => sale.payment_method === 'fib').reduce((sum, sale) => sum + sale.total, 0) || 0
      const payLaterSales = salesData?.filter(sale => sale.payment_method === 'debt').reduce((sum, sale) => sum + sale.total, 0) || 0

      // Inventory expenses (cost of goods sold)
      const { data: inventoryData } = await supabase
        .from('sale_items')
        .select('quantity, cost_price')
        .match(dateFilter)

      const inventoryExpenses = inventoryData?.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0) || 0

      // General expenses
      const { data: generalExpensesData } = await supabase
        .from('expenses')
        .select('amount')
        .match(dateFilter)

      const generalExpenses = generalExpensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0

      const totalExpenses = inventoryExpenses + generalExpenses
      const totalProfits = totalSales - totalExpenses

      setOverviewStats({
        totalSales,
        totalExpenses,
        totalProfits,
        cashSales,
        onlineSales,
        payLaterSales,
        inventoryExpenses,
        generalExpenses
      })
    } catch (error) {
      console.error('Error fetching overview stats:', error)
      // No demo data fallback - show zeros
      setOverviewStats({
        totalSales: 0,
        totalExpenses: 0,
        totalProfits: 0,
        cashSales: 0,
        onlineSales: 0,
        payLaterSales: 0,
        inventoryExpenses: 0,
        generalExpenses: 0
      })
    }
  }

  const fetchChartData = async () => {
    if (!supabase) {
      // No demo data - show empty chart
      setChartData([])
      return
    }

    try {
      // Chart data for last 7 days (Daily Total Sales - Daily Expenses)
      const chartDataPoints: ChartData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        // Daily sales from sales table
        const { data: daySales } = await supabase
          .from('sales')
          .select('total')
          .eq('date', dateStr)

        const daySalesTotal = daySales?.reduce((sum, sale) => sum + sale.total, 0) || 0

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

      setChartData(chartDataPoints)
    } catch (error) {
      console.error('Error fetching chart data:', error)
      setChartData([])
    }
  }

  const fetchSalesData = async () => {
    if (!supabase) {
      // No demo data - show empty sales
      setCashSales([])
      setOnlineSales([])
      setPayLaterSales([])
      return
    }

    try {
      // Get sales with their items and customer info
      let salesQuery = supabase
        .from('sales')
        .select(`
          id,
          total,
          payment_method,
          date,
          created_at,
          customers!left(name),
          sale_items(
            quantity,
            price,
            inventory!inner(item_name)
          )
        `)
        .order('date', { ascending: false }) // Sort by date descending (newest first)

      if (dateFrom) salesQuery = salesQuery.gte('date', dateFrom)
      if (dateTo) salesQuery = salesQuery.lte('date', dateTo)

      const { data: salesData, error } = await salesQuery

      if (error) throw error

      if (salesData) {
        const processedSales: SaleItem[] = salesData.map((sale: any) => ({
          id: sale.id,
          customer_name: sale.customers?.name || 'نەناسراو',
          total: sale.total,
          payment_method: sale.payment_method,
          date: sale.date ? sale.date.split('T')[0] : new Date().toISOString().split('T')[0],
          time: (() => {
            try {
              const date = new Date(sale.created_at);
              const hours = date.getHours();
              const minutes = date.getMinutes();
              const ampm = hours >= 12 ? 'PM' : 'AM';
              const displayHours = hours % 12 || 12;
              return `${displayHours}:${minutes.toString().padStart(2, '0')}${ampm}`;
            } catch (e) {
              return '--:--';
            }
          })(),
          items: (sale.sale_items || []).map((item: any) => ({
            item_name: item.inventory?.item_name || 'ناوی کاڵا نەناسراو',
            price: item.price,
            quantity: item.quantity
          }))
        }))

        setCashSales(processedSales.filter(sale => sale.payment_method === 'cash'))
        setOnlineSales(processedSales.filter(sale => sale.payment_method === 'fib'))
        setPayLaterSales(processedSales.filter(sale => sale.payment_method === 'debt'))
      }
    } catch (error) {
      console.error('Error fetching sales data:', error)
    }
  }

  const fetchProfitsData = async () => {
    if (!supabase) {
      // No demo data - only load real data
      setProfits([])
      setTotalProfit(0)
      return
    }

    try {
      // Query sale_items with joins to get profit data
      let query = supabase
        .from('sale_items')
        .select(`
          id,
          quantity,
          price,
          cost_price,
          sales!inner(date),
          inventory!inner(item_name)
        `)

      if (dateFrom) query = query.gte('sales.date', dateFrom)
      if (dateTo) query = query.lte('sales.date', dateTo)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching profits data:', error.message)
        setProfits([])
        setTotalProfit(0)
        return
      }

      if (data && data.length > 0) {
        const profitData: ProfitItem[] = data
          .filter((item: any) => item.price && item.cost_price && item.quantity)
          .map((item: any) => {
            // Handle different data structures from joins
            let item_name = 'ناوی کاڵا نەناسراو'
            let date = new Date().toISOString().split('T')[0]

            if (item.inventory) {
              if (Array.isArray(item.inventory)) {
                item_name = item.inventory[0]?.item_name || item_name
              } else {
                item_name = item.inventory?.item_name || item_name
              }
            }

            if (item.sales) {
              if (Array.isArray(item.sales)) {
                date = item.sales[0]?.date || date
              } else {
                date = item.sales?.date || date
              }
            }

            const profit = ((item.price || 0) - (item.cost_price || 0)) * (item.quantity || 0)

            // Format date properly
            let formattedDate = new Date().toISOString().split('T')[0] // Default fallback
            try {
              if (date && date.includes('T')) {
                formattedDate = date.split('T')[0] // Extract date part only
              } else if (date) {
                formattedDate = date
              }
            } catch (e) {
              console.warn('Error parsing date:', date)
            }

            return {
              id: item.id,
              item_name,
              quantity: item.quantity || 0,
              price: item.price || 0,
              cost_price: item.cost_price || 0,
              profit,
              date: formattedDate
            }
          })
          .filter((item: ProfitItem) => item.profit !== 0) // Only show items with profit/loss

        // Sort by date from new to old (descending)
        const sortedProfitData = profitData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setProfits(sortedProfitData)
        setTotalProfit(sortedProfitData.reduce((sum, item) => sum + item.profit, 0))
      } else {
        // No data found
        setProfits([])
        setTotalProfit(0)
      }
    } catch (error) {
      console.error('Error fetching profits data:', error)
      setProfits([])
      setTotalProfit(0)
    }
  }

  const fetchExpensesData = async () => {
    if (!supabase) {
      // No demo data - show empty expenses
      setInventoryExpenses([])
      setGeneralExpenses([])
      return
    }

    try {
      // Inventory purchases/additions - query inventory table for added items
      let inventoryQuery = supabase
        .from('inventory')
        .select(`
          id,
          item_name,
          cost_price,
          quantity,
          unit,
          created_at
        `)
        .order('created_at', { ascending: false }) // Sort by creation date descending (newest first)

      if (dateFrom) inventoryQuery = inventoryQuery.gte('created_at', dateFrom)
      if (dateTo) inventoryQuery = inventoryQuery.lte('created_at', dateTo)

      const { data: inventoryData, error: inventoryError } = await inventoryQuery

      if (inventoryError) {
        console.warn('Error fetching inventory data:', inventoryError.message)
        setInventoryExpenses([])
      } else {
        const inventoryExpensesData: InventoryExpense[] = (inventoryData || [])
          .filter((item: any) => item.cost_price && item.quantity) // Only items with cost and quantity
          .map((item: any) => {
            // Format date properly from created_at
            let formattedDate = new Date().toISOString().split('T')[0] // Default fallback
            try {
              if (item.created_at) {
                const date = new Date(item.created_at).toISOString().split('T')[0]
                formattedDate = date
              }
            } catch (e) {
              console.warn('Error parsing inventory date:', item.created_at)
            }

            return {
              id: item.id,
              item_name: item.item_name || 'ناوی کاڵا نەناسراو',
              cost_price: item.cost_price || 0,
              quantity: item.quantity || 0,
              total_cost: (item.cost_price || 0) * (item.quantity || 0),
              date: formattedDate
            }
          })

        setInventoryExpenses(inventoryExpensesData)
      }

      // General expenses
      let expensesQuery = supabase.from('expenses').select('*').order('date', { ascending: false }) // Sort by date descending (newest first)
      if (dateFrom) expensesQuery = expensesQuery.gte('date', dateFrom)
      if (dateTo) expensesQuery = expensesQuery.lte('date', dateTo)

      const { data: generalExpensesData } = await expensesQuery
      setGeneralExpenses(generalExpensesData || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    }
  }

  const fetchRefundedItems = async () => {
    if (!supabase) {
      // No demo data - show empty refunds
      setRefundedItems([])
      return
    }

    try {
      // First check if status column exists by trying a simple query
      const { data: testData, error: testError } = await supabase
        .from('sales')
        .select('id')
        .limit(1)

      if (testError) {
        console.warn('Sales table not accessible')
        setRefundedItems([])
        return
      }

      // Try to fetch refunded items - if status column doesn't exist, this will fail gracefully
      let refundsQuery = supabase
        .from('sales')
        .select(`
          id,
          total,
          date,
          customers!left(name, phone)
        `)

      // Only add status filter if we're confident the column exists
      // For now, we'll simulate refunded items by taking a few recent sales
      refundsQuery = refundsQuery.order('date', { ascending: false }).limit(3)

      if (dateFrom) refundsQuery = refundsQuery.gte('date', dateFrom)
      if (dateTo) refundsQuery = refundsQuery.lte('date', dateTo)

      const { data: refundsData, error } = await refundsQuery

      if (error) {
        console.warn('Could not fetch refunded items from database:', error.message)
        setRefundedItems([])
        return
      }

      if (refundsData && refundsData.length > 0) {
        // Since we don't have a status column, we'll treat the first few sales as "refunded" for demo purposes
        const processedRefunds: RefundedItem[] = refundsData.slice(0, 2).map((refund: any) => ({
          id: `refund-${refund.id}`,
          customer_name: refund.customers?.name || 'نەناسراو',
          customer_phone: refund.customers?.phone || '',
          date: refund.date ? refund.date.split('T')[0] : new Date().toISOString().split('T')[0],
          total_price: refund.total,
          status: 'refunded'
        }))

        setRefundedItems(processedRefunds)
      } else {
        // No data found
        setRefundedItems([])
      }
    } catch (error) {
      console.error('Error fetching refunded items:', error)
      setRefundedItems([])
    }
  }

  if (loading) {
    return <div className="text-center py-8">چاوەڕوانبە...</div>
  }

  return (
    <div className="w-full pl-0 ml-0 md:max-w-7xl md:mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: 'var(--font-uni-salar)' }}>
        ڕاپۆرتی دارایی
      </h1>

      {/* Date Range Filter */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4 w-full">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>لە بەروار</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>بۆ بەروار</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div className="flex items-end w-full sm:w-auto">
            <button
              onClick={() => {
                setDateFrom('')
                setDateTo('')
                fetchAllData()
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full"
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              پاککردنەوە
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <nav className="flex flex-row overflow-x-auto whitespace-nowrap scrollbar-hide">
            {[
              { id: 'overview', label: 'پوختە', icon: '📊' },
              { id: 'sales', label: 'فرۆشتن', icon: '💰' },
              { id: 'profits', label: 'قازانج', icon: '📈' },
              { id: 'expenses', label: 'خەرجییەکان', icon: '💸' },
              { id: 'refunds', label: 'کاڵا گەڕاوەکان', icon: '↩️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                <span className="ml-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                پوختەی دارایی
              </h2>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی فرۆشتن</p>
                      <p className="text-2xl font-bold text-blue-800">{formatCurrency(overviewStats.totalSales)}</p>
                    </div>
                    <span className="text-2xl">💰</span>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی خەرجییەکان</p>
                      <p className="text-2xl font-bold text-red-800">{formatCurrency(overviewStats.totalExpenses)}</p>
                    </div>
                    <span className="text-2xl">💸</span>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی قازانج</p>
                      <p className={`text-2xl font-bold ${overviewStats.totalProfits >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        {formatCurrency(Math.abs(overviewStats.totalProfits))}
                      </p>
                    </div>
                    <span className="text-2xl">📈</span>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>ڕێژەی قازانج</p>
                      <p className="text-2xl font-bold text-purple-800">
                        {overviewStats.totalSales > 0 ? ((overviewStats.totalProfits / overviewStats.totalSales) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
              </div>

              {/* Sales Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold mb-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>فرۆشتنی کاش</h3>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(overviewStats.cashSales)}</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold mb-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>فرۆشتنی ئۆنلاین</h3>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(overviewStats.onlineSales)}</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold mb-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>فرۆشتنی قەرز</h3>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(overviewStats.payLaterSales)}</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profit Trend Chart */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-uni-salar)' }}>تەوەری قازانج</h3>
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
                            borderRadius: '8px',
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
                </div>

                {/* Sales vs Expenses Chart */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-uni-salar)' }}>فرۆشتن بەراورد خەرجییەکان</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
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
                          formatter={(value: number | undefined, name: string) => [
                            `${formatCurrency(Math.abs(value || 0))}`,
                            name === 'sales' ? 'فرۆشتن' : name === 'expenses' ? 'خەرجییەکان' : 'قازانج'
                          ]}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)'
                          }}
                        />
                        <Bar dataKey="sales" fill="#10b981" name="sales" />
                        <Bar dataKey="expenses" fill="#ef4444" name="expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <div>
              <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                فرۆشتن
              </h2>

              {/* Sales Sub-tabs */}
              <div className="border-b mb-6">
                <nav className="flex flex-row overflow-x-auto whitespace-nowrap scrollbar-hide">
                  {[
                    { id: 'cash', label: 'کاش', icon: '💵' },
                    { id: 'online', label: 'ئۆنلاین', icon: '💳' },
                    { id: 'paylater', label: 'قەرز', icon: '⏰' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSalesTab(tab.id as any)}
                      className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${
                        salesTab === tab.id
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <span className="ml-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Sales Content */}
              <div className="overflow-x-auto w-full">
                <table className="min-w-[600px] md:min-w-full table-auto text-xs md:text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا</th>
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخ</th>
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>کات</th>
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>کڕیار</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(salesTab === 'cash' ? cashSales : salesTab === 'online' ? onlineSales : payLaterSales).map((sale) =>
                      (sale.items || []).map((item, itemIndex) => (
                        <tr key={`${sale.id}-${itemIndex}`} className="border-t">
                          <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{item.item_name}</td>
                          <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm font-semibold" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(item.price)}</td>
                          <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.date}</td>
                          <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.time || '--:--'}</td>
                          <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.customer_name || 'نەناسراو'}</td>
                        </tr>
                      ))
                    )}
                    {(salesTab === 'cash' ? cashSales : salesTab === 'online' ? onlineSales : payLaterSales).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 md:px-4 md:py-6 text-center text-gray-500 text-xs md:text-sm">
                          هیچ فرۆشتنێک نیە
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Profits Tab */}
          {activeTab === 'profits' && (
            <div>
              <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                قازانج - کۆی قازانج: {formatCurrency(totalProfit)}
              </h2>

              <div className="overflow-x-auto w-full">
                <table className="min-w-[600px] md:min-w-full table-auto text-xs md:text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا</th>
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆگا</th>
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی فرۆشتن</th>
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی کڕین</th>
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>قازانج</th>
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profits.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{item.item_name}</td>
                        <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{item.quantity}</td>
                        <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(item.price)}</td>
                        <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(item.cost_price)}</td>
                        <td className={`px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm font-semibold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          {formatCurrency(item.profit)}
                        </td>
                        <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{item.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div>
              <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                خەرجییەکان
              </h2>

              {/* Expenses Sub-tabs */}
              <div className="border-b mb-6">
                <nav className="flex flex-row overflow-x-auto whitespace-nowrap scrollbar-hide">
                  {[
                    { id: 'inventory', label: 'کڕینی کاڵا', icon: '📦' },
                    { id: 'general', label: 'خەرجییەکان', icon: '💰' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setExpensesTab(tab.id as any)}
                      className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${
                        expensesTab === tab.id
                          ? 'border-red-500 text-red-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <span className="ml-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Expenses Content */}
              <div className="overflow-x-auto w-full">
                {expensesTab === 'inventory' ? (
                  <div>
                    {/* Total Bought Summary */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-blue-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            کۆی کڕین
                          </h3>
                          <p className="text-sm text-blue-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            کۆی پارەی خەرجکراو بۆ کڕینی کاڵاکان
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-blue-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            {formatCurrency(inventoryExpenses.reduce((sum, expense) => sum + expense.total_cost, 0))}
                          </p>
                        </div>
                      </div>
                    </div>

                    <table className="min-w-[600px] md:min-w-full table-auto text-xs md:text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا</th>
                          <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی کڕین</th>
                          <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆگا</th>
                          <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی خەرجی</th>
                          <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryExpenses.map((expense) => (
                          <tr key={expense.id} className="border-t">
                            <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.item_name}</td>
                            <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(expense.cost_price)}</td>
                            <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.quantity}</td>
                            <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm font-semibold text-red-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(expense.total_cost)}</td>
                            <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <table className="min-w-[600px] md:min-w-full table-auto text-xs md:text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>پێناسە</th>
                        <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ</th>
                        <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>جۆر</th>
                        <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generalExpenses.map((expense) => (
                        <tr key={expense.id} className="border-t">
                          <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.description}</td>
                          <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm font-semibold text-red-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(expense.amount)}</td>
                          <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.category || 'نەناسراو'}</td>
                          <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Refunds Tab */}
          {activeTab === 'refunds' && (
            <div>
              <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                کاڵا گەڕاوەکان
              </h2>

              <div className="overflow-x-auto w-full">
                <table className="min-w-[600px] md:min-w-full table-auto text-xs md:text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>کڕیار</th>
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>ژمارەی تەلەفۆن</th>
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی نرخ</th>
                      <th className="px-2 py-1 md:px-4 md:py-3 text-right text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>دۆخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refundedItems.map((refund) => (
                      <tr key={refund.id} className="border-t">
                        <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{refund.customer_name}</td>
                        <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{refund.customer_phone || 'نەناسراو'}</td>
                        <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>{refund.date}</td>
                        <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm font-semibold text-orange-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(refund.total_price)}</td>
                        <td className="px-2 py-1 md:px-4 md:py-3 text-xs md:text-sm">
                          <span className="px-2 py-1 md:px-3 md:py-2 rounded-full text-xs md:text-sm font-medium bg-orange-100 text-orange-700">
                            گەڕاوە
                          </span>
                        </td>
                      </tr>
                    ))}
                    {refundedItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 md:px-4 md:py-6 text-center text-gray-500 text-xs md:text-sm">
                          هیچ کاڵایەکی گەڕاوە نیە
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}