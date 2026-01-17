'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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

interface PurchaseItem {
  item_name: string
  cost_price: number
  selling_price: number
  quantity: number
  unit: string
  total_purchase_price?: number
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
  const [loading, setLoading] = useState(true)
  const [showStockEntry, setShowStockEntry] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([
    { item_name: '', cost_price: 0, selling_price: 0, quantity: 0, unit: 'pieces' }
  ])
  const [searchTerm, setSearchTerm] = useState('')

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
    fetchSuppliers()
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

  const addPurchaseItem = () => {
    setPurchaseItems(prev => [...prev, { item_name: '', cost_price: 0, selling_price: 0, quantity: 0, unit: 'pieces' }])
  }

  const updatePurchaseItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    setPurchaseItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const removePurchaseItem = (index: number) => {
    setPurchaseItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleImageUpload = async (file: File) => {
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `inventory/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      updatePurchaseItem(0, 'image', data.publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error uploading image')
    }
  }

  const submitStockEntry = async () => {
    // Validation: Ensure required fields are filled
    const item = purchaseItems[0]
    if (!item?.item_name || !item?.quantity || !item?.total_purchase_price || !item?.selling_price || !selectedSupplier) {
      alert('تکایە هەموو زانیارییە پێویستەکان پڕبکەرەوە (ناو، بڕ، نرخی کڕین، نرخی فرۆشتن، دابینکەر)')
      return
    }

    if (!supabase) {
      console.log('Running in demo mode - no Supabase connection')
      alert('دۆخی دیمۆ: کاڵاکە بە سەرکەوتوویی زیادکرا (دیمۆ)')
      setShowStockEntry(false)
      setSelectedSupplier('')
      setPurchaseItems([{ item_name: '', cost_price: 0, selling_price: 0, quantity: 0, unit: 'pieces' }])
      return
    }

    console.log('Starting stock entry submission...')
    console.log('Supabase client:', !!supabase)
    console.log('Item data:', purchaseItems[0])
    console.log('Selected supplier:', selectedSupplier)

    try {
      // Calculate unit cost: Total Purchase Price / Total Amount Bought
      const unitCost = Math.round(item.total_purchase_price / item.quantity)

      // Add purchase cost immediately to expenses
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert({
          description: `کڕینی کۆگا - ${item.item_name}`,
          amount: item.total_purchase_price,
          category: 'inventory_purchase',
          date: new Date().toISOString().split('T')[0]
        })

      if (expenseError) {
        console.error('Expense error:', expenseError)
        throw expenseError
      }

      // Update or insert inventory (main inventory tracking)
      const { data: existingItem, error: checkError } = await supabase
        .from('inventory')
        .select('*')
        .eq('item_name', item.item_name)
        .eq('unit', item.unit)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Check error:', checkError)
        throw checkError
      }

      if (existingItem) {
        // Update existing
        const { error: updateError } = await supabase
          .from('inventory')
          .update({
            quantity: existingItem.quantity + item.quantity,
            cost_price: unitCost,
            selling_price: item.selling_price,
            image: item.image || existingItem.image
          })
          .eq('id', existingItem.id)

        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('inventory')
          .insert({
            item_name: item.item_name,
            quantity: item.quantity,
            unit: item.unit,
            cost_price: unitCost,
            selling_price: item.selling_price,
            image: item.image || ''
          })

        if (insertError) {
          console.error('Insert error:', insertError)
          throw insertError
        }
      }

      // Try to save to products table if it exists (for advanced product management)
      try {
        const { error: productError } = await supabase
          .from('products')
          .insert({
            name: item.item_name,
            image: item.image || '',
            total_amount_bought: item.quantity,
            unit: item.unit,
            total_purchase_price: item.total_purchase_price,
            selling_price_per_unit: item.selling_price,
            cost_per_unit: unitCost,
            barcode1: item.barcode1 || '',
            barcode2: item.barcode2 || '',
            barcode3: item.barcode3 || '',
            barcode4: item.barcode4 || '',
            added_date: new Date().toISOString().split('T')[0],
            expire_date: item.expire_date || null,
            supplier_id: selectedSupplier
          })

        // Don't throw error if products table doesn't exist - it's optional
        if (productError && !productError.message?.includes('relation "products" does not exist')) {
          console.warn('Products table insertion warning:', productError)
        }
      } catch (productTableError) {
        // Products table might not exist - that's okay, continue with inventory
        console.log('Products table not available, continuing with inventory only')
      }

      // Update supplier balance
      const supplier = suppliers.find(s => s.id === selectedSupplier)
      if (supplier) {
        const { error: balanceError } = await supabase
          .from('suppliers')
          .update({
            balance: supplier.balance + item.total_purchase_price
          })
          .eq('id', selectedSupplier)

        if (balanceError) {
          console.error('Balance error:', balanceError)
          throw balanceError
        }
      }

      // Success message
      alert('کاڵاکە بە سەرکەوتوویی زیادکرا')

      setShowStockEntry(false)
      setSelectedSupplier('')
      setPurchaseItems([{ item_name: '', cost_price: 0, selling_price: 0, quantity: 0, unit: 'pieces' }])
      fetchInventory()
      fetchSuppliers()
    } catch (error) {
      console.error('Error submitting stock entry:', error)
      alert('هەڵە لە زیادکردنی کاڵا: ' + (error as Error)?.message || 'هەڵەی نەناسراو')
    }
  }

  const updateOnlineVisibility = async (itemId: string, isVisible: boolean) => {
    // Demo mode: show message instead of actually updating
    if (!supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت ڕووناکی ئۆنلاین بگۆڕدرێت. تەنها بۆ پیشاندانە.')
      return
    }

    try {
      const { error } = await supabase
        .from('inventory')
        .update({ is_online_visible: isVisible })
        .eq('id', itemId)

      if (error) throw error
      fetchInventory()
    } catch (error) {
      console.error('Error updating online visibility:', error)
    }
  }

  const isLowStock = (item: InventoryItem) => {
    return item.quantity <= item.low_stock_threshold
  }

  if (loading) {
    return <div className="text-center">بارکردن...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--theme-primary)' }}>بەڕێوەبردنی کاڵاکان</h1>

      <div className="mb-6">
        <button
          onClick={() => setShowStockEntry(true)}
          className="px-4 py-2 rounded-md text-white transition-colors duration-200"
          style={{ backgroundColor: 'var(--theme-accent)' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          زیادکردنی کاڵا
        </button>
      </div>

      <div className="p-6 rounded-lg shadow-md" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--theme-primary)' }}>لیستی کاڵا</h2>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
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
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr style={{ background: 'var(--theme-muted)' }}>
                <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>ناو</th>
                <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>بڕی کڕدراو</th>
                <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>یەکە</th>
                <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>کۆی تێچوو</th>
                <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>نرخی فرۆشتن</th>
                <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>نرخی کڕین</th>
                <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>قازانج</th>
                <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>بەرواری بەسەرچوون</th>
                <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>دابینکەر</th>
                <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>بارکۆد</th>
                <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>تێبینی</th>
                <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>کۆگا</th>
              </tr>
            </thead>
            <tbody>
              {inventory
                .filter((item) => {
                  if (!searchTerm) return true

                  const searchLower = searchTerm.toLowerCase()

                  // Search by name (ناو)
                  if (item.item_name.toLowerCase().includes(searchLower)) return true

                  // Search by supplier name (دابینکەر) - would come from products table
                  // For now, search in suppliers list
                  const supplierMatch = suppliers.some(supplier =>
                    supplier.name.toLowerCase().includes(searchLower)
                  )
                  if (supplierMatch) return true

                  // Search by barcode (بارکۆد) - would come from products table
                  // For now, return false as barcodes aren't stored in inventory table
                  // This can be extended when products table is implemented

                  return false
                })
                .map((item) => (
                <tr key={item.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
                  <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>{item.item_name}</td>
                  <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                    {item.quantity}
                  </td>
                  <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>{item.unit}</td>
                  <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                    {Math.round((item.cost_price || 0) * item.quantity)} د.ع
                  </td>
                  <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                    {Math.round(item.selling_price || 0)} د.ع
                  </td>
                  <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                    {Math.round(item.cost_price || 0)} د.ع
                  </td>
                  <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                    {Math.round((item.selling_price || 0) - (item.cost_price || 0))} د.ع
                  </td>
                  <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                    {item.expire_date || '-'}
                  </td>
                  <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                    {item.supplier_name || '-'}
                  </td>
                  <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                    {/* Barcodes would come from products table */}
                    -
                  </td>
                  <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                    {item.note || '-'}
                  </td>
                  <td className="px-3 py-3">
                    <span style={{ fontFamily: 'var(--font-uni-salar)', fontWeight: 'bold', fontSize: '0.9em' }}>{item.quantity} {item.unit}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Stock Entry Modal */}
      {showStockEntry && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-7xl max-h-screen overflow-y-auto rounded-2xl shadow-2xl" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>زیادکردنی کاڵای نوێ</h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-6 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <h4 className="text-lg font-semibold mb-4" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>زانیارییە سەرەکییەکان</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>وێنە</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleImageUpload(file)
                            }
                          }}
                          className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                          style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)' }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕی گشتی کڕدراو</label>
                        <input
                          type="text"
                          value={purchaseItems[0]?.quantity || ''}
                          onChange={(e) => {
                            const westernNum = convertKurdishToWestern(e.target.value)
                            updatePurchaseItem(0, 'quantity', parseFloat(westernNum) || 0)
                          }}
                          className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                          style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                          placeholder="1000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>یەکە</label>
                        <select
                          value={purchaseItems[0]?.unit || 'pieces'}
                          onChange={(e) => updatePurchaseItem(0, 'unit', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                          style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                        >
                          <option value="دانە">دانە</option>
                          <option value="کیلۆگرام">کیلۆگرام</option>
                          <option value="گرام">گرام</option>
                          <option value="لیتر">لیتر</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی تێچووی کڕین</label>
                        <input
                          type="text"
                          value={purchaseItems[0]?.total_purchase_price || ''}
                          onChange={(e) => {
                            const westernNum = convertKurdishToWestern(e.target.value)
                            updatePurchaseItem(0, 'total_purchase_price', parseFloat(westernNum) || 0)
                          }}
                          className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                          style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                          placeholder="10000000 د.ع"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی فرۆشتنی هەر یەکەیەک</label>
                        <input
                          type="text"
                          value={purchaseItems[0]?.selling_price || ''}
                          onChange={(e) => {
                            const westernNum = convertKurdishToWestern(e.target.value)
                            updatePurchaseItem(0, 'selling_price', parseFloat(westernNum) || 0)
                          }}
                          className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                          style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                          placeholder="13000 د.ع"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>تێبینی</label>
                      <textarea
                        value={purchaseItems[0]?.note || ''}
                        onChange={(e) => updatePurchaseItem(0, 'note', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm resize-none"
                        style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                        placeholder="تێبینییەکانی کاڵا..."
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <h4 className="text-lg font-semibold mb-4" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>بارکۆدەکان</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بارکۆدی 1</label>
                        <input
                          type="text"
                          value={purchaseItems[0]?.barcode1 || ''}
                          onChange={(e) => updatePurchaseItem(0, 'barcode1', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                          style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بارکۆدی 2</label>
                        <input
                          type="text"
                          value={purchaseItems[0]?.barcode2 || ''}
                          onChange={(e) => updatePurchaseItem(0, 'barcode2', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                          style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بارکۆدی 3</label>
                        <input
                          type="text"
                          value={purchaseItems[0]?.barcode3 || ''}
                          onChange={(e) => updatePurchaseItem(0, 'barcode3', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                          style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بارکۆدی 4</label>
                        <input
                          type="text"
                          value={purchaseItems[0]?.barcode4 || ''}
                          onChange={(e) => updatePurchaseItem(0, 'barcode4', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                          style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                    <h4 className="text-lg font-semibold mb-4" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>بەروارەکان</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەرواری زیادکردن</label>
                        <input
                          type="text"
                          value={new Date().toLocaleDateString('ku')}
                          readOnly
                          className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm bg-gray-100"
                          style={{ borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەرواری بەسەرچوون</label>
                        <input
                          type="date"
                          value={purchaseItems[0]?.expire_date || ''}
                          onChange={(e) => updatePurchaseItem(0, 'expire_date', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                          style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Summary */}
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <h4 className="text-lg font-semibold mb-4 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>کورتەی زیندوو</h4>

                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm opacity-75 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>تێچووی هەر یەکەیەک</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--theme-accent)', fontFamily: 'var(--font-uni-salar)' }}>
                          {purchaseItems[0]?.total_purchase_price && purchaseItems[0]?.quantity ?
                            Math.round(purchaseItems[0].total_purchase_price / purchaseItems[0].quantity) : 0} د.ع
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm opacity-75 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>قازانجی گشتی چاوەڕوانکراو</p>
                        <p className="text-2xl font-bold text-green-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          {purchaseItems[0]?.selling_price && purchaseItems[0]?.quantity && purchaseItems[0]?.total_purchase_price ?
                            Math.round((purchaseItems[0].selling_price - (purchaseItems[0].total_purchase_price / purchaseItems[0].quantity)) * purchaseItems[0].quantity) : 0} د.ع
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm opacity-75 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی تێچوو</p>
                        <p className="text-xl font-semibold text-red-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          {Math.round(purchaseItems[0]?.total_purchase_price || 0)} د.ع
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <h4 className="text-lg font-semibold mb-4" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>دابینکەر</h4>
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <option value="">هەڵبژاردنی دابینکەر</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name} (قەرز: {Math.round(supplier.balance)} د.ع)
                        </option>
                      ))}
                    </select>
                  </div>
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
  )
}
