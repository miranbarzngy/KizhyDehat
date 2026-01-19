'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface InventoryItem {
  id: string
  item_name: string
  quantity: number
  unit: string
  selling_price: number
  cost_price: number
}

interface Customer {
  id: string
  name: string
  total_debt: number
}

interface CartItem {
  id: string
  item: InventoryItem
  quantity: number
  unit: string
  price: number
  total: number
}

interface ShopSettings {
  id: string
  shopname: string
  icon: string
  phone: string
  location: string
  qrcodeimage: string
}

export default function SalesPage() {
  const { user } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [weightInput, setWeightInput] = useState('')
  const [payLater, setPayLater] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [discount, setDiscount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)

  // Convert Kurdish numerals to Western numerals
  const convertKurdishToWestern = (kurdishNum: string): string => {
    // Handle Arabic decimal separator (٫) and convert to Western decimal point (.)
    const processedNum = kurdishNum.replace(/٫/g, '.')

    const kurdishToWestern: { [key: string]: string } = {
      '٠': '0',
      '١': '1',
      '٢': '2',
      '٣': '3',
      '٤': '4',
      '٥': '5',
      '٦': '6',
      '٧': '7',
      '٨': '8',
      '٩': '9'
    }

    return processedNum.split('').map(char => kurdishToWestern[char] || char).join('')
  }

  useEffect(() => {
    fetchInventory()
    fetchCustomers()
    fetchShopSettings()
  }, [])

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
          cost_price: 15.50
        },
        {
          id: '2',
          item_name: 'شەکر',
          quantity: 8,
          unit: 'کیلۆ',
          selling_price: 14.50,
          cost_price: 12.00
        },
        {
          id: '3',
          item_name: 'چای',
          quantity: 45,
          unit: 'پاکێت',
          selling_price: 10.00,
          cost_price: 8.50
        },
        {
          id: '4',
          item_name: 'گۆشت',
          quantity: 12,
          unit: 'کیلۆ',
          selling_price: 35.00,
          cost_price: 28.00
        },
        {
          id: '5',
          item_name: 'پیاز',
          quantity: 30,
          unit: 'کیلۆ',
          selling_price: 5.50,
          cost_price: 4.00
        },
        {
          id: '6',
          item_name: 'تەماتە',
          quantity: 20,
          unit: 'کیلۆ',
          selling_price: 8.00,
          cost_price: 6.50
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
      setInventory(data || [])
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
        .select('id, name, total_debt')

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

  const addToCart = (item: InventoryItem) => {
    if (item.unit.toLowerCase().includes('kg')) {
      setSelectedItem(item)
      setShowWeightModal(true)
    } else {
      const cartItem: CartItem = {
        id: Date.now().toString(),
        item,
        quantity: 1,
        unit: item.unit,
        price: item.selling_price,
        total: item.selling_price
      }
      setCart(prev => [...prev, cartItem])
    }
  }

  const addWeightItem = () => {
    if (!selectedItem || !weightInput) return

    const weight = parseFloat(weightInput)
    if (weight <= 0) return

    const cartItem: CartItem = {
      id: Date.now().toString(),
      item: selectedItem,
      quantity: weight,
      unit: 'kg',
      price: selectedItem.selling_price,
      total: weight * selectedItem.selling_price
    }
    setCart(prev => [...prev, cartItem])
    setShowWeightModal(false)
    setSelectedItem(null)
    setWeightInput('')
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

    if (payLater && !selectedCustomer) {
      alert('تکایە کڕیارێک هەڵبژێرە بۆ پارەدان دواتر')
      return
    }

    // Check stock availability
    for (const cartItem of cart) {
      if (cartItem.quantity > cartItem.item.quantity) {
        alert(`بڕی پێویست لە کۆگا نەماوە: ${cartItem.item.item_name}`)
        return
      }
    }

    try {
      const total = getTotal()

      // Insert sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_id: payLater ? selectedCustomer : null,
          total,
          user_id: user?.id
        })
        .select()
        .single()

      if (saleError) throw saleError

      // Insert sale items
      const saleItems = cart.map(item => ({
        sale_id: saleData.id,
        item_id: item.item.id,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        cost_price: item.item.cost_price || 0
      }))

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems)

      if (itemsError) throw itemsError

      // Update inventory
      for (const item of cart) {
        const { error: updateError } = await supabase
          .from('inventory')
          .update({
            quantity: item.item.quantity - item.quantity
          })
          .eq('id', item.item.id)

        if (updateError) throw updateError
      }

      // If pay later, update customer debt
      if (payLater) {
        const customer = customers.find(c => c.id === selectedCustomer)
        if (customer) {
          const { error: debtError } = await supabase
            .from('customers')
            .update({
              total_debt: customer.total_debt + total
            })
            .eq('id', selectedCustomer)

          if (debtError) throw debtError

          // Add to customer payments
          const { error: paymentError } = await supabase
            .from('customer_payments')
            .insert({
              customer_id: selectedCustomer,
              date: new Date().toISOString().split('T')[0],
              amount: total,
              items: cart.map(item => `${item.item.item_name} x${item.quantity}`).join(', '),
              note: 'Sale on credit'
            })

          if (paymentError) throw paymentError
        }
      }

      // Print receipt
      const customerName = payLater ? customers.find(c => c.id === selectedCustomer)?.name : undefined
      printReceipt(cart, total, customerName)

      // Reset cart
      setCart([])
      setPayLater(false)
      setSelectedCustomer('')
      setDiscount(0)
      fetchInventory()
      fetchCustomers()
    } catch (error) {
      console.error('Error completing sale:', error)
      alert('هەڵە لە تەواوبوونی فرۆشتن')
    }
  }

  const printReceipt = (items: CartItem[], total: number, customerName?: string) => {
    const receiptWindow = window.open('', '_blank', 'width=400,height=600')
    if (!receiptWindow) return

    const receiptHTML = `
      <html dir="rtl">
        <head>
          <title>فاکتور</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 10px; }
            .receipt { max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 1px solid #000; padding-top: 5px; font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>فاکتور</h2>
              <p>سیستەمی POS</p>
              <p>${new Date().toLocaleString('ku')}</p>
            </div>
            ${customerName ? `<p>کڕیار: ${customerName}</p>` : ''}
            ${items.map(item => `
              <div class="item">
                <span>${item.item.item_name} x${item.quantity}</span>
                <span>${item.total.toFixed(2)} د.ع</span>
              </div>
            `).join('')}
            ${discount > 0 ? `<div class="item"><span>داشکاندن</span><span>-${discount.toFixed(2)} د.ع</span></div>` : ''}
            <div class="total">
              <div class="item">
                <span>کۆی گشتی</span>
                <span>${total.toFixed(2)} د.ع</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    receiptWindow.document.write(receiptHTML)
    receiptWindow.document.close()
    receiptWindow.print()
  }

  if (loading) {
    return <div className="text-center">چاوەڕوانبە...</div>
  }

  return (
    <div className="h-screen flex">
        {/* Left Side - Products */}
      <div className="w-2/3 p-4 bg-gray-50">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">کاڵاکان</h2>
          {/* Categories would go here */}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {inventory.map((item) => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded mx-auto mb-2"></div>
                <h3 className="font-medium text-sm">{item.item_name}</h3>
                <p className="text-indigo-600 font-semibold">{item.selling_price.toFixed(2)} د.ع</p>
                <p className="text-xs text-gray-500">{item.quantity} {item.unit}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="w-1/3 bg-white shadow-lg p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">سەبەتە</h2>

        <div className="flex-1 overflow-y-auto">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-2 border-b">
              <div className="flex-1">
                <h4 className="font-medium">{item.item.item_name}</h4>
                <p className="text-sm text-gray-600">{item.quantity} {item.unit} x {item.price.toFixed(2)} د.ع</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="px-2 py-1 bg-gray-200 rounded"
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="px-2 py-1 bg-gray-200 rounded"
                >
                  +
                </button>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded"
                >
                  ✕
                </button>
              </div>
              <div className="text-right">
                <p className="font-semibold">{item.total.toFixed(2)} د.ع</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="payLater"
              checked={payLater}
              onChange={(e) => setPayLater(e.target.checked)}
            />
            <label htmlFor="payLater">پارەدان دواتر</label>
          </div>

          {payLater && (
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">هەڵبژاردنی کڕیار</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} (قەرز: {customer.total_debt.toFixed(2)} د.ع)
                </option>
              ))}
            </select>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">داشکاندن</label>
            <input
              type="text"
              value={discount}
              onChange={(e) => {
                const westernNum = convertKurdishToWestern(e.target.value)
                setDiscount(parseFloat(westernNum) || 0)
              }}
              className="w-full border rounded px-3 py-2"
              placeholder="٠.٠٠"
            />
          </div>

          <div className="text-xl font-bold">
            کۆی گشتی: {getTotal().toFixed(2)} د.ع
          </div>

          <button
            onClick={completeSale}
            disabled={cart.length === 0}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            تەواوبوونی فرۆشتن
          </button>
        </div>
      </div>

      {/* Weight Modal */}
      {showWeightModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">کێشی {selectedItem.item_name}</h3>
            <div className="mb-4">
              <input
                type="text"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-full text-center text-2xl border rounded px-3 py-2 mb-4"
                placeholder="0.000"
              />
              <div className="grid grid-cols-2 gap-2">
                {[0.25, 0.5, 1, 2].map((weight) => (
                  <button
                    key={weight}
                    onClick={() => setWeightInput(weight.toString())}
                    className="bg-gray-200 py-2 rounded hover:bg-gray-300"
                  >
                    {weight} kg
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowWeightModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={addWeightItem}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                زیادکردن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
