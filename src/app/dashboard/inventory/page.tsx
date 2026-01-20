'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FaTh, FaList, FaEdit, FaTrash, FaSearch } from 'react-icons/fa'
import { sanitizeNumericInput, safeStringToNumber, toEnglishDigits, sanitizeBarcode, formatCurrency } from '@/lib/numberUtils'

interface InventoryItem {
  id: string
  item_name: string
  quantity: number
  unit: string
  low_stock_threshold: number
  cost_price: number
  selling_price: number
  category: string
  is_online_visible: boolean
  image: string
  expire_date?: string
  supplier_name?: string
  note?: string
}

interface Supplier {
  id: string
  name: string
  balance: number
}

interface Category {
  id: string
  name: string
  created_at: string
}

interface PurchaseItem {
  item_name: string
  cost_price: number
  selling_price: number
  quantity: number
  unit: string
  category?: string
  total_purchase_price?: number
  amount_paid?: number
  debt_amount?: number
  barcode1?: string
  barcode2?: string
  barcode3?: string
  barcode4?: string
  expire_date?: string
  image?: string
  note?: string
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showStockEntry, setShowStockEntry] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([
    { item_name: '', cost_price: 0, selling_price: 0, quantity: 0, unit: 'دانە' }
  ])
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  useEffect(() => {
    fetchInventory()
    fetchSuppliers()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchInventory = async () => {
    console.log('🔄 Fetching inventory data...')

    // Demo mode: show sample inventory data when Supabase is not configured
    if (!supabase) {
      console.log('⚠️ Supabase not configured, showing demo data')
      const demoInventory: InventoryItem[] = [
        {
          id: '1',
          item_name: 'برنج',
          quantity: 25,
          unit: 'کیلۆ',
          low_stock_threshold: 10,
          cost_price: 15.50,
          selling_price: 18.00,
          category: 'خۆراك',
          is_online_visible: true,
          image: '',
          expire_date: '2026-12-31',
          supplier_name: 'کۆمپانیای برنجی کوردستان',
          note: 'برنجی باشی کوردستانی'
        },
        {
          id: '2',
          item_name: 'شەکر',
          quantity: 8,
          unit: 'کیلۆ',
          low_stock_threshold: 15,
          cost_price: 12.00,
          selling_price: 14.50,
          category: 'خۆراك',
          is_online_visible: false,
          image: '',
          expire_date: '2026-06-15',
          supplier_name: 'فرۆشیاری شەکر',
          note: 'شەکری پاک و خاوێن'
        },
        {
          id: '3',
          item_name: 'چای',
          quantity: 45,
          unit: 'پاکێت',
          low_stock_threshold: 20,
          cost_price: 8.50,
          selling_price: 10.00,
          category: 'خۆراك',
          is_online_visible: true,
          image: '',
          expire_date: '2027-01-20',
          supplier_name: 'کۆمپانیای چای ناوەندی',
          note: 'چای ڕەسەنی کوردستانی'
        }
      ]
      setInventory(demoInventory)
      setLoading(false)
      return
    }

    try {
      // Fetch inventory data
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')

      if (inventoryError) throw inventoryError

      // Try to fetch product data if products table exists
      let productsData = []
      try {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')

        if (!productsError) {
          productsData = products || []
        }
      } catch (productsError) {
        // Products table might not exist, continue without it
        console.log('Products table not available, using inventory data only')
      }

      // Merge inventory data with product data
      const mergedInventory = (inventoryData || []).map((inventoryItem: InventoryItem) => {
        // Find matching product data
        const productData = productsData.find((product: { name: string }) =>
          product.name === inventoryItem.item_name
        )

        // Find supplier name if supplier_id exists
        let supplierName = ''
        if (productData?.supplier_id) {
          const supplier = suppliers.find(s => s.id === productData.supplier_id)
          supplierName = supplier?.name || ''
        }

        return {
          ...inventoryItem,
          expire_date: productData?.expire_date || '',
          supplier_name: supplierName,
          note: productData?.note || ''
        }
      })

      setInventory(mergedInventory)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    // Demo mode: show sample suppliers data when Supabase is not configured
    if (!supabase) {
      const demoSuppliers: Supplier[] = [
        { id: '1', name: 'کۆمپانیای برنجی کوردستان', balance: 1250.75 },
        { id: '2', name: 'فرۆشیاری شەکر', balance: 890.50 },
        { id: '3', name: 'کۆمپانیای چای ناوەندی', balance: 2340.25 }
      ]
      setSuppliers(demoSuppliers)
      return
    }

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, balance')

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const updatePurchaseItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    setPurchaseItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const submitStockEntry = async () => {
    console.log('🚀 Starting stock entry submission...')

    // Validation: Ensure required fields are filled
    const item = purchaseItems[0]
    if (!item?.item_name || !item?.quantity || !item?.selling_price) {
      const missing = []
      if (!item?.item_name) missing.push('ناو')
      if (!item?.quantity) missing.push('بڕ')
      if (!item?.selling_price) missing.push('نرخی فرۆشتن')
      alert(`تکایە هەموو زانیارییە پێویستەکان پڕبکەرەوە: ${missing.join(', ')}`)
      return
    }

    if (!supabase) {
      console.log('Running in demo mode - no Supabase connection')
      alert('دۆخی دیمۆ: کاڵاکە بە سەرکەوتوویی زیادکرا (دیمۆ)')
      setShowStockEntry(false)
      setSelectedSupplier('')
      setPurchaseItems([{ item_name: '', cost_price: 0, selling_price: 0, quantity: 0, unit: 'دانە' }])
      return
    }

    try {
      const quantity = Number(item.quantity)
      const totalPurchasePrice = Number(item.total_purchase_price || 0)
      const sellingPrice = Number(item.selling_price)

      // Insert into inventory table
      const { error: insertError } = await supabase
        .from('inventory')
        .insert({
          item_name: item.item_name,
          quantity: quantity,
          unit: item.unit,
          cost_price: totalPurchasePrice > 0 ? Math.round(totalPurchasePrice / quantity) : 0,
          selling_price: sellingPrice,
          category: item.category || null,
          image: item.image || ''
        })

      if (insertError) throw insertError

      alert('کاڵاکە بە سەرکەوتوویی زیادکرا')
      setShowStockEntry(false)
      setSelectedSupplier('')
      setPurchaseItems([{ item_name: '', cost_price: 0, selling_price: 0, quantity: 0, unit: 'دانە' }])
      fetchInventory()

    } catch (error) {
      console.error('Error adding item:', error)
      alert('هەڵە لە زیادکردنی کاڵا')
    }
  }

  const isLowStock = (item: InventoryItem) => {
    return item.quantity <= item.low_stock_threshold
  }

  const filteredInventory = inventory.filter((item) => {
    // Category filter
    if (selectedCategory && item.category !== selectedCategory) return false

    // Search term filter
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()

    // Search by name
    if (item.item_name.toLowerCase().includes(searchLower)) return true

    // Search by supplier name
    if (item.supplier_name?.toLowerCase().includes(searchLower)) return true

    // Search by category
    if (item.category?.toLowerCase().includes(searchLower)) return true

    return false
  })

  if (loading) {
    return <div className="text-center">چاوەڕوانبە...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
          بەڕێوەبردنی کاڵاکان
        </h1>

        {/* Add Item Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowStockEntry(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            <span>زیادکردنی کاڵا</span>
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="گەڕان بە ناو، بارکۆد، دابینکەر..."
                className="w-full px-4 py-3 pr-12 rounded-lg border backdrop-blur-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  fontFamily: 'var(--font-uni-salar)',
                  color: 'var(--theme-primary)'
                }}
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-lg border backdrop-blur-sm min-w-[200px]"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(0, 0, 0, 0.1)',
                fontFamily: 'var(--font-uni-salar)',
                color: 'var(--theme-primary)'
              }}
            >
              <option value="">هەموو پۆلەکان</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredInventory.map((item) => (
              <div
                key={item.id}
                className="relative p-6 rounded-2xl backdrop-blur-md border transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderColor: isLowStock(item) ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Item Image */}
                <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.item_name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-gray-400 text-4xl">📦</span>
                  )}
                </div>

                {/* Item Name */}
                <h3 className="text-lg font-bold mb-2 text-center" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-primary)' }}>
                  {item.item_name}
                </h3>

                {/* Stock Quantity */}
                <div className="text-center mb-6">
                  <div className="text-2xl font-bold" style={{ color: isLowStock(item) ? '#dc2626' : 'var(--theme-accent)', fontFamily: 'var(--font-uni-salar)' }}>
                    {item.quantity} {item.unit}
                  </div>
                  {isLowStock(item) && (
                    <div className="text-sm text-red-500 mt-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      کەمە!
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-2">
                  <button
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <FaEdit size={14} />
                    <span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>دەستکاری</span>
                  </button>
                  <button
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <FaTrash size={14} />
                    <span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>سڕینەوە</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
              هیچ کاڵایەک نەدۆزرایەوە
            </h3>
            <p className="text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              {searchTerm || selectedCategory ? 'گەڕانەکەت بگۆڕە یان فیلتەرەکان پاکبکە' : 'کاڵای نوێ زیادبکە'}
            </p>
          </div>
        )}

        {/* Add Item Modal */}
        {showStockEntry && (
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-2xl max-h-screen overflow-y-auto rounded-2xl shadow-2xl" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                  زیادکردنی کاڵای نوێ
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناو</label>
                    <input
                      type="text"
                      value={purchaseItems[0]?.item_name || ''}
                      onChange={(e) => updatePurchaseItem(0, 'item_name', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                      placeholder="ناوی کاڵا"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={toEnglishDigits(purchaseItems[0]?.quantity || '')}
                      onChange={(e) => {
                        const sanitized = sanitizeNumericInput(e.target.value)
                        updatePurchaseItem(0, 'quantity', safeStringToNumber(sanitized))
                      }}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        fontFamily: '"Inter", "Roboto", system-ui, sans-serif'
                      }}
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی فرۆشتن</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={toEnglishDigits(purchaseItems[0]?.selling_price || '')}
                      onChange={(e) => {
                        const sanitized = sanitizeNumericInput(e.target.value)
                        updatePurchaseItem(0, 'selling_price', safeStringToNumber(sanitized))
                      }}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        fontFamily: '"Inter", "Roboto", system-ui, sans-serif'
                      }}
                      placeholder="13000 IQD"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => setShowStockEntry(false)}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: '#6b7280', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    پاشگەزبوونەوە
                  </button>
                  <button
                    onClick={submitStockEntry}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    تۆمارکردنی کاڵا
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
