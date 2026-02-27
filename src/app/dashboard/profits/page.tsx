'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import PermissionGuard from '@/components/PermissionGuard'
import SalesTab from './components/SalesTab'
import ProfitStats, { SalesTypeCards } from './components/ProfitStats'
import ProfitsTab from './components/ProfitsTab'
import ExpensesTab from './components/ExpensesTab'
import ProfitFilters from './components/ProfitFilters'
import ProfitsCharts from './components/ProfitsCharts'
import { ProfitItem, SaleItem, ExpenseItem, PurchaseExpense, OverviewStats, ActiveTab, ChartData } from './components/types'
import { useGlobalInvoiceModal } from '@/hooks/useGlobalInvoiceModal'
import { Database } from '@/types/supabase'

type SaleRow = Database['public']['Tables']['sales']['Row']
type SaleItemRow = Database['public']['Tables']['sale_items']['Row']
type ExpenseRow = Database['public']['Tables']['expenses']['Row']
type PurchaseExpenseRow = Database['public']['Tables']['purchase_expenses']['Row']

export default function ProfitsPage() {
  const { openModal } = useGlobalInvoiceModal()
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({ totalSales: 0, totalExpenses: 0, totalProfits: 0, totalReturns: 0, cashSales: 0, onlineSales: 0, payLaterSales: 0, inventoryExpenses: 0, generalExpenses: 0 })
  const [cashSales, setCashSales] = useState<SaleItem[]>([])
  const [onlineSales, setOnlineSales] = useState<SaleItem[]>([])
  const [payLaterSales, setPayLaterSales] = useState<SaleItem[]>([])
  const [profits, setProfits] = useState<ProfitItem[]>([])
  const [totalProfit, setTotalProfit] = useState(0)
  const [purchaseExpenses, setPurchaseExpenses] = useState<PurchaseExpense[]>([])
  const [generalExpenses, setGeneralExpenses] = useState<ExpenseItem[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initial load - fetch all data
  useEffect(() => { 
    setLoading(true)
    fetchAllData('', '').finally(() => setLoading(false)) 
  }, [])

  const handleViewPurchaseInvoice = async (purchaseId: string) => {
    if (!supabase) return
    try {
      const { data: purchaseData, error } = await supabase.from('purchase_expenses').select('*').eq('id', purchaseId).single()
      if (error) throw error
      const invoiceData = { 
        invoiceNumber: 0, 
        customerName: purchaseData.supplier_name || purchaseData.item_name || 'دابینکار',
        customerPhone: purchaseData.supplier_phone || '', 
        sellerName: '', 
        date: new Date(purchaseData.purchase_date).toLocaleDateString('ku'), 
        time: '--:--', 
        paymentMethod: 'purchase', 
        items: [{ 
          name: purchaseData.item_name || 'کاڵا', 
          unit: purchaseData.unit || '', 
          quantity: purchaseData.total_amount_bought || 0, 
          price: purchaseData.total_amount_bought ? purchaseData.total_purchase_price / purchaseData.total_amount_bought : 0, 
          total: purchaseData.total_purchase_price 
        }], 
        subtotal: purchaseData.total_purchase_price || 0, 
        discount: 0, 
        total: purchaseData.total_purchase_price || 0 
      }
      openModal(invoiceData, purchaseId, 'پسوڵەی کڕین')
    } catch (error) { console.error('Error fetching purchase invoice:', error); alert('هەڵە لە وەرگرتنی پسوڵەی کڕین') }
  }

  const handleViewInvoice = async (saleId: string) => {
    if (!supabase) return
    try {
      const { data: saleData, error } = await supabase.from('sales').select(`id, invoice_number, total, payment_method, date, created_at, discount_amount, subtotal, customers!left(name, phone1), sale_items(quantity, price, total, products!inner(name))`).eq('id', saleId).single()
      if (error) throw error
      const customers = Array.isArray(saleData.customers) ? saleData.customers[0] : saleData.customers
      const invoiceData = { 
        invoiceNumber: saleData.invoice_number || 0, 
        customerName: customers?.name || 'نەناسراو', 
        customerPhone: customers?.phone1 || '', 
        sellerName: '', 
        date: new Date(saleData.date).toLocaleDateString('ku'), 
        time: '--:--', 
        paymentMethod: saleData.payment_method, 
        items: (saleData.sale_items || []).map((item: any) => ({ 
          name: item.products?.name || 'ناوی کاڵا نەناسراو', 
          unit: '', 
          quantity: item.quantity, 
          price: item.price, 
          total: item.total 
        })), 
        subtotal: saleData.subtotal || saleData.total + (saleData.discount_amount || 0), 
        discount: saleData.discount_amount || 0, 
        total: saleData.total 
      }
      openModal(invoiceData, saleId, 'پسوڵە')
    } catch (error) { console.error('Error fetching invoice:', error); alert('هەڵە لە وەرگرتنی پسوڵە') }
  }

  // Handle filter application
  const handleApplyFilter = () => {
    setLoading(true)
    fetchAllData(dateFrom, dateTo).finally(() => setLoading(false))
  }

  // Handle clearing dates
  const handleClearDates = () => {
    setDateFrom('')
    setDateTo('')
    setLoading(true)
    fetchAllData('', '').finally(() => setLoading(false))
  }

  // Fetch all data with optional date filters
  const fetchAllData = async (dateFromParam?: string, dateToParam?: string) => {
    const fromDate = dateFromParam !== undefined ? dateFromParam : dateFrom
    const toDate = dateToParam !== undefined ? dateToParam : dateTo
    await Promise.all([
      fetchOverviewStats(fromDate, toDate),
      fetchSalesData(fromDate, toDate),
      fetchProfitsData(fromDate, toDate),
      fetchExpensesData(fromDate, toDate),
      fetchChartData(fromDate, toDate)
    ])
  }

  const fetchOverviewStats = async (dateFromParam?: string, dateToParam?: string) => {
    if (!supabase) { setOverviewStats({ totalSales: 0, totalExpenses: 0, totalProfits: 0, totalReturns: 0, cashSales: 0, onlineSales: 0, payLaterSales: 0, inventoryExpenses: 0, generalExpenses: 0 }); return }
    try {
      // Build date filter for sales
      let salesQuery = supabase.from('sales').select('total, payment_method, status, discount_amount').eq('status', 'completed')
      if (dateFromParam) {
        salesQuery = salesQuery.gte('date', dateFromParam)
      }
      if (dateToParam) {
        salesQuery = salesQuery.lte('date', dateToParam)
      }
      const { data: salesData } = await salesQuery
      
      const totalSales = salesData?.reduce((sum, sale) => sum + sale.total, 0) || 0
      const cashSalesData = salesData?.filter(sale => sale.payment_method === 'cash').reduce((sum, sale) => sum + sale.total, 0) || 0
      const onlineSalesData = salesData?.filter(sale => sale.payment_method === 'fib').reduce((sum, sale) => sum + sale.total, 0) || 0
      const payLaterSalesData = salesData?.filter(sale => sale.payment_method === 'debt').reduce((sum, sale) => sum + sale.total, 0) || 0
      
      // Refunded data with date filter
      let refundedQuery = supabase.from('sales').select('total').eq('status', 'refunded')
      if (dateFromParam) {
        refundedQuery = refundedQuery.gte('date', dateFromParam)
      }
      if (dateToParam) {
        refundedQuery = refundedQuery.lte('date', dateToParam)
      }
      const { data: refundedData } = await refundedQuery
      const totalReturns = refundedData?.reduce((sum, sale) => sum + sale.total, 0) || 0
      
      // Inventory expenses with date filter
      let inventoryQuery = supabase.from('sale_items').select('quantity, cost_price, sales!inner(status, date)')
      if (dateFromParam) {
        inventoryQuery = inventoryQuery.gte('sales.date', dateFromParam)
      }
      if (dateToParam) {
        inventoryQuery = inventoryQuery.lte('sales.date', dateToParam)
      }
      const { data: inventoryData } = await inventoryQuery.eq('sales.status', 'completed')
      const inventoryExpenses = inventoryData?.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0) || 0
      
      // General expenses with date filter
      let expensesQuery = supabase.from('expenses').select('amount')
      if (dateFromParam) {
        expensesQuery = expensesQuery.gte('date', dateFromParam)
      }
      if (dateToParam) {
        expensesQuery = expensesQuery.lte('date', dateToParam)
      }
      const { data: generalExpensesData } = await expensesQuery
      const generalExpensesTotal = generalExpensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0
      
      const totalExpenses = inventoryExpenses + generalExpensesTotal
      const totalProfits = totalSales - totalExpenses
      setOverviewStats({ totalSales, totalExpenses, totalProfits, totalReturns, cashSales: cashSalesData, onlineSales: onlineSalesData, payLaterSales: payLaterSalesData, inventoryExpenses, generalExpenses: generalExpensesTotal })
    } catch (error) { console.error('Error fetching overview stats:', error); setOverviewStats({ totalSales: 0, totalExpenses: 0, totalProfits: 0, totalReturns: 0, cashSales: 0, onlineSales: 0, payLaterSales: 0, inventoryExpenses: 0, generalExpenses: 0 }) }
  }

  const fetchSalesData = async (dateFromParam?: string, dateToParam?: string) => {
    if (!supabase) { setCashSales([]); setOnlineSales([]); setPayLaterSales([]); return }
    try {
      let query = supabase.from('sales').select('id, total, payment_method, date, created_at, customers!left(name, phone1), sale_items(quantity, price, total, products!inner(name))').eq('status', 'completed').order('date', { ascending: false })
      
      if (dateFromParam) {
        query = query.gte('date', dateFromParam)
      }
      if (dateToParam) {
        query = query.lte('date', dateToParam)
      }
      
      const { data: salesData, error } = await query
      if (error) throw error
      if (salesData) {
        const processedSales: SaleItem[] = salesData.map((sale: any) => {
          const saleDate = sale.date ? sale.date.split('T')[0] : new Date().toISOString().split('T')[0]
          let saleTime = '--:--'
          if (sale.created_at) {
            try {
              const createdDate = new Date(sale.created_at)
              let hours = createdDate.getHours()
              const minutes = createdDate.getMinutes()
              const ampm = hours >= 12 ? 'PM' : 'AM'
              hours = hours % 12
              hours = hours ? hours : 12
              const minutesStr = minutes < 10 ? '0' + minutes : minutes
              saleTime = `${hours}:${minutesStr} ${ampm}`
            } catch (e) {
              saleTime = '--:--'
            }
          }
          
          // For cash sales with no customer, show "کڕیاری گشتی" (General Customer)
          const customerName = sale.customers?.name || (sale.payment_method === 'cash' ? 'کڕیاری گشتی' : 'نەناسراو')
          
          return { 
            id: sale.id, 
            customer_name: customerName,
            customer_phone: sale.customers?.phone1 || '', 
            total: sale.total, 
            payment_method: sale.payment_method, 
            date: saleDate, 
            time: saleTime, 
            items: (sale.sale_items || []).map((item: any) => ({ 
              item_name: item.products?.name || 'ناوی کاڵا نەناسراو', 
              price: item.total || (item.price * item.quantity),
              quantity: item.quantity 
            }))
          }
        })
        setCashSales(processedSales.filter(sale => sale.payment_method === 'cash'))
        setOnlineSales(processedSales.filter(sale => sale.payment_method === 'fib'))
        setPayLaterSales(processedSales.filter(sale => sale.payment_method === 'debt'))
      }
    } catch (error) { console.error('Error fetching sales data:', error) }
  }

  const fetchProfitsData = async (dateFromParam?: string, dateToParam?: string) => {
    if (!supabase) { setProfits([]); setTotalProfit(0); return }
    try {
      let query = supabase.from('sale_items').select('id, quantity, price, cost_price, item_id, sales!inner(id, date, created_at, discount_amount, subtotal, status, invoice_number, customers!inner(name, phone1)), products:item_id(name, cost_per_unit)').eq('sales.status', 'completed')
      
      if (dateFromParam) {
        query = query.gte('sales.date', dateFromParam)
      }
      if (dateToParam) {
        query = query.lte('sales.date', dateToParam)
      }
      
      const { data, error } = await query
      if (error) { console.error('Error fetching profits data:', error.message); setProfits([]); setTotalProfit(0); return }
      if (data && data.length > 0) {
        const profitData: ProfitItem[] = data.filter((item: any) => item.price && (item.cost_price || item.products?.cost_per_unit) && item.quantity).map((item: any) => {
          let item_name = 'کاڵای سڕاوە'
          if (item.products?.name) { item_name = Array.isArray(item.products) ? item.products[0]?.name : item.products?.name }
          else if (item.item_name) { item_name = item.item_name }
          const effectiveCostPrice = item.cost_price || (item.products?.cost_per_unit || 0)
          let sale_id = '', date = new Date().toISOString().split('T')[0], time = '--:--', discount_amount = 0, subtotal = 0
          if (item.sales) { 
            const s = Array.isArray(item.sales) ? item.sales[0] : item.sales; 
            let fullDate = s.date || new Date().toISOString().split('T')[0]
            if (fullDate && fullDate.includes('T')) {
              date = fullDate.split('T')[0]
            } else {
              date = fullDate
            }
            sale_id = s.id || ''; 
            discount_amount = s.discount_amount || 0; 
            subtotal = s.subtotal || 0
            
            if (s.created_at) {
              try {
                const createdDate = new Date(s.created_at)
                let hours = createdDate.getHours()
                const minutes = createdDate.getMinutes()
                const ampm = hours >= 12 ? 'PM' : 'AM'
                hours = hours % 12
                hours = hours ? hours : 12
                const minutesStr = minutes < 10 ? '0' + minutes : minutes
                time = `${hours}:${minutesStr} ${ampm}`
              } catch (e) {
                time = '--:--'
              }
            }
          }
          // Get customer info from sales
          let customer_name = ''
          let customer_phone = ''
          if (item.sales) {
            const s = Array.isArray(item.sales) ? item.sales[0] : item.sales
            if (s && s.customers) {
              const cust = Array.isArray(s.customers) ? s.customers[0] : s.customers
              customer_name = cust?.name || ''
              customer_phone = cust?.phone1 || ''
            }
          }
          
          const itemTotal = (item.price || 0) * (item.quantity || 0)
          const discountRatio = subtotal > 0 ? itemTotal / subtotal : 0
          const itemDiscount = discount_amount * discountRatio
          const net_price = itemTotal - itemDiscount
          const profit = net_price - (effectiveCostPrice * (item.quantity || 0))
          return { id: item.id, invoice_number: (Array.isArray(item.sales) ? item.sales[0]?.invoice_number : item.sales?.invoice_number) || sale_id?.slice(0, 8).toUpperCase() || '', sale_id, item_name, quantity: item.quantity || 0, price: item.price || 0, cost_price: effectiveCostPrice, discount_amount, item_discount: itemDiscount, net_price, profit, date, time, customer_name, customer_phone }
        })
        const sortedProfitData = profitData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setProfits(sortedProfitData)
        setTotalProfit(sortedProfitData.reduce((sum, item) => sum + item.profit, 0))
      } else { setProfits([]); setTotalProfit(0) }
    } catch (error) { console.error('Error fetching profits data:', error); setProfits([]); setTotalProfit(0) }
  }

  const fetchExpensesData = async (dateFromParam?: string, dateToParam?: string) => {
    if (!supabase) { setPurchaseExpenses([]); setGeneralExpenses([]); return }
    try {
      // Purchase expenses with date filter
      let purchaseQuery = supabase.from('purchase_expenses').select('*').order('purchase_date', { ascending: false })
      if (dateFromParam) {
        purchaseQuery = purchaseQuery.gte('purchase_date', dateFromParam)
      }
      if (dateToParam) {
        purchaseQuery = purchaseQuery.lte('purchase_date', dateToParam)
      }
      const { data: purchaseData, error: purchaseError } = await purchaseQuery
      
      if (purchaseError) { setPurchaseExpenses([]) } else {
        setPurchaseExpenses((purchaseData || []).map((item: any) => ({
          id: item.id,
          item_name: item.item_name || 'ناوی کاڵا نەناسراو',
          total_purchase_price: item.total_purchase_price || 0,
          total_amount_bought: item.total_amount_bought || 0,
          unit: item.unit || '',
          purchase_date: item.purchase_date ? item.purchase_date.split('T')[0] : new Date().toISOString().split('T')[0],
          created_at: item.created_at
        })))
      }
      
      // General expenses with date filter
      let expensesQuery = supabase.from('expenses').select('*').order('date', { ascending: false })
      if (dateFromParam) {
        expensesQuery = expensesQuery.gte('date', dateFromParam)
      }
      if (dateToParam) {
        expensesQuery = expensesQuery.lte('date', dateToParam)
      }
      const { data: generalExpensesData } = await expensesQuery
      
      setGeneralExpenses((generalExpensesData || []).map((item: any) => ({
        ...item,
        date: item.date ? item.date.split('T')[0] : item.date
      })))
    } catch (error) { console.error('Error fetching expenses:', error) }
  }

  const fetchChartData = async (dateFromParam?: string, dateToParam?: string) => {
    if (!supabase) { setChartData([]); return }
    try {
      // Determine the date range for the chart
      let startDate: Date
      let endDate: Date
      
      if (dateFromParam && dateToParam) {
        // Use the filtered date range
        startDate = new Date(dateFromParam)
        endDate = new Date(dateToParam)
      } else {
        // Default: last 7 days
        endDate = new Date()
        startDate = new Date()
        startDate.setDate(endDate.getDate() - 7)
      }
      
      // Generate array of dates
      const dateArray: string[] = []
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        dateArray.push(currentDate.toISOString().split('T')[0])
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      // Fetch sales data for the date range
      let salesQuery = supabase.from('sales').select('date, total').eq('status', 'completed')
      if (dateFromParam) {
        salesQuery = salesQuery.gte('date', dateFromParam)
      }
      if (dateToParam) {
        salesQuery = salesQuery.lte('date', dateToParam)
      }
      const { data: salesData } = await salesQuery
      
      // Fetch expenses data for the date range
      let expensesQuery = supabase.from('expenses').select('date, amount')
      if (dateFromParam) {
        expensesQuery = expensesQuery.gte('date', dateFromParam)
      }
      if (dateToParam) {
        expensesQuery = expensesQuery.lte('date', dateToParam)
      }
      const { data: expensesData } = await expensesQuery
      
      // Fetch purchase expenses for the date range
      let purchaseQuery = supabase.from('purchase_expenses').select('purchase_date, total_purchase_price')
      if (dateFromParam) {
        purchaseQuery = purchaseQuery.gte('purchase_date', dateFromParam)
      }
      if (dateToParam) {
        purchaseQuery = purchaseQuery.lte('purchase_date', dateToParam)
      }
      const { data: purchaseData } = await purchaseQuery
      
      // Build chart data
      const chartDataMap: { [key: string]: ChartData } = {}
      
      // Initialize all dates in range
      dateArray.forEach(date => {
        chartDataMap[date] = { date, sales: 0, expenses: 0, profit: 0 }
      })
      
      // Aggregate sales
      salesData?.forEach(sale => {
        const saleDate = sale.date ? sale.date.split('T')[0] : ''
        if (chartDataMap[saleDate]) {
          chartDataMap[saleDate].sales += sale.total || 0
        }
      })
      
      // Aggregate general expenses
      expensesData?.forEach(expense => {
        const expenseDate = expense.date ? expense.date.split('T')[0] : ''
        if (chartDataMap[expenseDate]) {
          chartDataMap[expenseDate].expenses += expense.amount || 0
        }
      })
      
      // Aggregate purchase expenses (inventory costs)
      purchaseData?.forEach(purchase => {
        const purchaseDate = purchase.purchase_date ? purchase.purchase_date.split('T')[0] : ''
        if (chartDataMap[purchaseDate]) {
          chartDataMap[purchaseDate].expenses += purchase.total_purchase_price || 0
        }
      })
      
      // Calculate profit for each day
      Object.keys(chartDataMap).forEach(date => {
        chartDataMap[date].profit = chartDataMap[date].sales - chartDataMap[date].expenses
      })
      
      // Convert to array and sort by date
      const sortedChartData = Object.values(chartDataMap).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      
      setChartData(sortedChartData)
    } catch (error) { 
      console.error('Error fetching chart data:', error)
      setChartData([])
    }
  }

  return (
    <PermissionGuard permission="profits">
    <div className="w-full pl-0 ml-0 max-w-[2800px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>ڕاپۆرتی دارایی</h1>
        <p className="text-gray-500 mt-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>پوختەی دارایی و قازانجی فرۆشتن</p>
      </motion.div>

      {/* Date Filters */}
      <ProfitFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onApplyFilter={handleApplyFilter}
        onClearDates={handleClearDates}
        loading={loading}
      />

      {/* Loading Overlay */}
      {loading && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-lg font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                چاوەڕێ بکە...
              </span>
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
        <div className="border-b border-gray-200/50">
          <nav className="flex flex-row overflow-x-auto whitespace-nowrap scrollbar-hide px-2">
            {[
              { id: 'overview', label: 'پوختە', icon: '📊' },
              { id: 'sales', label: 'فرۆشتن', icon: '💰' },
              { id: 'profits', label: 'قازانج', icon: '📈' },
              { id: 'expenses', label: 'خەرجییەکان', icon: '💸' }
            ].map((tab, index) => (
              <motion.button key={tab.id} onClick={() => setActiveTab(tab.id as ActiveTab)} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 flex-shrink-0 ${activeTab === tab.id ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                <span className="ml-2 text-lg">{tab.icon}</span>
                {tab.label}
              </motion.button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <h2 className="text-xl font-semibold mb-6 text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>پوختەی دارایی</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-4 mb-8">
                <ProfitStats stats={overviewStats} />
              </div>
              <SalesTypeCards stats={overviewStats} />
              {/* Charts Section */}
              {isMounted && chartData.length > 0 && (
                <div className="mt-8">
                  <ProfitsCharts chartData={chartData} isMounted={isMounted} />
                </div>
              )}
            </motion.div>
          )}
          {activeTab === 'sales' && <SalesTab cashSales={cashSales} onlineSales={onlineSales} payLaterSales={payLaterSales} searchQuery={searchQuery} onSearchChange={setSearchQuery} onViewInvoice={handleViewInvoice} />}
          {activeTab === 'profits' && <ProfitsTab profits={profits} totalProfit={totalProfit} searchQuery={searchQuery} onSearchChange={setSearchQuery} onViewInvoice={handleViewInvoice} />}
          {activeTab === 'expenses' && <ExpensesTab purchaseExpenses={purchaseExpenses} generalExpenses={generalExpenses} onViewPurchaseInvoice={handleViewPurchaseInvoice} />}
        </div>
      </div>
    </div>
    </PermissionGuard>
  )
}
