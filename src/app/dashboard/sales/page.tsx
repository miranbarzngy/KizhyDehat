'use client'

import { useAuth } from '@/contexts/AuthContext'
import { calculateUnitPrice, convertUnits, safeStringToNumber } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useEffect, useState, useRef, useCallback } from 'react'
import ProductCard from './_components/ProductCard'
import CartSidebar from './_components/CartSidebar'
import CustomerSelector from './_components/CustomerSelector'
import UnitModal from './_components/UnitModal'
import { useGlobalInvoiceModal } from '@/hooks/useGlobalInvoiceModal'
import { useToast } from '@/components/Toast'
import { logActivity, ActivityActions, EntityTypes } from '@/lib/activityLogger'
import LoadingTimeout from '@/components/common/LoadingTimeout'

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
  image?: string
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

export default function SalesPage() {
  const { user, profile } = useAuth()
  const { openModal } = useGlobalInvoiceModal()
  const { showSuccess, showError } = useToast()
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
  const [orderSource, setOrderSource] = useState('')
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [selectedCustomerData, setSelectedCustomerData] = useState<Customer | null>(null)
  const [completedSaleData, setCompletedSaleData] = useState<any>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  
  // Timeout and error states
  const [inventoryError, setInventoryError] = useState<string | null>(null)
  const [customersError, setCustomersError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const mountedRef = useRef(true)

  const getFilteredInventory = (): InventoryItem[] => selectedCategory === 'all' ? inventory : inventory.filter(i => i.category === selectedCategory)
  const getFilteredCustomers = (): Customer[] => {
    if (!customerSearchTerm.trim()) return customers.slice(0, 5)
    const searchLower = customerSearchTerm.toLowerCase()
    return customers.filter(c => c.name.toLowerCase().includes(searchLower) || c.phone1?.toLowerCase().includes(searchLower)).slice(0, 10)
  }

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  
  const fetchWithRetry = async <T,>(fetchFn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T | null> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try { 
        if (!mountedRef.current) return null
        return await fetchFn() 
      } catch (err) { 
        if (attempt < maxRetries && mountedRef.current) await wait(delayMs) 
      }
    }
    return null
  }

  const fetchAllData = async () => {
    setIsRetrying(true)
    setInventoryError(null)
    setCustomersError(null)
    
    // Fetch inventory with timeout
    const invPromise = fetchWithRetry(async () => {
      const { data, error } = await supabase.from('products').select('*').gt('total_amount_bought', 0).or('is_archived.is.null,is_archived.eq.false').order('name', { ascending: true })
      if (error) throw error
      return data
    }, 3, 1000)

    // Fetch customers with timeout
    const custPromise = fetchWithRetry(async () => {
      const { data, error } = await supabase.from('customers').select('id, name, phone1, phone2, total_debt, image')
      if (error) throw error
      return data
    }, 3, 1000)

    // Race against timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 10000)
    })

    try {
      const [invResult, custResult] = await Promise.race([
        Promise.all([invPromise, custPromise]),
        timeoutPromise
      ]) as [any, any]

      if (mountedRef.current) {
        if (invResult) {
          setInventory(invResult.map((item: any) => ({
            ...item, category: item.category || 'ئەوانی تر', name: item.name,
            total_amount_bought: item.total_amount_bought, selling_price_per_unit: item.selling_price_per_unit,
            cost_per_unit: item.cost_per_unit
          })))
        } else {
          setInventoryError('کات بەسەرچوو')
        }

        if (custResult) {
          setCustomers(custResult)
        } else {
          setCustomersError('کات بەسەرچوو')
        }

        setLoading(false)
        setIsRetrying(false)
      }
    } catch (error) {
      if (mountedRef.current) {
        setInventoryError('هەڵە لە ئامادەکردن')
        setCustomersError('هەڵە لە ئامادەکردن')
        setLoading(false)
        setIsRetrying(false)
      }
    }
  }

  const handleRetry = useCallback(() => {
    setLoading(true)
    setIsRetrying(true)
    fetchAllData()
  }, [])

  useEffect(() => { 
    mountedRef.current = true
    fetchAllData()
    
    // Fetch categories from Supabase
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true })
        
        if (error) throw error
        if (mountedRef.current) setCategories(data || [])
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        if (mountedRef.current) setCategoriesLoading(false)
      }
    }
    
    fetchCategories()
    
    const handleClick = (e: MouseEvent) => { const t = e.target as Element; if (!t.closest('.customer-search-container')) setShowCustomerDropdown(false) }; document.addEventListener('mousedown', handleClick); return () => { 
      mountedRef.current = false
      document.removeEventListener('mousedown', handleClick) 
    }
  }, [])

  useEffect(() => {
    let finalUserName = 'کارمەند'
    if (profile?.name) finalUserName = profile.name
    else if (user?.user_metadata?.full_name || user?.user_metadata?.name) finalUserName = user.user_metadata.full_name || user.user_metadata.name
    setUserName(finalUserName)
  }, [profile, user])

  const addToCart = (item: InventoryItem) => { 
    if (item.total_amount_bought <= 0) {
      showError('بڕی پێویست لە کۆگا نەماوە!')
      return
    }
    setSelectedItem(item); setQuantityInput(''); setShowUnitModal(true) 
  }

  const addUnitItem = () => {
    if (!selectedItem || !quantityInput) return
    const quantity = safeStringToNumber(quantityInput)
    if (quantity <= 0) return
    
    if (quantity > selectedItem.total_amount_bought) {
      showError('بڕی پێویست لە کۆگا نەماوە!')
      return
    }
    
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
        status: 'pending', created_at: new Date().toISOString(), order_source: orderSource || null
      }).select('id, total, payment_method, date, invoice_number').single()
      if (saleError) throw saleError

      const customerNameForLog = customers.find(c => c.id === selectedCustomer)?.name || 'نەناسراو'
      await logActivity(
        user?.id || null,
        null,
        ActivityActions.CREATE_SALE,
        `فرۆشتنێکی نوێ بۆ ${customerNameForLog} بە بڕی ${total.toLocaleString()} IQD`,
        EntityTypes.SALE,
        saleData.id
      )

      const saleItems = cart.map(item => ({
        sale_id: saleData.id, item_id: item.item.id, item_name: item.item.name, category: item.item.category,
        quantity: item.quantity, unit: item.item.unit, price: item.price, cost_price: item.item.cost_per_unit || 0,
        total: item.total, date: new Date().toISOString().split('T')[0]
      }))
      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
      if (itemsError) throw itemsError

      for (const item of cart) {
        const { error: decrementError } = await supabase
          .from('products')
          .update({ total_amount_bought: item.item.total_amount_bought - item.baseQuantity })
          .eq('id', item.item.id)
        
        if (decrementError) {
          console.error('Error decrementing stock:', decrementError)
        }
      }

      const customerName = customers.find(c => c.id === selectedCustomer)?.name
      const customerPhone = customers.find(c => c.id === selectedCustomer)?.phone1

      let profileName = userName
      if (user?.id) {
        try {
          const { data: profileData } = await supabase.from('profiles').select('name').eq('id', user.id).single()
          if (profileData?.name) {
            profileName = profileData.name
          }
        } catch (e) {
          console.log('Could not fetch profile:', e)
        }
      }

      const invoiceData = {
        invoiceNumber: saleData.invoice_number || 0,
        customerName: customerName || 'نەناسراو',
        customerPhone,
        sellerName: profileName,
        seller_name: profileName,
        profiles: { name: profileName },
        date: new Date().toLocaleDateString('ku'),
        time: new Date().toLocaleTimeString('ku'),
        paymentMethod,
        items: cart.map(item => ({ name: item.item.name, unit: item.unit, quantity: item.quantity, price: item.price, total: item.total })),
        subtotal: total + discount,
        discount,
        total
      }

      openModal(invoiceData, saleData.id, 'پسوڵەی فرۆشتن')

      setCart([]); setPaymentMethod('cash'); setSelectedCustomer(''); setDiscount(0); setCustomerRequired(false); setOrderSource('')
      
      const invResult = await fetchWithRetry(async () => {
        const { data, error } = await supabase.from('products').select('*').gt('total_amount_bought', 0).or('is_archived.is.null,is_archived.eq.false').order('name', { ascending: true })
        if (error) throw error
        return data
      }, 3, 1000)

      if (invResult && mountedRef.current) {
        setInventory(invResult.map((item: any) => ({
          ...item, category: item.category || 'ئەوانی تر', name: item.name,
          total_amount_bought: item.total_amount_bought, selling_price_per_unit: item.selling_price_per_unit,
          cost_per_unit: item.cost_per_unit
        })))
      }
    } catch (error) { console.error('Error:', error); alert('هەڵە لە تۆمارکردن') }
  }

  const handleCustomerSelect = (customer: Customer) => { setSelectedCustomer(customer.id); setSelectedCustomerData(customer); setCustomerSearchTerm(''); setShowCustomerDropdown(false); setCustomerRequired(false) }
  const handleCreateCustomer = () => alert('زیادکردنی کڕیار لە بەشی کڕیاران')

  const filteredInventory = getFilteredInventory()
  const groupedInventory = Object.entries(inventory.reduce((acc, item) => {
    const cat = item.category || 'ئەوانی تر'; if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc
  }, {} as { [key: string]: InventoryItem[] })).map(([name, items]) => ({ name, items }))

  // Show loading timeout UI if loading
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingTimeout 
          timeout={10000} 
          onRetry={handleRetry}
          message="ئامادەکردنی پەڕە..."
          showRetryAfter={8}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-1 lg:gap-6">
      <div className="h-[35vh] lg:h-full lg:flex-1 lg:w-2/3 overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="h-full flex flex-col">
          <div className="mb-3">
            <motion.h2 
              className="text-xl font-bold mb-3"
              style={{ 
                color: 'var(--theme-foreground)',
                fontFamily: 'var(--font-uni-salar)' 
              }} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.2 }}
            >
              کاڵاکان
            </motion.h2>
            <CustomerSelector searchTerm={customerSearchTerm} showDropdown={showCustomerDropdown} filteredCustomers={getFilteredCustomers()} selectedCustomerData={selectedCustomerData} onSearchChange={setCustomerSearchTerm} onSelect={handleCustomerSelect} onDropdownChange={setShowCustomerDropdown} onCreateNew={handleCreateCustomer} />
            <motion.div 
              className="mb-2" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.3 }}
            >
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-3">
                  <div 
                    className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ 
                      borderColor: 'var(--theme-card-border)',
                      borderTopColor: 'transparent'
                    }}
                  />
                </div>
              ) : categories.length === 0 ? (
                <div 
                  className="text-center py-4 rounded-xl border backdrop-blur-xl"
                  style={{ 
                    backgroundColor: 'var(--theme-card-bg)',
                    borderColor: 'var(--theme-card-border)',
                    color: 'var(--theme-secondary)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  هیچ جۆرە پۆلێک نەدۆزرایەوە
                </div>
              ) : (
                <div className="grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                  <motion.button
                    onClick={() => setSelectedCategory('all')}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border backdrop-blur-xl ${
                      selectedCategory === 'all' 
                        ? 'ring-2 ring-blue-500/50' 
                        : ''
                    }`}
                    style={{ 
                      backgroundColor: selectedCategory === 'all' ? 'var(--theme-accent)' : 'var(--theme-card-bg)',
                      borderColor: selectedCategory === 'all' ? 'var(--theme-accent)' : 'var(--theme-card-border)',
                      color: selectedCategory === 'all' ? 'white' : 'var(--theme-foreground)',
                      fontFamily: 'var(--font-uni-salar)'
                    }}
                  >
                    هەموو جۆرەکان
                  </motion.button>
                  
                  {categories.map((category) => (
                    <motion.button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.name)}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border backdrop-blur-xl ${
                        selectedCategory === category.name 
                          ? 'ring-2 ring-blue-500/50' 
                          : ''
                      }`}
                      style={{ 
                        backgroundColor: selectedCategory === category.name ? 'var(--theme-accent)' : 'var(--theme-card-bg)',
                        borderColor: selectedCategory === category.name ? 'var(--theme-accent)' : 'var(--theme-card-border)',
                        color: selectedCategory === category.name ? 'white' : 'var(--theme-foreground)',
                        fontFamily: 'var(--font-uni-salar)'
                      }}
                    >
                      {category.name}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
          <motion.div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            {inventoryError ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-center mb-4" style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>
                  {inventoryError}
                </p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 rounded-xl font-bold"
                  style={{ background: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                >
                  هەوڵدانەوە
                </button>
              </div>
            ) : (
              <>
                {/* Mobile view (< 768px) - List layout */}
                <div className="md:hidden space-y-2">
                  {filteredInventory.map((item, index) => (
                    <motion.button 
                      key={item.id} 
                      onClick={() => addToCart(item)} 
                      className="w-full h-20 backdrop-blur-xl rounded-lg shadow-md border flex items-center p-2"
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: index * 0.03 }} 
                      whileTap={{ scale: 0.98 }}
                      style={{ 
                        backgroundColor: 'var(--theme-card-bg)',
                        borderColor: 'var(--theme-card-border)'
                      }}
                    >
                      <div className="flex-shrink-0 ml-2">
                        <div 
                          className="w-14 h-14 rounded-xl"
                          style={{ backgroundColor: 'var(--theme-muted)' }}
                        ></div>
                      </div>
                      <div className="flex-1 text-right mr-3">
                        <h3 
                          className="font-bold text-sm"
                          style={{ 
                            color: 'var(--theme-foreground)',
                            fontFamily: 'var(--font-uni-salar)' 
                          }}
                        >
                          {item.name}
                        </h3>
                        <p 
                          className="text-xs mt-1"
                          style={{ 
                            color: 'var(--theme-secondary)',
                            fontFamily: 'Inter, sans-serif' 
                          }}
                        >
                          {item.total_amount_bought.toLocaleString()} {item.unit}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-left flex flex-col justify-center">
                        <p 
                          className="text-sm font-bold"
                          style={{ 
                            color: 'var(--theme-accent)',
                            fontFamily: 'Inter, sans-serif' 
                          }}
                        >
                          {item.selling_price_per_unit.toLocaleString()}
                        </p>
                        <p 
                          className="text-xs"
                          style={{ 
                            color: 'var(--theme-secondary)',
                            fontFamily: 'Inter, sans-serif' 
                          }}
                        >
                          IQD/{item.unit}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
                
                {/* Tablet/Desktop view (768px+) - Grid layout with ProductCard */}
                <div className="hidden md:grid md:grid-cols-5 gap-2 lg:gap-4">
                  {filteredInventory.map((item) => (
                    <ProductCard key={item.id} item={item} onAddToCart={addToCart} />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
      <CartSidebar 
        cart={cart} 
        paymentMethod={paymentMethod} 
        selectedCustomer={selectedCustomer} 
        discount={discount} 
        customerRequired={customerRequired}
        orderSource={orderSource}
        onPaymentMethodChange={setPaymentMethod} 
        onDiscountChange={setDiscount} 
        onCustomerChange={setSelectedCustomer}
        onOrderSourceChange={setOrderSource}
        onUpdateQuantity={updateQuantity} 
        onRemove={removeFromCart} 
        onCompleteSale={completeSale} 
        customers={customers.map(c => ({ id: c.id, name: c.name }))} 
        onCreateCustomer={handleCreateCustomer} 
      />
      <UnitModal isOpen={showUnitModal} item={selectedItem} quantity={quantityInput} onQuantityChange={setQuantityInput} onConfirm={addUnitItem} onClose={() => setShowUnitModal(false)} />
    </div>
  )
}
