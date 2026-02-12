import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Product, Category, Unit } from './types'

interface InventoryFormData {
  supplier_id: string
  price_of_bought: number
  is_not_fully_paid: boolean
  remain_amount: number
  quantity: number
  unit: string
  name: string
  image: string
  expire_date: string
  added_date: string
  note: string
  barcode1: string
  barcode2: string
  barcode3: string
  barcode4: string
  selling_price: number
  category: string
}

interface UseInventoryDataReturn {
  activeTab: 'inventory' | 'categories' | 'units' | 'archive'
  products: Product[]
  categories: Category[]
  units: Unit[]
  suppliers: { id: string; name: string; balance: number }[]
  archivedItems: Product[]
  searchTerm: string
  selectedCategory: string
  currentStep: number
  showStockEntry: boolean
  editingItem: Product | null
  formData: InventoryFormData
  showDeleteConfirm: boolean
  itemToDelete: Product | null
  deleteStatus: 'idle' | 'deleting' | 'success' | 'error'
  deleteMessage: string
  soldProductIds: Set<string>
  showCategoryModal: boolean
  showUnitModal: boolean
  newCategoryName: string
  newUnitName: string
  newUnitSymbol: string
  editingCategory: Category | null
  editingUnit: Unit | null
  setActiveTab: (tab: 'inventory' | 'categories' | 'units' | 'archive') => void
  setSearchTerm: (term: string) => void
  setSelectedCategory: (category: string) => void
  setCurrentStep: (step: number) => void
  setShowStockEntry: (show: boolean) => void
  setFormData: (data: InventoryFormData) => void
  setShowDeleteConfirm: (show: boolean) => void
  setItemToDelete: (item: Product | null) => void
  setShowCategoryModal: (show: boolean) => void
  setShowUnitModal: (show: boolean) => void
  setNewCategoryName: (name: string) => void
  setNewUnitName: (name: string) => void
  setNewUnitSymbol: (symbol: string) => void
  setEditingCategory: (category: Category | null) => void
  setEditingUnit: (unit: Unit | null) => void
  fetchAll: () => Promise<void>
  fetchProducts: () => Promise<void>
  fetchArchivedItems: () => Promise<void>
  fetchCategories: () => Promise<void>
  fetchUnits: () => Promise<void>
  fetchSuppliers: () => Promise<void>
  openAddItem: () => void
  openEditItem: (item: Product) => void
  confirmDelete: (item: Product) => void
  executeDelete: () => Promise<void>
  archiveItem: (item: Product) => Promise<void>
  restoreItem: (item: Product) => Promise<void>
  handleAddCategory: () => void
  handleEditCategory: (category: Category) => void
  handleDeleteCategory: (category: Category) => Promise<void>
  saveCategory: () => Promise<void>
  handleAddUnit: () => void
  handleEditUnit: (unit: Unit) => void
  handleDeleteUnit: (unit: Unit) => Promise<void>
  saveUnit: () => Promise<void>
  filteredProducts: Product[]
}

const DEFAULT_FORM_DATA: InventoryFormData = {
  supplier_id: '',
  price_of_bought: 0,
  is_not_fully_paid: false,
  remain_amount: 0,
  quantity: 0,
  unit: 'دانە',
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
}

export function useInventoryData(): UseInventoryDataReturn {
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
  const [formData, setFormData] = useState<InventoryFormData>(DEFAULT_FORM_DATA)
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

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchProducts(), fetchCategories(), fetchUnits(), fetchSuppliers(), fetchSoldProductIds()])
  }, [])

  const fetchProducts = useCallback(async () => {
    if (!supabase) {
      setProducts([{ id: '1', name: 'برنج', total_amount_bought: 25, unit: 'کیلۆ', cost_per_unit: 15.50, selling_price_per_unit: 18.00, category: 'خۆراك', image: '', barcode1: '', barcode2: '', barcode3: '', barcode4: '', added_date: '2026-01-01', expire_date: '', note: '', supplier_id: '1', is_archived: false }])
      return
    }
    try {
      // Optimized: Select only needed columns to reduce payload size
      const { data, error } = await supabase
        .from('products')
        .select('id, name, total_amount_bought, unit, cost_per_unit, selling_price_per_unit, category, image, barcode1, barcode2, barcode3, barcode4, added_date, expire_date, note, supplier_id, is_archived')
        .or('is_archived.is.null,is_archived.eq.false')
        .limit(100)
      if (error) { console.error('Error:', error); return }
      const validProducts = (data || []).filter((item: any) => (item.total_amount_bought || 0) > 0).map((item: any) => ({ ...item, is_archived: item.is_archived || false }))
      setProducts(validProducts)
    } catch (e) { console.error('Exception:', e) }
  }, [])

  const fetchArchivedItems = useCallback(async () => {
    if (!supabase) return
    try { 
      // Optimized: Select only needed columns
      const { data } = await supabase
        .from('products')
        .select('id, name, total_amount_bought, unit, cost_per_unit, selling_price_per_unit, category, image, barcode1, barcode2, barcode3, barcode4, added_date, expire_date, note, supplier_id, is_archived')
        .or('is_archived.eq.true,total_amount_bought.lte.0')
        .limit(50); 
      setArchivedItems(data || []) 
    } catch (e) { console.error(e) }
  }, [])

  const fetchCategories = useCallback(async () => {
    if (!supabase) return
    try { const { data } = await supabase.from('categories').select('*'); setCategories(data || []) } catch {}
  }, [])

  const fetchUnits = useCallback(async () => {
    if (!supabase) return
    try { const { data } = await supabase.from('units').select('*'); setUnits(data || []) } catch {}
  }, [])

  const fetchSuppliers = useCallback(async () => {
    if (!supabase) { setSuppliers([{ id: '1', name: 'کۆمپانیا', balance: 0 }]); return }
    try { const { data } = await supabase.from('suppliers').select('*'); setSuppliers(data || []) } catch {}
  }, [])

  const fetchSoldProductIds = useCallback(async () => {
    if (!supabase) return
    try {
      const { data: saleItems } = await supabase.from('sale_items').select('item_name')
      if (saleItems && saleItems.length > 0) {
        const soldNames = [...new Set(saleItems.map(si => si.item_name))]
        const { data: productsWithSales } = await supabase.from('products').select('id').in('name', soldNames)
        if (productsWithSales) { setSoldProductIds(new Set(productsWithSales.map(p => p.id))) }
      }
    } catch (e) { console.error('Error:', e) }
  }, [])

  const openAddItem = useCallback(() => {
    setEditingItem(null)
    setFormData(DEFAULT_FORM_DATA)
    setCurrentStep(1)
    setShowStockEntry(true)
  }, [])

  const openEditItem = useCallback((item: Product) => {
    setEditingItem(item)
    const totalPurchasePrice = (item.cost_per_unit || 0) * item.total_amount_bought
    setFormData({
      supplier_id: item.supplier_id || '',
      price_of_bought: totalPurchasePrice,
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
    setCurrentStep(1)
    setShowStockEntry(true)
  }, [])

  const confirmDelete = useCallback((item: Product) => {
    setItemToDelete(item)
    setShowDeleteConfirm(true)
  }, [])

  const executeDelete = useCallback(async () => {
    if (!itemToDelete) return
    const { id: itemId, name: itemName } = itemToDelete
    setProducts(prev => prev.filter(i => i.id !== itemId))
    if (!supabase) {
      setDeleteStatus('success')
      setDeleteMessage(`سڕایەوە`)
      setTimeout(() => { setDeleteStatus('idle'); setItemToDelete(null) }, 2000)
      return
    }
    setDeleteStatus('deleting')
    try {
      const { data: expenseData } = await supabase.from('purchase_expenses').select('id').eq('item_name', itemName.trim()).single()
      if (expenseData) { await supabase.from('purchase_expenses').delete().eq('id', expenseData.id) }
      await supabase.from('products').delete().eq('id', itemId)
      setDeleteStatus('success')
      setDeleteMessage(`سڕایەوە`)
      fetchProducts()
    } catch (e: any) {
      setDeleteStatus('error')
      setDeleteMessage(`هەڵە: ${e?.message || 'نادیار'}`)
      fetchProducts()
    }
    setTimeout(() => { setDeleteStatus('idle'); setItemToDelete(null) }, 3000)
  }, [itemToDelete, fetchProducts])

  const archiveItem = useCallback(async (item: Product) => {
    if (!supabase) return
    await supabase.from('products').update({ is_archived: true }).eq('id', item.id)
    fetchProducts()
    fetchArchivedItems()
  }, [fetchProducts, fetchArchivedItems])

  const restoreItem = useCallback(async (item: Product) => {
    if (!supabase) return
    await supabase.from('products').update({ is_archived: false }).eq('id', item.id)
    fetchArchivedItems()
    fetchProducts()
  }, [fetchArchivedItems, fetchProducts])

  const handleAddCategory = useCallback(() => {
    setEditingCategory(null)
    setNewCategoryName('')
    setShowCategoryModal(true)
  }, [])

  const handleEditCategory = useCallback((category: Category) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setShowCategoryModal(true)
  }, [])

  const handleDeleteCategory = useCallback(async (category: Category) => {
    if (!supabase) return
    const { error } = await supabase.from('categories').delete().eq('id', category.id)
    if (!error) fetchCategories()
  }, [fetchCategories])

  const saveCategory = useCallback(async () => {
    if (!supabase) return
    if (editingCategory) {
      const { error } = await supabase.from('categories').update({ name: newCategoryName.trim() }).eq('id', editingCategory.id)
      if (!error) fetchCategories()
    } else {
      const { error } = await supabase.from('categories').insert([{ name: newCategoryName.trim() }])
      if (!error) fetchCategories()
    }
    setShowCategoryModal(false)
    setNewCategoryName('')
    setEditingCategory(null)
  }, [editingCategory, newCategoryName, fetchCategories])

  const handleAddUnit = useCallback(() => {
    setEditingUnit(null)
    setNewUnitName('')
    setNewUnitSymbol('')
    setShowUnitModal(true)
  }, [])

  const handleEditUnit = useCallback((unit: Unit) => {
    setEditingUnit(unit)
    setNewUnitName(unit.name)
    setNewUnitSymbol(unit.symbol || '')
    setShowUnitModal(true)
  }, [])

  const handleDeleteUnit = useCallback(async (unit: Unit) => {
    if (!supabase) return
    const { error } = await supabase.from('units').delete().eq('id', unit.id)
    if (!error) fetchUnits()
  }, [fetchUnits])

  const saveUnit = useCallback(async () => {
    if (!supabase) return
    if (editingUnit) {
      const { error } = await supabase.from('units').update({ name: newUnitName.trim(), symbol: newUnitSymbol.trim() }).eq('id', editingUnit.id)
      if (!error) fetchUnits()
    } else {
      const { error } = await supabase.from('units').insert([{ name: newUnitName.trim(), symbol: newUnitSymbol.trim() }])
      if (!error) fetchUnits()
    }
    setShowUnitModal(false)
    setNewUnitName('')
    setNewUnitSymbol('')
    setEditingUnit(null)
  }, [editingUnit, newUnitName, newUnitSymbol, fetchUnits])

  const filteredProducts = products.filter(item => {
    if (selectedCategory && item.category !== selectedCategory) return false
    if (!searchTerm) return true
    return item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return {
    activeTab, products, categories, units, suppliers, archivedItems, searchTerm, selectedCategory, currentStep, showStockEntry, editingItem, formData, showDeleteConfirm, itemToDelete, deleteStatus, deleteMessage, soldProductIds, showCategoryModal, showUnitModal, newCategoryName, newUnitName, newUnitSymbol, editingCategory, editingUnit,
    setActiveTab, setSearchTerm, setSelectedCategory, setCurrentStep, setShowStockEntry, setFormData, setShowDeleteConfirm, setItemToDelete, setShowCategoryModal, setShowUnitModal, setNewCategoryName, setNewUnitName, setNewUnitSymbol, setEditingCategory, setEditingUnit,
    fetchAll, fetchProducts, fetchArchivedItems, fetchCategories, fetchUnits, fetchSuppliers, openAddItem, openEditItem, confirmDelete, executeDelete, archiveItem, restoreItem, handleAddCategory, handleEditCategory, handleDeleteCategory, saveCategory, handleAddUnit, handleEditUnit, handleDeleteUnit, saveUnit, filteredProducts
  }
}
