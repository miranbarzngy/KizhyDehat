'use client'

import { useAuth } from '@/contexts/AuthContext'
import { calculateUnitPrice, convertUnits, safeStringToNumber } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import GlobalInvoiceModal from '@/components/GlobalInvoiceModal'
import ProductCard from './_components/ProductCard'
import CartSidebar from './_components/CartSidebar'
import CustomerSelector from './_components/CustomerSelector'
import UnitModal from './_components/UnitModal'

interface InventoryItem {
  id: string
  name: string
  total_amount_bought: number
  unit: string
  selling_price_per_unit: number
  cost_per_unit: number
  category: string
  image?: string
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
  baseQuantity: number
}

interface InvoiceSettings {
  id: string
  shop_name: string
  shop_phone: string
  shop_address: string
  shop_logo: string
  thank_you_note: string
  qr_code_url: string
}

export default function SalesPage() {
  const { user, profile } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [quantityInput, setQuantityInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'fib' | 'debt'>('cash')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [discount, setDiscount] = useState(0)
  const [customerRequired, setCustomerRequired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null)
  const [userName, setUserName] = useState('')
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [selectedCustomerData, setSelectedCustomerData] = useState<Customer | null>(null)
  const [showInvoice, setShowInvoice] = useState(false)
  const [completedSaleData, setCompletedSaleData] = useState<any>(null)

  const getFilteredInventory = (): InventoryItem[] => selectedCategory === 'all' ? inventory : inventory.filter(i => i.category === selectedCategory)
  const getFilteredCustomers = (): Customer[] => {
    if (!customerSearchTerm.trim()) return customers.slice(0, 5)
    const searchLower = customerSearchTerm.toLowerCase()
    return customers.filter(c => c.name.toLowerCase().includes(searchLower) || c.phone1?.toLowerCase().includes(searchLower)).slice(0, 10)
  }

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  const fetchWithRetry = async <T>(fetchFn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T | null> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try { return await fetchFn() } catch (err) { if (attempt < maxRetries) await wait(delayMs) }
    }
    return null
  }

  const fetchAllData = async () => {
    const invResult = await fetchWithRetry(async () => {
      const { data, error } = await supabase.from('products').select('*').gt('total_amount_bought', 0)
      if (error) throw error
      return data
    }, 3, 1000)

    if (invResult) {
      setInventory(invResult.map((item: any) => ({
        ...item, category: item.category || 'ئەوانی تر', name: item.name,
        total_amount_bought: item.total_amount_bought, selling_price_per_unit: item.selling_price_per_unit,
        cost_per_unit: item.cost_per_unit
      })))
    }

    const custResult = await fetchWithRetry(async () => {
      const { data, error } = await supabase.from('customers').select('id, name, phone1, phone2, total_debt')
      if (error) throw error
      return data
    }, 3, 1000)
    if (custResult) setCustomers(custResult)

    const { data } = await supabase.from('invoice_settings').select('*').single()
    setInvoiceSettings(data || null)
    setLoading(false)
  }

  useEffect(() => { fetchAllData(); const handleClick = (e: MouseEvent) => { const t = e.target as Element; if (!t.closest('.customer-search-container')) setShowCustomerDropdown(false) }; document.addEventListener('mousedown', handleClick); return () => document.removeEventListener('mousedown', handleClick) }, [])

  useEffect(() => {
    let finalUserName = 'کارمەند'
    if (profile?.name) finalUserName = profile.name
    else if (user?.user_metadata?.full_name || user?.user_metadata?.name) finalUserName = user.user_metadata.full_name || user.user_metadata.name
    setUserName(finalUserName)
  }, [profile, user])

  const addToCart = (item: InventoryItem) => { setSelectedItem(item); setQuantityInput(''); setShowUnitModal(true) }

  const addUnitItem = () => {
    if (!selectedItem || !quantityInput) return
    const quantity = safeStringToNumber(quantityInput)
    if (quantity <= 0) return
    const unitPrice = calculateUnitPrice(selectedItem.selling_price_per_unit, selectedItem.unit, selectedItem.unit, quantity)
    const cartItem: CartItem = {
      id: Date.now().toString(), item: selectedItem, quantity,
      unit: selectedItem.unit, price: unitPrice / quantity, total: unitPrice,
      baseQuantity: convertUnits(quantity, selectedItem.unit, selectedItem.unit)
    }
    setCart(prev => [...prev, cartItem])
    setShowUnitModal(false); setSelectedItem(null); setQuantityInput('')
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id))
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(id); return }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity, total: quantity * item.price } : item))
  }

  const getTotal = () => cart.reduce((sum, item) => sum + item.total, 0) - discount

  const completeSale = async () => {
    if (cart.length === 0 || !selectedCustomer) { if (!selectedCustomer) setCustomerRequired(true); return }
    if (!supabase) { alert('Supabase not configured'); return }

    try {
      const total = getTotal()
      const { data: saleData, error: saleError } = await supabase.from('sales').insert({
        customer_id: selectedCustomer, total, payment_method: paymentMethod, user_id: user?.id,
        sold_by: userName, discount_amount: discount, subtotal: total + discount, items_count: cart.length,
        status: 'pending', created_at: new Date().toISOString()
      }).select('id, total, payment_method, date').single()
      if (saleError) throw saleError

      const saleItems = cart.map(item => ({
        sale_id: saleData.id, item_id: item.item.id, item_name: item.item.name, category: item.item.category,
        quantity: item.baseQuantity, unit: item.item.unit, price: item.price, cost_price: item.item.cost_per_unit || 0,
        total: item.total, date: new Date().toISOString().split('T')[0]
      }))
      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
      if (itemsError) throw itemsError

      const customerName = customers.find(c => c.id === selectedCustomer)?.name
      const customerPhone = customers.find(c => c.id === selectedCustomer)?.phone1

      setCompletedSaleData({
        invoiceNumber: 0, customerName: customerName || 'نەناسراو', customerPhone, sellerName: userName,
        date: new Date().toLocaleDateString('ku'), time: new Date().toLocaleTimeString('ku'), paymentMethod,
        items: cart.map(item => ({ name: item.item.name, unit: item.unit, quantity: item.quantity, price: item.price, total: item.total })),
        subtotal: total + discount, discount, total,
        shopName: invoiceSettings?.shop_name || 'فرۆشگای کوردستان', shopPhone: invoiceSettings?.shop_phone,
        shopAddress: invoiceSettings?.shop_address, shopLogo: invoiceSettings?.shop_logo,
        qrCodeUrl: invoiceSettings?.qr_code_url, thankYouNote: invoiceSettings?.thank_you_note || 'سوپاس!'
      })
      setShowInvoice(true)
      setCart([]); setPaymentMethod('cash'); setSelectedCustomer(''); setDiscount(0); setCustomerRequired(false)
    } catch (error) { console.error('Error:', error); alert('هەڵە لە تۆمارکردن') }
  }

  const handleCustomerSelect = (customer: Customer) => { setSelectedCustomer(customer.id); setSelectedCustomerData(customer); setCustomerSearchTerm(''); setShowCustomerDropdown(false); setCustomerRequired(false) }
  const handleCreateCustomer = () => alert('زیادکردنی کڕیار لە بەشی کڕیاران')

  const filteredInventory = getFilteredInventory()
  const groupedInventory = Object.entries(inventory.reduce((acc, item) => {
    const cat = item.category || 'ئەوانی تر'; if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc
  }, {} as { [key: string]: InventoryItem[] })).map(([name, items]) => ({ name, items }))


  return (
    <div className="h-full flex flex-col bg-white dark:bg-transparent gap-4 lg:gap-6 lg:flex-row transition-colors duration-300">
      <div className="h-[70vh] lg:h-full lg:flex-1 lg:w-2/3 overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="h-full flex flex-col">
          <div className="mb-3">
            <motion.h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:to-purple-400" style={{ fontFamily: 'var(--font-uni-salar)' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>کاڵاکان</motion.h2>
            <CustomerSelector searchTerm={customerSearchTerm} showDropdown={showCustomerDropdown} filteredCustomers={getFilteredCustomers()} selectedCustomerData={selectedCustomerData} onSearchChange={setCustomerSearchTerm} onSelect={handleCustomerSelect} onDropdownChange={setShowCustomerDropdown} onCreateNew={handleCreateCustomer} />
            <motion.div className="mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white dark:bg-white/5 shadow-lg focus:ring-2 focus:ring-blue-500/50 outline-none text-sm text-gray-900 dark:text-gray-200" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                <option value="all">هەموو پۆلەکان</option>
                {groupedInventory.map((group) => <option key={group.name} value={group.name}>{group.name}</option>)}
              </select>
            </motion.div>
          </div>
          <motion.div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <div className="lg:hidden space-y-2">
              {filteredInventory.map((item, index) => (
                <motion.button key={item.id} onClick={() => addToCart(item)} className="w-full h-16 bg-gray-100 dark:bg-white/10 backdrop-blur-xl rounded-lg shadow-md border border-gray-200 dark:border-white/10 flex items-center p-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} whileTap={{ scale: 0.98 }}>
                  <div className="flex-shrink-0 ml-2"><div className="w-12 h-12 bg-gray-200 dark:bg-white/10 rounded-xl"></div></div>
                  <div className="flex-1 text-right mr-3">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-gray-200" style={{ fontFamily: 'var(--font-uni-salar)' }}>{item.name}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>{item.category}</p>
                  </div>
                  <div className="flex-shrink-0 text-left">
                    <p className="text-sm font-bold text-blue-500 dark:text-blue-400" style={{ fontFamily: 'Inter, sans-serif' }}>{item.selling_price_per_unit.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">IQD</p>
                  </div>
                </motion.button>
              ))}
            </div>
            <div className="hidden lg:grid lg:grid-cols-4 gap-4">
              {filteredInventory.map((item) => (<ProductCard key={item.id} item={item} onAddToCart={addToCart} />))}
            </div>
          </motion.div>
        </motion.div>
      </div>
      <CartSidebar cart={cart} paymentMethod={paymentMethod} selectedCustomer={selectedCustomer} discount={discount} customerRequired={customerRequired} onPaymentMethodChange={setPaymentMethod} onDiscountChange={setDiscount} onCustomerChange={setSelectedCustomer} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} onCompleteSale={completeSale} customers={customers.map(c => ({ id: c.id, name: c.name }))} onCreateCustomer={handleCreateCustomer} />
      <UnitModal isOpen={showUnitModal} item={selectedItem} quantity={quantityInput} onQuantityChange={setQuantityInput} onConfirm={addUnitItem} onClose={() => setShowUnitModal(false)} />
      <GlobalInvoiceModal isOpen={showInvoice} onClose={() => setShowInvoice(false)} invoiceData={completedSaleData} />
    </div>
  )
}
