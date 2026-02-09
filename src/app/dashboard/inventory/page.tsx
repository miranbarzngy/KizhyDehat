'use client'

import AddItemModal from '@/components/inventory/AddItemModal'
import { useSyncPause } from '@/contexts/SyncPauseContext'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FaArchive, FaBox, FaCalculator, FaEdit, FaPlus, FaSearch, FaTags, FaTrash } from 'react-icons/fa'

interface Product {
  id: string
  name: string
  total_amount_bought: number
  unit: string
  cost_per_unit: number
  selling_price_per_unit: number
  category: string
  image: string
  barcode1: string
  barcode2: string
  barcode3: string
  barcode4: string
  added_date: string
  expire_date: string
  note: string
  supplier_id: string
  is_archived?: boolean
  total_sold?: number
  total_revenue?: number
  total_profit?: number
  total_discounts?: number
}

interface Category { id: string; name: string; created_at: string }
interface Unit { id: string; name: string; symbol?: string; created_at: string }
interface Supplier { id: string; name: string; balance: number }

export default function InventoryPage() {
  const { pauseSync } = useSyncPause()
  const [activeTab, setActiveTab] = useState<'inventory' | 'categories' | 'units' | 'archive'>('inventory')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [archivedItems, setArchivedItems] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  
  const [currentStep, setCurrentStep] = useState(1)
  const [showStockEntry, setShowStockEntry] = useState(false)
  const [editingItem, setEditingItem] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    supplier_id: '',
    price_of_bought: 0,
    is_not_fully_paid: false,
    remain_amount: 0,
    quantity: 0,
    unit: 'دان۰',
    name: '',
    image: '',
    expire_date: '',
    added_date: new Date().toISOString().split('T')[0],
    note: '',
    barcode1: '',
    barcode2: '',
    barcode3: '',
    barcode4: '',
    selling_price: 0,
    category: ''
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Product | null>(null)
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle')
  const [deleteMessage, setDeleteMessage] = useState('')
  const [soldProductIds, setSoldProductIds] = useState<Set<string>>(new Set())

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    await Promise.all([fetchProducts(), fetchCategories(), fetchUnits(), fetchSuppliers(), fetchSoldProductIds()])
  }

  const fetchProducts = async () => {
    if (!supabase) {
      // Demo data when no supabase connection
      setProducts([
        { id: '1', name: 'برنج', total_amount_bought: 25, unit: 'کیلۆ', cost_per_unit: 15.50, selling_price_per_unit: 18.00, category: 'خۆراك', image: '', barcode1: '', barcode2: '', barcode3: '', barcode4: '', added_date: '2026-01-01', expire_date: '', note: '', supplier_id: '1', is_archived: false }
      ])
      return
    }
    
    try {
      console.log('Fetching products from database...')
      
      // First check if table exists by getting table info
      const { data: tableCheck, error: tableError } = await supabase
        .from('products')
        .select('id')
        .limit(1)
      
      console.log('Table check result:', { data: tableCheck, error: tableError })
      
      if (tableError) {
        console.error('Fetch Error Detail:', {
          message: tableError.message,
          details: tableError.details,
          hint: tableError.hint,
          code: tableError.code
        })
        
        // Try simpler query without filters
        console.log('Trying simpler query...')
        const { data: simpleData, error: simpleError } = await supabase
          .from('products')
          .select('*')
          .limit(10)
        
        console.log('Simple query result:', { data: simpleData, error: simpleError })
        
        if (simpleError) {
          console.error('Simple query error:', simpleError)
          return
        }
        
        setProducts((simpleData || []).map((item: any) => ({ ...item, is_archived: item.is_archived || false })))
        return
      }
      
      // If table check passed, do the full query
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or('is_archived.is.null,is_archived.eq.false')
        .limit(100)
      
      console.log('Full query result:', { data, error })
      
      if (error) {
        console.error('Full query error:', error)
        return
      }
      
      // Filter to show items with positive quantity
      const validProducts = (data || []).filter((item: any) => 
        (item.total_amount_bought || 0) > 0
      ).map((item: any) => ({ ...item, is_archived: item.is_archived || false }))
      
      setProducts(validProducts)
      console.log('Products set to state:', validProducts.length)
    } catch (e) { 
      console.error('Exception fetching products:', e) 
    }
  }

  const fetchArchivedItems = async () => {
    if (!supabase) return
    try {
      const { data } = await supabase.from('products').select('*').or('is_archived.eq.true,total_amount_bought.lte.0').limit(50)
      setArchivedItems(data || [])
    } catch (e) { console.error(e) }
  }

  const fetchCategories = async () => {
    if (!supabase) return
    try { const { data } = await supabase.from('categories').select('*'); setCategories(data || []) } catch {}
  }

  const fetchUnits = async () => {
    if (!supabase) return
    try { const { data } = await supabase.from('units').select('*'); setUnits(data || []) } catch {}
  }

  const fetchSuppliers = async () => {
    if (!supabase) { setSuppliers([{ id: '1', name: 'کۆمپانیا', balance: 0 }]); return }
    try { const { data } = await supabase.from('suppliers').select('*'); setSuppliers(data || []) } catch {}
  }

  const fetchSoldProductIds = async () => {
    if (!supabase) return
    try {
      // Check if sale_items table has any items linked to products via item_name
      // Get all distinct item_names that have been sold
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('item_name')
      
      if (saleItems && saleItems.length > 0) {
        // Get product IDs that have been sold
        const soldNames = [...new Set(saleItems.map(si => si.item_name))]
        const { data: productsWithSales } = await supabase
          .from('products')
          .select('id')
          .in('name', soldNames)
        
        if (productsWithSales) {
          setSoldProductIds(new Set(productsWithSales.map(p => p.id)))
        }
      }
    } catch (e) {
      console.error('Error fetching sold product IDs:', e)
    }
  }

  const openAddItem = () => {
    setEditingItem(null)
    setFormData({
      supplier_id: '', price_of_bought: 0, is_not_fully_paid: false, remain_amount: 0,
      quantity: 0, unit: 'دانە', name: '', image: '', expire_date: '',
      added_date: new Date().toISOString().split('T')[0], note: '',
      barcode1: '', barcode2: '', barcode3: '', barcode4: '', selling_price: 0, category: ''
    })
    setCurrentStep(1)
    setShowStockEntry(true)
  }

  const openEditItem = (item: Product) => {
    setEditingItem(item)
    // Calculate total purchase price from cost_per_unit * total_amount_bought
    const totalPurchasePrice = (item.cost_per_unit || 0) * item.total_amount_bought
    setFormData({
      supplier_id: item.supplier_id || '', 
      price_of_bought: totalPurchasePrice, // Calculate from product data
      is_not_fully_paid: false, 
      remain_amount: 0,
      quantity: item.total_amount_bought, 
      unit: item.unit || 'دانە', 
      name: item.name, 
      image: item.image || '',
      expire_date: item.expire_date || '', 
      added_date: item.added_date || new Date().toISOString().split('T')[0], 
      note: item.note || '',
      barcode1: item.barcode1 || '', 
      barcode2: item.barcode2 || '', 
      barcode3: item.barcode3 || '', 
      barcode4: item.barcode4 || '', 
      selling_price: item.selling_price_per_unit, 
      category: item.category || ''
    })
    setCurrentStep(1) // Reset to step 1 for editing
    setShowStockEntry(true)
  }

  const confirmDelete = (item: Product) => { setItemToDelete(item); setShowDeleteConfirm(true) }

  const executeDelete = async () => {
    if (!itemToDelete) return
    pauseSync(20000)
    setShowDeleteConfirm(false)
    const { id: itemId, name: itemName } = itemToDelete
    setProducts(prev => prev.filter(i => i.id !== itemId))
    if (!supabase) { setDeleteStatus('success'); setDeleteMessage(`سڕایەوە`); setTimeout(() => { setDeleteStatus('idle'); setItemToDelete(null) }, 2000); return }
    setDeleteStatus('deleting')
    try {
      // First, fetch the purchase_expense ID by item_name
      const { data: expenseData, error: fetchError } = await supabase
        .from('purchase_expenses')
        .select('id')
        .eq('item_name', itemName.trim())
        .single()
      
      if (fetchError) {
        console.error('Expense Fetch Error:', fetchError.code, fetchError.message)
      } else if (expenseData) {
        // Delete by ID (100% reliable)
        const { error: expenseError } = await supabase
          .from('purchase_expenses')
          .delete()
          .eq('id', expenseData.id)
        
        console.log('Expense Delete Status:', expenseError ? `Error: ${expenseError.code}` : 'Success (204)')
        if (expenseError) {
          console.error('Expense Delete Error:', expenseError.code, expenseError.message)
        }
      } else {
        console.log('No expense record found for:', itemName.trim())
      }
      
      // Then, delete from products table (cascade should handle sale_items)
      const { error: productError } = await supabase.from('products').delete().eq('id', itemId)
      if (productError) throw productError
      
      setDeleteStatus('success'); setDeleteMessage(`کاڵای "${itemName}" سڕایەوە`); fetchProducts()
    } catch (e: any) { setDeleteStatus('error'); setDeleteMessage(`هەڵە: ${e?.message || 'نادیار'}`); fetchProducts() }
    setTimeout(() => { setDeleteStatus('idle'); setItemToDelete(null) }, 3000)
  }

  const archiveItem = async (item: Product) => {
    if (!supabase) return
    await supabase.from('products').update({ is_archived: true }).eq('id', item.id)
    fetchProducts()
    fetchArchivedItems()
  }

  const restoreItem = async (item: Product) => {
    if (!supabase) return
    await supabase.from('products').update({ is_archived: false }).eq('id', item.id)
    fetchArchivedItems()
    fetchProducts()
  }

  const filteredProducts = products.filter(item => {
    if (selectedCategory && item.category !== selectedCategory) return false
    if (!searchTerm) return true
    return item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const filteredArchived = archivedItems.filter(item => {
    if (!searchTerm) return true
    return item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6 pl-0 md:pl-6">
      <div className="w-full max-w-7xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
          بەڕێوەبردنی کاڵاکان
        </motion.h1>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-row overflow-x-auto whitespace-nowrap space-x-1 mb-8 bg-white/60 backdrop-blur-xl rounded-2xl p-1 shadow-lg">
          {[
            { id: 'inventory', label: 'کاڵاکان', icon: FaBox, color: 'blue' },
            { id: 'categories', label: 'پۆلەکان', icon: FaTags, color: 'green' },
            { id: 'units', label: 'یەکەکان', icon: FaCalculator, color: 'purple' },
            { id: 'archive', label: 'ئەرشیڤ', icon: FaArchive, color: 'orange' }
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); if (tab.id === 'archive') fetchArchivedItems() }}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === tab.id ? `bg-${tab.color}-500 text-white shadow-md` : 'text-gray-600 hover:bg-white/50'}`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}>
              <tab.icon className="inline ml-2" />{tab.label}
            </button>
          ))}
        </motion.div>

        {activeTab === 'inventory' && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="گەڕان..." className="w-full px-4 py-3 pr-12 rounded-lg border bg-white/80" style={{ fontFamily: 'var(--font-uni-salar)' }} />
              </div>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="px-4 py-3 rounded-lg border bg-white/80" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                <option value="">هەموو پۆلەکان</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <button onClick={openAddItem} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg flex items-center" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                <FaPlus className="ml-2" />زیادکردن
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full p-12 rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 shadow-lg text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <p style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '1.2rem', color: '#6b7280' }}>هیچ کاڵایەک نییە</p>
                  <button onClick={openAddItem} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    <FaPlus className="ml-2" />زیادکردنی کاڵا
                  </button>
                </div>
              ) : filteredProducts.map(item => (
                <div key={item.id} className="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all">
                  <div className="h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-4xl overflow-hidden">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" /> : '📦'}
                  </div>
                  <h3 className="text-lg font-bold text-center mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>{item.name}</h3>
                  <div className="text-center mb-4">
                    <span className="text-2xl font-bold" style={{ color: item.total_amount_bought <= 5 ? '#dc2626' : '#059669' }}>
                      {item.total_amount_bought} {item.unit}
                    </span>
                    {item.category && <div className="text-sm text-gray-500">{item.category}</div>}
                  </div>
                  <div className="flex justify-center space-x-2">
                    <button onClick={() => openEditItem(item)} className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg flex items-center">
                      <FaEdit className="ml-1" /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>دەستکاری</span>
                    </button>
                    <button onClick={() => archiveItem(item)} className="px-3 py-2 bg-orange-100 text-orange-600 rounded-lg flex items-center">
                      <FaArchive className="ml-1" /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>ئەرشیڤ</span>
                    </button>
                    {!soldProductIds.has(item.id) && (
                      <button onClick={() => confirmDelete(item)} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg flex items-center">
                        <FaTrash className="ml-1" /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>سڕینەوە</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          </>
        )}

        {activeTab === 'categories' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map(category => (
              <div key={category.id} className="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 shadow-lg text-center">
                <div className="text-4xl mb-2">🏷️</div>
                <h3 className="font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>{category.name}</h3>
                <p className="text-sm text-gray-500">{products.filter(i => i.category === category.name).length} کاڵا</p>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'units' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {units.map(unit => (
              <div key={unit.id} className="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 shadow-lg text-center">
                <div className="text-4xl mb-2">⚖️</div>
                <h3 className="font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>{unit.name}</h3>
                {unit.symbol && <p className="text-sm text-gray-500">{unit.symbol}</p>}
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'archive' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredArchived.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📦</div>
                <p style={{ fontFamily: 'var(--font-uni-salar)' }}>هیچ کاڵایەک لە ئەرشیڤدا نییە</p>
              </div>
            ) : filteredArchived.map(item => {
              // Calculate financial data
              const totalSold = item.total_sold || 0
              const totalRevenue = item.total_revenue || 0
              const totalDiscounts = item.total_discounts || 0
              // Net Revenue = Total Revenue - Total Discounts
              const netRevenue = totalRevenue - totalDiscounts
              // Total Purchase Price = cost_per_unit * original quantity (sold + remaining)
              const totalPurchasePrice = (item.cost_per_unit || 0) * (totalSold + (item.total_amount_bought || 0))
              // Real Profit = Net Revenue - Total Purchase Price
              const realProfit = netRevenue - totalPurchasePrice
              const purchaseDate = item.added_date || item.created_at || '-'
              
              return (
                <div key={item.id} className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all">
                  {/* Product Image */}
                  <div className="h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center text-4xl overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      '📦'
                    )}
                  </div>
                  
                  {/* Item Name */}
                  <h3 className="text-lg font-bold text-center mb-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{item.name}</h3>
                  
                  {/* Financial Summary */}
                  <div className="space-y-2 mb-4">
                    {/* Total Purchase Price */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                      <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی نرخی کڕین:</span>
                      <span className="font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {totalPurchasePrice.toLocaleString()} IQD
                      </span>
                    </div>
                    
                    {/* Total Sold */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                      <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی فرۆشراو:</span>
                      <span className="font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {totalSold} {item.unit}
                      </span>
                    </div>
                    
                    {/* Total Revenue */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                      <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی داهات:</span>
                      <span className="font-bold text-green-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {totalRevenue.toLocaleString()} IQD
                      </span>
                    </div>
                    
                    {/* Total Discounts */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                      <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی داشکاندن:</span>
                      <span className="font-bold text-red-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {totalDiscounts > 0 ? `-${totalDiscounts.toLocaleString()}` : '0'} IQD
                      </span>
                    </div>
                    
                    {/* Net Revenue (After Discounts) */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200/50 bg-gray-50/50 rounded-lg px-2">
                      <span className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>داهاتی خاوەنەکە:</span>
                      <span className="font-bold text-blue-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {netRevenue.toLocaleString()} IQD
                      </span>
                    </div>
                    
                    {/* Real Profit */}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>قازانجی ڕاست:</span>
                      <span className={`font-bold ${realProfit > 0 ? 'text-green-600' : realProfit < 0 ? 'text-red-600' : 'text-yellow-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                        {realProfit >= 0 ? realProfit.toLocaleString() : `(${Math.abs(realProfit).toLocaleString()})`} IQD
                      </span>
                    </div>
                  </div>
                  
                  {/* Purchase Date */}
                  <div className="text-center py-2 mb-3 bg-gray-100/50 rounded-lg">
                    <span className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەرواری کڕین: </span>
                    <span className="text-sm font-bold text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {new Date(purchaseDate).toLocaleDateString('ku')}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-center space-x-2">
                    <button onClick={() => restoreItem(item)} className="px-3 py-2 bg-green-100 text-green-600 rounded-lg flex items-center">
                      <FaPlus className="ml-1" /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>گەڕاندنەوە</span>
                    </button>
                    <button onClick={() => confirmDelete(item)} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg flex items-center">
                      <FaTrash className="ml-1" /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>سڕینەوە</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}

        {/* Add/Edit Modal */}
        <AddItemModal
          showStockEntry={showStockEntry}
          setShowStockEntry={setShowStockEntry}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          editingItem={editingItem}
          formData={formData}
          setFormData={setFormData}
          suppliers={suppliers}
          units={units}
          onSuccess={fetchProducts}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && itemToDelete && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-md rounded-2xl shadow-2xl bg-white/95 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaTrash className="text-3xl text-orange-500" />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>سڕینەوەی کاڵا</h3>
                <p className="text-gray-600 mb-4" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  دڵنیایت لە سڕینەوەی <span className="font-bold">{itemToDelete.name}</span>؟
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                  <p className="text-orange-800 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    ⚠️ ئاگاداربە: ئەم کاڵایە لە هەردوو خشتەی products و purchase_expenses سڕێتەوە بۆ ئەوەی کۆی داهات لە پەڕەی قازانجدا وردبێتەوە.
                  </p>
                </div>
                {deleteStatus === 'idle' && (
                  <div className="flex gap-4 justify-center">
                    <button onClick={() => setShowDeleteConfirm(false)} className="px-6 py-3 bg-gray-400 text-white rounded-xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      پاشگەزبوونەوە
                    </button>
                    <button onClick={executeDelete} className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      سڕینەوە
                    </button>
                  </div>
                )}
                {deleteStatus === 'deleting' && (
                  <div className="text-center py-4">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p style={{ fontFamily: 'var(--font-uni-salar)' }}>پرۆسەکە بەڕێوەیە...</p>
                  </div>
                )}
                {deleteStatus === 'success' && (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-green-600 font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>{deleteMessage}</p>
                  </div>
                )}
                {deleteStatus === 'error' && (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">❌</div>
                    <p className="text-red-600 font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>{deleteMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
