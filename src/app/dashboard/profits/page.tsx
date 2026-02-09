'use client'

import InvoiceTemplate from '@/components/InvoiceTemplate'
import { Eye } from 'lucide-react'
import { formatCurrency } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import { useEffect, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface ProfitItem {
  id: string
  invoice_number?: string
  sale_id: string
  item_name: string
  quantity: number
  price: number
  cost_price: number
  discount_amount: number
  item_discount: number
  net_price: number
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
  items?: Array<{ item_name: string; price: number; quantity: number }>
  status?: string
}

interface ExpenseItem { id: string; description: string; amount: number; date: string; category?: string }
interface PurchaseExpense { id: string; item_name: string; total_purchase_price: number; total_amount_bought: number; unit: string; purchase_date: string; created_at?: string }
interface ChartData { date: string; sales: number; expenses: number; profit: number }
interface InvoiceSettings { id: string; shop_name: string; shop_phone: string; shop_address: string; shop_logo: string; thank_you_note: string; qr_code_url: string; starting_invoice_number: number; current_invoice_number: number }

export default function ProfitsPage() {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])
  
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'profits' | 'expenses'>('overview')
  const [salesTab, setSalesTab] = useState<'cash' | 'online' | 'paylater'>('cash')
  const [expensesTab, setExpensesTab] = useState<'inventory' | 'general'>('inventory')
  
  const [overviewStats, setOverviewStats] = useState({ totalSales: 0, totalExpenses: 0, totalProfits: 0, totalReturns: 0, cashSales: 0, onlineSales: 0, payLaterSales: 0, inventoryExpenses: 0, generalExpenses: 0 })
  const [cashSales, setCashSales] = useState<SaleItem[]>([])
  const [onlineSales, setOnlineSales] = useState<SaleItem[]>([])
  const [payLaterSales, setPayLaterSales] = useState<SaleItem[]>([])
  const [profits, setProfits] = useState<ProfitItem[]>([])
  const [totalProfit, setTotalProfit] = useState(0)
  const [purchaseExpenses, setPurchaseExpenses] = useState<PurchaseExpense[]>([])
  const [generalExpenses, setGeneralExpenses] = useState<ExpenseItem[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  
  const [showInvoice, setShowInvoice] = useState(false)
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<any>(null)
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null)
  
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchInvoiceSettings = async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase.from('invoice_settings').select('*').single()
      if (error && error.code !== 'PGRST116') throw error
      setInvoiceSettings(data || null)
    } catch (error) { console.error('Error fetching invoice settings:', error) }
  }

  useEffect(() => { fetchInvoiceSettings() }, [])

  const downloadInvoice = async () => {
    if (!invoiceRef.current || !selectedInvoiceData) return
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      const canvas = await html2canvas(invoiceRef.current, { windowWidth: 800, scale: 3, logging: false, backgroundColor: '#ffffff', useCORS: true, allowTaint: true, width: invoiceRef.current.offsetWidth, height: invoiceRef.current.offsetHeight })
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `Invoice_${selectedInvoiceData.invoiceNumber || 'temp'}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }, 'image/png', 1.0)
    } catch (error) { console.error('Error downloading invoice:', error); alert('هەڵە لە داگرتنی وێنەی فاکتور') }
  }

  const handleViewPurchaseInvoice = async (purchaseId: string) => {
    if (!supabase) return
    try {
      const { data: purchaseData, error } = await supabase.from('purchase_expenses').select('*').eq('id', purchaseId).single()
      if (error) throw error
      
      const invoiceData = {
        invoiceNumber: purchaseData.id.slice(0, 8).toUpperCase(),
        customerName: purchaseData.supplier_name || purchaseData.item_name || 'دابینکەر',
        customerPhone: purchaseData.supplier_phone || '',
        sellerName: '',
        date: new Date(purchaseData.purchase_date).toLocaleDateString('ku'),
        time: (() => { try { const d = new Date(purchaseData.created_at); const h = d.getHours(), m = d.getMinutes(), a = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}:${m.toString().padStart(2, '0')}${a}` } catch (e) { return '--:--' } })(),
        paymentMethod: 'purchase',
        items: [{ name: purchaseData.item_name || 'کاڵا', unit: purchaseData.unit || '', quantity: purchaseData.total_amount_bought || 0, price: purchaseData.total_purchase_price / (purchaseData.total_amount_bought || 1), total: purchaseData.total_purchase_price }],
        subtotal: purchaseData.total_purchase_price || 0,
        discount: 0,
        total: purchaseData.total_purchase_price || 0,
        shopName: invoiceSettings?.shop_name || 'فرۆشگای کوردستان',
        shopPhone: invoiceSettings?.shop_phone || '',
        shopAddress: invoiceSettings?.shop_address || '',
        shopLogo: invoiceSettings?.shop_logo || '',
        qrCodeUrl: invoiceSettings?.qr_code_url || '',
        thankYouNote: 'کڕین لە دابینکەر • ' + (invoiceSettings?.thank_you_note || 'سوپاس بۆ هاوکارییەکانتان!')
      }
      
      setSelectedInvoiceData(invoiceData)
      setShowInvoice(true)
    } catch (error) { console.error('Error fetching purchase invoice:', error); alert('هەڵە لە وەرگرتنی پسوڵەی کڕین') }
  }

  const handleViewInvoice = async (saleId: string) => {
    if (!supabase) return
    try {
      const { data: saleData, error } = await supabase.from('sales').select(`id, invoice_number, total, payment_method, date, created_at, discount_amount, subtotal, customers!left(name, phone1), sale_items(quantity, price, total, products!inner(name))`).eq('id', saleId).single()
      if (error) throw error
      
      const customers = Array.isArray(saleData.customers) ? saleData.customers[0] : saleData.customers
      const invoiceData = {
        invoiceNumber: saleData.invoice_number || saleData.id.slice(0, 8).toUpperCase(),
        customerName: customers?.name || 'نەناسراو',
        customerPhone: customers?.phone1 || '',
        sellerName: '',
        date: new Date(saleData.date).toLocaleDateString('ku'),
        time: (() => { try { const d = new Date(saleData.created_at); const h = d.getHours(), m = d.getMinutes(), a = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}:${m.toString().padStart(2, '0')}${a}` } catch (e) { return '--:--' } })(),
        paymentMethod: saleData.payment_method,
        items: (saleData.sale_items || []).map((item: any) => ({ name: item.products?.name || 'ناوی کاڵا نەناسراو', unit: '', quantity: item.quantity, price: item.price, total: item.total })),
        subtotal: saleData.subtotal || saleData.total + (saleData.discount_amount || 0),
        discount: saleData.discount_amount || 0,
        total: saleData.total,
        shopName: invoiceSettings?.shop_name || 'فرۆشگای کوردستان',
        shopPhone: invoiceSettings?.shop_phone || '',
        shopAddress: invoiceSettings?.shop_address || '',
        shopLogo: invoiceSettings?.shop_logo || '',
        qrCodeUrl: invoiceSettings?.qr_code_url || '',
        thankYouNote: invoiceSettings?.thank_you_note || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
      }
      
      setSelectedInvoiceData(invoiceData)
      setShowInvoice(true)
    } catch (error) { console.error('Error fetching invoice:', error); alert('هەڵە لە وەرگرتنی پسوڵە') }
  }

  useEffect(() => { fetchAllData() }, [dateFrom, dateTo])
  
  const fetchAllData = async () => {
    await Promise.all([fetchOverviewStats(), fetchChartData(), fetchSalesData(), fetchProfitsData(), fetchExpensesData()])
  }

  const fetchOverviewStats = async () => {
    if (!supabase) {
      setOverviewStats({ totalSales: 0, totalExpenses: 0, totalProfits: 0, totalReturns: 0, cashSales: 0, onlineSales: 0, payLaterSales: 0, inventoryExpenses: 0, generalExpenses: 0 })
      return
    }
    try {
      let dateFilter: any = {}
      if (dateFrom) dateFilter = { ...dateFilter, gte: dateFrom }
      if (dateTo) dateFilter = { ...dateFilter, lte: dateTo }
      
      // Only include COMPLETED sales in financial reports
      const { data: salesData } = await supabase.from('sales').select('total, payment_method, status, discount_amount').match(dateFilter).eq('status', 'completed')
      const totalSales = salesData?.reduce((sum, sale) => sum + sale.total, 0) || 0
      const cashSales = salesData?.filter(sale => sale.payment_method === 'cash').reduce((sum, sale) => sum + sale.total, 0) || 0
      const onlineSales = salesData?.filter(sale => sale.payment_method === 'fib').reduce((sum, sale) => sum + sale.total, 0) || 0
      const payLaterSales = salesData?.filter(sale => sale.payment_method === 'debt').reduce((sum, sale) => sum + sale.total, 0) || 0
      
      const { data: refundedData } = await supabase.from('sales').select('total').match(dateFilter).eq('status', 'refunded')
      const totalReturns = refundedData?.reduce((sum, sale) => sum + sale.total, 0) || 0
      
      // Only calculate expenses from completed sales
      const { data: inventoryData } = await supabase.from('sale_items').select('quantity, cost_price, sales!inner(status)').match(dateFilter).eq('sales.status', 'completed')
      const inventoryExpenses = inventoryData?.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0) || 0
      
      const { data: generalExpensesData } = await supabase.from('expenses').select('amount').match(dateFilter)
      const generalExpenses = generalExpensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0
      
      const totalExpenses = inventoryExpenses + generalExpenses
      const totalProfits = totalSales - totalExpenses
      
      setOverviewStats({ totalSales, totalExpenses, totalProfits, totalReturns, cashSales, onlineSales, payLaterSales, inventoryExpenses, generalExpenses })
    } catch (error) {
      console.error('Error fetching overview stats:', error)
      setOverviewStats({ totalSales: 0, totalExpenses: 0, totalProfits: 0, totalReturns: 0, cashSales: 0, onlineSales: 0, payLaterSales: 0, inventoryExpenses: 0, generalExpenses: 0 })
    }
  }

  const fetchChartData = async () => {
    if (!supabase) { setChartData([]); return }
    try {
      const chartDataPoints: ChartData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        // Only include COMPLETED sales in charts
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
      // Only fetch COMPLETED sales
      let salesQuery = supabase.from('sales').select('id, total, payment_method, date, created_at, customers!left(name), sale_items(quantity, price, products!inner(name))').eq('status', 'completed').order('date', { ascending: false })
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
          time: (() => { try { const d = new Date(sale.created_at); const h = d.getHours(), m = d.getMinutes(), a = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}:${m.toString().padStart(2, '0')}${a}` } catch (e) { return '--:--' } })(),
          items: (sale.sale_items || []).map((item: any) => ({ item_name: item.products?.name || 'ناوی کاڵا نەناسراو', price: item.price, quantity: item.quantity }))
        }))
        setCashSales(processedSales.filter(sale => sale.payment_method === 'cash'))
        setOnlineSales(processedSales.filter(sale => sale.payment_method === 'fib'))
        setPayLaterSales(processedSales.filter(sale => sale.payment_method === 'debt'))
      }
    } catch (error) { console.error('Error fetching sales data:', error) }
  }

  const fetchProfitsData = async () => {
    if (!supabase) { setProfits([]); setTotalProfit(0); return }
    try {
      // Only fetch profits from COMPLETED sales
      let query = supabase.from('sale_items').select('id, quantity, price, cost_price, item_id, sales!inner(id, date, discount_amount, subtotal, status, invoice_number), products:item_id(name, cost_per_unit)').eq('sales.status', 'completed')
      if (dateFrom) query = query.gte('sales.date', dateFrom)
      if (dateTo) query = query.lte('sales.date', dateTo)
      const { data, error } = await query
      
      if (error) { console.error('Error fetching profits data:', error.message); setProfits([]); setTotalProfit(0); return }
      
      if (data && data.length > 0) {
        const profitData: ProfitItem[] = data.filter((item: any) => item.price && (item.cost_price || item.products?.cost_per_unit) && item.quantity).map((item: any) => {
          // Fallback for old records: use products.name, then item_name (old field), then default
          let item_name = 'کاڵای سڕاوە'
          if (item.products?.name) {
            item_name = Array.isArray(item.products) ? item.products[0]?.name : item.products?.name
          } else if (item.item_name) {
            item_name = item.item_name
          }
          
          // Use cost_price from sale_item record as primary, fallback to products.cost_per_unit
          const effectiveCostPrice = item.cost_price || (item.products?.cost_per_unit || 0)
          
          let sale_id = '', date = new Date().toISOString().split('T')[0], discount_amount = 0, subtotal = 0
          if (item.sales) {
            const s = Array.isArray(item.sales) ? item.sales[0] : item.sales
            date = s.date || date
            sale_id = s.id || ''
            discount_amount = s.discount_amount || 0
            subtotal = s.subtotal || 0
          }
          
          // Profit calculation: (sale_price - cost_price) * quantity
          const itemTotal = (item.price || 0) * (item.quantity || 0)
          const discountRatio = subtotal > 0 ? itemTotal / subtotal : 0
          const itemDiscount = discount_amount * discountRatio
          const net_price = itemTotal - itemDiscount
          const profit = net_price - (effectiveCostPrice * (item.quantity || 0))
          
          return { 
            id: item.id, 
            invoice_number: (Array.isArray(item.sales) ? item.sales[0]?.invoice_number : item.sales?.invoice_number) || sale_id?.slice(0, 8).toUpperCase() || '', 
            sale_id, 
            item_name, 
            quantity: item.quantity || 0, 
            price: item.price || 0, 
            cost_price: effectiveCostPrice, 
            discount_amount, 
            item_discount: itemDiscount, 
            net_price, 
            profit, 
            date 
          }
        })
        const sortedProfitData = profitData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setProfits(sortedProfitData)
        setTotalProfit(sortedProfitData.reduce((sum, item) => sum + item.profit, 0))
      } else {
        setProfits([])
        setTotalProfit(0)
      }
    } catch (error) { console.error('Error fetching profits data:', error); setProfits([]); setTotalProfit(0) }
  }

  const fetchExpensesData = async () => {
    if (!supabase) { setPurchaseExpenses([]); setGeneralExpenses([]); return }
    try {
      let purchaseQuery = supabase.from('purchase_expenses').select('*').order('purchase_date', { ascending: false })
      if (dateFrom) purchaseQuery = purchaseQuery.gte('purchase_date', dateFrom)
      if (dateTo) purchaseQuery = purchaseQuery.lte('purchase_date', dateTo)
      const { data: purchaseData, error: purchaseError } = await purchaseQuery
      if (purchaseError) {
        setPurchaseExpenses([])
      } else {
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
    <div className="w-full pl-0 ml-0 md:max-w-7xl md:mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: 'var(--font-uni-salar)' }}>ڕاپۆرتی دارایی</h1>
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4 w-full">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>لە بەروار</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded px-3 py-2 w-full" />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>بۆ بەروار</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded px-3 py-2 w-full" />
          </div>
          <div className="flex items-end w-full sm:w-auto">
            <button onClick={() => { setDateFrom(''); setDateTo(''); fetchAllData() }} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full" style={{ fontFamily: 'var(--font-uni-salar)' }}>پاککردنەوە</button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <nav className="flex flex-row overflow-x-auto whitespace-nowrap scrollbar-hide">
            {[
              { id: 'overview', label: 'پوختە', icon: '📊' },
              { id: 'sales', label: 'فرۆشتن', icon: '💰' },
              { id: 'profits', label: 'قازانج', icon: '📈' },
              { id: 'expenses', label: 'خەرجییەکان', icon: '💸' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                <span className="ml-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'var(--font-uni-salar)' }}>پوختەی دارایی</h2>
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
                      <p className={`text-2xl font-bold ${overviewStats.totalProfits >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatCurrency(Math.abs(overviewStats.totalProfits))}</p>
                    </div>
                    <span className="text-2xl">📈</span>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>ڕێژەی قازانج</p>
                      <p className="text-2xl font-bold text-purple-800">{overviewStats.totalSales > 0 ? ((overviewStats.totalProfits / overviewStats.totalSales) * 100).toFixed(1) : 0}%</p>
                    </div>
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
              </div>
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
              {isMounted && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-uni-salar)' }}>تەوەری قازانج</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('ku', { month: 'short', day: 'numeric' })} stroke="#6b7280" fontSize={12} />
                          <YAxis stroke="#6b7280" fontSize={12} />
                          <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString('ku')} formatter={(v: number | undefined) => [`${formatCurrency(Math.abs(v || 0))}`, v && v >= 0 ? 'قازانج' : 'زیان']} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(0, 0, 0, 0.1)', borderRadius: '8px', backdropFilter: 'blur(10px)' }} />
                          <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-uni-salar)' }}>فرۆشتن بەراورد خەرجییەکان</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('ku', { month: 'short', day: 'numeric' })} stroke="#6b7280" fontSize={12} />
                          <YAxis stroke="#6b7280" fontSize={12} />
                          <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString('ku')} formatter={(v: number | undefined, name?: string) => [`${formatCurrency(Math.abs(v || 0))}`, name === 'sales' ? 'فرۆشتن' : name === 'expenses' ? 'خەرجییەکان' : 'قازانج']} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(0, 0, 0, 0.1)', borderRadius: '8px', backdropFilter: 'blur(10px)' }} />
                          <Bar dataKey="sales" fill="#10b981" name="sales" />
                          <Bar dataKey="expenses" fill="#ef4444" name="expenses" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'sales' && (
            <div>
              <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'var(--font-uni-salar)' }}>فرۆشتن</h2>
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
                      className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${salesTab === tab.id ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <span className="ml-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-[800px] w-full text-xs md:text-sm">
                    <thead className="bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                      <tr>
                        <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا</th>
                        <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخ</th>
                        <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                        <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کات</th>
                        <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کڕیار</th>
                        <th className="px-3 py-4 text-center text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کردارەکان</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(salesTab === 'cash' ? cashSales : salesTab === 'online' ? onlineSales : payLaterSales).map((sale) =>
                        (sale.items || []).map((item, itemIndex) => (
                          <tr key={`${sale.id}-${itemIndex}`} className="border-t hover:bg-gray-50/50 transition-colors">
                            <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{item.item_name}</td>
                            <td className="px-3 py-3 font-semibold" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(item.price)}</td>
                            <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.date}</td>
                            <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.time || '--:--'}</td>
                            <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.customer_name || 'نەناسراو'}</td>
                            <td className="px-3 py-3 text-center">
                              <button
                                onClick={() => handleViewInvoice(sale.id)}
                                className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors shadow-sm"
                                title="پیشاندانی پسوڵە"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                      {(salesTab === 'cash' ? cashSales : salesTab === 'online' ? onlineSales : payLaterSales).length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>هیچ فرۆشتنێک نیە</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'profits' && (
            <div>
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 mb-8">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی قازانج</h2>
                  <p className={`text-4xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>{formatCurrency(totalProfit)} IQD</p>
                  <p className={`text-sm mt-2 ${totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>{totalProfit >= 0 ? 'قازانجی پاک' : 'زیان'}</p>
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full text-xs md:text-sm">
                    <thead className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                      <tr>
                        <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>ژمارەی پسوڵە</th>
                        <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا</th>
                        <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                        <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی کڕین</th>
                        <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی فرۆشتن</th>
                        <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>داشکاندن</th>
                        <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>قازانج</th>
                        <th className="px-3 py-4 text-center text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کردارەکان</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profits.map((profit) => (
                        <tr key={profit.id} className="border-t hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 py-3 font-mono text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>{profit.invoice_number || '--'}</td>
                          <td className="px-3 py-3 font-medium" style={{ fontFamily: 'var(--font-uni-salar)' }}>{profit.item_name}</td>
                          <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{profit.date}</td>
                          <td className="px-3 py-3 text-red-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(profit.cost_price * profit.quantity)}</td>
                          <td className="px-3 py-3 text-blue-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(profit.price * profit.quantity)}</td>
                          <td className="px-3 py-3 text-orange-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(profit.item_discount)}</td>
                          <td className={`px-3 py-3 font-bold ${profit.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(profit.profit)}</td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => handleViewInvoice(profit.sale_id)}
                              className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors shadow-sm"
                              title="پیشاندانی پسوڵە"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {profits.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-3 py-8 text-center text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>هیچ قازانجێک نیە</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'expenses' && (
            <div>
              <div className="border-b mb-6">
                <nav className="flex flex-row overflow-x-auto whitespace-nowrap scrollbar-hide">
                  {[
                    { id: 'inventory', label: 'خەرجی کاڵا', icon: '📦' },
                    { id: 'general', label: 'خەرجی گشتی', icon: '📋' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setExpensesTab(tab.id as any)}
                      className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${expensesTab === tab.id ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <span className="ml-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              {expensesTab === 'inventory' && (
                <div>
                  <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 mb-6">
                    <div className="text-center">
                      <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی خەرجی کاڵا</h2>
                      <p className="text-4xl font-bold text-red-600" style={{ fontFamily: 'Inter, sans-serif' }}>{formatCurrency(purchaseExpenses.reduce((sum, item) => sum + item.total_purchase_price, 0))} IQD</p>
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-[900px] w-full text-xs md:text-sm">
                        <thead className="bg-gradient-to-r from-red-500/10 to-orange-500/10">
                          <tr>
                            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا</th>
                            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ</th>
                            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>یەکە</th>
                            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی کۆی</th>
                            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                            <th className="px-3 py-4 text-center text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>کردارەکان</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseExpenses.map((expense) => (
                            <tr key={expense.id} className="border-t hover:bg-gray-50/50 transition-colors">
                              <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.item_name}</td>
                              <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.total_amount_bought.toLocaleString()}</td>
                              <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.unit}</td>
                              <td className="px-3 py-3 font-bold text-red-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(expense.total_purchase_price)}</td>
                              <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.purchase_date}</td>
                              <td className="px-3 py-3 text-center">
                                <button
                                  onClick={() => handleViewPurchaseInvoice(expense.id)}
                                  className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors shadow-sm"
                                  title="پیشاندانی پسوڵە"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {purchaseExpenses.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-3 py-8 text-center text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>هیچ خەرجی کاڵایەک نیە</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {expensesTab === 'general' && (
                <div>
                  <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 mb-6">
                    <div className="text-center">
                      <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی خەرجی گشتی</h2>
                      <p className="text-4xl font-bold text-red-600" style={{ fontFamily: 'Inter, sans-serif' }}>{formatCurrency(generalExpenses.reduce((sum, item) => sum + item.amount, 0))} IQD</p>
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-[700px] w-full text-xs md:text-sm">
                        <thead className="bg-gradient-to-r from-red-500/10 to-orange-500/10">
                          <tr>
                            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>تەوضێحات</th>
                            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ</th>
                            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generalExpenses.map((expense) => (
                            <tr key={expense.id} className="border-t hover:bg-gray-50/50 transition-colors">
                              <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.description}</td>
                              <td className="px-3 py-3 font-bold text-red-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>{formatCurrency(expense.amount)}</td>
                              <td className="px-3 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.date}</td>
                            </tr>
                          ))}
                          {generalExpenses.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-3 py-8 text-center text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>هیچ خەرجی گشتیەک نیە</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {showInvoice && selectedInvoiceData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowInvoice(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>پسوڵە</h2>
                <div className="flex gap-2">
                  <button onClick={downloadInvoice} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    داگرتن
                  </button>
                  <button onClick={() => setShowInvoice(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'var(--font-uni-salar)' }}>داخستن</button>
                </div>
              </div>
              <div className="p-6" ref={invoiceRef}>
                {selectedInvoiceData && (
                  <InvoiceTemplate data={selectedInvoiceData} settings={invoiceSettings} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
