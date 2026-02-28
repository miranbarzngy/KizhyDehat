import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Product, Category, Unit } from './types'
import { logActivity, ActivityActions, EntityTypes } from '@/lib/activityLogger'
import { useAuth } from '@/contexts/AuthContext'

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
  suppliers: { id: string; name: string; balance: number; phone?: string; supplier_image?: string }[]
  archivedItems: Product[]
  searchTerm: string
  selectedCategory: string
  archiveStartDate: string
  archiveEndDate: string
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
  showDeleteCategoryConfirm: boolean
  categoryToDelete: Category | null
  showDeleteUnitConfirm: boolean
  unitToDelete: Unit | null
  loading: boolean
  error: string | null
  setActiveTab: (tab: 'inventory' | 'categories' | 'units' | 'archive') => void
  setSearchTerm: (term: string) => void
  setSelectedCategory: (category: string) => void
  setArchiveStartDate: (date: string) => void
  setArchiveEndDate: (date: string) => void
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
  setShowDeleteCategoryConfirm: (show: boolean) => void
  setCategoryToDelete: (category: Category | null) => void
  setShowDeleteUnitConfirm: (show: boolean) => void
  setUnitToDelete: (unit: Unit | null) => void
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
  confirmDeleteCategory: (category: Category) => void
  handleDeleteCategory: (category: Category) => Promise<void>
  executeDeleteCategory: () => Promise<void>
  saveCategory: () => Promise<void>
  handleAddUnit: () => void
  handleEditUnit: (unit: Unit) => void
  confirmDeleteUnit: (unit: Unit) => void
  handleDeleteUnit: (unit: Unit) => Promise<void>
  executeDeleteUnit: () => Promise<void>
  saveUnit: () => Promise<void>
  showDeleteCategoryConfirm: boolean
  categoryToDelete: Category | null
  showDeleteUnitConfirm: boolean
  unitToDelete: Unit | null
  setShowDeleteCategoryConfirm: (show: boolean) => void
  setCategoryToDelete: (category: Category | null) => void
  setShowDeleteUnitConfirm: (show: boolean) => void
  setUnitToDelete: (unit: Unit | null) => void
  filteredProducts: Product[]
  retry: () => void
}

const DEFAULT_FORM_DATA: InventoryFormData = {
  supplier_id: '',
  price_of_bought: 0,
  is_not_fully_paid: false,
  remain_amount: 0,
  quantity: 0,
  unit: '',
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
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'inventory' | 'categories' | 'units' | 'archive'>('inventory')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string; balance: number; phone?: string; supplier_image?: string }[]>([])
  const [archivedItems, setArchivedItems] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [archiveStartDate, setArchiveStartDate] = useState('')
  const [archiveEndDate, setArchiveEndDate] = useState('')
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
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [showDeleteUnitConfirm, setShowDeleteUnitConfirm] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null)
  
  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const fetchWithTimeout = useCallback(async <T,>(fetchFn: () => Promise<T>, timeoutMs = 10000): Promise<T | null> => {
    const timeoutPromise = new Promise<null>((_, reject) => {
      timeoutRef.current = setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    })
    
    try {
      const result = await Promise.race([fetchFn(), timeoutPromise])
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      return result
    } catch (err) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      throw err
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    if (!supabase) {
      setProducts([{ id: '1', name: 'برنج', total_amount_bought: 25, unit: 'کیلۆ', cost_per_unit: 15.50, selling_price_per_unit: 18.00, category: 'خۆراك', image: '', barcode1: '', barcode2: '', barcode3: '', barcode4: '', added_date: '2026-01-01', expire_date: '', note: '', supplier_id: '1', is_archived: false }])
      return
    }
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, total_amount_bought, unit, cost_per_unit, selling_price_per_unit, category, image, barcode1, barcode2, barcode3, barcode4, added_date, expire_date, note, supplier_id, is_archived, reference_id')
        .or('is_archived.is.null,is_archived.eq.false')
        .order('name', { ascending: true })
        .limit(100)
      if (error) { console.error('Error:', error); return }
      const validProducts = (data || []).filter((item: any) => (item.total_amount_bought || 0) > 0).map((item: any) => ({ ...item, is_archived: item.is_archived || false }))
      if (mountedRef.current) setProducts(validProducts)
    } catch (e) { console.error('Exception:', e) }
  }, [])

  const fetchArchivedItems = useCallback(async (startDate?: string, endDate?: string) => {
    if (!supabase) return
    try { 
      let query = supabase
        .from('products')
        .select('id, name, total_amount_bought, total_purchase_price, unit, cost_per_unit, selling_price_per_unit, category, image, barcode1, barcode2, barcode3, barcode4, added_date, expire_date, note, supplier_id, is_archived, total_sold, total_revenue, total_profit, total_discounts, created_at')
        .or('is_archived.eq.true,total_amount_bought.lte.0')
        .limit(50)
      
      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        const endDateObj = new Date(endDate)
        endDateObj.setDate(endDateObj.getDate() + 1)
        query = query.lt('created_at', endDateObj.toISOString())
      }
      
      const { data: productsData, error } = await query
      
      if (error) {
        console.error('Error fetching archived items:', error)
        let fallbackQuery = supabase
          .from('products')
          .select('id, name, total_amount_bought, unit, cost_per_unit, selling_price_per_unit, category, image, added_date, supplier_id, is_archived')
          .or('is_archived.eq.true,total_amount_bought.lte.0')
          .limit(50)
        
        const { data: fallbackData } = await fallbackQuery
        if (mountedRef.current) setArchivedItems(fallbackData || [])
      } else if (productsData && productsData.length > 0) {
        const productNames = productsData.map(p => p.name)
        
        let saleItemsQuery = supabase
          .from('sale_items')
          .select('item_name, created_at')
          .in('item_name', productNames)
          .order('created_at', { ascending: false })
        
        const { data: saleItemsData } = await saleItemsQuery
        
        const latestSaleDates: Record<string, string> = {}
        if (saleItemsData && saleItemsData.length > 0) {
          for (const item of saleItemsData) {
            const saleDate = item.created_at
            if (saleDate && !latestSaleDates[item.item_name]) {
              latestSaleDates[item.item_name] = saleDate
            }
          }
        }
        
        const mappedData = (productsData || []).map((item: any) => ({
          ...item,
          last_sale_date: latestSaleDates[item.name] || item.created_at
        }))
        if (mountedRef.current) setArchivedItems(mappedData)
      } else {
        if (mountedRef.current) setArchivedItems([])
      }
    } catch (e) { 
      console.error('Exception fetching archived items:', e) 
      if (mountedRef.current) setArchivedItems([])
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    if (!supabase) return
    try { const { data } = await supabase.from('categories').select('*').order('name', { ascending: true }); if (mountedRef.current) setCategories(data || []) } catch {}
  }, [])

  const fetchUnits = useCallback(async () => {
    if (!supabase) return
    try { const { data } = await supabase.from('units').select('*').order('name', { ascending: true }); if (mountedRef.current) setUnits(data || []) } catch {}
  }, [])

  const fetchSuppliers = useCallback(async () => {
    if (!supabase) { setSuppliers([{ id: '1', name: 'کۆمپانیا', balance: 0 }]); return }
    try { const { data } = await supabase.from('suppliers').select('*').order('name', { ascending: true }); if (mountedRef.current) setSuppliers(data || []) } catch {}
  }, [])

  const fetchSoldProductIds = useCallback(async () => {
    if (!supabase) return
    try {
      const { data: saleItems } = await supabase.from('sale_items').select('item_name')
      if (saleItems && saleItems.length > 0) {
        const soldNames = [...new Set(saleItems.map(si => si.item_name))]
        const { data: productsWithSales } = await supabase.from('products').select('id').in('name', soldNames)
        if (productsWithSales && mountedRef.current) { setSoldProductIds(new Set(productsWithSales.map(p => p.id))) }
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
      unit: item.unit || '',
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
      const { data: productData } = await supabase.from('products').select('reference_id').eq('id', itemId).single()
      const referenceId = productData?.reference_id

      // Note: supplier_debts table has been deleted, skip this cleanup
      // if (referenceId) {
      //   await supabase.from('supplier_debts').delete().eq('reference_id', referenceId)
      // } else {
      //   await supabase.from('supplier_debts').delete().eq('note', itemName.trim())
      // }

      if (referenceId) {
        await supabase.from('supplier_transactions').delete().eq('reference_id', referenceId)
      } else {
        await supabase.from('supplier_transactions').delete().eq('item_name', itemName.trim())
      }

      if (referenceId) {
        await supabase.from('purchase_expenses').delete().eq('reference_id', referenceId)
      } else {
        await supabase.from('purchase_expenses').delete().eq('item_name', itemName.trim())
      }

      await supabase.from('products').delete().eq('id', itemId)
      
      await logActivity(
        null, 
        'سیستەم', 
        ActivityActions.DELETE_PRODUCT, 
        `کاڵای ${itemName} سڕایەوە`, 
        EntityTypes.PRODUCT, 
        itemId
      )
      
      setDeleteStatus('success')
      setDeleteMessage(`کاڵا و هەموو حساباتە پەیوەندیدارەکانی بەسەرکەوتوویی سڕانەوە`)
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
    
    await logActivity(
      null,
      null,
      ActivityActions.UPDATE_PRODUCT,
      `ئەرشیفکردنی کاڵای ${item.name}`,
      EntityTypes.PRODUCT,
      item.id
    )
    
    fetchProducts()
    fetchArchivedItems()
  }, [fetchProducts, fetchArchivedItems])

  const restoreItem = useCallback(async (item: Product) => {
    if (!supabase) return
    await supabase.from('products').update({ is_archived: false }).eq('id', item.id)
    
    await logActivity(
      null,
      null,
      ActivityActions.UPDATE_PRODUCT,
      `گەڕاندنەوەی کاڵای ${item.name} لە ئەرشیفەوە بۆ لیستی سەرەکی`,
      EntityTypes.PRODUCT,
      item.id
    )
    
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

  const confirmDeleteCategory = useCallback((category: Category) => {
    setCategoryToDelete(category)
    setShowDeleteCategoryConfirm(true)
  }, [])

  const executeDeleteCategory = useCallback(async () => {
    if (!categoryToDelete || !supabase) return
    
    const isValidUUID = (id: any) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return id && uuidRegex.test(String(id))
    }
    
    const { error } = await supabase.from('categories').delete().eq('id', categoryToDelete.id)
    if (!error) {
      await logActivity(
        user?.id || null,
        profile?.name || null,
        ActivityActions.DELETE_CATEGORY,
        `پۆلی ${categoryToDelete.name} سڕایەوە`,
        EntityTypes.CATEGORY,
        isValidUUID(categoryToDelete.id) ? categoryToDelete.id : undefined
      )
      fetchCategories()
    }
    setShowDeleteCategoryConfirm(false)
    setCategoryToDelete(null)
  }, [categoryToDelete, fetchCategories, user, profile])

  const handleDeleteCategory = useCallback(async (category: Category) => {
    const isValidUUID = (id: any) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return id && uuidRegex.test(String(id))
    }
    
    if (!supabase) return
    const { error } = await supabase.from('categories').delete().eq('id', category.id)
    if (!error) {
      await logActivity(
        null,
        null,
        ActivityActions.DELETE_CATEGORY,
        `پۆلی ${category.name} سڕایەوە`,
        EntityTypes.CATEGORY,
        isValidUUID(category.id) ? category.id : undefined
      )
      fetchCategories()
    }
  }, [fetchCategories])

  const saveCategory = useCallback(async () => {
    const isValidUUID = (id: any) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return id && uuidRegex.test(String(id))
    }
    
    if (!supabase) return
    if (editingCategory) {
      const { error } = await supabase.from('categories').update({ name: newCategoryName.trim() }).eq('id', editingCategory.id)
      if (!error) {
        await logActivity(
          user?.id || null,
          profile?.name || null,
          ActivityActions.UPDATE_CATEGORY,
          `پۆل دەستکاری کرا بۆ: ${newCategoryName.trim()}`,
          EntityTypes.CATEGORY,
          isValidUUID(editingCategory.id) ? editingCategory.id : undefined
        )
        fetchCategories()
      }
    } else {
      const { error } = await supabase.from('categories').insert([{ name: newCategoryName.trim() }])
      if (!error) {
        await logActivity(
          user?.id || null,
          profile?.name || null,
          ActivityActions.ADD_CATEGORY,
          `پۆلی نوێ زیادکرا: ${newCategoryName.trim()}`,
          EntityTypes.CATEGORY
        )
        fetchCategories()
      }
    }
    setShowCategoryModal(false)
    setNewCategoryName('')
    setEditingCategory(null)
  }, [editingCategory, newCategoryName, fetchCategories, user, profile])

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

  const confirmDeleteUnit = useCallback((unit: Unit) => {
    setUnitToDelete(unit)
    setShowDeleteUnitConfirm(true)
  }, [])

  const executeDeleteUnit = useCallback(async () => {
    if (!unitToDelete || !supabase) return
    
    const { error } = await supabase.from('units').delete().eq('id', unitToDelete.id)
    if (!error) {
      console.log('Logging DELETE_UNIT activity:', { userId: user?.id, profileName: profile?.name })
      try {
        const isValidUUID = (id: any) => {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          return id && uuidRegex.test(String(id))
        }
        
        await logActivity(
          user?.id || null,
          profile?.name || 'سیستەم',
          ActivityActions.DELETE_UNIT,
          `یەکەی ${unitToDelete.name} سڕایەوە`,
          EntityTypes.UNIT,
          isValidUUID(unitToDelete.id) ? unitToDelete.id : undefined
        )
      } catch (logError) {
        console.error('Failed to log DELETE_UNIT activity:', logError)
      }
      fetchUnits()
    } else {
      console.error('Failed to delete unit:', error)
    }
    setShowDeleteUnitConfirm(false)
    setUnitToDelete(null)
  }, [unitToDelete, fetchUnits, user, profile])

  const handleDeleteUnit = useCallback(async (unit: Unit) => {
    const isValidUUID = (id: any) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return id && uuidRegex.test(String(id))
    }
    
    if (!supabase) return
    const { error } = await supabase.from('units').delete().eq('id', unit.id)
    if (!error) {
      await logActivity(
        null,
        null,
        ActivityActions.DELETE_UNIT,
        `یەکەی ${unit.name} سڕایەوە`,
        EntityTypes.UNIT,
        isValidUUID(unit.id) ? unit.id : undefined
      )
      fetchUnits()
    }
  }, [fetchUnits])

  const saveUnit = useCallback(async () => {
    const isValidUUID = (id: any) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return id && uuidRegex.test(String(id))
    }
    
    if (!supabase) return
    if (editingUnit) {
      const { error } = await supabase.from('units').update({ name: newUnitName.trim(), symbol: newUnitSymbol.trim() }).eq('id', editingUnit.id)
      if (!error) {
        console.log('Logging UPDATE_UNIT activity:', { userId: user?.id, profileName: profile?.name })
        try {
          await logActivity(
            user?.id || null,
            profile?.name || 'سیستەم',
            ActivityActions.UPDATE_UNIT,
            `یەکە دەستکاری کرا بۆ: ${newUnitName.trim()}`,
            EntityTypes.UNIT,
            isValidUUID(editingUnit.id) ? editingUnit.id : undefined
          )
        } catch (logError) {
          console.error('Failed to log UPDATE_UNIT activity:', logError)
        }
        fetchUnits()
      } else {
        console.error('Failed to update unit:', error)
      }
    } else {
      const { error } = await supabase.from('units').insert([{ name: newUnitName.trim(), symbol: newUnitSymbol.trim() }])
      if (!error) {
        console.log('Logging ADD_UNIT activity:', { userId: user?.id, profileName: profile?.name })
        try {
          await logActivity(
            user?.id || null,
            profile?.name || 'سیستەم',
            ActivityActions.ADD_UNIT,
            `یەکەی نوێ زیادکرا: ${newUnitName.trim()}`,
            EntityTypes.UNIT
          )
        } catch (logError) {
          console.error('Failed to log ADD_UNIT activity:', logError)
        }
        fetchUnits()
      } else {
        console.error('Failed to add unit:', error)
      }
    }
    setShowUnitModal(false)
    setNewUnitName('')
    setNewUnitSymbol('')
    setEditingUnit(null)
  }, [editingUnit, newUnitName, newUnitSymbol, fetchUnits, user, profile])

  const filteredProducts = products.filter(item => {
    if (selectedCategory && item.category !== selectedCategory) return false
    if (!searchTerm) return true
    return item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Main fetch all function with timeout handling
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch all data with timeout
      const fetchPromise = Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchUnits(),
        fetchSuppliers(),
        fetchSoldProductIds()
      ])
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('کات بەسەرچوو - تکایە هەوڵبدەرەوە')), 10000)
      })
      
      await Promise.race([fetchPromise, timeoutPromise])
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'هەڵە لە ئامادەکردن')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [fetchProducts, fetchCategories, fetchUnits, fetchSuppliers, fetchSoldProductIds])

  // Retry function
  const retry = useCallback(() => {
    fetchAll()
  }, [fetchAll])

  // Real-time subscription for products
  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('inventory-products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          const eventType = payload.eventType
          const newRecord = payload.new
          const oldRecord = payload.old

          if (eventType === 'INSERT') {
            setProducts(prev => [newRecord, ...prev])
          } else if (eventType === 'UPDATE') {
            setProducts(prev => prev.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item))
          } else if (eventType === 'DELETE') {
            setProducts(prev => prev.filter(item => item.id !== oldRecord.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Real-time subscription for categories
  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('inventory-categories-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          const eventType = payload.eventType
          const newRecord = payload.new
          const oldRecord = payload.old

          if (eventType === 'INSERT') {
            setCategories(prev => [...prev, newRecord])
          } else if (eventType === 'UPDATE') {
            setCategories(prev => prev.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item))
          } else if (eventType === 'DELETE') {
            setCategories(prev => prev.filter(item => item.id !== oldRecord.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Real-time subscription for units
  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('inventory-units-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'units' },
        (payload) => {
          const eventType = payload.eventType
          const newRecord = payload.new
          const oldRecord = payload.old

          if (eventType === 'INSERT') {
            setUnits(prev => [...prev, newRecord])
          } else if (eventType === 'UPDATE') {
            setUnits(prev => prev.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item))
          } else if (eventType === 'DELETE') {
            setUnits(prev => prev.filter(item => item.id !== oldRecord.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Real-time subscription for suppliers
  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('inventory-suppliers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'suppliers' },
        (payload) => {
          const eventType = payload.eventType
          const newRecord = payload.new
          const oldRecord = payload.old

          if (eventType === 'INSERT') {
            setSuppliers(prev => [...prev, newRecord])
          } else if (eventType === 'UPDATE') {
            setSuppliers(prev => prev.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item))
          } else if (eventType === 'DELETE') {
            setSuppliers(prev => prev.filter(item => item.id !== oldRecord.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    
    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    activeTab, products, categories, units, suppliers, archivedItems, searchTerm, selectedCategory, archiveStartDate, archiveEndDate, currentStep, showStockEntry, editingItem, formData, showDeleteConfirm, itemToDelete, deleteStatus, deleteMessage, soldProductIds, showCategoryModal, showUnitModal, newCategoryName, newUnitName, newUnitSymbol, editingCategory, editingUnit,
    showDeleteCategoryConfirm, categoryToDelete, showDeleteUnitConfirm, unitToDelete,
    setActiveTab, setSearchTerm, setSelectedCategory, setArchiveStartDate, setArchiveEndDate, setCurrentStep, setShowStockEntry, setFormData, setShowDeleteConfirm, setItemToDelete, setShowCategoryModal, setShowUnitModal, setNewCategoryName, setNewUnitName, setNewUnitSymbol, setEditingCategory, setEditingUnit,
    setShowDeleteCategoryConfirm, setCategoryToDelete, setShowDeleteUnitConfirm, setUnitToDelete,
    fetchAll, fetchProducts, fetchArchivedItems, fetchCategories, fetchUnits, fetchSuppliers, openAddItem, openEditItem, confirmDelete, executeDelete, archiveItem, restoreItem, handleAddCategory, handleEditCategory, confirmDeleteCategory, handleDeleteCategory, executeDeleteCategory, saveCategory, handleAddUnit, handleEditUnit, confirmDeleteUnit, handleDeleteUnit, executeDeleteUnit, saveUnit, filteredProducts,
    loading, error, retry
  }
}
