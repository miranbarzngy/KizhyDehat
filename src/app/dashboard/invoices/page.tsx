'use client'

import InvoiceTemplate from '@/components/InvoiceTemplate'
import { formatCurrency, formatCurrencyWithDecimals, toEnglishDigits } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import { useEffect, useRef, useState } from 'react'
import { FaCog, FaEye, FaFileInvoice, FaImage, FaMapMarkerAlt, FaPhone, FaPrint, FaQrcode, FaSearch, FaStore } from 'react-icons/fa'

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

interface Invoice {
  id: string
  invoice_number: number
  customer_name: string
  total: number
  status: string
  payment_method: string
  date: string
  items_count: number
}

function InvoicePreview({ saleData, invoice, invoiceRef }: { saleData: any, invoice: Invoice, invoiceRef: React.RefObject<HTMLDivElement> }) {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!supabase) return

        const { data, error } = await supabase
          .from('invoice_settings')
          .select('*')
          .single()

        if (!error && data) {
          setSettings(data)
        } else {
          // Use default settings
          setSettings({
            shop_name: 'فرۆشگای کوردستان',
            shop_phone: '',
            shop_address: '',
            shop_logo: '',
            thank_you_note: 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.',
            qr_code_url: ''
          })
        }
      } catch (error) {
        console.error('Error fetching invoice settings:', error)
        setSettings({
          shop_name: 'فرۆشگای کوردستان',
          shop_phone: '',
          shop_address: '',
          shop_logo: '',
          thank_you_note: 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.',
          qr_code_url: ''
        })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  // Prepare invoice data for InvoiceTemplate - with safety checks for null settings
  // For pending sales (invoice_number === 0), show placeholder instead of #0
  const displayInvoiceNumber = invoice.invoice_number && invoice.invoice_number > 0 
    ? invoice.invoice_number 
    : undefined // Will show placeholder in template

  const invoiceData = {
    invoiceNumber: displayInvoiceNumber || 0,
    customerName: saleData.customers?.name || 'نەناسراو',
    customerPhone: saleData.customers?.phone1 || '',
    sellerName: saleData.sold_by || 'فرۆشیار',
    date: new Date(invoice.date).toLocaleDateString('ku'),
    time: new Date().toLocaleTimeString('ku'),
    paymentMethod: invoice.payment_method || 'cash',
    items: saleData.sale_items?.map((item: any) => ({
      name: item.products?.name || 'نەناسراو',
      unit: item.products?.unit || item.unit || 'دانە',
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity // Calculate line total correctly
    })) || [],
    subtotal: saleData.subtotal || invoice.total,
    discount: saleData.discount_amount || 0,
    total: invoice.total,
    shopName: settings?.shop_name || 'فرۆشگای کوردستان',
    shopPhone: settings?.shop_phone || '',
    shopAddress: settings?.shop_address || '',
    shopLogo: settings?.shop_logo || '',
    qrCodeUrl: settings?.qr_code_url || '',
    thankYouNote: settings?.thank_you_note || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
  }

  return (
    <div ref={invoiceRef}>
      <InvoiceTemplate data={invoiceData} />
    </div>
  )
}

interface PendingSale {
  id: string
  customer_name: string
  customer_phone: string
  total: number
  date: string
  items: Array<{
    name: string
    quantity: number
    unit: string
    price: number
    total: number
  }>
}

export default function InvoicesPage() {
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'settings' | 'invoices' | 'pending'>('pending')
  const [settings, setSettings] = useState<InvoiceSettings | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)


  // Settings form state
  const [formData, setFormData] = useState({
    shop_name: '',
    shop_phone: '',
    shop_address: '',
    shop_logo: null as File | null,
    thank_you_note: '',
    qr_code_url: '',
    qr_code_file: null as File | null
  })

  useEffect(() => {
    fetchSettings()
    fetchInvoices()
    fetchPendingSales()
  }, [])

  const fetchPendingSales = async () => {
    if (!supabase) {
      setPendingSales([])
      return
    }

    try {
      // First check if status column exists by trying a simple query
      let hasStatusColumn = false
      try {
        const testQuery = await supabase
          .from('sales')
          .select('status')
          .limit(1)

        hasStatusColumn = !testQuery.error
      } catch (columnError) {
        console.log('Status column not available yet, skipping pending sales fetch')
        hasStatusColumn = false
      }

      if (!hasStatusColumn) {
        console.log('Status column not found, setting empty pending sales')
        setPendingSales([])
        return
      }

      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          total,
          payment_method,
          date,
          customer_id,
          customers(name, phone1),
          sale_items(
            id,
            item_id,
            quantity,
            price,
            unit,
            products(name, unit)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching pending sales:', error.message, error.details)
        setPendingSales([])
        return
      }

      // Transform data to match PendingSale interface
      const transformedPendingSales: PendingSale[] = await Promise.all(
        (data || []).map(async (sale: any) => {
          // Fetch customer data separately if not available in join
          let customerName = sale.customers?.name || 'نەناسراو'
          let customerPhone = sale.customers?.phone1 || ''

          // If customer data is missing from join, fetch it separately
          if ((!customerName || customerName === 'نەناسراو') && sale.customer_id && supabase) {
            try {
              const { data: customerData, error: customerError } = await supabase
                .from('customers')
                .select('name, phone1')
                .eq('id', sale.customer_id)
                .single()

              if (!customerError && customerData) {
                customerName = customerData.name || 'نەناسراو'
                customerPhone = customerData.phone1 || ''
              }
            } catch (error) {
              console.error('Error fetching customer data:', error)
            }
          }

          return {
            id: sale.id,
            customer_name: customerName,
            customer_phone: customerPhone,
            total: sale.total,
            date: sale.date,
            items: sale.sale_items?.map((item: any) => ({
              name: item.products?.name || 'نەناسراو',
              quantity: item.quantity,
              unit: item.products?.unit || item.unit || 'دانە',
              price: item.price,
              total: item.price * item.quantity
            })) || []
          }
        })
      )

      setPendingSales(transformedPendingSales)
    } catch (error) {
      console.error('Error fetching pending sales:', error)
      setPendingSales([])
    }
  }

  const confirmSale = async (pendingSale: PendingSale) => {
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    try {
      // Step 1: Validate stock availability for all items
      console.log('Validating stock availability for sale:', pendingSale.id)
      
      for (const item of pendingSale.items) {
        // Get current product quantity from products table
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, total_amount_bought, name, selling_price_per_unit, cost_per_unit')
          .eq('name', item.name)
          .single()
        
        if (productError) {
          console.error('Error fetching product:', productError)
          alert(`کاڵاکە نەدۆزرایەوە: ${item.name}`)
          return
        }

        // Check if there's enough stock
        if ((product.total_amount_bought || 0) < item.quantity) {
          alert(`بڕی پێویست لە کۆگا نەماوە!\n\nکاڵا: ${item.name}\nبەردەست: ${product.total_amount_bought || 0} ${item.unit}\nخاوەنەکە: ${item.quantity} ${item.unit}`)
          return
        }
      }

      // Step 2: User confirmation
      const confirmAction = confirm(`دڵنیایت لە پشتڕاستکردنەوەی فرۆشتنی ${pendingSale.customer_name} بە بڕی ${formatCurrencyWithDecimals(pendingSale.total)} IQD؟`)
      if (!confirmAction) return

      // Step 3: Update sale status to 'completed'
      console.log('Updating sale status to completed for ID:', pendingSale.id)
      const { data: saleUpdateData, error: saleError } = await supabase
        .from('sales')
        .update({ status: 'completed' })
        .eq('id', pendingSale.id)
        .select()

      if (saleError) {
        throw new Error(`هەڵە لە نوێکردنەوەی دۆخی فرۆشتن: ${saleError.message}`)
      }

      // Step 4: Update products quantities and financial stats (NOW that sale is approved)
      for (const item of pendingSale.items) {
        // Get current product data
        const { data: currentProduct, error: fetchError } = await supabase
          .from('products')
          .select('total_amount_bought, total_sold, total_revenue, total_profit, total_discounts, cost_per_unit')
          .eq('name', item.name)
          .single()

        if (fetchError) {
          console.error('Error fetching product:', fetchError)
          throw new Error(`کاڵاکە نەدۆزرایەوە: ${item.name}`)
        }

        // Calculate new values
        const newQuantity = (currentProduct.total_amount_bought || 0) - item.quantity
        const newTotalSold = (currentProduct.total_sold || 0) + item.quantity
        const newTotalRevenue = (currentProduct.total_revenue || 0) + item.total
        
        // Calculate discount portion for this item
        const cartSubtotal = pendingSale.items.reduce((sum, i) => sum + i.total, 0)
        const itemDiscountPortion = cartSubtotal > 0 ? (item.total / cartSubtotal) * 0 : 0 // Discount is 0 for now
        const newTotalDiscounts = (currentProduct.total_discounts || 0) + itemDiscountPortion
        
        const profitPerItem = item.price - (currentProduct.cost_per_unit || 0)
        const newTotalProfit = (currentProduct.total_profit || 0) + (profitPerItem * item.quantity)

        // Update products table
        const { error: productError } = await supabase
          .from('products')
          .update({
            total_amount_bought: newQuantity,
            total_sold: newTotalSold,
            total_revenue: newTotalRevenue,
            total_profit: newTotalProfit,
            total_discounts: newTotalDiscounts,
            is_archived: newQuantity <= 0
          })
          .eq('name', item.name)

        if (productError) {
          console.error('Error updating product:', productError)
          throw new Error(`هەڵە لە نوێکردنەوەی کاڵا: ${item.name}`)
        }

        console.log(`Product updated: ${item.name} - deducted ${item.quantity}`)
      }

      // Step 5: Handle customer debt if payment method was debt
      const { data: saleData, error: saleFetchError } = await supabase
        .from('sales')
        .select('payment_method, customer_id')
        .eq('id', pendingSale.id)
        .single()

      if (!saleFetchError && saleData) {
        if (saleData.payment_method === 'debt') {
          // Get current customer debt
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('total_debt')
            .eq('id', saleData.customer_id)
            .single()

          if (!customerError && customerData) {
            const newDebt = (customerData.total_debt || 0) + pendingSale.total

            // Update customer debt
            await supabase
              .from('customers')
              .update({ total_debt: newDebt })
              .eq('id', saleData.customer_id)

            // Add to customer payments
            await supabase
              .from('customer_payments')
              .insert({
                customer_id: saleData.customer_id,
                date: new Date().toISOString().split('T')[0],
                amount: pendingSale.total,
                items: pendingSale.items.map(item => `${item.name} x${item.quantity} ${item.unit}`).join(', '),
                note: 'پشتڕاستکردنەوەی فرۆشتن بە قەرز'
              })
          }
        }
      }

      // Refresh data
      fetchPendingSales()
      fetchInvoices()

      alert(`فرۆشتن بە سەرکەوتوویی پشتڕاستکرایەوە!\n\nکڕیار: ${pendingSale.customer_name}\nبڕ: ${formatCurrencyWithDecimals(pendingSale.total)} IQD`)

    } catch (error) {
      console.error('Error confirming sale:', error)
      alert(`هەڵە لە پشتڕاستکردنەوەی فرۆشتن: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const cancelSale = async (pendingSale: PendingSale) => {
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    const cancelAction = confirm(`دڵنیایت لە هەڵوەشاندنەوەی فرۆشتنی ${pendingSale.customer_name} بە بڕی ${formatCurrencyWithDecimals(pendingSale.total)} IQD؟\n\nئاگاداربە: هیچ گۆڕانێک لە کۆگادا ناکرێت.`)
    if (!cancelAction) return

    try {
      // Just update the status to 'cancelled' - no inventory changes needed
      // because pending sales never update the inventory
      const { error: saleError } = await supabase
        .from('sales')
        .update({ status: 'cancelled' })
        .eq('id', pendingSale.id)

      if (saleError) {
        throw new Error(`هەڵە لە هەڵوەشاندنەوە: ${saleError.message}`)
      }

      // Refresh data
      fetchPendingSales()
      fetchInvoices()

      alert(`فرۆشتنەکە هەڵوەشێنرایەوە.\n\nکڕیار: ${pendingSale.customer_name}\nبڕ: ${formatCurrencyWithDecimals(pendingSale.total)} IQD`)

    } catch (error) {
      console.error('Error cancelling sale:', error)
      alert(`هەڵە لە هەڵوەشاندنەوە: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const returnSale = async (pendingSale: PendingSale) => {
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    const returnAction = confirm(`دڵنیایت لە گەڕاندنەوەی فرۆشتنی ${pendingSale.customer_name} بە بڕی ${formatCurrencyWithDecimals(pendingSale.total)} IQD؟`)
    if (!returnAction) return

    try {
      // 1. Update sale status to 'refunded'
      console.log('Attempting to return sale for ID:', pendingSale.id)
      const { data: saleUpdateData, error: saleError } = await supabase
        .from('sales')
        .update({ status: 'refunded' })
        .eq('id', pendingSale.id)
        .select()

      console.log('Sale return result:', { data: saleUpdateData, error: saleError })

      if (saleError) {
        console.error('Error updating sale status for return:', {
          error: saleError,
          message: saleError.message,
          details: saleError.details,
          hint: saleError.hint,
          code: saleError.code,
          saleId: pendingSale.id
        })
        throw new Error(`Failed to return sale: ${saleError.message || 'Unknown error'}`)
      }

      if (!saleUpdateData || saleUpdateData.length === 0) {
        throw new Error('Sale return succeeded but no data returned - sale may not exist')
      }

      // 2. Add back quantities to inventory (reverse of confirmSale)
      for (const item of pendingSale.items) {
        // Get current inventory data
        const { data: currentItem, error: fetchError } = await supabase
          .from('inventory')
          .select('quantity, total_sold, total_revenue, total_profit, cost_price')
          .eq('item_name', item.item_name)
          .single()

        if (fetchError) {
          console.error('Error fetching inventory item for return:', fetchError)
          throw new Error('Failed to fetch inventory item for return')
        }

        // Calculate new values (reverse the confirmSale logic)
        const newQuantity = (currentItem.quantity || 0) + item.quantity
        const newTotalSold = Math.max(0, (currentItem.total_sold || 0) - item.quantity)
        const newTotalRevenue = Math.max(0, (currentItem.total_revenue || 0) - item.total)
        const profitPerItem = item.price - (currentItem.cost_price || 0)
        const newTotalProfit = Math.max(0, (currentItem.total_profit || 0) - (profitPerItem * item.quantity))

        // Update inventory
        const { error: inventoryError } = await supabase
          .from('inventory')
          .update({
            quantity: newQuantity,
            total_sold: newTotalSold,
            total_revenue: newTotalRevenue,
            total_profit: newTotalProfit,
            is_archived: false // Un-archive if it was archived due to zero quantity
          })
          .eq('item_name', item.item_name)

        if (inventoryError) {
          console.error('Error updating inventory for return:', inventoryError)
          throw new Error('Failed to update inventory for return')
        }
      }

      // 3. Handle customer debt for returns (reverse debt logic)
      const { data: saleData, error: saleFetchError } = await supabase
        .from('sales')
        .select('payment_method, customer_id')
        .eq('id', pendingSale.id)
        .single()

      if (saleFetchError) {
        console.error('Error fetching sale data for return:', saleFetchError)
        throw new Error('Failed to fetch sale data for return')
      }

      if (saleData.payment_method === 'debt') {
        // Get current customer debt
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('total_debt')
          .eq('id', saleData.customer_id)
          .single()

        if (customerError) {
          console.error('Error fetching customer debt for return:', customerError)
          throw new Error('Failed to fetch customer debt for return')
        }

        const newDebt = Math.max(0, (customerData.total_debt || 0) - pendingSale.total)

        // Update customer debt (reduce it since we're returning)
        const { error: debtError } = await supabase
          .from('customers')
          .update({ total_debt: newDebt })
          .eq('id', saleData.customer_id)

        if (debtError) {
          console.error('Error updating customer debt for return:', debtError)
          throw new Error('Failed to update customer debt for return')
        }

        // Add return record to customer payments
        const { error: paymentError } = await supabase
          .from('customer_payments')
          .insert({
            customer_id: saleData.customer_id,
            date: new Date().toISOString().split('T')[0],
            amount: -pendingSale.total, // Negative amount for return
            items: pendingSale.items.map(item => `${item.item_name} x${item.quantity} ${item.unit}`).join(', '),
            note: 'Item return - debt reduced'
          })

        if (paymentError) {
          console.error('Error creating customer payment record for return:', paymentError)
          // Don't fail the entire operation for this
        }
      }

      // Refresh data
      fetchPendingSales()
      fetchInvoices()

      alert(`فرۆشتن بە سەرکەوتوویی گەڕێندرایەوە!\n\nکڕیار: ${pendingSale.customer_name}\nبڕ: ${formatCurrencyWithDecimals(pendingSale.total)} IQD`)

    } catch (error) {
      console.error('Error returning sale:', error)
      alert(`هەڵە لە گەڕاندنەوەی فرۆشتن: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Refund an already completed invoice
  const refundInvoice = async (invoice: Invoice) => {
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    const refundAction = confirm(`دڵنیایت لە گەڕاندنەوەی فاکتور ${invoice.invoice_number} بە بڕی ${formatCurrencyWithDecimals(invoice.total)} IQD؟`)
    if (!refundAction) return

    try {
      // 1. Fetch the sale items for this invoice
      const { data: saleItemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          id,
          item_id,
          quantity,
          price,
          unit,
          inventory(item_name, unit, cost_price)
        `)
        .eq('sale_id', invoice.id)

      if (itemsError) {
        console.error('Error fetching sale items:', itemsError)
        throw new Error('Failed to fetch sale items')
      }

      // 2. Update sale status to 'refunded'
      console.log('Attempting to refund invoice for ID:', invoice.id)
      const { data: saleUpdateData, error: saleError } = await supabase
        .from('sales')
        .update({ status: 'refunded' })
        .eq('id', invoice.id)
        .select()

      console.log('Invoice refund result:', { data: saleUpdateData, error: saleError })

      if (saleError) {
        console.error('Error updating sale status for refund:', saleError)
        throw new Error(`Failed to refund invoice: ${saleError.message || 'Unknown error'}`)
      }

      if (!saleUpdateData || saleUpdateData.length === 0) {
        throw new Error('Invoice refund succeeded but no data returned')
      }

      // 3. Add back quantities to inventory (reverse of original sale)
      for (const item of (saleItemsData || [])) {
        const { data: currentItem, error: fetchError } = await supabase
          .from('inventory')
          .select('quantity, total_sold, total_revenue, total_profit, cost_price')
          .eq('id', item.item_id)
          .single()

        if (fetchError) {
          console.error('Error fetching inventory item for refund:', fetchError)
          continue // Skip this item
        }

        const costPrice = (item as any).inventory?.cost_price || (currentItem as any)?.cost_price || 0
        const itemTotal = item.price * item.quantity

        // Calculate new values (reverse the original sale logic)
        const newQuantity = (currentItem?.quantity || 0) + item.quantity
        const newTotalSold = Math.max(0, (currentItem?.total_sold || 0) - item.quantity)
        const newTotalRevenue = Math.max(0, (currentItem?.total_revenue || 0) - itemTotal)
        const profitPerItem = item.price - costPrice
        const newTotalProfit = Math.max(0, (currentItem?.total_profit || 0) - (profitPerItem * item.quantity))

        // Update inventory
        const { error: inventoryError } = await supabase
          .from('inventory')
          .update({
            quantity: newQuantity,
            total_sold: newTotalSold,
            total_revenue: newTotalRevenue,
            total_profit: newTotalProfit,
            is_archived: false
          })
          .eq('id', item.item_id)

        if (inventoryError) {
          console.error('Error updating inventory for refund:', inventoryError)
        }
      }

      // 4. Handle customer debt for refunds (reverse debt logic)
      const { data: saleData, error: saleFetchError } = await supabase
        .from('sales')
        .select('payment_method, customer_id')
        .eq('id', invoice.id)
        .single()

      if (!saleFetchError && saleData) {
        if (saleData.payment_method === 'debt') {
          // Get current customer debt
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('total_debt')
            .eq('id', saleData.customer_id)
            .single()

          if (!customerError && customerData) {
            const newDebt = Math.max(0, (customerData.total_debt || 0) - invoice.total)

            // Update customer debt (reduce it since we're refunding)
            await supabase
              .from('customers')
              .update({ total_debt: newDebt })
              .eq('id', saleData.customer_id)

            // Add refund record to customer payments
            await supabase
              .from('customer_payments')
              .insert({
                customer_id: saleData.customer_id,
                date: new Date().toISOString().split('T')[0],
                amount: -invoice.total,
                items: saleItemsData?.map((item: any) => 
                  `${item.inventory?.item_name || 'نەناسراو'} x${item.quantity} ${item.unit}`
                ).join(', ') || '',
                note: 'Invoice refund - debt reduced'
              })
          }
        }
      }

      // Refresh data
      fetchInvoices()

      alert(`فاکتور ${invoice.invoice_number} بە سەرکەوتوویی گەڕێندرایەوە!\n\nبڕ: ${formatCurrencyWithDecimals(invoice.total)} IQD`)

    } catch (error) {
      console.error('Error refunding invoice:', error)
      alert(`هەڵە لە گەڕاندنەوەی فاکتور: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const fetchSettings = async () => {
    if (!supabase) {
      // Demo mode: set default settings
      setFormData({
        shop_name: 'فرۆشگای کوردستان',
        shop_phone: '',
        shop_address: '',
        shop_logo: null,
        thank_you_note: 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.',
        qr_code_url: '',
        qr_code_file: null
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .single()

      if (error) {
        // If table doesn't exist or other error, use default settings silently
        console.log('Invoice settings not available, using defaults')
        setFormData({
          shop_name: 'فرۆشگای کوردستان',
          shop_phone: '',
          shop_address: '',
          shop_logo: null,
          thank_you_note: 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.',
          qr_code_url: '',
          qr_code_file: null
        })
        return
      }

      if (data) {
        setSettings(data)
        setFormData({
          shop_name: data.shop_name,
          shop_phone: data.shop_phone || '',
          shop_address: data.shop_address || '',
          shop_logo: null,
          thank_you_note: data.thank_you_note,
          qr_code_url: data.qr_code_url || '',
          qr_code_file: null
        })
      } else {
        // Create default settings
        const defaultSettings = {
          shop_name: 'فرۆشگای کوردستان',
          shop_phone: '',
          shop_address: '',
          shop_logo: null,
          thank_you_note: 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.',
          qr_code_url: '',
          qr_code_file: null
        }
        setFormData(defaultSettings)
      }
    } catch (error) {
      // Silent fallback to default settings
      console.log('Using default invoice settings')
      setFormData({
        shop_name: 'فرۆشگای کوردستان',
        shop_phone: '',
        shop_address: '',
        shop_logo: null,
        thank_you_note: 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.',
        qr_code_url: '',
        qr_code_file: null
      })
    }
  }

  const fetchInvoices = async () => {
    if (!supabase) {
      // Demo mode: set empty invoices
      setInvoices([])
      setLoading(false)
      return
    }

    try {
      // First, check if invoice_number column exists
      let hasInvoiceNumberColumn = false
      try {
        const testQuery = await supabase
          .from('sales')
          .select('invoice_number')
          .limit(1)

        hasInvoiceNumberColumn = !testQuery.error
      } catch (columnError) {
        console.log('invoice_number column not available yet, using fallback numbering')
        hasInvoiceNumberColumn = false
      }

      // First, fetch basic sales data
      let selectFields = `
        id,
        total,
        status,
        payment_method,
        date,
        customers!inner(name)
      `

      if (hasInvoiceNumberColumn) {
        selectFields = `
          id,
          invoice_number,
          total,
          status,
          payment_method,
          date,
          customers!inner(name)
        `
      }

      const { data, error } = await supabase
        .from('sales')
        .select(selectFields)
        .order(hasInvoiceNumberColumn ? 'invoice_number' : 'date', { ascending: false, nullsFirst: false })

      if (error) {
        // Silent fallback to empty invoices
        console.log('Sales table not available or query failed, showing empty invoices')
        setInvoices([])
        return
      }

      // Transform data and handle invoice numbers gracefully
      const transformedInvoices: Invoice[] = await Promise.all(
        (data || []).map(async (sale: any, index: number) => {
          // Fetch customer data separately if not available in join
          let customerName = sale.customers?.name || 'نەناسراو'

          // If customer data is missing from join, fetch it separately
          if ((!customerName || customerName === 'نەناسراو') && sale.customer_id && supabase) {
            try {
              const { data: customerData, error: customerError } = await supabase
                .from('customers')
                .select('name')
                .eq('id', sale.customer_id)
                .single()

              if (!customerError && customerData) {
                customerName = customerData.name || 'نەناسراو'
              }
            } catch (error) {
              // Silent fallback for customer data
              console.log('Customer data not available for invoice')
            }
          }

          return {
            id: sale.id,
            invoice_number: hasInvoiceNumberColumn ? (sale.invoice_number || (1000 + index)) : (1000 + index),
            customer_name: customerName,
            total: sale.total,
            status: sale.status,
            payment_method: sale.payment_method,
            date: sale.date,
            items_count: 0 // Will be populated when viewing details
          }
        })
      )

      setInvoices(transformedInvoices)
    } catch (error) {
      // Silent fallback to empty invoices
      console.log('Using empty invoices due to database issues')
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    // File size validation (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      alert('وێنەکە زۆر گەورەیە. دەبێت لە 5MB کەمتر بێت.')
      return
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('جۆری وێنە نادروستە. تکایە JPEG، PNG یان WebP بەکاربهێنە.')
      return
    }

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `customers/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) throw new Error('Failed to get public URL')

      return urlData.publicUrl
    } catch (error) {
      console.error('Image upload failed:', error)
      alert(`هەڵە لە بارکردنی وێنە: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return null
    }
  }

  const saveSettings = async () => {
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    setSaving(true)
    try {
      let logoUrl = settings?.shop_logo || ''
      let qrUrl = settings?.qr_code_url || ''

      // Upload new logo if provided
      if (formData.shop_logo) {
        logoUrl = await handleImageUpload(formData.shop_logo) || logoUrl
      }

      // Upload new QR code if provided
      if (formData.qr_code_file) {
        qrUrl = await handleImageUpload(formData.qr_code_file) || qrUrl
      }

      const settingsData = {
        shop_name: formData.shop_name,
        shop_phone: formData.shop_phone,
        shop_address: formData.shop_address,
        shop_logo: logoUrl,
        thank_you_note: formData.thank_you_note,
        qr_code_url: qrUrl,
        updated_at: new Date().toISOString()
      }

      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from('invoice_settings')
          .update(settingsData)
          .eq('id', settings.id)

        if (error) throw error
      } else {
        // Create new settings
        const { error } = await supabase
          .from('invoice_settings')
          .insert(settingsData)

        if (error) throw error
      }

      await fetchSettings()
      alert('ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کران!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('هەڵە لە پاشەکەوتکردنی ڕێکخستنەکان')
    } finally {
      setSaving(false)
    }
  }

  const downloadInvoice = async () => {
    if (!invoiceRef.current || !invoiceDetails || !selectedInvoice) return

    try {
      // Wait for fonts and images to fully render
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

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `Invoice_${selectedInvoice.invoice_number || 'temp'}.png`
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

  const reprintInvoice = (invoice: Invoice) => {
    // TODO: Implement invoice reprinting
    alert(`دووبارە چاپکردنی فاکتور ${invoice.invoice_number}`)
  }



  const viewPendingSaleDetails = async (pendingSale: PendingSale) => {
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    try {
      // First, fetch the basic sale data with customer info
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          customers(name, phone1)
        `)
        .eq('id', pendingSale.id)
        .single()

      if (saleError) {
        console.error('Sale query error:', saleError)
        throw new Error(`Sale record not found: ${saleError.message}`)
      }

      // Pending sales don't have invoice numbers yet

      // For pending sales, use the data from the pendingSale object directly
      // since the sale_items table might not have complete data yet
      const saleItemsWithNames = pendingSale.items.map((item, index) => ({
        id: index + 1,
        quantity: item.quantity,
        price: item.price,
        unit: item.unit,
        total: item.price * item.quantity, // Calculate line total correctly
        products: {
          name: item.item_name,
          unit: item.unit
        }
      }))

      // Create a mock invoice object for pending sales preview
      const mockInvoice: Invoice & { payment_method?: string } = {
        id: pendingSale.id,
        invoice_number: 0, // Pending sales don't have invoice numbers yet
        customer_name: pendingSale.customer_name,
        total: pendingSale.total,
        status: 'completed', // Show as completed for preview
        date: pendingSale.date,
        items_count: pendingSale.items.length,
        payment_method: saleData.payment_method || 'cash'
      }

      setSelectedInvoice(mockInvoice)
      setInvoiceDetails({
        ...(saleData as any || {}),
        sale_items: saleItemsWithNames,
        payment_method: (saleData as any)?.payment_method || 'cash'
      })
      setShowInvoiceModal(true)
    } catch (error) {
      console.error('Error fetching pending sale details:', error)
      alert(`هەڵە لە بارکردنی وردەکارییەکانی فرۆشتنی چاوەڕوانکراو: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const viewInvoiceDetails = async (invoice: Invoice) => {
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    try {
      // Check if discount_amount and subtotal columns exist
      let hasDiscountAmountColumn = false
      let hasSubtotalColumn = false

      try {
        const testQuery = await supabase
          .from('sales')
          .select('discount_amount')
          .limit(1)
        hasDiscountAmountColumn = !testQuery.error
      } catch (error) {
        console.log('Discount amount column not available yet')
        hasDiscountAmountColumn = false
      }

      try {
        const testQuery = await supabase
          .from('sales')
          .select('subtotal')
          .limit(1)
        hasSubtotalColumn = !testQuery.error
      } catch (error) {
        console.log('Subtotal column not available yet')
        hasSubtotalColumn = false
      }

      // Build select fields dynamically
      let selectFields = `
        id,
        total,
        payment_method,
        date,
        sold_by,
        customers(name, phone1)
      `

      if (hasDiscountAmountColumn) {
        selectFields += `,
        discount_amount`
      }

      if (hasSubtotalColumn) {
        selectFields += `,
        subtotal`
      }

      // First, fetch the basic sale data with customer info
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(selectFields)
        .eq('id', invoice.id)
        .single()

      if (saleError) {
        console.error('Sale query error:', saleError)
        throw new Error(`Sale record not found: ${saleError.message}`)
      }

      // Then fetch the sale items
      const { data: saleItemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          id,
          quantity,
          price,
          unit,
          item_id
        `)
        .eq('sale_id', invoice.id)

      if (itemsError) {
        console.error('Sale items query error:', itemsError)
        // Continue with empty items if this fails
      }

      // Fetch inventory item names for each sale item
      const saleItemsWithNames = await Promise.all(
        (saleItemsData || []).map(async (item: any) => {
          try {
            if (!supabase) {
              return {
                ...item,
                products: {
                  name: 'نەناسراو',
                  unit: item.unit
                }
              }
            }

            const { data: inventoryData, error: inventoryError } = await supabase
              .from('inventory')
              .select('item_name')
              .eq('id', item.item_id)
              .single()

            return {
              ...item,
              products: {
                name: inventoryData?.item_name || 'نەناسراو',
                unit: item.unit
              }
            }
          } catch (error) {
            console.error('Error fetching inventory item:', error)
            return {
              ...item,
              products: {
                name: 'نەناسراو',
                unit: item.unit
              }
            }
          }
        })
      )

      setSelectedInvoice(invoice)
      setInvoiceDetails({
        ...(saleData as any),
        sale_items: saleItemsWithNames,
        discount_amount: (saleData as any)?.discount_amount || 0
      })
      setShowInvoiceModal(true)
    } catch (error) {
      console.error('Error fetching invoice details:', error)
      alert(`هەڵە لە بارکردنی وردەکارییەکانی فاکتور: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const generateReceiptPreview = () => {
    // Use current form data for real-time preview
    const shopName = formData.shop_name || 'فرۆشگای کوردستان'
    const shopPhone = formData.shop_phone || ''
    const shopAddress = formData.shop_address || ''
    const shopLogo = settings?.shop_logo || ''
    const thankYouNote = formData.thank_you_note || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
    const qrCodeUrl = formData.qr_code_url || settings?.qr_code_url || ''
    const currentInvoiceNumber = settings?.current_invoice_number || 1000

    // Mock data for preview
    const mockItems = [
      { name: 'هەنگوین', unit: 'کیلۆ', quantity: 2, price: 12.50 },
      { name: 'سەرکە', unit: 'دانە', quantity: 1, price: 8.00 }
    ]
    const mockTotal = 32.50
    const mockCustomerName = 'نموونەی کڕیار'
    const mockSellerName = 'فرۆشیار'

    return `
      <div style="font-family: var(--font-uni-salar); direction: rtl; width: 100%; max-width: 320px; margin: 0 auto; background: white; padding: 16px;">
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 16px;">
          <!-- Shop Logo - Circular -->
          ${shopLogo ? `
            <div style="width: 60px; height: 60px; margin: 0 auto 12px; border-radius: 50%; overflow: hidden; border: 3px solid #e5e7eb; box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);">
              <img src="${shopLogo}" alt="${shopName}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          ` : ''}

          <!-- Shop Name -->
          <h1 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 6px 0; font-family: var(--font-uni-salar);">
            ${shopName}
          </h1>

          <!-- Shop Contact Info -->
          <div style="display: flex; flex-direction: column; gap: 3px; align-items: center; font-size: 10px; color: #6b7280;">
            ${shopPhone ? `<div style="display: flex; align-items: center; gap: 3px;">📞 ${shopPhone}</div>` : ''}
            ${shopAddress ? `<div style="display: flex; align-items: center; gap: 3px;">📍 ${shopAddress}</div>` : ''}
          </div>
        </div>

        <!-- Separator -->
        <div style="text-align: center; margin: 12px 0; color: #d1d5db; font-size: 16px;">--------------------------</div>

        <!-- Information Grid -->
        <div style="margin-bottom: 16px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 10px;">
            <!-- Right Column -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div style="text-align: center;">
                <div style="font-weight: 600; color: #374151; margin-bottom: 3px;">ژمارەی فاکتور</div>
                <div style="font-family: 'Inter', sans-serif; font-weight: bold; color: #1f2937; font-size: 14px; direction: ltr;">
                  #${toEnglishDigits(currentInvoiceNumber.toString())}
                </div>
              </div>
              <div style="text-align: center;">
                <div style="font-weight: 600; color: #374151; margin-bottom: 3px;">کڕیار</div>
                <div style="font-weight: bold; color: #1f2937; font-size: 12px; word-break: break-word;">
                  ${mockCustomerName}
                </div>
              </div>
            </div>

            <!-- Left Column -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div style="text-align: center;">
                <div style="font-weight: 600; color: #374151; margin-bottom: 3px;">بەروار/کات</div>
                <div style="font-family: 'Inter', sans-serif; color: #1f2937; font-size: 10px; direction: ltr;">
                  ${new Date().toLocaleDateString('ku')}
                </div>
                <div style="font-family: 'Inter', sans-serif; color: #6b7280; font-size: 9px; direction: ltr;">
                  ${new Date().toLocaleTimeString('ku')}
                </div>
              </div>
              <div style="text-align: center;">
                <div style="font-weight: 600; color: #374151; margin-bottom: 3px;">فرۆشیار</div>
                <div style="font-weight: bold; color: #1f2937; font-size: 12px; word-break: break-word;">
                  ${mockSellerName}
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Method - Full Width -->
          <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <div style="text-align: center;">
              <div style="font-weight: 600; color: #374151; margin-bottom: 3px;">شێوازی پارەدان</div>
              <div style="font-weight: bold; color: #1f2937; font-size: 14px;">
                کاش
              </div>
            </div>
          </div>
        </div>

        <!-- Separator -->
        <div style="text-align: center; margin: 12px 0; color: #d1d5db; font-size: 16px;">--------------------------</div>

        <!-- Items Table -->
        <div style="margin-bottom: 16px;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 10px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: right; font-weight: bold; color: #374151;">
                  ناوی کاڵا
                </th>
                <th style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: center; font-weight: bold; color: #374151;">
                  یەکە
                </th>
                <th style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: center; font-weight: bold; color: #374151;">
                  بڕ
                </th>
                <th style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: center; font-weight: bold; color: #374151;">
                  نرخ
                </th>
              </tr>
            </thead>
            <tbody>
              ${mockItems.map(item => `
                <tr style="hover: background: #f9fafb;">
                  <td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: right; font-weight: 500; max-width: 100px; overflow: hidden; text-overflow: ellipsis;">
                    ${item.name}
                  </td>
                  <td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: center; font-weight: 500;">
                    ${item.unit}
                  </td>
                  <td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: center; font-family: 'Inter', sans-serif; font-weight: bold; direction: ltr;">
                    ${toEnglishDigits(item.quantity.toString())}
                  </td>
                  <td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: center; font-family: 'Inter', sans-serif; font-weight: bold; direction: ltr;">
                    ${formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Separator -->
        <div style="text-align: center; margin: 12px 0; color: #d1d5db; font-size: 16px;">--------------------------</div>

        <!-- Footer Section -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <!-- Financial Summary -->
          <div style="border-top: 2px solid #d1d5db; padding-top: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: bold;">
              <span style="color: #1f2937;">کۆی گشتی:</span>
              <span style="font-family: 'Inter', sans-serif; color: #1f2937; direction: ltr;">
                ${formatCurrency(mockTotal)} IQD
              </span>
            </div>
          </div>

          <!-- Grand Total Highlight -->
          <div style="background: transparent; color: #000; text-align: center; padding: 10px 12px; border-radius: 6px; font-size: 16px; font-weight: bold; border: 2px solid #000;">
            کۆی گشتی: ${formatCurrency(mockTotal)} IQD
          </div>

          <!-- QR Code -->
          ${qrCodeUrl ? `
            <div style="text-align: center; margin: 12px 0;">
              <img src="${qrCodeUrl}" alt="QR Code" style="width: 48px; height: 48px; margin: 0 auto;" />
            </div>
          ` : ''}

          <!-- Thank You Note -->
          <div style="text-align: center; font-size: 10px; color: #6b7280; font-style: italic; border-top: 1px solid #e5e7eb; padding-top: 8px;">
            ${thankYouNote}
          </div>

          <!-- Developer Branding -->
          <div style="text-align: center; font-size: 8px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 6px;">
            گەشەپێدانی سیستم لە لایەن Click Group<br />
            07701466787
          </div>
        </div>
      </div>
    `
  }

  const filteredInvoices = invoices.filter(invoice => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      invoice.customer_name.toLowerCase().includes(searchLower) ||
      invoice.invoice_number.toString().includes(searchTerm) ||
      invoice.status.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 pl-0 md:pl-6">
      <div className="w-full max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              پسوڵە و ڕێکخستنەکان
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FaFileInvoice className="text-blue-500" />
              <span>{filteredInvoices.length} فاکتور</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-row overflow-x-auto whitespace-nowrap space-x-1 mb-8 bg-white/60 backdrop-blur-xl rounded-2xl p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'pending'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              ⏳
              فرۆشتنە چاوەڕوانکراوەکان
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'invoices'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <FaFileInvoice className="inline ml-2" />
              پسوڵەی فرۆشتنەکان
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'settings'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <FaCog className="inline ml-2" />
              ڕێکخستنەکان
            </button>
          </div>

          {/* Settings Tab */}
          <AnimatePresence mode="wait">
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Side-by-Side Layout: Settings Form + Live Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Side: Settings Form */}
                  <div className="space-y-6">
                    {/* Invoice Branding Section */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                      <div className="flex items-center mb-6">
                        <FaStore className="text-blue-500 text-2xl ml-3" />
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          براندی فاکتور
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        {/* Shop Name */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            ناوی فرۆشگا
                          </label>
                          <div className="relative">
                            <FaStore className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={formData.shop_name}
                              onChange={(e) => setFormData(prev => ({ ...prev, shop_name: e.target.value }))}
                              className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              style={{ fontFamily: 'var(--font-uni-salar)' }}
                              placeholder="ناوی فرۆشگاکەت"
                            />
                          </div>
                        </div>

                        {/* Shop Logo */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            لۆگۆی فرۆشگا
                          </label>
                          <div className="relative">
                            <FaImage className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setFormData(prev => ({ ...prev, shop_logo: e.target.files?.[0] || null }))}
                              className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                          {settings?.shop_logo && (
                            <div className="mt-2">
                              <img
                                src={settings.shop_logo}
                                alt="Current logo"
                                className="w-16 h-16 object-contain"
                              />
                            </div>
                          )}
                        </div>

                        {/* Shop Phone */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            ژمارەی تەلەفۆن
                          </label>
                          <div className="relative">
                            <FaPhone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={toEnglishDigits(formData.shop_phone)}
                              onChange={(e) => setFormData(prev => ({ ...prev, shop_phone: toEnglishDigits(e.target.value.replace(/\D/g, '')) }))}
                              className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
                              style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                              placeholder="0750XXXXXXX"
                            />
                          </div>
                        </div>

                        {/* Shop Address */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            ناونیشان
                          </label>
                          <div className="relative">
                            <FaMapMarkerAlt className="absolute right-3 top-3 text-gray-400" />
                            <textarea
                              value={formData.shop_address}
                              onChange={(e) => setFormData(prev => ({ ...prev, shop_address: e.target.value }))}
                              className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                              style={{ fontFamily: 'var(--font-uni-salar)' }}
                              placeholder="ناونیشانی فرۆشگاکەت"
                              rows={3}
                            />
                          </div>
                        </div>

                        {/* QR Code for Social Media */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            QR کۆد   
                          </label>
                          <div className="relative">
                            <FaQrcode className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setFormData(prev => ({ ...prev, qr_code_file: e.target.files?.[0] || null }))}
                              className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            وێنەی QR کۆد دابنێ   
                          </p>
                          {settings?.qr_code_url && (
                            <div className="mt-2">
                              <img
                                src={settings.qr_code_url}
                                alt="Current QR Code"
                                className="w-16 h-16 object-contain border rounded"
                              />
                            </div>
                          )}
                        </div>

                        {/* Thank You Note */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            دانانی پەیام 
                          </label>
                          <textarea
                            value={formData.thank_you_note}
                            onChange={(e) => setFormData(prev => ({ ...prev, thank_you_note: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                            style={{ fontFamily: 'var(--font-uni-salar)' }}
                            placeholder="پەیامی سوپاس بۆ کڕیار"
                            rows={2}
                          />
                        </div>
                      </div>

                      {/* Save Button */}
                      <motion.button
                        onClick={saveSettings}
                        disabled={saving}
                        className="w-full mt-8 py-4 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: 'var(--font-uni-salar)' }}
                        whileHover={{ scale: saving ? 1 : 1.02, y: saving ? 0 : -2 }}
                        whileTap={{ scale: saving ? 1 : 0.98 }}
                        animate={{
                          backgroundPosition: saving ? '0% 50%' : ['0% 50%', '100% 50%', '0% 50%']
                        }}
                        transition={{
                          backgroundPosition: { duration: 3, repeat: saving ? 0 : Infinity, ease: "linear" }
                        }}
                      >
                        <span className="flex items-center justify-center space-x-2">
                          <span>{saving ? 'پاشەکەوتکردن...' : 'پاشەکەوتکردنی ڕێکخستنەکان'}</span>
                          {saving && (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Right Side: Live Receipt Preview */}
                  <div className="space-y-6">
                    <div className="sticky top-6">
                      <div className="flex items-center mb-6">
                        <FaFileInvoice className="text-green-500 text-2xl ml-3" />
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          پێشبینینی فاکتور
                        </h2>
                      </div>

                      {/* Receipt Preview Container */}
                      <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/30 max-w-sm mx-auto">
                        <div className="text-center mb-4">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded" style={{ fontFamily: 'Inter, sans-serif' }}>
                            80mm Thermal Receipt Preview
                          </span>
                        </div>

                        {/* Receipt Preview */}
                        <div
                          className="bg-white border border-gray-200 rounded-lg p-3 text-xs"
                          style={{
                            fontFamily: 'var(--font-uni-salar)',
                            fontWeight: 'bold',
                            letterSpacing: '0.5px',
                            lineHeight: '1.4',
                            direction: 'rtl',
                            width: '300px',
                            margin: '0 auto'
                          }}
                          dangerouslySetInnerHTML={{
                            __html: generateReceiptPreview()
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <motion.div
                key="invoices"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="گەڕان بە ژمارەی فاکتور، کڕیار، یان دۆخ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    />
                  </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200/50 bg-gray-50/50">
                          <th className="px-2 md:px-6 py-3 md:py-4 text-center font-semibold text-gray-700 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            ژمارەی فاکتور
                          </th>
                          <th className="px-2 md:px-6 py-3 md:py-4 text-center font-semibold text-gray-700 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            کڕیار
                          </th>
                          <th className="px-2 md:px-6 py-3 md:py-4 text-center font-semibold text-gray-700 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            بەروار
                          </th>
                          <th className="px-2 md:px-6 py-3 md:py-4 text-center font-semibold text-gray-700 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            کۆی گشتی
                          </th>
                          <th className="px-2 md:px-6 py-3 md:py-4 text-center font-semibold text-gray-700 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            دۆخ
                          </th>
                          <th className="px-2 md:px-6 py-3 md:py-4 text-center font-semibold text-gray-700 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            شێوازی پارەدان
                          </th>
                          <th className="px-2 md:px-6 py-3 md:py-4 text-center font-semibold text-gray-700 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            کردارەکان
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.map((invoice, index) => (
                          <motion.tr
                            key={invoice.id}
                            className="border-b border-gray-100/50 hover:bg-white/30 transition-colors duration-200"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <td className="px-2 md:px-6 py-3 md:py-4 text-gray-800 font-bold text-center text-xs md:text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                              #{invoice.invoice_number}
                            </td>
                            <td className="px-2 md:px-6 py-3 md:py-4 text-gray-800 text-center text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              {invoice.customer_name}
                            </td>
                            <td className="px-2 md:px-6 py-3 md:py-4 text-gray-600 text-center text-xs md:text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {new Date(invoice.date).toLocaleDateString('ku')}
                            </td>
                            <td className="px-2 md:px-6 py-3 md:py-4 text-gray-800 font-bold text-center text-xs md:text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatCurrency(invoice.total)} IQD
                            </td>
                            <td className="px-2 md:px-6 py-2 md:py-4">
                              <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-medium ${
                                invoice.status === 'completed' ? 'bg-green-100 text-green-800' :
                                invoice.status === 'refunded' ? 'bg-red-100 text-red-800' :
                                invoice.status === 'cancelled' ? 'bg-gray-200 text-gray-600' :
                                'bg-orange-100 text-orange-800'
                              }`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                {invoice.status === 'completed' ? '✅ تەواوکراو' :
                                 invoice.status === 'refunded' ? '↩️ گەڕێندراوە' :
                                 invoice.status === 'cancelled' ? '❌ هەڵوەشێنراوە' :
                                 '⏳ چاوەڕوانکراو'}
                              </span>
                            </td>
                            <td className="px-2 md:px-6 py-3 md:py-4 text-center">
                              <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-medium ${
                                invoice.status === 'cancelled' || invoice.status === 'refunded' ? 'bg-gray-100 text-gray-800' :
                                invoice.payment_method === 'cash' ? 'bg-green-100 text-green-800' :
                                invoice.payment_method === 'fib' ? 'bg-blue-100 text-blue-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {invoice.status === 'cancelled' || invoice.status === 'refunded' ? 'null' :
                                 invoice.payment_method === 'cash' ? '💵 کاش' :
                                 invoice.payment_method === 'fib' ? '💳 ئۆنلاین' :
                                 '📝 قەرز'}
                              </span>
                            </td>
                            <td className="px-2 md:px-6 py-3 md:py-4">
                              <div className="flex space-x-1 md:space-x-2">
                                <motion.button
                                  onClick={() => viewInvoiceDetails(invoice)}
                                  className="px-2 md:px-3 py-1 md:py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs md:text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="بینینی وردەکارییەکان"
                                >
                                  <FaEye className="text-xs md:text-sm" />
                                </motion.button>
                                <motion.button
                                  onClick={() => reprintInvoice(invoice)}
                                  className="px-2 md:px-3 py-1 md:py-2 bg-green-500 hover:bg-green-600 text-white text-xs md:text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="دووبارە چاپکردن"
                                >
                                  <FaPrint className="text-xs md:text-sm" />
                                </motion.button>
                                {invoice.status !== 'refunded' && invoice.status !== 'cancelled' && (
                                  <motion.button
                                    onClick={() => refundInvoice(invoice)}
                                    className="px-2 md:px-3 py-1 md:py-2 bg-red-500 hover:bg-red-600 text-white text-xs md:text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="گەڕاندنەوە"
                                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                                  >
                                    ↩️
                                  </motion.button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                        {filteredInvoices.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center">
                              <div className="text-gray-400">
                                <FaFileInvoice className="text-4xl mx-auto mb-4" />
                                <p className="text-lg" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                  {searchTerm ? 'هیچ فاکتورێک نەدۆزرایەوە' : 'هیچ فاکتورێک نیە'}
                                </p>
                                {searchTerm && (
                                  <p className="text-sm mt-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                    گەڕانەکەت بگۆڕە یان پاکبکە
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Pending Sales Tab */}
            {activeTab === 'pending' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Pending Sales Table */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200/50 bg-gray-50/50">
                          <th className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-gray-700 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            کڕیار
                          </th>
                          <th className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-gray-700 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            تەلەفۆن
                          </th>
                          <th className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-gray-700 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            ناوی کاڵا
                          </th>
                          <th className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-gray-700 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            یەکە
                          </th>
                          <th className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-gray-700 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            بڕ
                          </th>
                          <th className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-gray-700 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            بەروار
                          </th>
                          <th className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-gray-700 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            دۆخ
                          </th>
                          <th className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-gray-700 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            کردارەکان
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingSales.map((sale, index) => (
                          <motion.tr
                            key={sale.id}
                            className="border-b border-gray-100/50 hover:bg-white/30 transition-colors duration-200"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <td className="px-2 md:px-6 py-3 md:py-4 text-gray-800 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              {sale.customer_name}
                            </td>
                            <td className="px-2 md:px-6 py-3 md:py-4 text-gray-600 text-xs md:text-sm" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>
                              {sale.customer_phone || '—'}
                            </td>
                            <td className="px-2 md:px-6 py-3 md:py-4 text-gray-800 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              {sale.items.map(item => item.item_name).join(', ')}
                            </td>
                            <td className="px-2 md:px-6 py-3 md:py-4 text-gray-600 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              {sale.items.map(item => item.unit).join(', ')}
                            </td>
                            <td className="px-2 md:px-6 py-3 md:py-4 text-gray-800 font-bold text-xs md:text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {sale.items.map(item => item.quantity).join(', ')}
                            </td>
                            <td className="px-2 md:px-6 py-3 md:py-4 text-gray-600 text-xs md:text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {new Date(sale.date).toLocaleDateString('ku')}
                            </td>
                            <td className="px-2 md:px-6 py-2 md:py-4">
                              <span className="px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-medium bg-orange-100 text-orange-800">
                                ⏳ چاوەڕوانکراو
                              </span>
                            </td>
                            <td className="px-2 md:px-6 py-3 md:py-4">
                              <div className="flex space-x-1 md:space-x-2">
                                <motion.button
                                  onClick={() => viewPendingSaleDetails(sale)}
                                  className="px-2 md:px-3 py-1 md:py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs md:text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="بینینی وردەکارییەکان"
                                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                                >
                                  <FaEye className="text-xs md:text-sm" />
                                </motion.button>
                                <motion.button
                                  onClick={() => confirmSale(sale)}
                                  className="px-2 md:px-3 py-1 md:py-2 bg-green-500 hover:bg-green-600 text-white text-xs md:text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="فرۆشراوی فرۆشتن"
                                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                                >
                                  فرۆشراو
                                </motion.button>
                                <motion.button
                                  onClick={() => returnSale(sale)}
                                  className="px-2 md:px-3 py-1 md:py-2 bg-red-500 hover:bg-red-600 text-white text-xs md:text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="گەڕێندراوەی کاڵا"
                                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                                >
                                  گەڕێندراوە
                                </motion.button>
                                <motion.button
                                  onClick={() => cancelSale(sale)}
                                  className="px-2 md:px-3 py-1 md:py-2 bg-gray-500 hover:bg-gray-600 text-white text-xs md:text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="هەڵوەشاندنەوەی فرۆشتن"
                                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                                >
                                  هەڵوەشاندنەوە
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                        {pendingSales.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center">
                              <div className="text-gray-400">
                                <div className="text-4xl mb-4">⏳</div>
                                <p className="text-lg" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                  هیچ فرۆشتنێکی چاوەڕوانکراو نیە
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Invoice Details Modal */}
      <AnimatePresence>
        {showInvoiceModal && invoiceDetails && selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowInvoiceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <FaFileInvoice className="text-blue-500 text-2xl" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      وردەکارییەکانی فاکتور #{selectedInvoice.invoice_number}
                    </h3>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {new Date(selectedInvoice.date).toLocaleDateString('ku')} - {invoiceDetails.customers?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaEye className="text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto overflow-x-hidden max-h-[90vh] md:max-h-[80vh]" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Invoice Wrapper */}
                <div style={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  padding: '10px'
                }}>
                  {/* Invoice Component - Responsive Scaling with Scroll */}
                  <div
                    className="invoice-preview-container"
                    style={{
                      width: 'auto',
                      aspectRatio: 'auto',
                      transformOrigin: 'top center',
                      minHeight: 'fit-content'
                    }}
                  >
                    <style jsx>{`
                      .invoice-preview-container {
                        zoom: 0.25;
                      }
                      @media (min-width: 480px) {
                        .invoice-preview-container {
                          zoom: 0.3;
                        }
                      }
                      @media (min-width: 640px) {
                        .invoice-preview-container {
                          zoom: 0.4;
                        }
                      }
                      @media (min-width: 768px) {
                        .invoice-preview-container {
                          zoom: 0.5;
                        }
                      }
                      @media (min-width: 1024px) {
                        .invoice-preview-container {
                          zoom: 0.6;
                        }
                      }
                      @media (min-width: 1280px) {
                        .invoice-preview-container {
                          zoom: 0.7;
                        }
                      }
                      @media (min-width: 1536px) {
                        .invoice-preview-container {
                          zoom: 0.8;
                        }
                      }
                      @media (min-width: 1920px) {
                        .invoice-preview-container {
                          zoom: 1;
                        }
                      }
                    `}</style>
                    <InvoicePreview saleData={invoiceDetails} invoice={selectedInvoice} invoiceRef={invoiceRef} />
                  </div>
                </div>
              </div>

              {/* Sticky Modal Footer */}
              <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-lg p-4 print:hidden" style={{ flexShrink: 0 }}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Total Amount Display */}
                  <div className="text-center sm:text-right">
                    <div className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      کۆی گشتی
                    </div>
                    <div className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>
                      {formatCurrency(selectedInvoice.total)} IQD
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <motion.button
                      onClick={() => window.print()}
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
                      onClick={() => setShowInvoiceModal(false)}
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



async function generateInvoiceHTML(saleData: any, invoice: Invoice) {
  // Fetch settings from database
  let settings = null
  try {
    if (!supabase) return ''

    const { data, error } = await supabase
      .from('invoice_settings')
      .select('*')
      .single()

    if (!error && data) {
      settings = data
    }
  } catch (error) {
    console.error('Error fetching invoice settings:', error)
  }

  // Use settings data or defaults
  const shopName = settings?.shop_name || 'فرۆشگای کوردستان'
  const shopPhone = settings?.shop_phone || ''
  const shopAddress = settings?.shop_address || ''
  const shopLogo = settings?.shop_logo || ''
  const thankYouNote = settings?.thank_you_note || 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.'
  const qrCodeUrl = settings?.qr_code_url || ''
  const currentInvoiceNumber = settings?.current_invoice_number || invoice.invoice_number

  // Get seller information
  const sellerName = saleData.sold_by || 'فرۆشیار'

  const getPaymentStatus = () => {
    switch (invoice.payment_method) {
      case 'cash': return 'کاش'
      case 'fib': return 'ئۆنلاین (FIB)'
      case 'debt': return 'قەرز'
      default: return 'نەپارەدراو'
    }
  }

  return `
    <div style="font-family: var(--font-uni-salar); direction: rtl; width: 100%; max-width: 400px; margin: 0 auto; background: white; padding: 20px;">
      <!-- Header Section -->
      <div style="text-align: center; margin-bottom: 20px;">
        <!-- Shop Logo - Circular -->
        ${shopLogo ? `
          <div style="width: 80px; height: 80px; margin: 0 auto 16px; border-radius: 50%; overflow: hidden; border: 4px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <img src="${shopLogo}" alt="${shopName}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        ` : ''}

        <!-- Shop Name -->
        <h1 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 8px 0; font-family: var(--font-uni-salar);">
          ${shopName}
        </h1>

        <!-- Shop Contact Info -->
        <div style="display: flex; flex-direction: column; gap: 4px; align-items: center; font-size: 12px; color: #6b7280;">
          ${shopPhone ? `<div style="display: flex; align-items: center; gap: 4px;">📞 ${shopPhone}</div>` : ''}
          ${shopAddress ? `<div style="display: flex; align-items: center; gap: 4px;">📍 ${shopAddress}</div>` : ''}
        </div>
      </div>

      <!-- Separator -->
      <div style="text-align: center; margin: 16px 0; color: #d1d5db; font-size: 20px;">--------------------------</div>

      <!-- Information Grid -->
      <div style="margin-bottom: 24px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 12px;">
          <!-- Right Column -->
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="text-align: center;">
              <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">ژمارەی فاکتور</div>
              <div style="font-family: 'Inter', sans-serif; font-weight: bold; color: #1f2937; font-size: 18px; direction: ltr;">
                ${invoice.invoice_number === 0 ? '' : '#' + toEnglishDigits(invoice.invoice_number.toString())}
              </div>
            </div>
            <div style="text-align: center;">
              <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">کڕیار</div>
              <div style="font-weight: bold; color: #1f2937; font-size: 14px; word-break: break-word;">
                ${saleData.customers?.name || 'نەناسراو'}
              </div>
            </div>
          </div>

          <!-- Left Column -->
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="text-align: center;">
              <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">بەروار/کات</div>
              <div style="font-family: 'Inter', sans-serif; color: #1f2937; font-size: 12px; direction: ltr;">
                ${new Date(invoice.date).toLocaleDateString('ku')}
              </div>
              <div style="font-family: 'Inter', sans-serif; color: #6b7280; font-size: 10px; direction: ltr;">
                ${new Date().toLocaleTimeString('ku')}
              </div>
            </div>
            ${saleData.customers?.phone1 ? `
              <div style="text-align: center;">
                <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">تەلەفۆن</div>
                <div style="font-family: 'Inter', sans-serif; color: #1f2937; font-size: 12px; direction: ltr;">
                  ${saleData.customers.phone1}
                </div>
              </div>
            ` : ''}
            <div style="text-align: center;">
              <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">فرۆشیار</div>
              <div style="font-weight: bold; color: #1f2937; font-size: 14px; word-break: break-word;">
                ${sellerName}
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Method - Full Width -->
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <div style="text-align: center;">
            <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">شێوازی پارەدان</div>
            <div style="font-weight: bold; color: #1f2937; font-size: 18px;">
              ${getPaymentStatus()}
            </div>
          </div>
        </div>
      </div>

      <!-- Separator -->
      <div style="text-align: center; margin: 16px 0; color: #d1d5db; font-size: 20px;">--------------------------</div>

      <!-- Items Table -->
      <div style="margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 12px;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: right; font-weight: bold; color: #374151;">
                ناوی کاڵا
              </th>
              <th style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: center; font-weight: bold; color: #374151;">
                یەکە
              </th>
              <th style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: center; font-weight: bold; color: #374151;">
                بڕ
              </th>
              <th style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: center; font-weight: bold; color: #374151;">
                نرخ
              </th>
            </tr>
          </thead>
          <tbody>
            ${saleData.sale_items?.map((item: any) => `
              <tr style="hover: background: #f9fafb;">
                <td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: right; font-weight: 500; max-width: 140px; overflow: hidden; text-overflow: ellipsis;">
                  ${item.products?.name || 'نەناسراو'}
                </td>
                <td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: center; font-weight: 500;">
                  ${item.products?.unit || ''}
                </td>
                <td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: center; font-family: 'Inter', sans-serif; font-weight: bold; direction: ltr;">
                  ${toEnglishDigits(item.quantity.toString())}
                </td>
                <td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: center; font-family: 'Inter', sans-serif; font-weight: bold; direction: ltr;">
                  ${formatCurrency(item.total)}
                </td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
      </div>

      <!-- Separator -->
      <div style="text-align: center; margin: 16px 0; color: #d1d5db; font-size: 20px;">--------------------------</div>

      <!-- Footer Section -->
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Financial Summary -->
        <div style="border-top: 2px solid #d1d5db; padding-top: 12px;">
          <!-- Subtotal -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 12px;">
            <span style="font-weight: 600; color: #374151;">کۆی نرخ:</span>
            <span style="font-family: 'Inter', sans-serif; color: #1f2937; direction: ltr;">
              ${formatCurrency(saleData.subtotal || invoice.total)} IQD
            </span>
          </div>

          <!-- Discount -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 12px;">
            <span style="font-weight: 600; color: #374151;">داشکاندن:</span>
            <span style="font-family: 'Inter', sans-serif; font-weight: bold; color: #dc2626; direction: ltr;">
              -${formatCurrency(saleData.discount_amount || 0)}
            </span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: bold;">
            <span style="color: #1f2937;">کۆی گشتی:</span>
            <span style="font-family: 'Inter', sans-serif; color: #1f2937; direction: ltr;">
              ${formatCurrency(invoice.total)} IQD
            </span>
          </div>
        </div>

        <!-- Grand Total Highlight -->
        <div style="background: transparent; color: #000; text-align: center; padding: 12px 16px; border-radius: 8px; font-size: 20px; font-weight: bold; border: 2px solid #000;">
          کۆی گشتی: ${formatCurrency(invoice.total)} IQD
        </div>

        <!-- QR Code -->
        ${qrCodeUrl ? `
          <div style="text-align: center; margin: 16px 0;">
            <img src="${qrCodeUrl}" alt="QR Code" style="width: 64px; height: 64px; margin: 0 auto;" />
          </div>
        ` : ''}

        <!-- Thank You Note -->
        <div style="text-align: center; font-size: 12px; color: #6b7280; font-style: italic; border-top: 1px solid #e5e7eb; padding-top: 12px;">
          ${thankYouNote}
        </div>

        <!-- Developer Branding -->
        <div style="text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px;">
          گەشەپێدانی سیستم لە لایەن Click Group<br />
          07701466787
        </div>
      </div>
    </div>
  `
}