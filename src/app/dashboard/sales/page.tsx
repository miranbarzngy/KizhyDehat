'use client'

import InvoiceTemplate from '@/components/InvoiceTemplate'
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
import { useToast } from '@/components/Toast'
import { AnimatePresence, motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import { Package } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { FaPlus, FaSearch } from 'react-icons/fa'

interface InventoryItem {
  id: string
  name: string
  total_amount_bought: number
  unit: string
  selling_price_per_unit: number
  cost_per_unit: number
  category: string
  image?: string
  barcode1?: string
  barcode2?: string
  barcode3?: string
  barcode4?: string
  total_sold?: number
  total_revenue?: number
  total_profit?: number
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
      className={`bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner border border-white/30 ${className}`}
      whileHover={{ rotate: 5, scale: 1.1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
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
  const invoiceRef = useRef<HTMLDivElement>(null)
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
  const [showInvoice, setShowInvoice] = useState(false)
  const [completedSaleData, setCompletedSaleData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

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

  // Helper function for retry with delay
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // Fetch with retry mechanism
  const fetchWithRetry = async <T>(
    fetchFn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T | null> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fetchFn()
      } catch (err) {
        console.log(`Attempt ${attempt}/${maxRetries} failed:`, err)
        if (attempt < maxRetries) {
          await wait(delayMs)
        }
      }
    }
    return null
  }

  // Main data fetching function with retry
  const fetchAllData = async () => {
    setError(null)
    setRetryCount(0)

    // Fetch inventory with retry
    const inventoryResult = await fetchWithRetry(async () => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('total_amount_bought', 0)
        .or('is_archived.is.null,is_archived.eq.false')
      if (error) throw error
      return data
    }, 3, 1000)

    if (inventoryResult) {
      const processedData = inventoryResult.map(item => ({ 
        ...item, 
        category: item.category || 'ئەوانی تر',
        name: item.name,
        total_amount_bought: item.total_amount_bought,
        selling_price_per_unit: item.selling_price_per_unit,
        cost_per_unit: item.cost_per_unit
      }))
      setInventory(processedData)
    }

    // Fetch customers with retry
    const customersResult = await fetchWithRetry(async () => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.from('customers').select('id, name, phone1, phone2, total_debt')
      if (error) throw error
      return data
    }, 3, 1000)

    if (customersResult) {
      setCustomers(customersResult)
    }

    // Fetch shop settings (non-critical, no retry needed)
    if (supabase) {
      const { data } = await supabase.from('shop_settings').select('*').single()
      setShopSettings(data || null)
    }

    // Fetch invoice settings (non-critical, no retry needed)
    if (supabase) {
      const { data } = await supabase.from('invoice_settings').select('*').single()
      setInvoiceSettings(data || null)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchAllData()

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

    // Priority: profile.name -> user.user_metadata.full_name -> user.user_metadata.name -> 'کارمەند'
    const userNameFromProfile = profile?.name
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
    const unitPrice = calculateUnitPrice(selectedItem.selling_price_per_unit, selectedItem.unit, selectedSaleUnit, quantity)
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

    // Check if Supabase is available
    if (!supabase) {
      const errorMsg = 'Supabase client not configured'
      console.error(errorMsg)
      alert(`هەڵە: ${errorMsg}`)
      return
    }

    try {
      const total = getTotal()

      console.log('Creating pending sale...', {
        customerId: selectedCustomer,
        total,
        paymentMethod,
        cartItems: cart.length,
        userId: user?.id
      })

      // Step 1: Insert sale record with status 'pending'
      // NO inventory updates at this stage
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_id: selectedCustomer,
          total,
          payment_method: paymentMethod,
          user_id: user?.id,
          sold_by: userName,
          discount_amount: discount,
          subtotal: total + discount,
          items_count: cart.length,
          status: 'pending', // Sale is pending approval
          created_at: new Date().toISOString(),
          notes: paymentMethod === 'debt' ? 'Sale on credit' : null
        })
        .select('id, total, payment_method, date, user_id, sold_by, customers(name, phone1)')
        .single()

      if (saleError) {
        console.error('Sale insertion error:', saleError)
        throw saleError
      }

      console.log('Pending sale created:', saleData)

      // Step 2: Insert sale items (without updating products table)
      const saleItems = cart.map(item => ({
        sale_id: saleData.id,
        item_id: item.item.id,
        item_name: item.item.name,
        category: item.item.category,
        quantity: item.baseQuantity,
        unit: item.item.unit,
        price: item.price,
        cost_price: item.item.cost_per_unit || 0,
        total: item.total,
        date: new Date().toISOString().split('T')[0]
      }))

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems)

      if (itemsError) {
        console.error('Sale items insertion error:', itemsError)
        throw itemsError
      }

      console.log('Sale items inserted. Sale is now pending approval.')

      // Show invoice preview with customer data
      const customerName = customers.find(c => c.id === selectedCustomer)?.name
      const customerPhone = customers.find(c => c.id === selectedCustomer)?.phone1

      const invoiceData = {
        invoiceNumber: 0, // Pending sales don't have invoice numbers yet
        customerName: customerName || 'نەناسراو',
        customerPhone: customerPhone,
        sellerName: userName,
        date: new Date().toLocaleDateString('ku'),
        time: new Date().toLocaleTimeString('ku'),
        paymentMethod: paymentMethod,
        items: cart.map(item => ({
          name: item.item.name,
          unit: item.unit,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        subtotal: total + discount,
        discount: discount,
        total: total,
        shopName: invoiceSettings?.shop_name || 'فرۆشگای کوردستان',
        shopPhone: invoiceSettings?.shop_phone,
        shopAddress: invoiceSettings?.shop_address,
        shopLogo: invoiceSettings?.shop_logo,
        qrCodeUrl: invoiceSettings?.qr_code_url,
        thankYouNote: invoiceSettings?.thank_you_note || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
      }

      setCompletedSaleData(invoiceData)
      setShowInvoice(true)

      // Reset cart
      setCart([])
      setPaymentMethod('cash')
      setSelectedCustomer('')
      setDiscount(0)
      setCustomerRequired(false)

      alert('فرۆشتنەکەتۆمارکرا و چاوەڕوانی پشتڕاستکردنەوەیە لە پسوڵەکان.')
    } catch (error) {
      console.error('Error creating pending sale:', error)
      alert(`هەڵە لە تۆمارکردنی فرۆشتن: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }



  const downloadInvoice = async () => {
    if (!invoiceRef.current || !completedSaleData) return

    try {
      // Wait 800ms for QR image and UniSalar fonts to fully render
      await new Promise(resolve => setTimeout(resolve, 800))

      // Create a temporary container with fixed width for consistent capture
      const tempContainer = document.createElement('div')
      tempContainer.style.cssText = 'width: 800px; margin: 0 auto; background-color: white; direction: rtl; font-family: var(--font-uni-salar);'
      
      // Clone the invoice content
      const clone = invoiceRef.current.cloneNode(true) as HTMLElement
      clone.id = 'invoice-container'
      clone.style.width = '800px'
      clone.style.margin = '0 auto'
      clone.style.backgroundColor = 'white'
      clone.style.padding = '20px'
      tempContainer.appendChild(clone)
      
      // Temporarily add to body (hidden)
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '0'
      document.body.appendChild(tempContainer)

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        width: 800,
        windowWidth: 800,
        logging: false,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const clonedContainer = clonedDoc.getElementById('invoice-container')
          if (clonedContainer) {
            clonedContainer.style.display = 'block'
            clonedContainer.style.width = '800px'
            clonedContainer.style.margin = '0 auto'
            clonedContainer.style.backgroundColor = 'white'
          }
        }
      })

      // Remove temporary container
      document.body.removeChild(tempContainer)

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `Invoice_${completedSaleData.invoiceNumber || 'temp'}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }, 'image/png', 1.0)
    } catch (error) {
      console.error('Error downloading invoice:', error)
      alert('هەڵە لە داگرتنی وێنەی فاکتور')
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
              font-size: 10px;
              line-height: 1.3;
              margin: 0;
              padding: 3px;
              direction: rtl;
              background: white;
              color: #000;
              font-weight: bold !important;
              letter-spacing: 0.3px;
            }

            .receipt {
              max-width: 320px;
              width: 100%;
              margin: 0 auto;
              padding: 3px;
            }

            /* 1. Header Section (Visual Brand) */
            .header {
              text-align: center;
              margin-bottom: 8px;
            }

            .logo {
              width: 60px;
              height: 60px;
              margin: 0 auto 6px;
              border-radius: 4px;
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
              object-fit: cover;
            }

            .shop-name {
              font-size: 14px;
              font-weight: bold;
              margin: 4px 0 3px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .shop-info {
              font-size: 8px;
              margin: 2px 0;
              color: #495057;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 3px;
            }

            .separator {
              text-align: center;
              margin: 6px 0;
              font-size: 6px;
              color: #6c757d;
              letter-spacing: -1px;
            }

            /* 2. Invoice Meta Details - Strict Vertical Stacking */
            .metadata {
              margin: 6px 0;
              font-size: 8px;
              text-align: center;
            }

            .meta-item {
              margin: 4px 0;
              text-align: center;
            }

            .meta-label {
              font-weight: bold;
              color: #495057;
              display: block;
              margin-bottom: 2px;
            }

            .meta-value {
              font-family: 'JetBrains Mono', monospace;
              font-weight: 600;
              text-align: center;
              direction: ltr;
              display: block;
            }

            /* 3. Itemized List (The Grid) - Optimized for 80mm */
            .items-table {
              margin: 8px 0;
              width: 100%;
              font-size: 8px;
            }

            .table-header {
              display: flex;
              border-bottom: 1px solid #000;
              padding: 3px 1px;
              font-weight: bold;
              font-size: 7px;
              background: #f8f9fa;
            }

            .table-row {
              display: flex;
              padding: 3px 1px;
              border-bottom: 1px dotted #adb5bd;
            }

            .item-name {
              flex: 1;
              text-align: right;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-weight: 500;
            }

            .item-unit {
              width: 25px;
              text-align: center;
              font-weight: 500;
            }

            .item-qty {
              width: 20px;
              text-align: right;
              font-family: 'JetBrains Mono', monospace;
              font-weight: bold;
              direction: ltr;
            }

            .item-price {
              width: 35px;
              text-align: right;
              font-family: 'JetBrains Mono', monospace;
              font-weight: bold;
              direction: ltr;
              padding-left: 3px;
            }

            /* 4. Financial Summary (The Totals) */
            .financial-summary {
              margin: 8px 0;
              border-top: 1px solid #000;
              padding-top: 4px;
            }

            .summary-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 3px 0;
              font-size: 9px;
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
              padding: 8px 12px;
              text-align: center;
              font-size: 13px;
              font-weight: 900;
              margin: 10px 0;
              font-family: 'JetBrains Mono', monospace;
              border-radius: 4px;
              letter-spacing: 0.5px;
            }

            /* 5. Footer & Social */
            .footer {
              text-align: center;
              margin-top: 8px;
            }

            .thank-you {
              font-size: 8px;
              margin: 6px 0;
              font-style: italic;
              text-align: center;
              color: #6c757d;
            }

            .qr-code {
              text-align: center;
              margin: 8px 0;
            }

            .qr-code img {
              width: 50px;
              height: 50px;
              border: 1px solid #000;
              border-radius: 3px;
            }

            .footer-text {
              font-size: 6px;
              color: #adb5bd;
              margin-top: 4px;
              border-top: 1px solid #dee2e6;
              padding-top: 3px;
            }

            /* Print CSS for 80mm Thermal */
            @media print {
              * {
                font-family: 'UniSalar_F_007', sans-serif !important;
              }

              body {
                margin: 0;
                padding: 0;
              }

              .receipt {
                width: 80mm;
                padding: 0;
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

            <!-- 2. Invoice Meta Details - Vertical Stacking -->
            <div class="metadata">
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
              <div class="meta-item">
                <span class="meta-label">شێوازی پارەدان:</span>
                <span class="meta-value">${getPaymentStatus()}</span>
              </div>
              ${soldBy ? `
                <div class="meta-item">
                  <span class="meta-label">فرۆشیار:</span>
                  <span class="meta-value">${soldBy}</span>
                </div>
              ` : ''}
            </div>

            <div class="separator"></div>

            <!-- 3. Itemized List (The Grid) - Optimized for 80mm -->
            <div class="items-table">
              <div class="table-header">
                <div class="item-name">ناوی کاڵا</div>
                <div class="item-unit">یەکە</div>
                <div class="item-qty">بڕ</div>
                <div class="item-price">نرخ</div>
              </div>
              ${items.map(item => `
                <div class="table-row">
                  <div class="item-name" style="font-family: 'UniSalar_F_007', sans-serif;">${item.item.name}</div>
                  <div class="item-unit">${item.unit}</div>
                  <div class="item-qty">${item.quantity}</div>
                  <div class="item-price">${formatCurrency(item.total)}</div>
                </div>
              `).join('')}
            </div>

            <div class="separator"></div>

            <!-- 4. Financial Summary (The Totals) -->
            <div class="financial-summary">
              <div class="summary-row">
                <span class="summary-label">کۆی بەشی:</span>
                <span class="summary-value">${formatCurrency(subtotal)}</span>
              </div>
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



  const groupedInventory = getGroupedInventory()
  const filteredInventory = getFilteredInventory()

  // Show loading state inline with actual content if still loading
  if (loading) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 gap-4 lg:gap-6 lg:flex-row">
        {/* Products Section */}
        <div className="h-[70vh] lg:h-full lg:flex-1 lg:w-2/3 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="mb-3">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="h-12 w-full bg-white/60 rounded animate-pulse"></div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Cart Section */}
        <div className="h-[30vh] lg:h-full lg:w-96 bg-white/60 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-white/20 flex flex-col">
          <div className="p-3 border-b border-white/20">
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex-1 p-4">
            <div className="text-center text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              بارکردن...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 gap-4 lg:gap-6 lg:flex-row">
      {/* Top Section - Products (Mobile) / Left Side (Desktop) */}
      <div className="h-[70vh] lg:h-full lg:flex-1 lg:w-2/3 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full flex flex-col"
        >
          {/* Header */}
          <div className="mb-3">
            <motion.h2
              className="text-xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              style={{ fontFamily: 'var(--font-uni-salar)' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              کاڵاکان
            </motion.h2>

            {/* Customer Search */}
            <motion.div
              className="mb-2 relative customer-search-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    placeholder="گەڕان بۆ کڕیار"
                    className="w-full px-4 py-2 pr-10 rounded-xl border-0 bg-white/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                    style={{
                      fontFamily: 'var(--font-uni-salar)',
                      color: 'var(--theme-primary)'
                    }}
                  />

                  {/* Customer Dropdown */}
                  <AnimatePresence>
                    {showCustomerDropdown && customerSearchTerm && (
                      <motion.div
                        className="absolute top-full left-0 right-0 mt-1 bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 z-50 max-h-48 overflow-y-auto"
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
                              className="w-full px-3 py-2 text-right hover:bg-blue-50/50 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl text-sm"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <div className="flex justify-between items-center">
                                <div className="text-left">
                                  <div className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    {customer.phone1}
                                  </div>
                                  {customer.total_debt > 0 && (
                                    <div className="text-xs text-red-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                                      قەرز: {formatCurrency(customer.total_debt)} IQD
                                    </div>
                                  )}
                                </div>
                                <div className="font-bold text-gray-800 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                  {customer.name}
                                </div>
                              </div>
                            </motion.button>
                          ))
                        ) : (
                          <div className="px-3 py-4 text-center text-gray-500 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
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
                  className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  title="کڕیاری نوێ زیادبکە"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border-0 bg-white/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
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

          {/* Products List/Grid */}
          <motion.div
            className="flex-1 overflow-y-auto pr-2 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {/* Mobile List View */}
            <div className="lg:hidden space-y-2">
              <AnimatePresence>
                {filteredInventory.map((item, index) => (
                  <motion.button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="w-full h-16 bg-white/60 backdrop-blur-xl rounded-lg shadow-md hover:shadow-lg border border-white/20 transition-all duration-300 hover:scale-[1.02] flex items-center p-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      delay: index * 0.03,
                      duration: 0.2
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Left: Small Image */}
                    <div className="flex-shrink-0 ml-2">
                      <ProductImage item={item} className="w-12 h-12" />
                    </div>

                    {/* Center: Name & Category */}
                    <div className="flex-1 text-right mr-3">
                      <h3 className="font-bold text-sm text-gray-800 truncate" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-600 truncate" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        {item.category}
                      </p>
                    </div>

                    {/* Right: Price */}
                    <div className="flex-shrink-0 text-left">
                      <p className="text-sm font-bold text-blue-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {formatCurrency(item.selling_price_per_unit)}
                      </p>
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                        IQD
                      </p>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {/* Desktop Grid View */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {filteredInventory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="group relative bg-white/60 backdrop-blur-xl rounded-2xl p-4 shadow-lg hover:shadow-2xl border border-white/20 transition-all duration-500 overflow-hidden flex flex-col"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      delay: index * 0.05,
                      duration: 0.3
                    }}
                  >
                    {/* Product Image */}
                    <div className="mb-3 flex justify-center">
                      <ProductImage item={item} className="w-20 h-20" />
                    </div>

                    {/* Product Name */}
                    <h3 className="font-bold text-base mb-1 text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      {item.name}
                    </h3>

                    {/* Price */}
                    <p className="text-xl font-bold text-blue-600 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {formatCurrency(item.selling_price_per_unit)} IQD
                    </p>

                    {/* Stock Level */}
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <div className={`w-2 h-2 rounded-full ${(item.total_amount_bought ?? 0) > 10 ? 'bg-green-400' : (item.total_amount_bought ?? 0) > 5 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                      <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        {toEnglishDigits((item.total_amount_bought ?? 0).toString())} {item.unit}
                      </p>
                    </div>

                    {/* Category Badge */}
                    <div className="inline-block px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium mb-3 mx-auto" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      {item.category}
                    </div>

                    {/* Add to Cart Button - Touch Friendly */}
                    <button
                      onClick={() => addToCart(item)}
                      className="w-full mt-auto py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center gap-2"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <FaPlus className="text-lg" />
                      <span>زیادکردن</span>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Section - Cart (Mobile) / Right Side (Desktop) */}
      <motion.div
        className="h-[30vh] lg:h-full w-full lg:w-96 bg-white/60 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-white/20 shadow-2xl flex flex-col"
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Cart Header */}
        <div className="p-3 border-b border-white/20 bg-white/80">
          <motion.h2
            className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            سەبەتە
          </motion.h2>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              {cart.length} کاڵا
            </span>
            <motion.div
              className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
              animate={{ scale: cart.length > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-white text-xs font-bold">{cart.length}</span>
            </motion.div>
          </div>
        </div>

        {/* Cart Items - Compact */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-60">
          <AnimatePresence>
            {cart.map((item, index) => (
              <motion.div
                key={item.id}
                className="bg-white/40 backdrop-blur-sm rounded-lg p-2 shadow-sm border border-white/20 hover:shadow-md transition-all duration-300"
                initial={{ opacity: 0, x: 50 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: addedItemId === item.id ? [1, 1.05, 1] : 1
                }}
                exit={{ opacity: 0, x: -50, scale: 0.8 }}
                transition={{
                  delay: index * 0.05,
                  scale: { duration: 0.6, ease: "easeInOut" }
                }}
                whileHover={{ scale: 1.01, y: -0.5 }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 text-xs truncate" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      {item.item.name}
                    </h4>
                    <p className="text-xs text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {toEnglishDigits(item.quantity.toString())} {item.unit} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  {/* Touch-Friendly Cart Buttons */}
                  <div className="flex items-center gap-2 mr-2">
                    <motion.button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl flex items-center justify-center font-bold transition-colors duration-200 shadow-md"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="کەمکردن"
                    >
                      <span className="text-lg">−</span>
                    </motion.button>
                    <span className="font-bold text-sm min-w-[2rem] text-center px-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {toEnglishDigits(item.quantity.toString())}
                    </span>
                    <motion.button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-10 h-10 bg-green-100 hover:bg-green-200 text-green-600 rounded-xl flex items-center justify-center font-bold transition-colors duration-200 shadow-md"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="زیادکردن"
                    >
                      <FaPlus className="text-sm" />
                    </motion.button>
                    <motion.button
                      onClick={() => removeFromCart(item.id)}
                      className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center transition-colors duration-200 shadow-md"
                      whileHover={{ scale: 1.05, rotate: 90 }}
                      whileTap={{ scale: 0.95 }}
                      title="سڕینەوە"
                    >
                      <span className="text-sm">✕</span>
                    </motion.button>
                  </div>
                </div>
                <div className="text-right mt-1">
                  <span className="font-bold text-sm text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {formatCurrency(item.total)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {cart.length === 0 && (
            <motion.div
              className="text-center py-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-3xl mb-2">🛒</div>
              <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                سەبەتەکە بەتاڵە
              </p>
            </motion.div>
          )}
        </div>

        {/* Checkout Section - Always Visible */}
        <div className="bg-white/80 backdrop-blur-xl border-t border-white/20 p-3 space-y-2">
          {/* Customer Selection */}
          <motion.div
            className={`space-y-1 ${customerRequired ? 'animate-pulse' : ''}`}
            animate={customerRequired ? {
              boxShadow: ['0 0 0 0 rgba(239, 68, 68, 0.7)', '0 0 0 4px rgba(239, 68, 68, 0)', '0 0 0 0 rgba(239, 68, 68, 0.7)']
            } : {}}
            transition={{ duration: 1.5, repeat: customerRequired ? Infinity : 0 }}
          >
            <select
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value)
                setCustomerRequired(false)
              }}
              className={`w-full px-2 py-1 rounded border-0 bg-white/60 backdrop-blur-sm shadow-sm focus:ring-1 focus:outline-none transition-all duration-300 text-xs ${
                customerRequired
                  ? 'ring-1 ring-red-500 border-red-300 bg-red-50/50'
                  : 'focus:ring-blue-500'
              }`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <option value="">کڕیار</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Payment Method - Compact */}
          <div className="grid grid-cols-3 gap-1">
            <motion.button
              onClick={() => {
                setPaymentMethod('cash')
                if (!selectedCustomer) setCustomerRequired(true)
              }}
              className={`p-1 rounded-lg backdrop-blur-xl border transition-all duration-300 text-xs ${
                paymentMethod === 'cash'
                  ? 'bg-green-500/20 border-green-500 shadow-sm'
                  : 'bg-white/60 border-white/30 hover:bg-green-50/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <div className="text-sm mb-0.5">💵</div>
                <div className={`text-xs font-bold ${paymentMethod === 'cash' ? 'text-green-700' : 'text-gray-700'}`}>
                  کاش
                </div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => {
                setPaymentMethod('fib')
                if (!selectedCustomer) setCustomerRequired(true)
              }}
              className={`p-1 rounded-lg backdrop-blur-xl border transition-all duration-300 text-xs ${
                paymentMethod === 'fib'
                  ? 'bg-blue-500/20 border-blue-500 shadow-sm'
                  : 'bg-white/60 border-white/30 hover:bg-blue-50/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <div className="text-sm mb-0.5">💳</div>
                <div className={`text-xs font-bold ${paymentMethod === 'fib' ? 'text-blue-700' : 'text-gray-700'}`}>
                  ئۆنلاین
                </div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => {
                setPaymentMethod('debt')
                if (!selectedCustomer) setCustomerRequired(true)
              }}
              className={`p-1 rounded-lg backdrop-blur-xl border transition-all duration-300 text-xs ${
                paymentMethod === 'debt'
                  ? 'bg-orange-500/20 border-orange-500 shadow-sm'
                  : 'bg-white/60 border-white/30 hover:bg-orange-50/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <div className="text-sm mb-0.5">📝</div>
                <div className={`text-xs font-bold ${paymentMethod === 'debt' ? 'text-orange-700' : 'text-gray-700'}`}>
                  قەرز
                </div>
              </div>
            </motion.button>
          </div>

          {/* Discount Section */}
          <motion.div
            className="space-y-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-xs font-medium text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              داشکاندن (IQD)
            </label>
            <input
              type="text"
              value={discount}
              onChange={(e) => setDiscount(safeStringToNumber(e.target.value))}
              className="w-full px-2 py-1 rounded border-0 bg-white/60 backdrop-blur-sm shadow-sm focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs text-center"
              style={{ fontFamily: 'Inter, sans-serif' }}
              placeholder="0"
            />
          </motion.div>

          {/* Total Display */}
          <motion.div
            className="text-center p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-md"
            whileHover={{ scale: 1.01 }}
            animate={{
              scale: cart.length > 0 ? [1, 1.01, 1] : 1
            }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-white/80 text-xs font-medium mb-0.5" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              کۆی گشتی
            </p>
            <p className="text-white text-lg font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
              {formatCurrency(getTotal())} IQD
            </p>
          </motion.div>

          {/* Complete Sale Button */}
          <motion.button
            onClick={completeSale}
            disabled={cart.length === 0 || !selectedCustomer}
            className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
            whileHover={{ scale: cart.length > 0 && selectedCustomer ? 1.01 : 1, y: cart.length > 0 && selectedCustomer ? -0.5 : 0 }}
            whileTap={{ scale: cart.length > 0 && selectedCustomer ? 0.99 : 1 }}
            animate={{
              backgroundPosition: (cart.length > 0 && selectedCustomer) ? ['0% 50%', '100% 50%', '0% 50%'] : '0% 50%'
            }}
            transition={{
              backgroundPosition: { duration: 3, repeat: (cart.length > 0 && selectedCustomer) ? Infinity : 0, ease: "linear" }
            }}
          >
            <span className="flex items-center justify-center space-x-1">
              <span>
                {!selectedCustomer
                  ? 'کڕیار'
                  : 'فرۆشتن'
                }
              </span>
              <motion.span
                animate={{ x: (cart.length > 0 && selectedCustomer) ? [0, 3, 0] : 0 }}
                transition={{ duration: 1.5, repeat: (cart.length > 0 && selectedCustomer) ? Infinity : 0 }}
              >
                💰
              </motion.span>
            </span>
          </motion.button>
        </div>
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
                  زیادکردنی {selectedItem.name}
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
                          نرخ: {formatCurrency(calculateUnitPrice(selectedItem.selling_price_per_unit, selectedItem.unit, selectedSaleUnit, safeStringToNumber(quantityInput)))} IQD
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

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoice && completedSaleData && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInvoice(false)}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">🧾</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      فاکتور #{completedSaleData.invoiceNumber}
                    </h3>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {completedSaleData.date} - {completedSaleData.customerName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInvoice(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="text-gray-400 text-xl">×</span>
                </button>
              </div>

              {/* Invoice Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div ref={invoiceRef}>
                  <InvoiceTemplate data={completedSaleData} />
                </div>
              </div>

              {/* Sticky Modal Footer */}
              <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-lg p-4 print:hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Total Amount Display */}
                  <div className="text-center sm:text-right">
                    <div className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      کۆی گشتی
                    </div>
                    <div className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>
                      {formatCurrency(completedSaleData.total)} IQD
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <motion.button
                      onClick={() => {
                        window.print()
                        setShowInvoice(false)
                      }}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 print:hidden"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>چاپکردن</span>
                    </motion.button>

                    <motion.button
                      onClick={downloadInvoice}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 print:hidden"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>داگرتن</span>
                    </motion.button>

                    <motion.button
                      onClick={() => setShowInvoice(false)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 print:hidden"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>داخستن</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}