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
          image: ''
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
          image: ''
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
          image: ''
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

      if (error) throw error
      setInventory(data || [])
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

  const submitStockEntry = async () => {
    if (!selectedSupplier || purchaseItems.some(item => !item.item_name || item.quantity <= 0)) {
      alert('تکایە هەموو زانیارییەکان پڕبکەرەوە')
      return
    }

    // Demo mode: show message instead of actually adding stock
    if (!supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت کۆگا زیاد بکرێت. تەنها بۆ پیشاندانە.')
      setShowStockEntry(false)
      setSelectedSupplier('')
      setPurchaseItems([{ item_name: '', cost_price: 0, selling_price: 0, quantity: 0, unit: 'pieces' }])
      return
    }

    try {
      const totalCost = purchaseItems.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0)

      // Insert purchases
      const purchases = purchaseItems.map(item => ({
        supplier_id: selectedSupplier,
        item_name: item.item_name,
        cost_price: item.cost_price,
        quantity: item.quantity,
        unit: item.unit,
        date: new Date().toISOString().split('T')[0]
      }))

      const { error: purchaseError } = await supabase
        .from('supplier_purchases')
        .insert(purchases)

      if (purchaseError) throw purchaseError

      // Update or insert inventory
      for (const item of purchaseItems) {
        // Check if item exists
        const { data: existingItem, error: checkError } = await supabase
          .from('inventory')
          .select('*')
          .eq('item_name', item.item_name)
          .eq('unit', item.unit)
          .single()

        if (checkError && checkError.code !== 'PGRST116') throw checkError

        if (existingItem) {
          // Update existing
          const { error: updateError } = await supabase
            .from('inventory')
            .update({
              quantity: existingItem.quantity + item.quantity,
              cost_price: item.cost_price,
              selling_price: item.selling_price
            })
            .eq('id', existingItem.id)

          if (updateError) throw updateError
        } else {
          // Insert new
          const { error: insertError } = await supabase
            .from('inventory')
            .insert({
              item_name: item.item_name,
              quantity: item.quantity,
              unit: item.unit,
              cost_price: item.cost_price,
              selling_price: item.selling_price
            })

          if (insertError) throw insertError
        }
      }

      // Update supplier balance
      const supplier = suppliers.find(s => s.id === selectedSupplier)
      if (supplier) {
        const { error: balanceError } = await supabase
          .from('suppliers')
          .update({
            balance: supplier.balance + totalCost
          })
          .eq('id', selectedSupplier)

        if (balanceError) throw balanceError
      }

      setShowStockEntry(false)
      setSelectedSupplier('')
      setPurchaseItems([{ item_name: '', cost_price: 0, selling_price: 0, quantity: 0, unit: 'pieces' }])
      fetchInventory()
      fetchSuppliers()
    } catch (error) {
      console.error('Error submitting stock entry:', error)
      alert('Error submitting stock entry')
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">بەڕێوەبردنی کۆگا</h1>

      <div className="mb-6">
        <button
          onClick={() => setShowStockEntry(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          زیادکردنی کۆگا
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">لیستی کۆگا</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-right">ناوی کاڵا</th>
                <th className="px-4 py-2 text-right">کۆگا</th>
                <th className="px-4 py-2 text-right">یەکە</th>
                <th className="px-4 py-2 text-right">نرخی کڕین</th>
                <th className="px-4 py-2 text-right">نرخی فرۆشتن</th>
                <th className="px-4 py-2 text-right">پۆل</th>
                <th className="px-4 py-2 text-right">ئۆنلاین</th>
                <th className="px-4 py-2 text-right">ئاگاداری</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2">{item.item_name}</td>
                  <td className="px-4 py-2">{item.quantity}</td>
                  <td className="px-4 py-2">{item.unit}</td>
                  <td className="px-4 py-2">{item.cost_price?.toFixed(2)} د.ع</td>
                  <td className="px-4 py-2">{item.selling_price?.toFixed(2)} د.ع</td>
                  <td className="px-4 py-2">{item.category || '-'}</td>
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={item.is_online_visible || false}
                      onChange={(e) => updateOnlineVisibility(item.id, e.target.checked)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-2">
                    {isLowStock(item) && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                        کەم کۆگا
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Entry Modal */}
      {showStockEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">زیادکردنی کۆگا</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">دابینکەر</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">هەڵبژاردنی دابینکەر</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} (قەرز: {supplier.balance.toFixed(2)} د.ع)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {purchaseItems.map((item, index) => (
                <div key={index} className="border p-4 rounded">
                  <div className="grid grid-cols-6 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">ناوی کاڵا</label>
                      <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => updatePurchaseItem(index, 'item_name', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">نرخی کڕین</label>
                      <input
                        type="text"
                        value={item.cost_price}
                        onChange={(e) => {
                          const westernNum = convertKurdishToWestern(e.target.value)
                          updatePurchaseItem(index, 'cost_price', parseFloat(westernNum) || 0)
                        }}
                        className="w-full border rounded px-3 py-2"
                        placeholder="٠.٠٠"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">نرخی فرۆشتن</label>
                      <input
                        type="text"
                        value={item.selling_price}
                        onChange={(e) => {
                          const westernNum = convertKurdishToWestern(e.target.value)
                          updatePurchaseItem(index, 'selling_price', parseFloat(westernNum) || 0)
                        }}
                        className="w-full border rounded px-3 py-2"
                        placeholder="٠.٠٠"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">کۆگا</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updatePurchaseItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">یەکە</label>
                      <select
                        value={item.unit}
                        onChange={(e) => updatePurchaseItem(index, 'unit', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="pieces">دانە</option>
                        <option value="kg">کیلۆ</option>
                        <option value="liter">لیتر</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => removePurchaseItem(index)}
                        className="w-full bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                        disabled={purchaseItems.length === 1}
                      >
                        سڕینەوە
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between">
              <button
                onClick={addPurchaseItem}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                زیادکردنی کاڵا
              </button>
              <div className="space-x-2">
                <button
                  onClick={() => setShowStockEntry(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  onClick={submitStockEntry}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  تۆمارکردن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
