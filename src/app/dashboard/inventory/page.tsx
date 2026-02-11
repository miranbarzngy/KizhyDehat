'use client'

import AddItemModal from '@/components/inventory/AddItemModal'
import { useSyncPause } from '@/contexts/SyncPauseContext'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FaArchive, FaBox, FaCalculator, FaEdit, FaPlus, FaSearch, FaTags, FaTrash } from 'react-icons/fa'
import CategoryGrid from '@/components/inventory/ui/CategoryGrid'
import UnitGrid from '@/components/inventory/ui/UnitGrid'
import ProductGrid from '@/components/inventory/ui/ProductGrid'
import ArchiveGrid from '@/components/inventory/ui/ArchiveGrid'
import { Category, Unit, Product } from '@/components/inventory/types'

export default function InventoryPage() {
  const { pauseSync } = useSyncPause()
  const [activeTab, setActiveTab] = useState<'inventory' | 'categories' | 'units' | 'archive'>('inventory')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string; balance: number }[]>([])
  const [archivedItems, setArchivedItems] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [showStockEntry, setShowStockEntry] = useState(false)
  const [editingItem, setEditingItem] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    supplier_id: '', price_of_bought: 0, is_not_fully_paid: false, remain_amount: 0,
    quantity: 0, unit: 'دانە', name: '', image: '', expire_date: '',
    added_date: new Date().toISOString().split('T')[0], note: '',
    barcode1: '', barcode2: '', barcode3: '', barcode4: '', selling_price: 0, category: ''
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Product | null>(null)
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle')
  const [deleteMessage, setDeleteMessage] = useState('')
  const [soldProductIds, setSoldProductIds] = useState<Set<string>>(new Set())
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newUnitName, setNewUnitName] = useState('')
  const [newUnitSymbol, setNewUnitSymbol] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    await Promise.all([fetchProducts(), fetchCategories(), fetchUnits(), fetchSuppliers(), fetchSoldProductIds()])
  }

  const fetchProducts = async () => {
    if (!supabase) {
      setProducts([{ id: '1', name: 'برنج', total_amount_bought: 25, unit: 'کیلۆ', cost_per_unit: 15.50, selling_price_per_unit: 18.00, category: 'خۆراك', image: '', barcode1: '', barcode2: '', barcode3: '', barcode4: '', added_date: '2026-01-01', expire_date: '', note: '', supplier_id: '1', is_archived: false }])
      return
    }
    try {
      const { data, error } = await supabase.from('products').select('*').or('is_archived.is.null,is_archived.eq.false').limit(100)
      if (error) { console.error('Full query error:', error); return }
      const validProducts = (data || []).filter((item: any) => (item.total_amount_bought || 0) > 0).map((item: any) => ({ ...item, is_archived: item.is_archived || false }))
      setProducts(validProducts)
    } catch (e) { console.error('Exception fetching products:', e) }
  }

  const fetchArchivedItems = async () => {
    if (!supabase) return
    try { const { data } = await supabase.from('products').select('*').or('is_archived.eq.true,total_amount_bought.lte.0').limit(50); setArchivedItems(data || []) } catch (e) { console.error(e) }
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
      const { data: saleItems } = await supabase.from('sale_items').select('item_name')
      if (saleItems && saleItems.length > 0) {
        const soldNames = [...new Set(saleItems.map(si => si.item_name))]
        const { data: productsWithSales } = await supabase.from('products').select('id').in('name', soldNames)
        if (productsWithSales) { setSoldProductIds(new Set(productsWithSales.map(p => p.id))) }
      }
    } catch (e) { console.error('Error fetching sold product IDs:', e) }
  }

  const openAddItem = () => {
    setEditingItem(null)
    setFormData({ supplier_id: '', price_of_bought: 0, is_not_fully_paid: false, remain_amount: 0, quantity: 0, unit: 'دانە', name: '', image: '', expire_date: '', added_date: new Date().toISOString().split('T')[0], note: '', barcode1: '', barcode2: '', barcode3: '', barcode4: '', selling_price: 0, category: '' })
    setCurrentStep(1)
    setShowStockEntry(true)
  }

  const openEditItem = (item: Product) => {
    setEditingItem(item)
    const totalPurchasePrice = (item.cost_per_unit || 0) * item.total_amount_bought
    setFormData({
      supplier_id: item.supplier_id || '', price_of_bought: totalPurchasePrice, is_not_fully_paid: false, remain_amount: 0,
      quantity: item.total_amount_bought, unit: item.unit || 'دانە', name: item.name, image: item.image || '',
      expire_date: item.expire_date || '', added_date: item.added_date || new Date().toISOString().split('T')[0], note: item.note || '',
      barcode1: item.barcode1 || '', barcode2: item.barcode2 || '', barcode3: item.barcode3 || '', barcode4: item.barcode4 || '',
      selling_price: item.selling_price_per_unit, category: item.category || ''
    })
    setCurrentStep(1)
    setShowStockEntry(true)
  }

  const confirmDelete = (item: Product) => { setItemToDelete(item); setShowDeleteConfirm(true) }

  const executeDelete = async () => {
    if (!itemToDelete) return
    pauseSync('inventory-delete')
    setShowDeleteConfirm(false)
    const { id: itemId, name: itemName } = itemToDelete
    setProducts(prev => prev.filter(i => i.id !== itemId))
    if (!supabase) { setDeleteStatus('success'); setDeleteMessage(`سڕایەوە`); setTimeout(() => { setDeleteStatus('idle'); setItemToDelete(null) }, 2000); return }
    setDeleteStatus('deleting')
    try {
      const { data: expenseData, error: fetchError } = await supabase.from('purchase_expenses').select('id').eq('item_name', itemName.trim()).single()
      if (fetchError) { console.error('Expense Fetch Error:', fetchError.code, fetchError.message) }
      else if (expenseData) {
        const { error: expenseError } = await supabase.from('purchase_expenses').delete().eq('id', expenseData.id)
        console.log('Expense Delete Status:', expenseError ? `Error: ${expenseError.code}` : 'Success (204)')
      }
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

  const handleAddCategory = () => { setEditingCategory(null); setNewCategoryName(''); setShowCategoryModal(true) }
  const handleEditCategory = (category: Category) => { setEditingCategory(category); setNewCategoryName(category.name); setShowCategoryModal(true) }
  const handleDeleteCategory = async (category: Category) => { if (!supabase) return; const { error } = await supabase.from('categories').delete().eq('id', category.id); if (!error) fetchCategories() }
  const saveCategory = async () => {
    if (!supabase) return
    if (editingCategory) { const { error } = await supabase.from('categories').update({ name: newCategoryName.trim() }).eq('id', editingCategory.id); if (!error) fetchCategories() }
    else { const { error } = await supabase.from('categories').insert([{ name: newCategoryName.trim() }]); if (!error) fetchCategories() }
    setShowCategoryModal(false); setNewCategoryName(''); setEditingCategory(null)
  }

  const handleAddUnit = () => { setEditingUnit(null); setNewUnitName(''); setNewUnitSymbol(''); setShowUnitModal(true) }
  const handleEditUnit = (unit: Unit) => { setEditingUnit(unit); setNewUnitName(unit.name); setNewUnitSymbol(unit.symbol || ''); setShowUnitModal(true) }
  const handleDeleteUnit = async (unit: Unit) => { if (!supabase) return; const { error } = await supabase.from('units').delete().eq('id', unit.id); if (!error) fetchUnits() }
  const saveUnit = async () => {
    if (!supabase) return
    if (editingUnit) { const { error } = await supabase.from('units').update({ name: newUnitName.trim(), symbol: newUnitSymbol.trim() }).eq('id', editingUnit.id); if (!error) fetchUnits() }
    else { const { error } = await supabase.from('units').insert([{ name: newUnitName.trim(), symbol: newUnitSymbol.trim() }]); if (!error) fetchUnits() }
    setShowUnitModal(false); setNewUnitName(''); setNewUnitSymbol(''); setEditingUnit(null)
  }

  const filteredProducts = products.filter(item => {
    if (selectedCategory && item.category !== selectedCategory) return false
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
            </motion.div>
            <ProductGrid products={filteredProducts} soldProductIds={soldProductIds} openEditItem={openEditItem} confirmDelete={confirmDelete} archiveItem={archiveItem} onAddProduct={openAddItem} />
          </>
        )}

        {activeTab === 'categories' && (
          <CategoryGrid categories={categories} products={products} onAddCategory={handleAddCategory} onEditCategory={handleEditCategory} onDeleteCategory={handleDeleteCategory} />
        )}

        {activeTab === 'units' && (
          <UnitGrid units={units} onAddUnit={handleAddUnit} onEditUnit={handleEditUnit} onDeleteUnit={handleDeleteUnit} />
        )}

        {activeTab === 'archive' && (
          <ArchiveGrid archivedItems={archivedItems} searchTerm={searchTerm} restoreItem={restoreItem} confirmDelete={confirmDelete} />
        )}

        <AddItemModal showStockEntry={showStockEntry} setShowStockEntry={setShowStockEntry} currentStep={currentStep} setCurrentStep={setCurrentStep} editingItem={editingItem} formData={formData} setFormData={setFormData} suppliers={suppliers} units={units} onSuccess={fetchProducts} />

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
                {deleteStatus === 'idle' && (
                  <div className="flex gap-4 justify-center">
                    <button onClick={() => setShowDeleteConfirm(false)} className="px-6 py-3 bg-gray-400 text-white rounded-xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>پاشگەزبوونەوە</button>
                    <button onClick={executeDelete} className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>سڕینەوە</button>
                  </div>
                )}
                {deleteStatus === 'deleting' && <div className="text-center py-4"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div><p style={{ fontFamily: 'var(--font-uni-salar)' }}>پرۆسەکە بەڕێوەیە...</p></div>}
                {deleteStatus === 'success' && <div className="text-center py-4"><div className="text-4xl mb-2">✅</div><p className="text-green-600 font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>{deleteMessage}</p></div>}
                {deleteStatus === 'error' && <div className="text-center py-4"><div className="text-4xl mb-2">❌</div><p className="text-red-600 font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>{deleteMessage}</p></div>}
              </div>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-2xl shadow-2xl bg-white/95 p-8">
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                {editingCategory ? 'دەستکاری پۆل' : 'زیادکردنی پۆل'}
              </h3>
              <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="ناوی پۆل" className="w-full px-4 py-3 rounded-lg border bg-gray-50 mb-4" style={{ fontFamily: 'var(--font-uni-salar)' }} />
              <div className="flex gap-4 justify-center">
                <button onClick={() => setShowCategoryModal(false)} className="px-6 py-3 bg-gray-400 text-white rounded-xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>پاشگەزبوونەوە</button>
                <button onClick={saveCategory} className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>{editingCategory ? 'نوێکردنەوە' : 'زیادکردن'}</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Unit Modal */}
        {showUnitModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-2xl shadow-2xl bg-white/95 p-8">
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                {editingUnit ? 'دەستکاری یەکە' : 'زیادکردنی یەکە'}
              </h3>
              <input type="text" value={newUnitName} onChange={e => setNewUnitName(e.target.value)} placeholder="ناوی یەکە" className="w-full px-4 py-3 rounded-lg border bg-gray-50 mb-4" style={{ fontFamily: 'var(--font-uni-salar)' }} />
              <input type="text" value={newUnitSymbol} onChange={e => setNewUnitSymbol(e.target.value)} placeholder="هێڵکاری (بەختار)" className="w-full px-4 py-3 rounded-lg border bg-gray-50 mb-4" style={{ fontFamily: 'var(--font-uni-salar)' }} />
              <div className="flex gap-4 justify-center">
                <button onClick={() => setShowUnitModal(false)} className="px-6 py-3 bg-gray-400 text-white rounded-xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>پاشگەزبوونەوە</button>
                <button onClick={saveUnit} className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>{editingUnit ? 'نوێکردنەوە' : 'زیادکردن'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
