'use client'

import InvoiceTemplate from '@/components/InvoiceTemplate'
import { Eye, TrendingUp, TrendingDown, DollarSign, Wallet, Percent, CreditCard, Calendar, BarChart3, PieChart } from 'lucide-react'
import { formatCurrency } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import { useEffect, useRef, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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

// Glassmorphism Card Component
function GlassCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  )
}

// Stat Card Component with theme colors
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  colorTheme, 
  delay = 0,
  subtitle 
}: { 
  title: string
  value: string
  icon: any
  colorTheme: 'blue' | 'red' | 'green' | 'purple'
  delay?: number
  subtitle?: string
}) {
  const colorSchemes = {
    blue: {
      bg: 'from-blue-500/20 to-blue-600/10',
      icon: 'bg-blue-500',
      text: 'text-blue-600',
      border: 'border-blue-300/30',
      shadow: 'shadow-blue-500/20'
    },
    red: {
      bg: 'from-red-500/20 to-red-600/10',
      icon: 'bg-red-500',
      text: 'text-red-600',
      border: 'border-red-300/30',
      shadow: 'shadow-red-500/20'
    },
    green: {
      bg: 'from-green-500/20 to-green-600/10',
      icon: 'bg-green-500',
      text: 'text-green-600',
      border: 'border-green-300/30',
      shadow: 'shadow-green-500/20'
    },
    purple: {
      bg: 'from-purple-500/20 to-purple-600/10',
      icon: 'bg-purple-500',
      text: 'text-purple-600',
      border: 'border-purple-300/30',
      shadow: 'shadow-purple-500/20'
    }
  }

  const scheme = colorSchemes[colorTheme]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative overflow-hidden rounded-3xl shadow-xl border ${scheme.border} bg-gradient-to-br ${scheme.bg}`}
    >
      {/* Animated pulse icon */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`absolute top-4 left-4 p-3 rounded-2xl ${scheme.icon} shadow-lg`}
      >
        <Icon className="w-6 h-6 text-white" />
      </motion.div>
      
      <div className="p-6 pr-20">
        <p className="text-sm font-semibold text-gray-600 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>{title}</p>
        <p className={`text-3xl font-bold ${scheme.text}`} style={{ fontFamily: 'Inter, sans-serif' }}>{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>{subtitle}</p>
        )}
      </div>
      
      {/* Decorative gradient overlay */}
      <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${scheme.bg} opacity-50 blur-2xl`} />
    </motion.div>
  )
}

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
        customerName: purchaseData.supplier_name || purchaseData.item_name || 'دابینکار',
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
        thankYouNote: 'کڕین لە دابینکار • ' + (invoiceSettings?.thank_you_note || 'سوپاس بۆ هاوکارییەکانتان!')
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
      
      const { data: salesData } = await supabase.from('sales').select('total, payment_method, status, discount_amount').match(dateFilter).eq('status', 'completed')
      const totalSales = salesData?.reduce((sum, sale) => sum + sale.total, 0) || 0
      const cashSales = salesData?.filter(sale => sale.payment_method === 'cash').reduce((sum, sale) => sum + sale.total, 0) || 0
      const onlineSales = salesData?.filter(sale => sale.payment_method === 'fib').reduce((sum, sale) => sum + sale.total, 0) || 0
      const payLaterSales = salesData?.filter(sale => sale.payment_method === 'debt').reduce((sum, sale) => sum + sale.total, 0) || 0
      
      const { data: refundedData } = await supabase.from('sales').select('total').match(dateFilter).eq('status', 'refunded')
      const totalReturns = refundedData?.reduce((sum, sale) => sum + sale.total, 0) || 0
      
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
      for (let i = 6; i >= 0;
