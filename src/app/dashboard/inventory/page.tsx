'use client'

import { formatCurrency, safeStringToNumber, sanitizeBarcode, sanitizeNumericInput, toEnglishDigits } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FaArchive, FaBarcode, FaBox, FaCalculator, FaChartLine, FaEdit, FaSearch, FaTags, FaTrash, FaTruck } from 'react-icons/fa'

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
  total_sold?: number
  total_revenue?: number
  total_profit?: number
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

interface Unit {
  id: string
  name: string
  symbol?: string
  created_at: string
}

interface PurchaseItem {
  item_name: string
  cost_price: number
  selling_price: number
  quantity: number
  unit: string
  category?: string
  price_of_bought?: number // Total amount paid to supplier
  amount_of_pay?: number // Amount paid now
  debt_pay?: number // Auto-calculated: price_of_bought - amount_of_pay
  barcode1?: string
  barcode2?: string
  barcode3?: string
  barcode4?: string
  expire_date?: string
  created_date?: string
  image?: string
  note?: string
  supplier_id?: string
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'categories' | 'units' | 'archive'>('inventory')
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [newUnitName, setNewUnitName] = useState('')
  const [newUnitSymbol, setNewUnitSymbol] = useState('')
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [archivedItems, setArchivedItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showStockEntry, setShowStockEntry] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
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
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [archiveDateFrom, setArchiveDateFrom] = useState('')
  const [archiveDateTo, setArchiveDateTo] = useState('')

  useEffect(() => {
    fetchInventory()
    fetchSuppliers()
    fetchCategories()
    fetchUnits()
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

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('تکایە ناوی پۆل بنووسە')
      return
    }

    if (!supabase) {
      alert('دۆخی دیمۆ: پۆل دروست نەکراوە')
      return
    }

    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          name: newCategoryName.trim()
        })

      if (error) throw error

      alert('پۆل بە سەرکەوتوویی دروستکرا')
      setShowCategoryModal(false)
      setNewCategoryName('')
      fetchCategories()
    } catch (error) {
      console.error('Error creating category:', error)
      alert('هەڵە لە دروستکردنی پۆل')
    }
  }

  const updateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      alert('تکایە ناوی پۆل بنووسە')
      return
    }

    if (!supabase) {
      alert('دۆخی دیمۆ: پۆل نوێ نەکرایەوە')
      return
    }

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: newCategoryName.trim()
        })
        .eq('id', editingCategory.id)

      if (error) throw error

      alert('پۆل بە سەرکەوتوویی نوێکرایەوە')
      setShowCategoryModal(false)
      setEditingCategory(null)
      setNewCategoryName('')
      fetchCategories()
    } catch (error) {
      console.error('Error updating category:', error)
      alert('هەڵە لە نوێکردنەوەی پۆل')
    }
  }

  const deleteCategory = async (categoryId: string, categoryName: string) => {
    // Check if any items are using this category
    const itemsWithCategory = inventory.filter(item => item.category === categoryName)
    if (itemsWithCategory.length > 0) {
      alert(`ناتوانرێت پۆل بسڕدرێتەوە چونکە ${itemsWithCategory.length} کاڵا ئەم پۆلە بەکاردەهێنن. تکایە یەکەم کاڵاکان بگوازەوە بۆ پۆلی تر.`)
      return
    }

    if (!confirm(`دڵنیایت لە سڕینەوەی پۆلی "${categoryName}"؟`)) {
      return
    }

    if (!supabase) {
      alert('دۆخی دیمۆ: پۆل سڕاوە نەکراوە')
      return
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      alert('پۆل بە سەرکەوتوویی سڕایەوە')
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('هەڵە لە سڕینەوەی پۆل')
    }
  }

  const fetchUnits = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name')

      if (error) throw error
      setUnits(data || [])
    } catch (error) {
      console.error('Error fetching units:', error)
    }
  }

  const createUnit = async () => {
    if (!newUnitName.trim()) {
      alert('تکایە ناوی یەکە بنووسە')
      return
    }

    if (!supabase) {
      console.log('⚠️ Supabase not configured, showing demo mode')
      alert('دۆخی دیمۆ: یەکە بە سەرکەوتوویی دروستکرا (دیمۆ)')
      setShowUnitModal(false)
      setNewUnitName('')
      setNewUnitSymbol('')
      // In demo mode, we'll just close the modal without actually creating anything
      return
    }

    try {
      console.log('🚀 Creating unit:', { name: newUnitName.trim(), symbol: newUnitSymbol.trim() || null })

      // Try to insert with symbol first, if it fails, try without symbol
      let { data, error } = await supabase
        .from('units')
        .insert({
          name: newUnitName.trim(),
          symbol: newUnitSymbol.trim() || null
        })
        .select()

      // If error is about missing symbol column, try without symbol
      if (error && error.code === 'PGRST204' && error.message.includes('symbol')) {
        console.log('Symbol column not found, trying without symbol...')
        const fallbackResult = await supabase
          .from('units')
          .insert({
            name: newUnitName.trim()
          })
          .select()

        data = fallbackResult.data
        error = fallbackResult.error
      }

      if (error) {
        console.error('❌ Supabase insert error:', error)
        console.error('Error type:', typeof error)
        console.error('Error keys:', Object.keys(error))
        
        // Try to get more detailed error information
        if (error instanceof Error) {
          console.error('Error message:', error.message)
          console.error('Error stack:', error.stack)
        } else if (typeof error === 'object' && error !== null) {
          console.error('Error object:', JSON.stringify(error, null, 2))
        }
        
        throw error
      }

      console.log('✅ Unit created successfully:', data)
      alert('یەکە بە سەرکەوتوویی دروستکرا')
      setEditingUnit(null)
      setNewUnitName('')
      setNewUnitSymbol('')
      fetchUnits()
    } catch (error) {
      console.error('Error creating unit:', error)
      console.error('Error type:', typeof error)
      console.error('Error keys:', Object.keys(error || {}))
      
      // Enhanced error handling with better debugging
      let errorMessage = 'هەڵەی نادیار'
      let shouldShowDetails = false
      
      if (error instanceof Error) {
        errorMessage = error.message
        shouldShowDetails = true
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as any
        errorMessage = errorObj?.message || errorObj?.error || 'هەڵەی نادیار'
        shouldShowDetails = true
        
        // Log detailed error information
        console.error('Detailed error info:', {
          message: errorObj?.message,
          code: errorObj?.code,
          details: errorObj?.details,
          hint: errorObj?.hint,
          status: errorObj?.status,
          statusText: errorObj?.statusText
        })
      }
      
      // Provide more specific error messages
      if (typeof error === 'object' && error !== null) {
        const errorObj = error as any
        if (errorObj?.code === '23505') {
          alert('هەڵە: یەکەیەکی لەم ناونیشەوە پێشتر هەیە')
        } else if (errorObj?.code === '42P01') {
          alert('هەڵە: جدولی یەکەکان نییە، تکایە یەکەکان دروست بکەرەوە')
        } else if (errorObj?.status === 401) {
          alert('هەڵە: دەستگەیشتن بۆ سیستەم نییە، تکایە دووبارە بچووە سیستەم')
        } else if (errorObj?.status === 403) {
          alert('هەڵە: مۆڵەتی دروستکردنی یەکە نییە')
        } else {
          alert('هەڵە لە دروستکردنی یەکە: ' + errorMessage)
        }
      } else {
        alert('هەڵە لە دروستکردنی یەکە: ' + errorMessage)
      }
    }
  }

  const updateUnit = async () => {
    if (!editingUnit || !newUnitName.trim()) {
      alert('تکایە ناوی یەکە بنووسە')
      return
    }

    if (!supabase) {
      alert('دۆخی دیمۆ: یەکە نوێ نەکرایەوە')
      return
    }

    try {
      const { error } = await supabase
        .from('units')
        .update({
          name: newUnitName.trim(),
          symbol: newUnitSymbol.trim() || null
        })
        .eq('id', editingUnit.id)

      if (error) throw error

      alert('یەکە بە سەرکەوتوویی نوێکرایەوە')
      setEditingUnit(null)
      setNewUnitName('')
      setNewUnitSymbol('')
      fetchUnits()
    } catch (error) {
      console.error('Error updating unit:', error)
      alert('هەڵە لە نوێکردنەوەی یەکە')
    }
  }

  const deleteUnit = async (unitId: string, unitName: string) => {
    // Check if any items are using this unit
    const itemsWithUnit = inventory.filter(item => item.unit === unitName)
    if (itemsWithUnit.length > 0) {
      alert(`ناتوانرێت یەکە بسڕدرێتەوە چونکە ${itemsWithUnit.length} کاڵا ئەم یەکەیە بەکاردەهێنن. تکایە یەکەم کاڵاکان بگۆڕە بۆ یەکەی تر.`)
      return
    }

    if (!confirm(`دڵنیایت لە سڕینەوەی یەکەی "${unitName}"؟`)) {
      return
    }

    if (!supabase) {
      alert('دۆخی دیمۆ: یەکە سڕاوە نەکراوە')
      return
    }

    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId)

      if (error) throw error

      alert('یەکە بە سەرکەوتوویی سڕایەوە')
      fetchUnits()
    } catch (error) {
      console.error('Error deleting unit:', error)
      alert('هەڵە لە سڕینەوەی یەکە')
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
      const demoArchived: InventoryItem[] = [
        {
          id: '4',
          item_name: 'گۆشت',
          quantity: 0,
          unit: 'کیلۆ',
          low_stock_threshold: 5,
          cost_price: 28.00,
          selling_price: 35.00,
          category: 'گۆشت و ماسی',
          is_online_visible: false,
          image: '',
          expire_date: '2026-01-15',
          supplier_name: 'فرۆشیاری گۆشت',
          note: 'گۆشتی پاک و تازە'
        }
      ]
      setInventory(demoInventory)
      setArchivedItems(demoArchived)
      setLoading(false)
      return
    }

    try {
      // Fetch active inventory data (not archived AND quantity > 0)
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .or('is_archived.is.null,is_archived.eq.false')
        .gt('quantity', 0)

      if (inventoryError) throw inventoryError

      // Fetch archived items (is_archived = TRUE OR quantity <= 0)
      const { data: archivedData, error: archivedError } = await supabase
        .from('inventory')
        .select('*')
        .or('is_archived.eq.true,quantity.lte.0')

      if (archivedError) {
        console.warn('Error fetching archived items:', archivedError)
        // Continue without archived items
      }

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

      // Merge archived data with product data
      const mergedArchived = (archivedData || []).map((archivedItem: InventoryItem) => {
        // Find matching product data
        const productData = productsData.find((product: { name: string }) =>
          product.name === archivedItem.item_name
        )

        // Find supplier name if supplier_id exists
        let supplierName = ''
        if (productData?.supplier_id) {
          const supplier = suppliers.find(s => s.id === productData.supplier_id)
          supplierName = supplier?.name || ''
        }

        return {
          ...archivedItem,
          expire_date: productData?.expire_date || '',
          supplier_name: supplierName,
          note: productData?.note || ''
        }
      })

      setInventory(mergedInventory)
      setArchivedItems(mergedArchived)
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        updatePurchaseItem(0, 'image', result)
      }
      reader.readAsDataURL(file)
    }
  }

  const openCamera = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' // Use back camera on mobile
    input.onchange = (e) => handleImageUpload(e as any)
    input.click()
  }

  const editItem = (item: InventoryItem) => {
    setEditingItem(item)
    setCurrentStep(1) // Reset to first step when editing
    // Pre-populate the form with existing item data
    const editData: PurchaseItem = {
      item_name: item.item_name,
      cost_price: item.cost_price,
      selling_price: item.selling_price,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      image: item.image,
      note: item.note,
      expire_date: item.expire_date,
      created_date: new Date().toISOString().split('T')[0], // Current date for updates
      // Note: Financial fields (price_of_bought, amount_of_pay) are not stored in inventory table
      // They would need to be fetched from a separate purchases/transactions table if implemented
      price_of_bought: item.cost_price * item.quantity, // Estimate based on current cost
      amount_of_pay: item.cost_price * item.quantity, // Assume fully paid for existing items
    }
    setPurchaseItems([editData])
    setImagePreview(item.image || '')
    setShowStockEntry(true)
  }

  const updateItem = async () => {
    console.log('🚀 Starting item update...')

    if (!editingItem) {
      alert('هیچ کاڵایەک بۆ نوێکردنەوە هەڵنەبژێراوە')
      return
    }

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
      alert('دۆخی دیمۆ: کاڵاکە بە سەرکەوتوویی نوێکرایەوە (دیمۆ)')
      setShowStockEntry(false)
      setEditingItem(null)
      setPurchaseItems([{ item_name: '', cost_price: 0, selling_price: 0, quantity: 0, unit: 'دانە' }])
      setImagePreview('')
      return
    }

    try {
      const quantity = Number(item.quantity)
      const totalPurchasePrice = Number(item.price_of_bought || 0)
      const sellingPrice = Number(item.selling_price)

      // Update inventory table
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          item_name: item.item_name,
          quantity: quantity,
          unit: item.unit,
          cost_price: totalPurchasePrice > 0 ? Math.round(totalPurchasePrice / quantity) : 0,
          selling_price: sellingPrice,
          category: item.category || null,
          image: item.image || ''
        })
        .eq('id', editingItem.id)

      if (updateError) throw updateError

      alert('کاڵاکە بە سەرکەوتوویی نوێکرایەوە')
      setShowStockEntry(false)
      setEditingItem(null)
      setPurchaseItems([{ item_name: '', cost_price: 0, selling_price: 0, quantity: 0, unit: 'دانە' }])
      setImagePreview('')
      fetchInventory()

    } catch (error) {
      console.error('Error updating item:', error)
      alert('هەڵە لە نوێکردنەوەی کاڵا')
    }
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
      const totalPurchasePrice = Number(item.price_of_bought || 0)
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

      // Insert into purchase_expenses table (immutable record of purchase)
      try {
        const { error: purchaseError } = await supabase
          .from('purchase_expenses')
          .insert({
            item_name: item.item_name,
            total_purchase_price: totalPurchasePrice,
            total_amount_bought: quantity,
            unit: item.unit,
            purchase_date: item.created_date || new Date().toISOString().split('T')[0]
          })

        if (purchaseError) {
          console.error('Error inserting purchase expense:', purchaseError)
          // Don't throw - the main item was inserted successfully
        }
      } catch (purchaseErr) {
        console.error('Error creating purchase expense record:', purchaseErr)
        // Don't throw - the main item was inserted successfully
      }

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

  const deleteItem = async () => {
    if (!itemToDelete) return

    if (!supabase) {
      alert('دۆخی دیمۆ: کاڵا سڕاوە نەکراوە')
      setShowDeleteConfirm(false)
      setItemToDelete(null)
      return
    }

    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', itemToDelete.id)

      if (error) throw error

      alert(`کاڵای "${itemToDelete.item_name}" بە سەرکەوتوویی سڕایەوە`)
      setShowDeleteConfirm(false)
      setItemToDelete(null)
      fetchInventory()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('هەڵە لە سڕینەوەی کاڵا')
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

  // Skeleton Loader Component
  const ProductSkeleton = () => (
    <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20 animate-pulse">
      <div className="w-20 h-20 bg-gray-200 rounded-2xl mx-auto mb-4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-6 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto"></div>
    </div>
  )

  if (loading) {
    return <div className="text-center">چاوەڕوانبە...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 pl-0 md:pl-6">
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
          بەڕێوەبردنی کاڵاکان
        </h1>

        {/* Tab Navigation */}
        <div className="flex flex-row overflow-x-auto whitespace-nowrap space-x-1 mb-8 bg-white/60 backdrop-blur-xl rounded-2xl p-1 shadow-lg">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'inventory'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-white/50'
            }`}
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            <FaBox className="inline ml-2" />
            کاڵاکان
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'categories'
                ? 'bg-green-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-white/50'
            }`}
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            <FaTags className="inline ml-2" />
            پۆلەکان
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'units'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-white/50'
            }`}
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            <FaCalculator className="inline ml-2" />
            یەکەکان
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'archive'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-white/50'
            }`}
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            <FaArchive className="inline ml-2" />
            ئەرشیڤ
          </button>
        </div>

        {/* Add Item Button - Only show on inventory tab */}
        {activeTab === 'inventory' && (
          <>
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
                        onClick={() => editItem(item)}
                        className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <FaEdit size={14} />
                        <span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>دەستکاری</span>
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete(item)
                          setShowDeleteConfirm(true)
                        }}
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
                  {searchTerm || selectedCategory ? 'گەڕانەکەت  یان فیلتەرەکان بگۆڕە' : 'کاڵای نوێ زیادبکە'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-primary)' }}>
                بەڕێوەبردنی پۆلەکان
              </h2>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                <FaTags className="ml-2" />
                <span>پۆلی نوێ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <FaTags className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-xl text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        {category.name}
                      </h3>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                    دروستکراوە: {new Date(category.created_at).toLocaleDateString('ku-IQ')}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setEditingCategory(category)
                        setNewCategoryName(category.name)
                        setShowCategoryModal(true)
                      }}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <FaEdit className="inline ml-2" />
                      دەستکاری
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id, category.name)}
                      className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {categories.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏷️</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                  هیچ پۆلێک نییە
                </h3>
                <p className="text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  پۆلی نوێ دروستبکە بۆ ڕێکخستنی کاڵاکانت
                </p>
              </div>
            )}
          </div>
        )}

        {/* Units Tab */}
        {activeTab === 'units' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-primary)' }}>
                بەڕێوەبردنی یەکەکان
              </h2>
            </div>

            {/* Unit Add/Update Form */}
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      ناوی یەکە
                    </label>
                    <input
                      type="text"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        fontFamily: 'var(--font-uni-salar)'
                      }}
                      placeholder="ناوی یەکە"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      نمادی یەکە (بۆ نموونە: kg, m, L)
                    </label>
                    <input
                      type="text"
                      value={newUnitSymbol}
                      onChange={(e) => setNewUnitSymbol(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        fontFamily: 'var(--font-uni-salar)'
                      }}
                      placeholder="نمادی یەکە"
                    />
                  </div>

                  <div className="flex space-x-2">
                    {editingUnit ? (
                      <>
                        <button
                          onClick={updateUnit}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                          style={{ fontFamily: 'var(--font-uni-salar)' }}
                        >
                          نوێکردنەوە
                        </button>
                        <button
                          onClick={() => {
                            setEditingUnit(null)
                            setNewUnitName('')
                            setNewUnitSymbol('')
                          }}
                          className="px-4 py-3 bg-gray-400 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                          style={{ fontFamily: 'var(--font-uni-salar)' }}
                        >
                          پاشگەزبوونەوە
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={createUnit}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                        style={{ fontFamily: 'var(--font-uni-salar)' }}
                      >
                        زیادکردن
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <FaCalculator className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          {unit.name}
                        </h3>
                        {unit.symbol && (
                          <p className="text-sm text-purple-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                            نماد: {unit.symbol}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                    دروستکراوە: {new Date(unit.created_at).toLocaleDateString('ku-IQ')}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setEditingUnit(unit)
                        setNewUnitName(unit.name)
                        setNewUnitSymbol(unit.symbol || '')
                      }}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <FaEdit className="inline ml-2" />
                      دەستکاری
                    </button>
                    <button
                      onClick={() => deleteUnit(unit.id, unit.name)}
                      className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {units.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚖️</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                  هیچ یەکەیەک نییە
                </h3>
                <p className="text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  یەکەی نوێ دروستبکە بۆ بەکارهێنانی لە کاڵاکاندا
                </p>
              </div>
            )}
          </div>
        )}

        {/* Archive Tab */}
        {activeTab === 'archive' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-primary)' }}>
                کاڵاکانی فرۆشراو
              </h2>
              <motion.button
                onClick={() => fetchInventory()}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaArchive className="ml-2" />
                <span>نوێکردنەوە</span>
              </motion.button>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    لە بەروار
                  </label>
                  <input
                    type="date"
                    value={archiveDateFrom}
                    onChange={(e) => setArchiveDateFrom(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-0 bg-white/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    بۆ بەروار
                  </label>
                  <input
                    type="date"
                    value={archiveDateTo}
                    onChange={(e) => setArchiveDateTo(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-0 bg-white/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => {
                      setArchiveDateFrom('')
                      setArchiveDateTo('')
                    }}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-300"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    پاککردنەوە
                  </motion.button>
                  <motion.button
                    onClick={() => fetchInventory()}
                    className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium transition-all duration-300"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    گەڕان
                  </motion.button>
                </div>
              </div>
            </div>

            {(() => {
              // Filter archived items based on date range
              const filteredArchivedItems = archivedItems.filter((item) => {
                // If no date range is set, show all items
                if (!archiveDateFrom && !archiveDateTo) return true

                // For demo purposes, simulate different archive dates based on item properties
                // In a real implementation, you'd use an actual archive timestamp field like 'archived_at'
                // For now, we'll use a hash of the item name to simulate different archive dates
                const hash = item.item_name.split('').reduce((a, b) => {
                  a = ((a << 5) - a) + b.charCodeAt(0)
                  return a & a
                }, 0)

                // Create a simulated archive date within the last few days
                // Make sure today's items appear in today's range by using a more predictable pattern
                // Use the hash to determine which items appear on which days
                // Ensure at least one item appears today for testing
                const daysAgo = Math.abs(hash) % 27 // Random days within last 27 days (0-26)
                const itemDate = new Date()
                itemDate.setDate(itemDate.getDate() - daysAgo)
                const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate())

                // Parse the filter dates
                const fromDate = archiveDateFrom ? new Date(archiveDateFrom + 'T00:00:00') : null
                const toDate = archiveDateTo ? new Date(archiveDateTo + 'T23:59:59') : null

                if (fromDate && toDate) {
                  // Both dates set - check if item date is between them (inclusive)
                  return itemDateOnly >= fromDate && itemDateOnly <= toDate
                } else if (fromDate) {
                  // Only from date set - check if item date is on or after from date
                  return itemDateOnly >= fromDate
                } else if (toDate) {
                  // Only to date set - check if item date is on or before to date
                  return itemDateOnly <= toDate
                }

                return true
              })

              // Calculate summary for filtered items
              const totalProfit = filteredArchivedItems.reduce((sum, item) => sum + Number(item.total_profit || 0), 0)
              const totalRevenue = filteredArchivedItems.reduce((sum, item) =>
                sum + Number(item.total_revenue || (Number(item.total_sold || 0) * Number(item.selling_price || 0))), 0
              )
              const totalCost = filteredArchivedItems.reduce((sum, item) =>
                sum + ((Number(item.total_sold || 0) + Number(item.quantity || 0)) * Number(item.cost_price || 0)), 0
              )

              const getFilterLabel = () => {
                if (!archiveDateFrom && !archiveDateTo) return 'هەمووی'
                if (archiveDateFrom && archiveDateTo) {
                  return `لە ${archiveDateFrom} بۆ ${archiveDateTo}`
                }
                if (archiveDateFrom) return `لە ${archiveDateFrom} وە`
                if (archiveDateTo) return `بۆ ${archiveDateTo}`
                return 'هەمووی'
              }

              return (
                <>
                  {/* Summary Header */}
                  {filteredArchivedItems.length > 0 && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-emerald-200">
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-emerald-800 mb-4" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          کۆی قازانجی {getFilterLabel()}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-white/60 rounded-xl p-4">
                            <div className="text-sm text-emerald-700 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              کۆی قازانج
                            </div>
                            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatCurrency(totalProfit)} IQD
                            </div>
                          </div>
                          <div className="bg-white/60 rounded-xl p-4">
                            <div className="text-sm text-emerald-700 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              کۆی داهات
                            </div>
                            <div className="text-2xl font-bold text-blue-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatCurrency(totalRevenue)} IQD
                            </div>
                          </div>
                          <div className="bg-white/60 rounded-xl p-4">
                            <div className="text-sm text-emerald-700 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              کۆی تێچوو
                            </div>
                            <div className="text-2xl font-bold text-red-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatCurrency(totalCost)} IQD
                            </div>
                          </div>
                          <div className="bg-white/60 rounded-xl p-4">
                            <div className="text-sm text-emerald-700 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              ڕێژەی قازانج
                            </div>
                            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                              {totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}%` : '0%'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {filteredArchivedItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredArchivedItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2"
                        >
                          {/* Item Image */}
                          <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center relative">
                            {item.image ? (
                              <img src={item.image} alt={item.item_name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <span className="text-gray-400 text-4xl">📦</span>
                            )}
                            {/* Archive Badge */}
                            <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              فرۆشراو
                            </div>
                          </div>

                          {/* Item Name */}
                          <h3 className="text-lg font-bold mb-2 text-center" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-primary)' }}>
                            {item.item_name}
                          </h3>

                          {/* Financial Summary */}
                          <div className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-blue-200/50">
                            {/* Purchase Data */}
                            <div className="mb-3">
                              <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                🛒 کڕین
                              </h4>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white/60 rounded-lg p-2 text-center">
                                  <div className="text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی بڕی کڕدراو</div>
                                  <div className="font-bold text-blue-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    {formatCurrency(Number(item.total_sold || 0) + Number(item.quantity || 0))} {item.unit}
                                  </div>
                                </div>
                                <div className="bg-white/60 rounded-lg p-2 text-center">
                                  <div className="text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>تێچووی گشتی</div>
                                  <div className="font-bold text-blue-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    {formatCurrency((Number(item.total_sold || 0) + Number(item.quantity || 0)) * Number(item.cost_price || 0))} IQD
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Sales Data */}
                            <div className="mb-3">
                              <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                💰 فرۆشتن
                              </h4>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white/60 rounded-lg p-2 text-center">
                                  <div className="text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی داهات</div>
                                  <div className="font-bold text-green-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    {formatCurrency(
                                      Number(item.total_revenue || 0) ||
                                      (Number(item.total_sold || 0) * Number(item.selling_price || 0))
                                    )} IQD
                                  </div>
                                </div>
                                <div className="bg-white/60 rounded-lg p-2 text-center">
                                  <div className="text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی قازانج</div>
                                  <div className={`font-bold ${((item.total_profit || 0) >= 0) ? 'text-green-700' : 'text-red-700'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                                    {formatCurrency(item.total_profit || 0)} IQD
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Profit Margin */}
                            <div className="flex justify-center">
                              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                ((item.total_profit || 0) >= 0) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                                {(() => {
                                  const revenue = Number(item.total_revenue || 0) || (Number(item.total_sold || 0) * Number(item.selling_price || 0));
                                  const profit = Number(item.total_profit || 0);
                                  return revenue > 0 ? `${((profit / revenue) * 100).toFixed(1)}%` : '0%';
                                })()} قازانج
                              </div>
                            </div>
                          </div>

                          {/* Category Badge */}
                          <div className="text-center">
                            <div className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              {item.category}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                          هیچ کاڵای ئەرشیڤکراو نییە
                        </h3>
                        <p className="text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          کاڵاکانی فرۆشراو لێرە دەردەکەون
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                  {editingCategory ? 'دەستکاری پۆل' : 'پۆلی نوێ'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی پۆل</label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                      placeholder="ناوی پۆل"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowCategoryModal(false)
                      setEditingCategory(null)
                      setNewCategoryName('')
                    }}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: '#6b7280', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    پاشگەزبوونەوە
                  </button>
                  <button
                    onClick={editingCategory ? updateCategory : createCategory}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    {editingCategory ? 'نوێکردنەوە' : 'دروستکردن'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unit Modal */}
        {showUnitModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                  {editingUnit ? 'دەستکاری یەکە' : 'یەکەی نوێ'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی یەکە</label>
                    <input
                      type="text"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                      placeholder="ناوی یەکە"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>نمادی یەکە (بۆ نموونە: kg, m, L)</label>
                    <input
                      type="text"
                      value={newUnitSymbol}
                      onChange={(e) => setNewUnitSymbol(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                      placeholder="نمادی یەکە"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowUnitModal(false)
                      setEditingUnit(null)
                      setNewUnitName('')
                      setNewUnitSymbol('')
                    }}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: '#6b7280', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    پاشگەزبوونەوە
                  </button>
                  <button
                    onClick={editingUnit ? updateUnit : createUnit}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    {editingUnit ? 'نوێکردنەوە' : 'زیادکردن'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4-Step Wizard Modal */}
        {showStockEntry && (() => {
          const item = purchaseItems[0] || {}
          const priceOfBought = Number(item.price_of_bought) || 0
          const amountOfPay = Number(item.amount_of_pay) || 0
          const debtPay = priceOfBought - amountOfPay
          const quantity = Number(item.quantity) || 0
          const sellingPrice = Number(item.selling_price) || 0
          const unitPrice = quantity > 0 ? priceOfBought / quantity : 0
          const totalBenefit = quantity > 0 ? (sellingPrice - unitPrice) * quantity : 0

          const steps = [
            { id: 1, title: 'هەنگاوی ١', subtitle: 'دابینکەر و دارایی', icon: FaTruck, color: 'blue' },
            { id: 2, title: 'هەنگاوی ٢', subtitle: 'بڕ و یەکە', icon: FaCalculator, color: 'green' },
            { id: 3, title: 'هەنگاوی ٣', subtitle: 'زانیارییەکان و بەروارەکان', icon: FaBarcode, color: 'purple' },
            { id: 4, title: 'هەنگاوی ٤', subtitle: 'پێشبینی قازانج', icon: FaChartLine, color: 'orange' }
          ]

          const nextStep = () => {
            if (currentStep < 4) setCurrentStep(currentStep + 1)
          }

          const prevStep = () => {
            if (currentStep > 1) setCurrentStep(currentStep - 1)
          }

          const canProceed = () => {
            switch (currentStep) {
              case 1: return item.supplier_id && priceOfBought > 0
              case 2: return quantity > 0 && item.unit
              case 3: return item.item_name && item.category
              case 4: return true
              default: return false
            }
          }

          const renderStepContent = () => {
            switch (currentStep) {
              case 1:
                return (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 shadow-xl border border-blue-200">
                    <div className="flex items-center mb-6">
                      <FaTruck className="text-blue-600 text-2xl ml-3" />
                      <h4 className="text-xl font-bold text-blue-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        دابینکەر و دارایی
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {/* Supplier Select */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-blue-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          دابینکەر *
                        </label>
                        <select
                          value={item.supplier_id || ''}
                          onChange={(e) => updatePurchaseItem(0, 'supplier_id', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-0 bg-white/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          style={{ fontFamily: 'var(--font-uni-salar)' }}
                        >
                          <option value="">دابینکەر هەڵبژێرە</option>
                          {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Financial Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-blue-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            نرخی کڕین (کۆی)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={toEnglishDigits(priceOfBought.toString())}
                            onChange={(e) => {
                              const sanitized = sanitizeNumericInput(e.target.value)
                              updatePurchaseItem(0, 'price_of_bought', safeStringToNumber(sanitized))
                            }}
                            className="w-full px-4 py-3 rounded-xl border-0 bg-white/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                            placeholder="0.00 IQD"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-blue-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            پارەی دراو
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={toEnglishDigits(amountOfPay.toString())}
                            onChange={(e) => {
                              const sanitized = sanitizeNumericInput(e.target.value)
                              updatePurchaseItem(0, 'amount_of_pay', safeStringToNumber(sanitized))
                            }}
                            className="w-full px-4 py-3 rounded-xl border-0 bg-white/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                            placeholder="0.00 IQD"
                          />
                        </div>
                      </div>

                      {/* Paid in Full Checkbox */}
                      <div className="flex items-center space-x-3 bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <input
                          type="checkbox"
                          id="paidInFull"
                          checked={amountOfPay === priceOfBought && priceOfBought > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updatePurchaseItem(0, 'amount_of_pay', priceOfBought)
                            } else {
                              updatePurchaseItem(0, 'amount_of_pay', 0)
                            }
                          }}
                          className="w-5 h-5 text-blue-600 bg-white border-2 border-blue-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label
                          htmlFor="paidInFull"
                          className="text-sm font-semibold text-blue-700 cursor-pointer"
                          style={{ fontFamily: 'var(--font-uni-salar)' }}
                        >
                          هەموو پارە دراوە، قەرز نییە
                        </label>
                      </div>

                      {/* Auto-calculated Debt */}
                      <div className="bg-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-blue-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            قەرز:
                          </span>
                          <span className={`text-lg font-bold ${debtPay > 0 ? 'text-red-600' : 'text-green-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                            {formatCurrency(debtPay)} IQD
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )

              case 2:
                return (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-6 shadow-xl border border-green-200">
                    <div className="flex items-center mb-6">
                      <FaCalculator className="text-green-600 text-2xl ml-3" />
                      <h4 className="text-xl font-bold text-green-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        بڕ و یەکە
                      </h4>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-green-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            بڕ *
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={toEnglishDigits(quantity.toString())}
                            onChange={(e) => {
                              const sanitized = sanitizeNumericInput(e.target.value)
                              updatePurchaseItem(0, 'quantity', safeStringToNumber(sanitized))
                            }}
                            className="w-full px-4 py-3 rounded-xl border-0 bg-white/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                            placeholder="1000"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-green-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            یەکە *
                          </label>
                          <select
                            value={item.unit || ''}
                            onChange={(e) => updatePurchaseItem(0, 'unit', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-0 bg-white/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                            style={{ fontFamily: 'var(--font-uni-salar)' }}
                          >
                            <option value="">یەکە هەڵبژێرە</option>
                            {units.map((unit) => (
                              <option key={unit.id} value={unit.name}>{unit.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Unit Price Calculator */}
                      {quantity > 0 && priceOfBought > 0 && (
                        <div className="bg-green-100 rounded-xl p-4 border border-green-200">
                          <div className="text-center">
                            <div className="text-sm text-green-700 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              نرخی یەک {item.unit}
                            </div>
                            <div className="text-2xl font-bold text-green-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatCurrency(unitPrice)} IQD /
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              ({quantity} {item.unit} × {formatCurrency(priceOfBought)} IQD)
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )

              case 3:
                return (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-6 shadow-xl border border-purple-200">
                    <div className="flex items-center mb-6">
                      <FaBarcode className="text-purple-600 text-2xl ml-3" />
                      <h4 className="text-xl font-bold text-purple-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        زانیارییەکان و بەروارەکان
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {/* Item Name */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-purple-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          ناوی کاڵا *
                        </label>
                        <input
                          type="text"
                          value={item.item_name || ''}
                          onChange={(e) => updatePurchaseItem(0, 'item_name', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-0 bg-white/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          style={{ fontFamily: 'var(--font-uni-salar)' }}
                          placeholder="ناوی کاڵا"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-purple-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          پۆل
                        </label>
                        <select
                          value={item.category || ''}
                          onChange={(e) => updatePurchaseItem(0, 'category', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-0 bg-white/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          style={{ fontFamily: 'var(--font-uni-salar)' }}
                        >
                          <option value="">پۆل هەڵبژێرە</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>{category.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Barcode Fields */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-purple-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          بارکۆدەکان
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={item.barcode1 || ''}
                            onChange={(e) => updatePurchaseItem(0, 'barcode1', sanitizeBarcode(e.target.value))}
                            className="px-3 py-2 rounded-lg border-0 bg-white/80 backdrop-blur-sm shadow focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                            placeholder="بارکۆد 1"
                          />
                          <input
                            type="text"
                            value={item.barcode2 || ''}
                            onChange={(e) => updatePurchaseItem(0, 'barcode2', sanitizeBarcode(e.target.value))}
                            className="px-3 py-2 rounded-lg border-0 bg-white/80 backdrop-blur-sm shadow focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                            placeholder="بارکۆد 2"
                          />
                          <input
                            type="text"
                            value={item.barcode3 || ''}
                            onChange={(e) => updatePurchaseItem(0, 'barcode3', sanitizeBarcode(e.target.value))}
                            className="px-3 py-2 rounded-lg border-0 bg-white/80 backdrop-blur-sm shadow focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                            placeholder="بارکۆد 3"
                          />
                          <input
                            type="text"
                            value={item.barcode4 || ''}
                            onChange={(e) => updatePurchaseItem(0, 'barcode4', sanitizeBarcode(e.target.value))}
                            className="px-3 py-2 rounded-lg border-0 bg-white/80 backdrop-blur-sm shadow focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                            placeholder="بارکۆد 4"
                          />
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-purple-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            بەرواری بەسەرچوون
                          </label>
                          <input
                            type="date"
                            value={item.expire_date || ''}
                            onChange={(e) => updatePurchaseItem(0, 'expire_date', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-0 bg-white/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-purple-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            بەرواری دروستکردن
                          </label>
                          <input
                            type="date"
                            value={item.created_date || new Date().toISOString().split('T')[0]}
                            onChange={(e) => updatePurchaseItem(0, 'created_date', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-0 bg-white/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          />
                        </div>
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-purple-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          وێنە
                        </label>

                        {/* Image Preview */}
                        {imagePreview && (
                          <div className="mb-4">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-32 object-cover rounded-xl border-2 border-purple-200 shadow-lg"
                            />
                          </div>
                        )}

                        {/* Upload Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => document.getElementById('imageUpload')?.click()}
                            className="flex items-center justify-center px-4 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl border-2 border-dashed border-purple-300 transition-all duration-300 hover:scale-105"
                            style={{ fontFamily: 'var(--font-uni-salar)' }}
                          >
                            <FaBox className="ml-2" />
                            هەڵبژاردنی وێنە
                          </button>

                          <button
                            type="button"
                            onClick={openCamera}
                            className="flex items-center justify-center px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl border-2 border-dashed border-blue-300 transition-all duration-300 hover:scale-105"
                            style={{ fontFamily: 'var(--font-uni-salar)' }}
                          >
                            📷
                            کامێرا
                          </button>
                        </div>

                        {/* Hidden File Input */}
                        <input
                          id="imageUpload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />

                        {/* Clear Image Button */}
                        {imagePreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview('')
                              setSelectedImageFile(null)
                              updatePurchaseItem(0, 'image', '')
                            }}
                            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                            style={{ fontFamily: 'var(--font-uni-salar)' }}
                          >
                            سڕینەوەی وێنە
                          </button>
                        )}
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-purple-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          تێبینی
                        </label>
                        <textarea
                          value={item.note || ''}
                          onChange={(e) => updatePurchaseItem(0, 'note', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border-0 bg-white/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                          style={{ fontFamily: 'var(--font-uni-salar)' }}
                          placeholder="تێبینی دەربارەی کاڵا..."
                        />
                      </div>
                    </div>
                  </div>
                )

              case 4:
                return (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 shadow-xl border border-orange-200">
                    <div className="flex items-center mb-6">
                      <FaChartLine className="text-orange-600 text-2xl ml-3" />
                      <h4 className="text-xl font-bold text-orange-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        پێشبینی قازانج
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {/* Selling Price */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-orange-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          نرخی فرۆشتن *
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={toEnglishDigits(sellingPrice.toString())}
                          onChange={(e) => {
                            const sanitized = sanitizeNumericInput(e.target.value)
                            updatePurchaseItem(0, 'selling_price', safeStringToNumber(sanitized))
                          }}
                          className="w-full px-4 py-3 rounded-xl border-0 bg-white/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          placeholder="0.00 IQD"
                        />
                      </div>

                      {/* Cost Price Display */}
                      <div className="bg-orange-100 rounded-xl p-4 border border-orange-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-orange-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            نرخی کڕین بە یەکە:
                          </span>
                          <span className="text-lg font-bold text-orange-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {formatCurrency(unitPrice)} IQD
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-orange-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            نرخی فرۆشتن بە یەکە:
                          </span>
                          <span className="text-lg font-bold text-orange-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {formatCurrency(sellingPrice)} IQD
                          </span>
                        </div>
                      </div>

                      {/* Total Benefit Calculation */}
                      <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-4 border border-green-300">
                        <div className="text-center">
                          <div className="text-sm text-green-700 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            کۆی قازانج
                          </div>
                          <div className={`text-3xl font-bold ${totalBenefit >= 0 ? 'text-green-800' : 'text-red-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                            {formatCurrency(totalBenefit)} IQD
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            ({formatCurrency(sellingPrice - unitPrice)} × {quantity} {item.unit})
                          </div>
                        </div>
                      </div>

                      {/* Profit Margin */}
                      {unitPrice > 0 && (
                        <div className="bg-blue-100 rounded-xl p-4 border border-blue-200">
                          <div className="text-center">
                            <div className="text-sm text-blue-700 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              ڕێژەی قازانج
                            </div>
                            <div className="text-2xl font-bold text-blue-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {((sellingPrice - unitPrice) / unitPrice * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )

              default:
                return null
            }
          }

          return (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
              <div className="w-full max-w-4xl max-h-screen overflow-y-auto rounded-3xl shadow-2xl" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                <div className="p-8">
                  <h3 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    {editingItem ? 'دەستکاری کاڵا' : 'زیادکردنی کاڵای نوێ'}
                  </h3>

                  {/* Step Indicator */}
                  <div className="mb-8">
                    <div className="flex justify-center items-center space-x-4">
                      {steps.map((step, index) => {
                        const IconComponent = step.icon
                        const isActive = currentStep === step.id
                        const isCompleted = currentStep > step.id

                        return (
                          <div key={step.id} className="flex items-center">
                            <div className={`flex flex-col items-center ${index < steps.length - 1 ? 'w-24' : ''}`}>
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                isCompleted
                                  ? 'bg-green-500 text-white'
                                  : isActive
                                    ? `bg-${step.color}-500 text-white`
                                    : 'bg-gray-200 text-gray-500'
                              }`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                {isCompleted ? '✓' : step.id}
                              </div>
                              <div className="text-center mt-2">
                                <div className={`text-xs font-semibold ${isActive ? `text-${step.color}-600` : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                  {step.title}
                                </div>
                                <div className={`text-xs ${isActive ? `text-${step.color}-500` : 'text-gray-400'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                  {step.subtitle}
                                </div>
                              </div>
                            </div>
                            {index < steps.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                                isCompleted ? 'bg-green-500' : 'bg-gray-200'
                              }`}></div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="min-h-[400px]">
                    {renderStepContent()}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="mt-8 flex justify-between items-center">
                    <div>
                      {currentStep > 1 && (
                        <button
                          onClick={prevStep}
                          className="px-6 py-3 bg-gray-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                          style={{ fontFamily: 'var(--font-uni-salar)' }}
                        >
                          <span>پێشوو</span>
                        </button>
                      )}
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          setShowStockEntry(false)
                          setCurrentStep(1)
                        }}
                        className="px-6 py-3 bg-gray-400 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        style={{ fontFamily: 'var(--font-uni-salar)' }}
                      >
                        پاشگەزبوونەوە
                      </button>

                      {currentStep < 4 ? (
                        <button
                          onClick={nextStep}
                          disabled={!canProceed()}
                          className={`px-6 py-3 font-bold rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 flex items-center space-x-2 ${
                            canProceed()
                              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          style={{ fontFamily: 'var(--font-uni-salar)' }}
                        >
                          <span>دواتر</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (editingItem) {
                              updateItem()
                            } else {
                              submitStockEntry()
                            }
                            setCurrentStep(1)
                          }}
                          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          style={{ fontFamily: 'var(--font-uni-salar)' }}
                        >
                          تۆمارکردن
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}