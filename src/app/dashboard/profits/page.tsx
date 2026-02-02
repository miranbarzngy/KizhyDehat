'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, sanitizePhoneNumber } from '@/lib/numberUtils'

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

export default function ProfitsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'profits' | 'expenses'>('overview')
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
      fetchSalesData(),
      fetchProfitsData(),
      fetchExpensesData()
    ])
    setLoading(false)
  }

  const fetchOverviewStats = async () => {
    if (!supabase) {
      // Demo data
      setOverviewStats({
        totalSales: 125000,
        totalExpenses: 87500,
        totalProfits: 37500,
        cashSales: 75000,
        onlineSales: 35000,
        payLaterSales: 15000,
        inventoryExpenses: 65000,
        generalExpenses: 22500
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
    }
  }

  const fetchSalesData = async () => {
    if (!supabase) {
      // Demo data with detailed items
      const demoCashSales: SaleItem[] = [
        {
          id: '1',
          customer_name: 'کڕیار ۱',
          total: 15000,
          payment_method: 'cash',
          date: '2024-01-15',
          time: '14:30',
          items: [
            { item_name: 'برنج', price: 18000, quantity: 1 },
            { item_name: 'شەکر', price: 12000, quantity: 1 }
          ]
        },
        {
          id: '2',
          customer_name: 'کڕیار ۲',
          total: 25000,
          payment_method: 'cash',
          date: '2024-01-14',
          time: '16:45',
          items: [
            { item_name: 'گۆشت', price: 35000, quantity: 1 }
          ]
        }
      ]

      const demoOnlineSales: SaleItem[] = [
        {
          id: '3',
          customer_name: 'کڕیار ۳',
          total: 18000,
          payment_method: 'online',
          date: '2024-01-15',
          time: '12:20',
          items: [
            { item_name: 'چای', price: 18000, quantity: 1 }
          ]
        }
      ]

      const demoPayLaterSales: SaleItem[] = [
        {
          id: '4',
          customer_name: 'کڕیار ۴',
          total: 12000,
          payment_method: 'pay_later',
          date: '2024-01-13',
          time: '10:15',
          items: [
            { item_name: 'ڕۆن', price: 12000, quantity: 1 }
          ]
        }
      ]

      setCashSales(demoCashSales)
      setOnlineSales(demoOnlineSales)
      setPayLaterSales(demoPayLaterSales)
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
          time: new Date(sale.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
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
      const demoProfits: ProfitItem[] = [
        { id: '1', item_name: 'برنج', quantity: 5, price: 18.00, cost_price: 15.50, profit: 12.50, date: '2024-01-15' },
        { id: '2', item_name: 'شەکر', quantity: 3, price: 14.50, cost_price: 12.00, profit: 7.50, date: '2024-01-15' }
      ]
      setProfits(demoProfits)
      setTotalProfit(demoProfits.reduce((sum, item) => sum + item.profit, 0))
      return
    }

    try {
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

      if (error) throw error

      const profitData: ProfitItem[] = (data || [])
        .filter((item: any) => item.inventory && item.inventory.length > 0 && item.sales && item.sales.length > 0)
        .map((item: any) => ({
          id: item.id,
          item_name: item.inventory[0]?.item_name || 'ناوی کاڵا نەناسراو',
          quantity: item.quantity || 0,
          price: item.price || 0,
          cost_price: item.cost_price || 0,
          profit: ((item.price || 0) - (item.cost_price || 0)) * (item.quantity || 0),
          date: item.sales[0]?.date || new Date().toISOString().split('T')[0]
        }))

      setProfits(profitData)
      setTotalProfit(profitData.reduce((sum, item) => sum + item.profit, 0))
    } catch (error) {
      console.error('Error fetching profits:', error)
    }
  }

  const fetchExpensesData = async () => {
    if (!supabase) {
      // Demo data
      setInventoryExpenses([
        { id: '1', item_name: 'برنج', cost_price: 15.50, quantity: 100, total_cost: 1550, date: '2024-01-10', supplier_name: 'دابینکەر ۱' }
      ])
      setGeneralExpenses([
        { id: '1', description: 'کرێی فرۆشگا', amount: 50000, date: '2024-01-01', category: 'کرێ' }
      ])
      return
    }

    try {
      // Inventory expenses (from sale_items cost_price)
      let inventoryQuery = supabase
        .from('sale_items')
        .select(`
          id,
          quantity,
          cost_price,
          sales!inner(date),
          inventory!inner(item_name)
        `)

      if (dateFrom) inventoryQuery = inventoryQuery.gte('sales.date', dateFrom)
      if (dateTo) inventoryQuery = inventoryQuery.lte('sales.date', dateTo)

      const { data: inventoryData } = await inventoryQuery

      const inventoryExpensesData: InventoryExpense[] = (inventoryData || [])
        .filter((item: any) => item.inventory && item.inventory.length > 0)
        .map((item: any) => ({
          id: item.id,
          item_name: item.inventory[0]?.item_name || 'ناوی کاڵا نەناسراو',
          cost_price: item.cost_price || 0,
          quantity: item.quantity || 0,
          total_cost: (item.cost_price || 0) * (item.quantity || 0),
          date: item.sales[0]?.date || new Date().toISOString().split('T')[0]
        }))

      setInventoryExpenses(inventoryExpensesData)

      // General expenses
      let expensesQuery = supabase.from('expenses').select('*')
      if (dateFrom) expensesQuery = expensesQuery.gte('date', dateFrom)
      if (dateTo) expensesQuery = expensesQuery.lte('date', dateTo)

      const { data: generalExpensesData } = await expensesQuery
      setGeneralExpenses(generalExpensesData || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">چاوەڕوانبە...</div>
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: 'var(--font-uni-salar)' }}>
        ڕاپۆرتی دارایی
      </h1>

      {/* Date Range Filter */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>لە بەروار</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>بۆ بەروار</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFrom('')
                setDateTo('')
                fetchAllData()
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
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
          <nav className="flex">
            {[
              { id: 'overview', label: 'پوختە', icon: '📊' },
              { id: 'sales', label: 'فرۆشتن', icon: '💰' },
              { id: 'profits', label: 'قازانج', icon: '📈' },
              { id: 'expenses', label: 'خەرجییەکان', icon: '💸' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <nav className="flex">
                  {[
                    { id: 'cash', label: 'کاش', icon: '💵' },
                    { id: 'online', label: 'ئۆنلاین', icon: '💳' },
                    { id: 'paylater', label: 'قەرز', icon: '⏰' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSalesTab(tab.id as any)}
                      className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا</th>
                      <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخ</th>
                      <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                      <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>کات</th>
                      <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>کڕیار</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(salesTab === 'cash' ? cashSales : salesTab === 'online' ? onlineSales : payLaterSales).map((sale) =>
                      (sale.items || []).map((item, itemIndex) => (
                        <tr key={`${sale.id}-${itemIndex}`} className="border-t">
                          <td className="px-4 py-2">{item.item_name}</td>
                          <td className="px-4 py-2 font-semibold">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-2">{sale.date}</td>
                          <td className="px-4 py-2">{sale.time || '--:--'}</td>
                          <td className="px-4 py-2">{sale.customer_name || 'نەناسراو'}</td>
                        </tr>
                      ))
                    )}
                    {(salesTab === 'cash' ? cashSales : salesTab === 'online' ? onlineSales : payLaterSales).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
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

              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا</th>
                      <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆگا</th>
                      <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی فرۆشتن</th>
                      <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی کڕین</th>
                      <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>قازانج</th>
                      <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profits.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-4 py-2">{item.item_name}</td>
                        <td className="px-4 py-2">{item.quantity}</td>
                        <td className="px-4 py-2">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-2">{formatCurrency(item.cost_price)}</td>
                        <td className={`px-4 py-2 font-semibold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(item.profit)}
                        </td>
                        <td className="px-4 py-2">{item.date}</td>
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
                <nav className="flex">
                  {[
                    { id: 'inventory', label: 'کڕینی کاڵا', icon: '📦' },
                    { id: 'general', label: 'خەرجییەکان', icon: '💰' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setExpensesTab(tab.id as any)}
                      className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
              <div className="overflow-x-auto">
                {expensesTab === 'inventory' ? (
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا</th>
                        <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی کڕین</th>
                        <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆگا</th>
                        <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی خەرجی</th>
                        <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryExpenses.map((expense) => (
                        <tr key={expense.id} className="border-t">
                          <td className="px-4 py-2">{expense.item_name}</td>
                          <td className="px-4 py-2">{formatCurrency(expense.cost_price)}</td>
                          <td className="px-4 py-2">{expense.quantity}</td>
                          <td className="px-4 py-2 font-semibold text-red-600">{formatCurrency(expense.total_cost)}</td>
                          <td className="px-4 py-2">{expense.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>پێناسە</th>
                        <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ</th>
                        <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>جۆر</th>
                        <th className="px-4 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generalExpenses.map((expense) => (
                        <tr key={expense.id} className="border-t">
                          <td className="px-4 py-2">{expense.description}</td>
                          <td className="px-4 py-2 font-semibold text-red-600">{formatCurrency(expense.amount)}</td>
                          <td className="px-4 py-2">{expense.category || 'نەناسراو'}</td>
                          <td className="px-4 py-2">{expense.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}