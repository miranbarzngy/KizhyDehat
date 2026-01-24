'use client'

import { useAuth } from '@/contexts/AuthContext'
import {
  calculateUnitPrice,
  convertUnits,
  formatCurrency,
  safeStringToNumber,
  sanitizeNumericInput,
  toEnglishDigits
} from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import { Package } from 'lucide-react'
import { useEffect, useState } from 'react'

interface InventoryItem {
  id: string
  item_name: string
  quantity: number
  unit: string
  selling_price: number
  cost_price: number
  category: string
  image?: string
  image_url?: string
}

interface Customer {
  id: string
  name: string
  phone1: string
  phone2?: string
  total_debt: number
}

interface CartItem {
  id: string
  item: InventoryItem
  quantity: number
  unit: string
  price: number
  total: number
  baseQuantity: number // Quantity converted to base unit for inventory
}

interface ShopSettings {
  id: string
  shopname: string
  icon: string
  phone: string
  location: string
  qrcodeimage: string
}

interface InvoiceSettings {
  id: string
  shop_name: string
  shop_phone: string
  shop_address: string
  shop_logo: string
  thank_you_note: string
  qr_code_url: string
  starting_invoice_number: number
  current_invoice_number: number
}

interface CategoryGroup {
  name: string
  items: InventoryItem[]
}

// Product Image Component - Perfectly Centered
const ProductImage = ({ item, className = "" }: { item: InventoryItem, className?: string }) => {
  return (
    <motion.div
      className={`bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner ${className}`}
      whileHover={{ rotate: 5, scale: 1.1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.item_name}
          className="w-full h-full object-cover rounded-2xl"
        />
      ) : (
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl flex items-center justify-center">
          <Package className="w-6 h-6 text-white" />
        </div>
      )}
    </motion.div>
  )
}

// Skeleton Loader Component (Updated for proper aspect ratio)
const ProductSkeleton = () => (
  <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20 animate-pulse">
    <div className="w-20 h-20 bg-gray-200 rounded-2xl mx-auto mb-4"></div>
    <div className="h-4 bg-gray-200 rounded mb-2"></div>
    <div className="h-6 bg-gray-200 rounded mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto"></div>
  </div>
)

export default function SalesPage() {
  const { user, profile } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [selectedSaleUnit, setSelectedSaleUnit] = useState('')
  const [quantityInput, setQuantityInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'fib' | 'debt'>('cash')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [discount, setDiscount] = useState(0)
  const [customerRequired, setCustomerRequired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null)
  const [addedItemId, setAddedItemId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [selectedCustomerData, setSelectedCustomerData] = useState<Customer | null>(null)

  // Group inventory by categories
  const getGroupedInventory = (): CategoryGroup[] => {
    const groups: { [key: string]: InventoryItem[] } = {}

    inventory.forEach(item => {
      const category = item.category || 'ئەوانی تر'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(item)
    })

    return Object.entries(groups).map(([name, items]) => ({
      name,
      items
    }))
  }

  // Get filtered inventory based on selected category
  const getFilteredInventory = (): InventoryItem[] => {
    if (selectedCategory === 'all') {
      return inventory
    }
    return inventory.filter(item => item.category === selectedCategory)
  }

  // Get filtered customers based on search term
  const getFilteredCustomers = (): Customer[] => {
    if (!customerSearchTerm.trim()) {
      return customers.slice(0, 5) // Show first 5 customers when no search
    }

    const searchLower = customerSearchTerm.toLowerCase()
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone1?.toLowerCase().includes(searchLower) ||
      customer.phone2?.toLowerCase().includes(searchLower)
    ).slice(0, 10) // Limit to 10 results
  }

  // Handle customer selection
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer.id)
    setSelectedCustomerData(customer)
    setCustomerSearchTerm('')
    setShowCustomerDropdown(false)
    setCustomerRequired(false)
  }

  // Handle new customer creation
  const createNewCustomer = () => {
    // For now, just show an alert - in a real implementation, this would open a modal
    alert('زیادکردنی کڕیاری نوێ لە بەشی کڕیاران بکە')
  }

  useEffect(() => {
    fetchInventory()
    fetchCustomers()
    fetchShopSettings()
    fetchInvoiceSettings()

    // Add click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.customer-search-container')) {
        setShowCustomerDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch user name from profile
  useEffect(() => {
    console.log('🔍 Profile data:', profile)
    console.log('🔍 User metadata:', user?.user_metadata)

    // Priority: profile.name -> profile.full_name -> profile.display_name -> user.user_metadata.full_name -> user.user_metadata.name -> 'کارمەند'
    const userNameFromProfile = profile?.name || profile?.full_name || profile?.display_name
    const userNameFromMetadata = user?.user_metadata?.full_name || user?.user_metadata?.name

    let finalUserName = 'کارمەند' // Default fallback

    if (userNameFromProfile) {
      finalUserName = userNameFromProfile
      console.log('✅ Using name from profile:', finalUserName)
    } else if (userNameFromMetadata) {
      finalUserName = userNameFromMetadata
      console.log('✅ Using name from metadata:', finalUserName)
    } else {
      console.log('⚠️ No name found, using default:', finalUserName)
    }

    setUserName(finalUserName)
  }, [profile, user])

  const fetchInventory = async () => {
    // Demo mode: show sample inventory data when Supabase is not configured
    if (!supabase) {
      const demoInventory: InventoryItem[] = [
        {
          id: '1',
          item_name: 'برنج',
          quantity: 25,
          unit: 'کیلۆ',
          selling_price: 18.00,
          cost_price: 15.50,
          category: 'خۆراك'
        },
        {
          id: '2',
          item_name: 'شەکر',
          quantity: 8,
          unit: 'کیلۆ',
          selling_price: 14.50,
          cost_price: 12.00,
          category: 'خۆراك'
        },
        {
          id: '3',
          item_name: 'چای',
          quantity: 45,
          unit: 'پاکێت',
          selling_price: 10.00,
          cost_price: 8.50,
          category: 'خۆراك'
        },
        {
          id: '4',
          item_name: 'گۆشت',
          quantity: 12,
          unit: 'کیلۆ',
          selling_price: 35.00,
          cost_price: 28.00,
          category: 'گۆشت و ماسی'
        },
        {
          id: '5',
          item_name: 'پیاز',
          quantity: 30,
          unit: 'کیلۆ',
          selling_price: 5.50,
          cost_price: 4.00,
          category: 'میوە و سەوزە'
        },
        {
          id: '6',
          item_name: 'تەماتە',
          quantity: 20,
          unit: 'کیلۆ',
          selling_price: 8.00,
          cost_price: 6.50,
          category: 'میوە و سەوزە'
        }
      ]
      setInventory(demoInventory)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .gt('quantity', 0)

      if (error) throw error
      // Add default category if missing
      const processedData = (data || []).map(item => ({
        ...item,
        category: item.category || 'ئەوانی تر'
      }))
      setInventory(processedData)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    // Demo mode: show sample customers data when Supabase is not configured
    if (!supabase) {
      const demoCustomers: Customer[] = [
        { id: '1', name: 'ئەحمەد محەمەد', total_debt: 125.50 },
        { id: '2', name: 'فاطمە عەلی', total_debt: 0 },
        { id: '3', name: 'محەمەد کەریم', total_debt: 89.25 },
        { id: '4', name: 'سارا ئەحمەد', total_debt: 234.75 }
      ]
      setCustomers(demoCustomers)
      return
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone1, phone2, total_debt')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
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

  const fetchInvoiceSettings = async () => {
    // Demo mode: show sample invoice settings data when Supabase is not configured
    if (!supabase) {
      const demoSettings: InvoiceSettings = {
        id: 'demo-invoice',
        shop_name: 'فرۆشگای کوردستان',
        shop_phone: '+964 750 123 4567',
        shop_address: 'هەولێر، کوردستان',
        shop_logo: '',
        thank_you_note: 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.',
        qr_code_url: '',
        starting_invoice_number: 1000,
        current_invoice_number: 1000
      }
      setInvoiceSettings(demoSettings)
      return
    }

    try {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setInvoiceSettings(data || null)
    } catch (error) {
      console.error('Error fetching invoice settings:', error)
    }
  }

  // Auto-unit add to cart function - automatically uses item's base unit
  const addToCart = (item: InventoryItem) => {
    setSelectedItem(item)
    setSelectedSaleUnit(item.unit) // Auto-select the item's base unit
    setQuantityInput('')
    setShowUnitModal(true)
  }

  // Add item with selected unit and quantity
  const addUnitItem = () => {
    if (!selectedItem || !selectedSaleUnit || !quantityInput) return

    const quantity = safeStringToNumber(quantityInput)
    if (quantity <= 0) return

    // Calculate price based on unit conversion
    const unitPrice = calculateUnitPrice(selectedItem.selling_price, selectedItem.unit, selectedSaleUnit, quantity)
    const totalPrice = unitPrice

    // Convert quantity to base unit for inventory tracking
    const baseQuantity = convertUnits(quantity, selectedSaleUnit, selectedItem.unit)

    const cartItem: CartItem = {
      id: Date.now().toString(),
      item: selectedItem,
      quantity: quantity,
      unit: selectedSaleUnit,
      price: unitPrice / quantity, // Price per unit in sale unit
      total: totalPrice,
      baseQuantity: baseQuantity
    }

    setCart(prev => [...prev, cartItem])
    setShowUnitModal(false)
    setSelectedItem(null)
    setSelectedSaleUnit('')
    setQuantityInput('')
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setCart(prev => prev.map(item =>
      item.id === id
        ? { ...item, quantity, total: quantity * item.price }
        : item
    ))
  }

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0) - discount
  }

  const completeSale = async () => {
    if (cart.length === 0) return

    // Customer selection is now required for ALL payment methods
    if (!selectedCustomer) {
      alert('تکایە کڕیارێک هەڵبژێرە بۆ تەواوبوونی فرۆشتن')
      setCustomerRequired(true)
      return
    }

    // Check stock availability using converted quantities
    for (const cartItem of cart) {
      if (cartItem.baseQuantity > cartItem.item.quantity) {
        alert(`بڕی پێویست لە کۆگا نەماوە: ${cartItem.item.item_name}`)
        return
      }
    }

    try {
      const total = getTotal()

      console.log('Starting sale completion...', {
        customerId: selectedCustomer,
        total,
        paymentMethod,
        cartItems: cart.length,
        userId: user?.id
      })

      // Insert sale with payment method - invoice_number will be auto-assigned by database sequence
      const saleInsertData = {
        customer_id: selectedCustomer, // Always link to customer
        total,
        payment_method: paymentMethod,
        user_id: user?.id,
        sold_by: userName
      }

      console.log('Attempting to insert sale with data:', saleInsertData)

      const { data: saleData, error: saleError } = await supabase!
        .from('sales')
        .insert(saleInsertData)
        .select('id, invoice_number, total, payment_method, date, user_id, sold_by, customers(name, phone1)') // Explicitly select invoice_number and sold_by
        .single()

      if (saleError) {
        console.error('Sale insertion error details:', {
          message: saleError.message,
          details: saleError.details,
          hint: saleError.hint,
          code: saleError.code,
          fullError: JSON.stringify(saleError, null, 2)
        })
        throw saleError
      }

      console.log('Sale created:', saleData)
      console.log('Invoice number from database:', saleData.invoice_number)

      // Insert sale items with converted quantities for inventory tracking
      const saleItems = cart.map(item => ({
        sale_id: saleData.id,
        item_id: item.item.id,
        quantity: item.baseQuantity, // Use converted quantity for inventory
        unit: item.item.unit, // Store in base unit
        price: item.price,
        cost_price: item.item.cost_price || 0
      }))

      console.log('Inserting sale items:', saleItems)

      const { error: itemsError } = await supabase!
        .from('sale_items')
        .insert(saleItems)

      if (itemsError) {
        console.error('Sale items insertion error:', itemsError)
        throw itemsError
      }

      // Update inventory using converted quantities and archive if needed
      for (const item of cart) {
        const newQuantity = item.item.quantity - item.baseQuantity
        const profitPerItem = item.price - (item.item.cost_price || 0)
        const totalProfit = profitPerItem * item.baseQuantity
        const totalRevenue = item.price * item.baseQuantity

        console.log(`Updating inventory for ${item.item.item_name}:`)
        console.log(`  Quantity: ${item.item.quantity} - ${item.baseQuantity} = ${newQuantity}`)
        console.log(`  Total sold increment: ${item.baseQuantity}`)
        console.log(`  Total revenue increment: ${totalRevenue}`)
        console.log(`  Total profit increment: ${totalProfit}`)

        const updateData: any = {
          quantity: newQuantity,
          total_sold: (item.item.total_sold || 0) + item.baseQuantity,
          total_revenue: (item.item.total_revenue || 0) + totalRevenue,
          total_profit: (item.item.total_profit || 0) + totalProfit
        }

        // Archive item if quantity becomes zero or negative
        if (newQuantity <= 0) {
          updateData.is_archived = true
          console.log(`Archiving item ${item.item.item_name} due to zero stock`)
        }

        const { error: updateError } = await supabase!
          .from('inventory')
          .update(updateData)
          .eq('id', item.item.id)

        if (updateError) {
          console.error('Inventory update error:', updateError)
          throw updateError
        }
      }

      // If debt payment, update customer debt
      if (paymentMethod === 'debt') {
        const customer = customers.find(c => c.id === selectedCustomer)
        if (customer) {
          console.log(`Updating customer debt: ${customer.total_debt} + ${total} = ${customer.total_debt + total}`)

          const { error: debtError } = await supabase!
            .from('customers')
            .update({
              total_debt: customer.total_debt + total
            })
            .eq('id', selectedCustomer)

          if (debtError) {
            console.error('Customer debt update error:', debtError)
            throw debtError
          }

          // Add to customer payments
          const { error: paymentError } = await supabase!
            .from('customer_payments')
            .insert({
              customer_id: selectedCustomer,
              date: new Date().toISOString().split('T')[0],
              amount: total,
              items: cart.map(item => `${item.item.item_name} x${item.quantity} ${item.unit}`).join(', '),
              note: 'Sale on credit'
            })

          if (paymentError) {
            console.error('Customer payment insertion error:', paymentError)
            throw paymentError
          }
        }
      }

      // Print receipt with customer name and actual invoice number for ALL sales
      const customerName = customers.find(c => c.id === selectedCustomer)?.name
      const actualInvoiceNumber = saleData.invoice_number
      console.log('Printing receipt for customer:', customerName, 'with invoice number:', actualInvoiceNumber, 'sold by:', userName)
      printReceipt(cart, total, customerName, paymentMethod, actualInvoiceNumber, userName)

      // Reset cart
      setCart([])
      setPaymentMethod('cash')
      setSelectedCustomer('')
      setDiscount(0)
      setCustomerRequired(false)
      fetchInventory()
      fetchCustomers()

      alert('فرۆشتن بە سەرکەوتوویی تەواوبوو!')
    } catch (error) {
      console.error('Error completing sale:', error)
      alert(`هەڵە لە تەواوبوونی فرۆشتن: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const printReceipt = (items: CartItem[], total: number, customerName?: string, paymentMethod?: 'cash' | 'fib' | 'debt', invoiceNumber?: number, soldBy?: string) => {
    const receiptWindow = window.open('', '_blank', 'width=400,height=800')
    if (!receiptWindow) return

    // Get customer phone from selected customer
    const selectedCustomerData = customers.find(c => c.id === selectedCustomer)
    const customerPhone = selectedCustomerData?.phone1 || ''

    // Payment status text
    const getPaymentStatus = () => {
      switch (paymentMethod) {
        case 'cash':
          return 'نەختینە'
        case 'fib':
          return 'ئۆنلاین (FIB)'
        case 'debt':
          return 'قەرز'
        default:
          return 'نەپارەدراو'
      }
    }

    // Use invoice settings for branding
    const shopName = invoiceSettings?.shop_name || 'فرۆشگای کوردستان'
    const shopPhone = invoiceSettings?.shop_phone || ''
    const shopAddress = invoiceSettings?.shop_address || ''
    const shopLogo = invoiceSettings?.shop_logo || ''
    const thankYouNote = invoiceSettings?.thank_you_note || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
    const qrCodeUrl = invoiceSettings?.qr_code_url || ''

    // Calculate tax (assuming 0% for now, can be configured later)
    const tax = 0
    const subtotal = total - discount

    const receiptHTML = `
      <html>
        <head>
          <title>فاکتور #${invoiceNumber}</title>
          <meta charset="UTF-8">
          <style>
            @font-face {
              font-family: 'UniSalar_F_007';
              src: url('/fonts/UniSalar_F_007.otf') format('truetype');
              font-weight: normal;
              font-style: normal;
            }

            body {
              font-family: 'UniSalar_F_007', sans-serif;
              font-size: 11px;
              line-height: 1.4;
              margin: 0;
              padding: 5px;
              direction: rtl;
              background: white;
              color: #000;
              font-weight: bold !important;
              letter-spacing: 0.5px;
            }

            .receipt {
              width: 80mm;
              max-width: 300px;
              margin: 0 auto;
              padding: 5px;
            }

            /* 1. Header Section (Visual Brand) */
            .header {
              text-align: center;
              margin-bottom: 10px;
            }

            .logo {
              width: 70px;
              height: 70px;
              margin: 0 auto 8px;
              border-radius: 6px;
              overflow: hidden;
              background: #f8f9fa;
              border: 2px solid #e9ecef;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .logo img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }

            .shop-name {
              font-size: 15px;
              font-weight: bold;
              margin: 6px 0 4px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .shop-info {
              font-size: 9px;
              margin: 3px 0;
              color: #495057;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
            }

            .separator {
              text-align: center;
              margin: 8px 0;
              font-size: 8px;
              color: #6c757d;
              letter-spacing: -1px;
            }

            /* 2. Invoice Meta Details */
            .metadata {
              margin: 8px 0;
              font-size: 9px;
            }

            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 4px 8px;
              margin-bottom: 6px;
            }

            .meta-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .meta-label {
              font-weight: bold;
              color: #495057;
            }

            .meta-value {
              font-family: 'JetBrains Mono', monospace;
              font-weight: 600;
              text-align: left;
              direction: ltr;
            }

            /* 3. Itemized List (The Grid) */
            .items-table {
              margin: 10px 0;
              border-collapse: collapse;
              width: 100%;
              font-size: 9px;
            }

            .items-table th {
              border-bottom: 2px solid #000;
              padding: 4px 2px;
              text-align: right;
              font-weight: bold;
              font-size: 8px;
              background: #f8f9fa;
            }

            .items-table td {
              padding: 4px 2px;
              border-bottom: 1px dotted #adb5bd;
            }

            .item-name {
              text-align: right;
              max-width: 70px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-weight: 500;
            }

            .item-unit {
              text-align: center;
              min-width: 25px;
              font-weight: 500;
            }

            .item-qty {
              text-align: right;
              min-width: 25px;
              font-family: 'JetBrains Mono', monospace;
              font-weight: bold;
              direction: ltr;
            }

            .item-price {
              text-align: right;
              min-width: 40px;
              font-family: 'JetBrains Mono', monospace;
              font-weight: bold;
              direction: ltr;
              padding-left: 5px;
            }

            /* 4. Financial Summary (The Totals) */
            .financial-summary {
              margin: 10px 0;
              border-top: 2px solid #000;
              padding-top: 6px;
            }

            .summary-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 4px 0;
              font-size: 10px;
            }

            .summary-label {
              font-weight: bold;
              color: #495057;
            }

            .summary-value {
              font-family: 'JetBrains Mono', monospace;
              font-weight: bold;
              text-align: right;
              direction: ltr;
            }

            .total-highlight {
              background: #000;
              color: #fff;
              padding: 10px 15px;
              text-align: center;
              font-size: 15px;
              font-weight: 900;
              margin: 12px 0;
              font-family: 'JetBrains Mono', monospace;
              border-radius: 6px;
              letter-spacing: 1px;
            }

            /* 5. Footer & Social */
            .footer {
              text-align: center;
              margin-top: 10px;
            }

            .thank-you {
              font-size: 9px;
              margin: 8px 0;
              font-style: italic;
              text-align: center;
              color: #6c757d;
            }

            .qr-code {
              text-align: center;
              margin: 10px 0;
            }

            .qr-code img {
              width: 55px;
              height: 55px;
              border: 2px solid #000;
              border-radius: 4px;
            }

            .footer-text {
              font-size: 7px;
              color: #adb5bd;
              margin-top: 6px;
              border-top: 1px solid #dee2e6;
              padding-top: 4px;
            }

            /* Unistellar Font Override for Print */
            @media print {
              * {
                font-family: 'JetBrains Mono', 'Courier New', monospace !important;
              }

              body {
                margin: 0;
                padding: 2px;
              }

              .receipt {
                width: 80mm;
                padding: 3px;
              }

              .separator {
                border-top-style: dashed;
                border-top-width: 1px;
                border-top-color: #000;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <!-- 1. Header Section (Visual Brand) -->
            <div class="header">
              ${shopLogo ? `
                <div class="logo">
                  <img src="${shopLogo}" alt="${shopName}" />
                </div>
              ` : ''}
              <div class="shop-name">${shopName}</div>
              ${shopPhone ? `<div class="shop-info">📞 ${shopPhone}</div>` : ''}
              ${shopAddress ? `<div class="shop-info">📍 ${shopAddress}</div>` : ''}
            </div>

            <div class="separator">--------------------------</div>

            <!-- 2. Invoice Meta Details -->
            <div class="metadata">
              <div class="meta-grid">
                <div class="meta-item">
                  <span class="meta-label">ژمارەی فاکتور:</span>
                  <span class="meta-value">#${invoiceNumber}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">بەروار/کات:</span>
                  <span class="meta-value">${new Date().toLocaleString('ku')}</span>
                </div>
                ${customerName ? `
                  <div class="meta-item">
                    <span class="meta-label">کڕیار:</span>
                    <span class="meta-value">${customerName}</span>
                  </div>
                ` : ''}
                ${customerPhone ? `
                  <div class="meta-item">
                    <span class="meta-label">تەلەفۆن:</span>
                    <span class="meta-value">${customerPhone}</span>
                  </div>
                ` : ''}
                <div class="meta-item" style="grid-column: span 2;">
                  <span class="meta-label">شێوازی پارەدان:</span>
                  <span class="meta-value">${getPaymentStatus()}</span>
                </div>
                ${soldBy ? `
                  <div class="meta-item" style="grid-column: span 2;">
                    <span class="meta-label">فرۆشیار:</span>
                    <span class="meta-value">${soldBy}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="separator"></div>

            <!-- 3. Itemized List (The Grid) -->
            <table class="items-table">
              <thead>
                <tr>
                  <th class="item-name">ناوی کاڵا</th>
                  <th class="item-unit">یەکە</th>
                  <th class="item-qty">بڕ</th>
                  <th class="item-price">نرخ</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td class="item-name">${item.item.item_name}</td>
                    <td class="item-unit">${item.unit}</td>
                    <td class="item-qty">${item.quantity}</td>
                    <td class="item-price">${formatCurrency(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="separator"></div>

            <!-- 4. Financial Summary (The Totals) -->
            <div class="financial-summary">
              <div class="summary-row">
                <span class="summary-value">${formatCurrency(subtotal)}</span>
              </div>
              ${tax > 0 ? `
               
              ` : ''}
              ${discount > 0 ? `
                <div class="summary-row">
                  <span class="summary-label">داشکاندن:</span>
                  <span class="summary-value" style="color: #dc3545;">-${formatCurrency(discount)}</span>
                </div>
              ` : ''}
              <div class="summary-row">
                <span class="summary-label">کۆی گشتی:</span>
                <span class="summary-value">${formatCurrency(total)}</span>
              </div>
            </div>

            <!-- Grand Total Highlight -->
            <div class="total-highlight">
              کۆی گشتی: ${formatCurrency(total)} IQD
            </div>

            <!-- 5. Footer & Social -->
            <div class="footer">
              <div class="thank-you">
                ${thankYouNote}
              </div>

              ${qrCodeUrl ? `
                <div class="qr-code">
                  <img src="${qrCodeUrl}" alt="QR Code" />
                </div>
              ` : ''}

              <div class="footer-text">
                سیستم بەرهەم هێنراوە لە لایەن Click Group
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    receiptWindow.document.write(receiptHTML)
    receiptWindow.document.close()

    // Auto-print after a short delay to ensure content loads
    setTimeout(() => {
      receiptWindow.print()
    }, 500)
  }



  if (loading) {
    return (
      <div className="h-screen flex">
        {/* Left Side - Products Skeleton */}
        <div className="w-2/3 p-4 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="mb-4">
            <div className="h-8 bg-white/60 rounded-lg mb-4 animate-pulse"></div>
            <div className="h-12 bg-white/60 rounded-lg animate-pulse"></div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Right Side - Cart Skeleton */}
        <div className="w-1/3 bg-white/60 backdrop-blur-xl border-r border-white/20 shadow-2xl">
          <div className="p-6">
            <div className="h-8 bg-white/40 rounded-lg mb-6 animate-pulse"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-white/40 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const groupedInventory = getGroupedInventory()
  const filteredInventory = getFilteredInventory()

  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Left Side - Products */}
      <div className="w-2/3 p-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full flex flex-col"
        >
          {/* Header */}
          <div className="mb-6">
            <motion.h2
              className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              style={{ fontFamily: 'var(--font-uni-salar)' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              کاڵاکان
            </motion.h2>

            {/* Customer Search */}
            <motion.div
              className="mb-4 relative customer-search-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value)
                      setShowCustomerDropdown(true)
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="گەڕان بۆ کڕیار (ناو یان ژمارەی تەلەفۆن)"
                    className="w-full px-6 py-4 pr-12 rounded-2xl border-0 bg-white/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    style={{
                      fontFamily: 'var(--font-uni-salar)',
                      color: 'var(--theme-primary)'
                    }}
                  />

                  {/* Customer Dropdown */}
                  <AnimatePresence>
                    {showCustomerDropdown && customerSearchTerm && (
                      <motion.div
                        className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-50 max-h-64 overflow-y-auto"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        {getFilteredCustomers().length > 0 ? (
                          getFilteredCustomers().map((customer, index) => (
                            <motion.button
                              key={customer.id}
                              onClick={() => selectCustomer(customer)}
                              className="w-full px-4 py-3 text-right hover:bg-blue-50/50 transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <div className="flex justify-between items-center">
                                <div className="text-left">
                                  <div className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    {customer.phone1}
                                  </div>
                                  {customer.total_debt > 0 && (
                                    <div className="text-xs text-red-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                                      قەرز: {formatCurrency(customer.total_debt)} IQD
                                    </div>
                                  )}
                                </div>
                                <div className="font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                  {customer.name}
                                </div>
                              </div>
                            </motion.button>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            هیچ کڕیارێک نەدۆزرایەوە
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Add New Customer Button */}
                <motion.button
                  onClick={createNewCustomer}
                  className="px-4 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  title="کڕیاری نوێ زیادبکە"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </motion.button>
              </div>

              {/* Selected Customer Display */}
              <AnimatePresence>
                {selectedCustomerData && (
                  <motion.div
                    className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">👤</span>
                        </div>
                        <div>
                          <div className="font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            {selectedCustomerData.name}
                          </div>
                          <div className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {selectedCustomerData.phone1}
                          </div>
                        </div>
                      </div>
                      {selectedCustomerData.total_debt > 0 && (
                        <div className="text-right">
                          <div className="text-sm text-red-600 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                            قەرزی ئێستا
                          </div>
                          <div className="text-lg font-bold text-red-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {formatCurrency(selectedCustomerData.total_debt)} IQD
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Category Filter */}
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border-0 bg-white/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                style={{
                  fontFamily: 'var(--font-uni-salar)',
                  color: 'var(--theme-primary)'
                }}
              >
                <option value="all">هەموو پۆلەکان</option>
                {groupedInventory.map((group) => (
                  <option key={group.name} value={group.name}>{group.name}</option>
                ))}
              </select>
            </motion.div>
          </div>

          {/* Products Grid */}
          <motion.div
            className="flex-1 overflow-y-auto pr-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="grid grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredInventory.map((item, index) => (
                  <motion.button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="group relative bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-lg hover:shadow-2xl border border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      delay: index * 0.05,
                      duration: 0.3
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500 rounded-3xl"></div>

                    <div className="relative z-10 text-center">
                      {/* Product Image */}
                      <div className="mb-4">
                        <ProductImage item={item} className="w-20 h-20" />
                      </div>

                      {/* Product Name */}
                      <h3 className="font-bold text-lg mb-2 text-gray-800 group-hover:text-blue-600 transition-colors duration-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        {item.item_name}
                      </h3>

                      {/* Price */}
                      <motion.p
                        className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                        whileHover={{ scale: 1.05 }}
                      >
                        {formatCurrency(item.selling_price)} IQD
                      </motion.p>

                      {/* Stock Level */}
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${item.quantity > 10 ? 'bg-green-400' : item.quantity > 5 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {toEnglishDigits(item.quantity.toString())} {item.unit}
                        </p>
                      </div>

                      {/* Category Badge */}
                      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        {item.category}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Side - Glassmorphism Cart */}
      <motion.div
        className="w-1/3 bg-white/60 backdrop-blur-xl border-r border-white/20 shadow-2xl flex flex-col"
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Cart Header */}
        <div className="p-6 border-b border-white/20">
          <motion.h2
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            سەبەتە
          </motion.h2>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              {cart.length} کاڵا
            </span>
            <motion.div
              className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
              animate={{ scale: cart.length > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-white text-sm font-bold">{cart.length}</span>
            </motion.div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {cart.map((item, index) => (
              <motion.div
                key={item.id}
                className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, x: 50 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: addedItemId === item.id ? [1, 1.05, 1] : 1
                }}
                exit={{ opacity: 0, x: -50, scale: 0.8 }}
                transition={{
                  delay: index * 0.1,
                  scale: { duration: 0.6, ease: "easeInOut" }
                }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      {item.item.item_name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {toEnglishDigits(item.quantity.toString())} {item.unit} × {formatCurrency(item.price)} IQD
                    </p>
                    <div className="flex items-center space-x-2">
                      <motion.button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center font-bold transition-colors duration-200"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        -
                      </motion.button>
                      <span className="font-bold text-lg min-w-[2rem] text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {toEnglishDigits(item.quantity.toString())}
                      </span>
                      <motion.button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center font-bold transition-colors duration-200"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        +
                      </motion.button>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg text-gray-800 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {formatCurrency(item.total)} IQD
                    </p>
                    <motion.button
                      onClick={() => removeFromCart(item.id)}
                      className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ✕
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {cart.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-gray-500 text-lg" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                سەبەتە بەتاڵە
              </p>
              <p className="text-gray-400 text-sm mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                کاڵایەک هەڵبژێرە بۆ زیادکردن
              </p>
            </motion.div>
          )}
        </div>

        {/* Fixed Bottom Section - FAB */}
        <motion.div
          className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-white/20 p-6 shadow-2xl"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <div className="space-y-4">
            {/* Mandatory Customer Selection */}
            <motion.div
              className={`space-y-2 ${customerRequired ? 'animate-pulse' : ''}`}
              animate={customerRequired ? {
                boxShadow: ['0 0 0 0 rgba(239, 68, 68, 0.7)', '0 0 0 4px rgba(239, 68, 68, 0)', '0 0 0 0 rgba(239, 68, 68, 0.7)']
              } : {}}
              transition={{ duration: 1.5, repeat: customerRequired ? Infinity : 0 }}
            >
              <label className="block text-sm font-semibold text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                هەڵبژاردنی کڕیار <span className="text-red-500">*</span>
                {customerRequired && (
                  <span className="text-red-500 text-xs mr-2">(پێویستە)</span>
                )}
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => {
                  setSelectedCustomer(e.target.value)
                  setCustomerRequired(false)
                }}
                className={`w-full px-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:outline-none transition-all duration-300 ${
                  customerRequired
                    ? 'ring-2 ring-red-500 border-red-300 bg-red-50/50'
                    : 'focus:ring-blue-500'
                }`}
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                <option value="">هەڵبژاردنی کڕیار</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} (قەرزی ئێستا: {formatCurrency(customer.total_debt)} IQD)
                  </option>
                ))}
              </select>
              {customerRequired && (
                <p className="text-red-600 text-xs" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  تکایە کڕیارێک هەڵبژێرە بۆ تەواوبوونی فرۆشتن
                </p>
              )}
            </motion.div>

            {/* Triple Payment System */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                شێوازی پارەدان
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {/* Cash Payment */}
                <motion.button
                  onClick={() => {
                    setPaymentMethod('cash')
                    if (!selectedCustomer) {
                      setCustomerRequired(true)
                    }
                  }}
                  className={`group p-4 rounded-2xl backdrop-blur-xl border-2 transition-all duration-300 ${
                    paymentMethod === 'cash'
                      ? 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/25'
                      : 'bg-white/60 border-white/30 hover:bg-green-50/50 hover:border-green-300'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">💵</div>
                    <div className={`text-sm font-bold ${paymentMethod === 'cash' ? 'text-green-700' : 'text-gray-700'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      نەختینە
                    </div>
                    <div className={`text-xs ${paymentMethod === 'cash' ? 'text-green-600' : 'text-gray-500'}`}>Cash</div>
                  </div>
                </motion.button>

                {/* FIB Payment */}
                <motion.button
                  onClick={() => {
                    setPaymentMethod('fib')
                    if (!selectedCustomer) {
                      setCustomerRequired(true)
                    }
                  }}
                  className={`group p-4 rounded-2xl backdrop-blur-xl border-2 transition-all duration-300 ${
                    paymentMethod === 'fib'
                      ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/25'
                      : 'bg-white/60 border-white/30 hover:bg-blue-50/50 hover:border-blue-300'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">💳</div>
                    <div className={`text-sm font-bold ${paymentMethod === 'fib' ? 'text-blue-700' : 'text-gray-700'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      ئۆنلاین
                    </div>
                    <div className={`text-xs ${paymentMethod === 'fib' ? 'text-blue-600' : 'text-gray-500'}`}>FIB</div>
                  </div>
                </motion.button>

                {/* Pay Later Payment */}
                <motion.button
                  onClick={() => {
                    setPaymentMethod('debt')
                    if (!selectedCustomer) {
                      setCustomerRequired(true)
                    }
                  }}
                  className={`group p-4 rounded-2xl backdrop-blur-xl border-2 transition-all duration-300 ${
                    paymentMethod === 'debt'
                      ? 'bg-orange-500/20 border-orange-500 shadow-lg shadow-orange-500/25'
                      : 'bg-white/60 border-white/30 hover:bg-orange-50/50 hover:border-orange-300'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">📝</div>
                    <div className={`text-sm font-bold ${paymentMethod === 'debt' ? 'text-orange-700' : 'text-gray-700'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      قەرز
                    </div>
                    <div className={`text-xs ${paymentMethod === 'debt' ? 'text-orange-600' : 'text-gray-500'}`}>Pay Later</div>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Discount Input */}
            <motion.div whileHover={{ scale: 1.02 }}>
              <label className="block text-sm font-medium mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                داشکاندن
              </label>
              <input
                type="text"
                value={toEnglishDigits(discount.toString())}
                onChange={(e) => {
                  const sanitized = sanitizeNumericInput(e.target.value)
                  setDiscount(safeStringToNumber(sanitized))
                }}
                className="w-full px-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                style={{ fontFamily: 'Inter, sans-serif' }}
                placeholder="0.00"
              />
            </motion.div>

            {/* Total Display */}
            <motion.div
              className="text-center p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-xl"
              whileHover={{ scale: 1.02 }}
              animate={{
                scale: cart.length > 0 ? [1, 1.02, 1] : 1
              }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-white/80 text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                کۆی گشتی
              </p>
              <p className="text-white text-3xl font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                {formatCurrency(getTotal())} IQD
              </p>
            </motion.div>

            {/* Complete Sale Button */}
            <motion.button
              onClick={completeSale}
              disabled={cart.length === 0 || !selectedCustomer}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-uni-salar)' }}
              whileHover={{ scale: cart.length > 0 && selectedCustomer ? 1.02 : 1, y: cart.length > 0 && selectedCustomer ? -2 : 0 }}
              whileTap={{ scale: cart.length > 0 && selectedCustomer ? 0.98 : 1 }}
              animate={{
                backgroundPosition: (cart.length > 0 && selectedCustomer) ? ['0% 50%', '100% 50%', '0% 50%'] : '0% 50%'
              }}
              transition={{
                backgroundPosition: { duration: 3, repeat: (cart.length > 0 && selectedCustomer) ? Infinity : 0, ease: "linear" }
              }}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>
                  {!selectedCustomer
                    ? 'تکایە کڕیارێک هەڵبژێرە بۆ تەواوبوونی فرۆشتن'
                    : 'تەواوبوونی فرۆشتن'
                  }
                </span>
                <motion.span
                  animate={{ x: (cart.length > 0 && selectedCustomer) ? [0, 5, 0] : 0 }}
                  transition={{ duration: 1.5, repeat: (cart.length > 0 && selectedCustomer) ? Infinity : 0 }}
                >
                  💰
                </motion.span>
              </span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Unit Selection Modal */}
      <AnimatePresence>
        {showUnitModal && selectedItem && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/90 backdrop-blur-xl rounded-3xl w-full max-w-md shadow-2xl border border-white/20"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="p-6">
                <motion.h3
                  className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  زیادکردنی {selectedItem.item_name}
                </motion.h3>

                <div className="space-y-5">
                  {/* Unit Display (Fixed - No Selection) */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      یەکەی فرۆشتن
                    </label>
                    <div className="w-full px-4 py-3 rounded-xl border-0 bg-blue-50/60 backdrop-blur-sm shadow-lg border-2 border-blue-200 text-center">
                      <span className="text-lg font-bold text-blue-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        {selectedItem.unit}
                      </span>
                    </div>
                  </motion.div>

                  {/* Quantity Input */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      بڕ
                    </label>
                    <input
                      type="text"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(sanitizeNumericInput(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-center text-xl font-bold"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      placeholder="0.00"
                    />
                  </motion.div>

                  {/* Price Preview */}
                  <AnimatePresence>
                    {selectedSaleUnit && quantityInput && (
                      <motion.div
                        className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: 0.4 }}
                      >
                        <p className="text-lg font-bold text-gray-800 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                          نرخ: {formatCurrency(calculateUnitPrice(selectedItem.selling_price, selectedItem.unit, selectedSaleUnit, safeStringToNumber(quantityInput)))} IQD
                        </p>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          نرخ بەپێی یەکەی {selectedSaleUnit}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Quick Quantity Buttons */}
                  <motion.div
                    className="grid grid-cols-4 gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {[0.25, 0.5, 1, 2].map((qty, index) => (
                      <motion.button
                        key={qty}
                        onClick={() => setQuantityInput(qty.toString())}
                        className="py-3 px-4 bg-gradient-to-br from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 text-gray-700 font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        {qty}
                      </motion.button>
                    ))}
                  </motion.div>
                </div>

                <motion.div
                  className="flex justify-end space-x-3 mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <motion.button
                    onClick={() => setShowUnitModal(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-colors duration-200"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    پاشگەزبوونەوە
                  </motion.button>
                  <motion.button
                    onClick={addUnitItem}
                    disabled={!selectedSaleUnit || !quantityInput}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    زیادکردن
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}