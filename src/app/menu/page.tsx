'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface MenuItem {
  id: string
  item_name: string
  selling_price: number
  unit: string
  category: string
  image: string
}

interface CartItem {
  id: string
  item: MenuItem
  quantity: number
  unit: string
  total: number
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [weightInput, setWeightInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .gt('quantity', 0)
        .eq('is_online_visible', true)

      if (error) throw error

      const items = data || []
      setMenuItems(items)

      // Extract unique categories
      const uniqueCategories = [...new Set(items.map(item => item.category).filter(Boolean))]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Error fetching menu items:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory)

  const addToCart = (item: MenuItem) => {
    if (item.unit.toLowerCase().includes('kg')) {
      setSelectedItem(item)
      setShowWeightModal(true)
    } else {
      const cartItem: CartItem = {
        id: Date.now().toString(),
        item,
        quantity: 1,
        unit: item.unit,
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

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0)
  }

  const sendOrder = () => {
    if (cart.length === 0) return

    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
    if (!whatsappNumber) {
      alert('WhatsApp number not configured')
      return
    }

    const itemsText = cart.map(item =>
      `${item.quantity} ${item.unit === 'pieces' ? 'دانە' : 'کیلۆ'} ${item.item.item_name} (${item.total.toFixed(2)} دینار)`
    ).join('\n')

    const totalText = `کۆتایی: ${getTotal().toFixed(2)} دینار`

    const message = `سڵاو، دەمەوێت ئەم کاڵایانە داوا بکەم:\n\n${itemsText}\n\n${totalText}`

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">مێنوی کاڵاکان</h1>
          <button
            onClick={() => setShowCart(true)}
            className="relative bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            سەبەتە ({cart.length})
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedCategory === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-white/80 text-gray-700 hover:bg-white'
              }`}
            >
              هەموو
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="aspect-square bg-gray-200 relative">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.item_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    🛒
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.item_name}</h3>
                <p className="text-green-600 font-bold text-xl mb-3">{item.selling_price.toFixed(2)} د.ع</p>
                <button
                  onClick={() => addToCart(item)}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  زیادکردن بۆ سەبەتە
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">هیچ کاڵایەک نیە لەم پۆلە</p>
          </div>
        )}
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">سەبەتە</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">سەبەتە بەتاڵە</p>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.item.item_name}</h4>
                          <p className="text-sm text-gray-600">
                            {item.quantity} {item.unit} × {item.item.selling_price.toFixed(2)} د.ع
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{item.total.toFixed(2)} د.ع</span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-xl font-bold mb-4">
                      <span>کۆی گشتی:</span>
                      <span>{getTotal().toFixed(2)} د.ع</span>
                    </div>
                    <button
                      onClick={sendOrder}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
                    >
                      ناردنی داواکاری بۆ واتسئاپ
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Weight Modal */}
      {showWeightModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
