'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import ProfitFilters from './components/ProfitFilters'
import ProfitStats, { SalesTypeCards } from './components/ProfitStats'
import ProfitsCharts from './components/ProfitsCharts'
import SalesTab from './components/SalesTab'
import ProfitsTab from './components/ProfitsTab'
import ExpensesTab from './components/ExpensesTab'
import { ProfitItem, SaleItem, ExpenseItem, PurchaseExpense, ChartData, InvoiceSettings, OverviewStats, ActiveTab } from './components/types'
import { useGlobalInvoiceModal } from '@/hooks/useGlobalInvoiceModal'

export default function ProfitsPage() {
  const { openModal } = useGlobalInvoiceModal()
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({ totalSales: 0, totalExpenses: 0, totalProfits: 0, totalReturns: 0, cashSales: 0, onlineSales: 0, payLaterSales: 0, inventoryExpenses: 0, generalExpenses: 0 })
  const [cashSales, setCashSales] = useState<SaleItem[]>([])
  const [onlineSales, setOnlineSales] = useState<SaleItem[]>([])
  const [payLaterSales, setPayLaterSales] = useState<SaleItem[]>([])
  const [profits, setProfits] = useState<ProfitItem[]>([])
  const [totalProfit, setTotalProfit] = useState(0)
  const [purchaseExpenses, setPurchaseExpenses] = useState<PurchaseExpense[]>([])
  const [generalExpenses, setGeneralExpenses] = useState<ExpenseItem[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const handleViewPurchaseInvoice = async (purchaseId: string) => {
    if (!supabase) return
    try {
      const { data: purchaseData, error } = await supabase.from('purchase_expenses').select('*').eq('id', purchaseId).single()
      if (error) throw error
      const invoiceData = { 
        invoiceNumber: 0, 
        customerName: purchaseData.supplier_name || purchaseData.item_name || 'دابینکەر', 
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

  useEffect(() => { fetchAllData() }, [dateFrom, dateTo])
  const fetchAllData = async () => { await Promise.all([fetchOverviewStats(), fetchChartData(), fetchSalesData(), fetchProfitsData(), fetchExpensesData()]) }

  const fetchOverviewStats = async () => {
    if (!supabase) { setOverviewStats({ totalSales: 0, totalExpenses: 0, totalProfits: 0, totalReturns: 0, cashSales: 0, onlineSales: 0, payLaterSales: 0, inventoryExpenses: 0, generalExpenses: 0 }); return }
    try {
      let dateFilter: any = {}
      if (dateFrom) dateFilter = { ...dateFilter, gte: dateFrom }
      if (dateTo) dateFilter = { ...dateFilter, lte: dateTo }
      const { data: salesData } = await supabase.from('sales').select('total, payment_method, status, discount_amount').match(dateFilter).eq('status', 'completed')
      const totalSales = salesData?.reduce((sum, sale) => sum + sale.total, 0) || 0
      const cashSalesData = salesData?.filter(sale => sale.payment_method === 'cash').reduce((sum, sale) => sum + sale.total, 0) || 0
      const onlineSalesData = salesData?.filter(sale => sale.payment_method === 'fib').reduce((sum, sale) => sum + sale.total, 0) || 0
      const payLaterSalesData = salesData?.filter(sale => sale.payment_method === 'debt').reduce((sum, sale) => sum + sale.total, 0) || 0
      const { data: refundedData } = await supabase.from('sales').select('total').match(dateFilter).eq('status', 'refunded')
      const totalReturns = refundedData?.reduce((sum, sale) => sum + sale.total, 0) || 0
      const { data: inventoryData } = await supabase.from('sale_items').select('quantity, cost_price, sales!inner(status)').match(dateFilter).eq('sales.status', 'completed')
      const inventoryExpenses = inventoryData?.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0) || 0
      const { data: generalExpensesData } = await supabase.from('expenses').select('amount').match(dateFilter)
      const generalExpensesTotal = generalExpensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0
      const totalExpenses = inventoryExpenses + generalExpensesTotal
      const totalProfits = totalSales - totalExpenses
      setOverviewStats({ totalSales, totalExpenses, totalProfits, totalReturns, cashSales: cashSalesData, onlineSales: onlineSalesData, payLaterSales: payLaterSalesData, inventoryExpenses, generalExpenses: generalExpensesTotal })
    } catch (error) { console.error('Error fetching overview stats:', error); setOverviewStats({ totalSales: 0, totalExpenses: 0, totalProfits: 0, totalReturns: 0, cashSales: 0, onlineSales: 0, payLaterSales: 0, inventoryExpenses: 0, generalExpenses: 0 }) }
  }

  const fetchChartData = async () => {
    if (!supabase) { setChartData([]); return }
    try {
      const chartDataPoints: ChartData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const { data: daySales } = await supabase.from('sales').select('total').eq('date', dateStr).eq('status', 'completed')
        const daySalesTotal = daySales?.reduce((sum, sale) => sum + sale.total, 0) || 0
        const { data: dayExpenses } = await supabase.from('expenses').select('amount').eq('date', dateStr)
        const dayExpensesTotal = dayExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0
        chartDataPoints.push({ date: dateStr, sales: Math.round(daySalesTotal), expenses: Math.round(dayExpensesTotal), profit: Math.round(daySalesTotal - dayExpensesTotal) })
      }
      setChartData(chartDataPoints)
    } catch (error) { console.error('Error fetching chart data:', error); setChartData([]) }
  }

  const fetchSalesData = async () => {
    if (!supabase) { setCashSales([]); setOnlineSales([]); setPayLaterSales([]); return }
    try {
      let salesQuery = supabase.from('sales').select('id, total, payment_method, date, created_at, customers!left(name), sale_items(quantity, price, products!inner(name))').eq('status', 'completed').order('date', { ascending: false })
      if (dateFrom) salesQuery = salesQuery.gte('date', dateFrom)
      if (dateTo) salesQuery = salesQuery.lte('date', dateTo)
      const { data: salesData, error } = await salesQuery
      if (error) throw error
      if (salesData) {
        const processedSales: SaleItem[] = salesData.map((sale: any) => ({ id: sale.id, customer_name: sale.customers?.name || 'نەناسراو', total: sale.total, payment_method: sale.payment_method, date: sale.date ? sale.date.split('T')[0] : new Date().toISOString().split('T')[0], time: '--:--', items: (sale.sale_items || []).map((item: any) => ({ item_name: item.products?.name || 'ناوی کاڵا نەناسراو', price: item.price, quantity: item.quantity })) }))
        setCashSales(processedSales.filter(sale => sale.payment_method === 'cash'))
        setOnlineSales(processedSales.filter(sale => sale.payment_method === 'fib'))
        setPayLaterSales(processedSales.filter(sale => sale.payment_method === 'debt'))
      }
    } catch (error) { console.error('Error fetching sales data:', error) }
  }

  const fetchProfitsData = async () => {
    if (!supabase) { setProfits([]); setTotalProfit(0); return }
    try {
      let query = supabase.from('sale_items').select('id, quantity, price, cost_price, item_id, sales!inner(id, date, discount_amount, subtotal, status, invoice_number), products:item_id(name, cost_per_unit)').eq('sales.status', 'completed')
      if (dateFrom) query = query.gte('sales.date', dateFrom)
      if (dateTo) query = query.lte('sales.date', dateTo)
      const { data, error } = await query
      if (error) { console.error('Error fetching profits data:', error.message); setProfits([]); setTotalProfit(0); return }
      if (data && data.length > 0) {
        const profitData: ProfitItem[] = data.filter((item: any) => item.price && (item.cost_price || item.products?.cost_per_unit) && item.quantity).map((item: any) => {
          let item_name = 'کاڵای سڕاوە'
          if (item.products?.name) { item_name = Array.isArray(item.products) ? item.products[0]?.name : item.products?.name }
          else if (item.item_name) { item_name = item.item_name }
          const effectiveCostPrice = item.cost_price || (item.products?.cost_per_unit || 0)
          let sale_id = '', date = new Date().toISOString().split('T')[0], discount_amount = 0, subtotal = 0
          if (item.sales) { const s = Array.isArray(item.sales) ? item.sales[0] : item.sales; date = s.date || date; sale_id = s.id || ''; discount_amount = s.discount_amount || 0; subtotal = s.subtotal || 0 }
          const itemTotal = (item.price || 0) * (item.quantity || 0)
          const discountRatio = subtotal > 0 ? itemTotal / subtotal : 0
          const itemDiscount = discount_amount * discountRatio
          const net_price = itemTotal - itemDiscount
          const profit = net_price - (effectiveCostPrice * (item.quantity || 0))
          return { id: item.id, invoice_number: (Array.isArray(item.sales) ? item.sales[0]?.invoice_number : item.sales?.invoice_number) || sale_id?.slice(0, 8).toUpperCase() || '', sale_id, item_name, quantity: item.quantity || 0, price: item.price || 0, cost_price: effectiveCostPrice, discount_amount, item_discount: itemDiscount, net_price, profit, date }
        })
        const sortedProfitData = profitData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setProfits(sortedProfitData)
        setTotalProfit(sortedProfitData.reduce((sum, item) => sum + item.profit, 0))
      } else { setProfits([]); setTotalProfit(0) }
    } catch (error) { console.error('Error fetching profits data:', error); setProfits([]); setTotalProfit(0) }
  }

  const fetchExpensesData = async () => {
    if (!supabase) { setPurchaseExpenses([]); setGeneralExpenses([]); return }
    try {
      let purchaseQuery = supabase.from('purchase_expenses').select('*').order('purchase_date', { ascending: false })
      if (dateFrom) purchaseQuery = purchaseQuery.gte('purchase_date', dateFrom)
      if (dateTo) purchaseQuery = purchaseQuery.lte('purchase_date', dateTo)
      const { data: purchaseData, error: purchaseError } = await purchaseQuery
      if (purchaseError) { setPurchaseExpenses([]) } else {
        setPurchaseExpenses((purchaseData || []).map((item: any) => ({
          id: item.id,
          item_name: item.item_name || 'ناوی کاڵا نەناسراو',
          total_purchase_price: item.total_purchase_price || 0,
          total_amount_bought: item.total_amount_bought || 0,
          unit: item.unit || '',
          purchase_date: item.purchase_date || new Date().toISOString().split('T')[0],
          created_at: item.created_at
        })))
      }
      let expensesQuery = supabase.from('expenses').select('*').order('date', { ascending: false })
      if (dateFrom) expensesQuery = expensesQuery.gte('date', dateFrom)
      if (dateTo) expensesQuery = expensesQuery.lte('date', dateTo)
      const { data: generalExpensesData } = await expensesQuery
      setGeneralExpenses(generalExpensesData || [])
    } catch (error) { console.error('Error fetching expenses:', error) }
  }

  return (
    <div className="w-full pl-0 ml-0 max-w-[2800px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>ڕاپۆرتی دارایی</h1>
        <p className="text-gray-500 mt-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>پوختەی دارایی و قازانجی فرۆشتن</p>
      </motion.div>

      <ProfitFilters dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} onClearDates={() => { setDateFrom(''); setDateTo(''); fetchAllData() }} />

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
              <ProfitsCharts chartData={chartData} isMounted={isMounted} />
            </motion.div>
          )}
          {activeTab === 'sales' && <SalesTab cashSales={cashSales} onlineSales={onlineSales} payLaterSales={payLaterSales} onViewInvoice={handleViewInvoice} />}
          {activeTab === 'profits' && <ProfitsTab profits={profits} totalProfit={totalProfit} onViewInvoice={handleViewInvoice} />}
          {activeTab === 'expenses' && <ExpensesTab purchaseExpenses={purchaseExpenses} generalExpenses={generalExpenses} onViewPurchaseInvoice={handleViewPurchaseInvoice} />}
        </div>
      </div>

      {/* No local modal - GlobalInvoiceModal is handled by context in layout */}
    </div>
  )
}
