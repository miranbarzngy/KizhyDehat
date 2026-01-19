'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FaTh, FaList, FaEdit, FaTrash, FaSearch } from 'react-icons/fa'

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
  const [editForm, setEditForm] = useState({
    item_name: '',
    quantity: 0,
    unit: '',
    cost_price: 0,
    selling_price: 0,
    category: '',
    barcode1: '',
    barcode2: '',
    barcode3: '',
    barcode4: '',
    expire_date: '',
    note: ''
  })

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

  const addPurchaseItem = () => {
    setPurchaseItems(prev => [...prev, { item_name: '', cost_price: 0, selling_price: 0, quantity: 0, unit: 'دانە' }])
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
    console.log('🖼️ Starting image upload process...')

    if (!supabase) {
      console.error('❌ Supabase not configured')
      alert('Supabase not configured')
      return
    }

    // File size validation (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size, 'bytes (max 5MB)')
      alert('وێنەکە زۆر گەورەیە. دەبێت لە 5MB کەمتر بێت.')
      return
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type)
      alert('جۆری وێنە نادروستە. تکایە JPEG، PNG یان WebP بەکاربهێنە.')
      return
    }

    try {
      console.log('📁 File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      })

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `inventory/${fileName}`

      console.log('📤 Uploading to path:', filePath)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Upload error details:', {
          message: uploadError.message,
          details: uploadError,
          filePath: filePath,
          bucket: 'images'
        })

        // Provide specific guidance for bucket not found error
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error(`هەڵە: باکەتی 'images' لە Supabase Storage نییە.\n\nچۆن باکەت دروست بکەیت:\n1. بڕۆ بۆ Supabase Dashboard\n2. کلیکی بکە لەسەر "Storage" لە مێنۆی چەپ\n3. کلیکی بکە لەسەر "Create bucket"\n4. ناوی باکەت بنووسە: "images"\n5. هەڵبژێرە "Public bucket"\n6. کلیکی بکە لەسەر "Create bucket"\n\nدوای دروستکردنی باکەت، دووبارە هەوڵبدەوە.`)
        }

        // Provide guidance for RLS policy error
        if (uploadError.message.includes('violates row-level security policy')) {
          throw new Error(`هەڵە: ڕێگەپێدانەکانی باکەت سەپێنراوە.\n\nچۆن ڕێگەپێدانەکان چاک بکەیت:\n1. بڕۆ بۆ Supabase Dashboard > SQL Editor\n2. فایلەکەی setup_storage_policies.sql بکەرەوە\n3. هەموو کۆدەکە کۆپی بکە و لە SQL Editor دابنێ\n4. کلیکی بکە لەسەر "Run" بکە\n\nیان بە شێوەیەکی سادەتر:\n- بڕۆ بۆ Storage > images > Policies\n- زیادبکە ڕێگەپێدانێک بۆ Authenticated users بۆ INSERT و SELECT\n\nدوای چاککردنی ڕێگەپێدانەکان، دووبارە هەوڵبدەوە.`)
        }

        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      console.log('✅ Upload successful:', uploadData)

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        console.error('❌ Failed to get public URL')
        throw new Error('Failed to get public URL')
      }

      console.log('🔗 Public URL generated:', urlData.publicUrl)

      updatePurchaseItem(0, 'image', urlData.publicUrl)
      console.log('✅ Image URL updated in form')

    } catch (error) {
      console.error('💥 Image upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`هەڵە لە بارکردنی وێنە: ${errorMessage}`)
    }
  }

  const submitStockEntry = async () => {
    console.log('🚀 Starting stock entry submission...', editingItem ? 'EDIT MODE' : 'ADD MODE')

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
      alert(`دۆخی دیمۆ: کاڵاکە بە سەرکەوتوویی ${editingItem ? 'نوێکرایەوە' : 'زیادکرا'} (دیمۆ)`)
      setShowStockEntry(false)
      setSelectedSupplier('')
      setPurchaseItems([{ item_name: '', cost_price: 0, selling_price: 0, quantity: 0, unit: 'دانە' }])
      setEditingItem(null)
      return
    }

    // Convert all numeric values to ensure proper types
    const quantity = Number(item.quantity)
    const totalPurchasePrice = Number(item.total_purchase_price || 0)
    const sellingPrice = Number(item.selling_price)
    const unitCost = totalPurchasePrice > 0 ? Math.round(totalPurchasePrice / quantity) : 0

    console.log('📊 Calculated values:', {
      quantity,
      totalPurchasePrice,
      sellingPrice,
      unitCost,
      isEditing: !!editingItem
    })

    try {
      if (editingItem) {
        // ===== EDIT MODE: Update existing item =====
        console.log('✏️ Editing existing item:', editingItem.id)

        // Update inventory table
        const { error: inventoryError } = await supabase
          .from('inventory')
          .update({
            item_name: item.item_name,
            quantity: quantity,
            unit: item.unit,
            cost_price: unitCost,
            selling_price: sellingPrice,
            category: item.category || null,
            image: item.image || ''
          })
          .eq('id', editingItem.id)

        if (inventoryError) {
          console.error('❌ Inventory update error:', JSON.stringify(inventoryError, null, 2))
          throw new Error(`Inventory update failed: ${inventoryError.message}`)
        }

        // Update products table if it exists
        try {
          const { error: productError } = await supabase
            .from('products')
            .update({
              name: item.item_name,
              image: item.image || '',
              total_amount_bought: quantity,
              unit: item.unit,
              selling_price_per_unit: sellingPrice,
              cost_per_unit: unitCost,
              barcode1: item.barcode1 || '',
              barcode2: item.barcode2 || '',
              barcode3: item.barcode3 || '',
              barcode4: item.barcode4 || '',
              expire_date: item.expire_date || null,
              note: item.note || ''
            })
            .eq('name', editingItem.item_name)

          if (productError) {
            console.log('⚠️ Products table update failed, continuing...')
          } else {
            console.log('✅ Products record updated')
          }
        } catch (productError) {
          console.log('⚠️ Products table not available, skipping...')
        }

        console.log('✅ Item updated successfully!')
        alert('کاڵاکە بە سەرکەوتوویی نوێکرایەوە')

      } else {
        // ===== ADD MODE: Insert new item =====
        console.log('➕ Adding new item')

        // Validate supplier for new items
        if (!selectedSupplier || selectedSupplier.length !== 36) {
          console.error('❌ Invalid supplier_id:', selectedSupplier)
          alert('خەتا: supplier_id نادروستە')
          return
        }

        const amountPaid = Number(item.amount_paid || 0)
        const debtAmount = Number(item.debt_amount || 0)

        // ===== STEP 1: Insert into Inventory Table =====
        console.log('📦 Step 1: Inserting into inventory table...')
        const { data: insertData, error: insertError } = await supabase
          .from('inventory')
          .insert({
            item_name: item.item_name,
            quantity: quantity,
            unit: item.unit,
            cost_price: unitCost,
            selling_price: sellingPrice,
            category: item.category || null,
            image: item.image || ''
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('❌ Inventory insert error:', JSON.stringify(insertError, null, 2))
          throw new Error(`Inventory insert failed: ${insertError.message}`)
        }
        console.log('✅ Inventory record inserted')

        // ===== STEP 2: Insert into Products Table =====
        console.log('📋 Step 2: Inserting into products table...')
        try {
          const { error: productError } = await supabase
            .from('products')
            .insert({
              name: item.item_name,
              image: item.image || '',
              total_amount_bought: quantity,
              unit: item.unit,
              total_purchase_price: totalPurchasePrice,
              selling_price_per_unit: sellingPrice,
              cost_per_unit: unitCost,
              barcode1: item.barcode1 || '',
              barcode2: item.barcode2 || '',
              barcode3: item.barcode3 || '',
              barcode4: item.barcode4 || '',
              added_date: new Date().toISOString().split('T')[0],
              expire_date: item.expire_date || null,
              supplier_id: selectedSupplier,
              note: item.note || ''
            })

          if (productError) {
            console.error('❌ Products insert error:', JSON.stringify(productError, null, 2))
            console.log('⚠️ Products table insert failed, continuing...')
          } else {
            console.log('✅ Products record inserted')
          }
        } catch (productError) {
          console.log('⚠️ Products table not available, skipping...')
        }

        // ===== STEP 3: Insert Supplier Transaction =====
        console.log('💰 Step 3: Inserting supplier transaction...')
        const transactionData = {
          supplier_id: selectedSupplier,
          item_name: item.item_name,
          total_price: totalPurchasePrice,
          amount_paid: amountPaid,
          debt_amount: debtAmount,
          date: new Date().toISOString().split('T')[0]
        }

        const { error: transactionError } = await supabase
          .from('supplier_transactions')
          .insert(transactionData)

        if (transactionError) {
          console.error('❌ Supplier transaction insert error:', JSON.stringify(transactionError, null, 2))
          throw new Error(`Supplier transaction failed: ${transactionError.message}`)
        }
        console.log('✅ Supplier transaction inserted')

        // ===== STEP 4: Update Supplier Balance =====
        console.log('⚖️ Step 4: Updating supplier balance...')
        const supplier = suppliers.find(s => s.id === selectedSupplier)
        if (supplier) {
          const newBalance = supplier.balance + debtAmount
          console.log(`Balance update: ${supplier.balance} + ${debtAmount} = ${newBalance}`)

          const { error: balanceError } = await supabase
            .from('suppliers')
            .update({ balance: newBalance })
            .eq('id', selectedSupplier)

          if (balanceError) {
            console.error('❌ Supplier balance update error:', JSON.stringify(balanceError, null, 2))
            throw new Error(`Supplier balance update failed: ${balanceError.message}`)
          }
          console.log('✅ Supplier balance updated')
        }

        // ===== STEP 5: Insert Expense Record =====
        console.log('💸 Step 5: Inserting expense record...')
        const { error: expenseError } = await supabase
          .from('expenses')
          .insert({
            description: `کڕینی کۆگا - ${item.item_name} (${quantity} ${item.unit})`,
            amount: totalPurchasePrice,
            category: 'inventory_purchase',
            date: new Date().toISOString().split('T')[0]
          })

        if (expenseError) {
          console.error('❌ Expense insert error:', JSON.stringify(expenseError, null, 2))
          throw new Error(`Expense record failed: ${expenseError.message}`)
        }
        console.log('✅ Expense record inserted')

        console.log('🎉 New item added successfully!')
        alert('کاڵاکە بە سەرکەوتوویی زیادکرا و هەموو تۆمارەکان نوێکران')
      }

      // Reset form
      setShowStockEntry(false)
      setSelectedSupplier('')
      setPurchaseItems([{ item_name: '', cost_price: 0, selling_price: 0, quantity: 0, unit: 'دانە' }])
      setEditingItem(null)

      // Refresh data
      fetchInventory()
      if (!editingItem) fetchSuppliers() // Only refresh suppliers for new items

    } catch (error) {
      console.error('💥 Operation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'هەڵەی نەناسراو'
      alert(`هەڵە لە ${editingItem ? 'نوێکردنی' : 'زیادکردنی'} کاڵا: ${errorMessage}`)
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

  // Get unique categories for filter
  const getUniqueCategories = () => {
    const categories = inventory.map(item => item.category).filter(Boolean)
    return [...new Set(categories)]
  }

  // Category management functions
  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('ناوی پۆل پێویستە')
      return
    }

    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    try {
      console.log('Adding category:', newCategoryName.trim())
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: newCategoryName.trim() })
        .select()

      if (error) {
        console.error('Category insert error:', error)
        throw error
      }

      console.log('Category added successfully:', data)
      alert('پۆلەکە بە سەرکەوتوویی زیادکرا')
      setNewCategoryName('')
      fetchCategories()
    } catch (error) {
      console.error('Error adding category:', error)
      alert(`هەڵە لە زیادکردنی پۆل: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const editCategory = async () => {
    if (!editingCategory || !supabase) return

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editingCategory.name })
        .eq('id', editingCategory.id)

      if (error) throw error

      alert('پۆلەکە بە سەرکەوتوویی نوێکرایەوە')
      setEditingCategory(null)
      setShowCategoryModal(false)
      fetchCategories()
    } catch (error) {
      console.error('Error updating category:', error)
      alert('هەڵە لە نوێکردنی پۆل')
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (!supabase) return

    // Check if category is being used
    const itemsUsingCategory = inventory.filter(item => item.category === categories.find(c => c.id === categoryId)?.name)
    if (itemsUsingCategory.length > 0) {
      alert(`ناتوانرێت پۆلەکە بسڕدرێتەوە چونکە ${itemsUsingCategory.length} کاڵا بەکاری دەهێنێت`)
      return
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      alert('پۆلەکە بە سەرکەوتوویی سڕدرایەوە')
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('هەڵە لە سڕینەوەی پۆل')
    }
  }

  const openCategoryEdit = (category: Category) => {
    setEditingCategory(category)
    setShowCategoryModal(true)
  }

  // Enhanced search function
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

    // Search by unit
    if (item.unit?.toLowerCase().includes(searchLower)) return true

    // Search by note
    if (item.note?.toLowerCase().includes(searchLower)) return true

    return false
  })



  // Edit item functions
  const openEditModal = async (item: InventoryItem) => {
    setEditingItem(item)

    // Fetch complete item data from products table if available
    let completeItemData = {
      item_name: item.item_name,
      cost_price: item.cost_price || 0,
      selling_price: item.selling_price || 0,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category || '',
      total_purchase_price: (item.cost_price || 0) * item.quantity,
      amount_paid: (item.cost_price || 0) * item.quantity, // Assume fully paid for editing
      debt_amount: 0,
      barcode1: '',
      barcode2: '',
      barcode3: '',
      barcode4: '',
      expire_date: item.expire_date || '',
      image: item.image || '',
      note: item.note || ''
    }

    let productData: any = null

    // Try to fetch additional data from products table
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('name', item.item_name)
          .single()

        if (!error && data) {
          productData = data
          // Merge product data with inventory data
          completeItemData = {
            ...completeItemData,
            barcode1: productData.barcode1 || '',
            barcode2: productData.barcode2 || '',
            barcode3: productData.barcode3 || '',
            barcode4: productData.barcode4 || '',
            expire_date: productData.expire_date || '',
            image: productData.image || item.image || '',
            note: productData.note || '',
            // Calculate total purchase price from product data if available
            total_purchase_price: productData.total_purchase_price || completeItemData.total_purchase_price,
            cost_price: productData.cost_per_unit || completeItemData.cost_price,
            selling_price: productData.selling_price_per_unit || completeItemData.selling_price
          }
        }
      } catch (error) {
        console.log('Products table data not available, using inventory data only')
      }
    }

    setPurchaseItems([completeItemData])

    // Set the selected supplier if available
    if (productData?.supplier_id) {
      setSelectedSupplier(productData.supplier_id)
    }

    setShowStockEntry(true) // Use the same modal as add item
  }

  const updateEditForm = (field: string, value: string | number) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const submitEditForm = async () => {
    if (!editingItem || !supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت کاڵا دەستکاری بکرێت')
      return
    }

    try {
      // Update inventory table
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({
          item_name: editForm.item_name,
          quantity: editForm.quantity,
          unit: editForm.unit,
          cost_price: editForm.cost_price,
          selling_price: editForm.selling_price,
          category: editForm.category
        })
        .eq('id', editingItem.id)

      if (inventoryError) throw inventoryError

      // Update products table if it exists
      try {
        const { error: productError } = await supabase
          .from('products')
          .update({
            name: editForm.item_name,
            barcode1: editForm.barcode1,
            barcode2: editForm.barcode2,
            barcode3: editForm.barcode3,
            barcode4: editForm.barcode4,
            expire_date: editForm.expire_date || null,
            note: editForm.note
          })
          .eq('name', editingItem.item_name)

        if (productError) {
          console.log('Products table update failed, continuing...')
        }
      } catch (productError) {
        console.log('Products table not available, skipping...')
      }

      alert('کاڵاکە بە سەرکەوتوویی نوێکرایەوە')
      setShowEditModal(false)
      setEditingItem(null)
      fetchInventory()
    } catch (error) {
      console.error('Error updating item:', error)
      alert('هەڵە لە نوێکردنی کاڵا')
    }
  }

  // Delete item functions
  const confirmDelete = (item: InventoryItem) => {
    setItemToDelete(item)
    setShowDeleteConfirm(true)
  }

  const executeDelete = async () => {
    if (!itemToDelete || !supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت کاڵا بسڕدرێتەوە')
      return
    }

    console.log('🗑️ Starting delete operation for item:', itemToDelete.item_name, 'ID:', itemToDelete.id)

    try {
      // Check if item is referenced in sale_items table
      console.log('🔍 Checking for references in sale_items...')
      const { data: saleReferences, error: saleCheckError } = await supabase
        .from('sale_items')
        .select('id')
        .eq('item_id', itemToDelete.id)
        .limit(1)

      if (saleCheckError) {
        console.error('❌ Error checking sale references:', saleCheckError)
      } else if (saleReferences && saleReferences.length > 0) {
        console.error('❌ Cannot delete: Item is referenced in sales')
        alert('ناتوانرێت کاڵاکە بسڕدرێتەوە چونکە لە فرۆشتنەکاندا بەکارهاتووە')
        return
      }

      // Delete from products table first (if exists)
      console.log('📋 Deleting from products table...')
      try {
        const { error: productError } = await supabase
          .from('products')
          .delete()
          .eq('name', itemToDelete.item_name)

        if (productError) {
          console.error('❌ Products table delete error:', productError)
          console.log('Products table delete failed, continuing...')
        } else {
          console.log('✅ Products record deleted')
        }
      } catch (productError) {
        console.error('❌ Products table error:', productError)
        console.log('Products table not available, skipping...')
      }

      // Delete from inventory table
      console.log('📦 Deleting from inventory table...')
      const { error: inventoryError } = await supabase
        .from('inventory')
        .delete()
        .eq('id', itemToDelete.id)

      if (inventoryError) {
        console.error('❌ Inventory delete error:', inventoryError)
        throw inventoryError
      }

      console.log('✅ Inventory record deleted successfully')
      alert('کاڵاکە بە سەرکەوتوویی سڕدرایەوە')
      setShowDeleteConfirm(false)
      setItemToDelete(null)
      fetchInventory()
    } catch (error) {
      console.error('💥 Delete operation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`هەڵە لە سڕینەوەی کاڵا: ${errorMessage}`)
    }
  }

  if (loading) {
    return <div className="text-center">چاوەڕوانبە...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--theme-primary)' }}>بەڕێوەبردنی کاڵاکان</h1>

      {/* Category Management Section */}
      <div className="mb-8 p-6 rounded-lg shadow-md" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
        <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
          بەڕێوەبردنی پۆلەکان
        </h2>

        {/* Add Category Form */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="ناوی پۆلە نوێیەکە"
            className="flex-1 px-4 py-3 rounded-lg border backdrop-blur-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              borderColor: 'rgba(0, 0, 0, 0.1)',
              fontFamily: 'var(--font-uni-salar)',
              color: 'var(--theme-primary)'
            }}
          />
          <button
            onClick={addCategory}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: 'var(--theme-accent)',
              color: '#ffffff',
              fontFamily: 'var(--font-uni-salar)'
            }}
          >
            زیادکردن
          </button>
        </div>

        {/* Categories List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="p-4 rounded-lg backdrop-blur-md border transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold" style={{
                  color: 'var(--theme-primary)',
                  fontFamily: 'var(--font-uni-salar)'
                }}>
                  {category.name}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openCategoryEdit(category)}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
                    style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}
                  >
                    دەستکاری
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                    style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}
                  >
                    سڕینەوە
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              هیچ پۆلێک نییە. پۆلە نوێیەک زیادبکە.
            </p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <button
          onClick={() => {
            console.log('🖱️ Add Item button clicked')
            setShowStockEntry(true)
            console.log('📂 Modal state set to true')
          }}
          className="px-4 py-2 rounded-md text-white transition-colors duration-200"
          style={{ backgroundColor: 'var(--theme-accent)' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          زیادکردنی کاڵا
        </button>
      </div>

      <div className="p-6 rounded-lg shadow-md" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--theme-primary)' }}>لیستی کاڵا</h2>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <FaTh size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <FaList size={18} />
            </button>
          </div>
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
                    onClick={() => openEditModal(item)}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <FaEdit size={14} />
                    <span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>دەستکاری</span>
                  </button>
                  <button
                    onClick={() => confirmDelete(item)}
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

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr style={{ background: 'var(--theme-muted)' }}>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>ناو</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>بڕ</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>یەکە</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>نرخی کڕین</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>نرخی فرۆشتن</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>پۆل</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>کردارەکان</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
                    <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>{item.item_name}</td>
                    <td className="px-3 py-3" style={{ color: isLowStock(item) ? '#dc2626' : 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em', fontWeight: 'bold' }}>
                      {item.quantity}
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>{item.unit}</td>
                    <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                      {Math.round(item.cost_price || 0)} د.ع
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                      {Math.round(item.selling_price || 0)} د.ع
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                      {item.category || '-'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button
                          onClick={() => confirmDelete(item)}
                          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                        {purchaseItems[0]?.image && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>وێنەی ئێستا:</p>
                            <img
                              src={purchaseItems[0].image}
                              alt="Current item image"
                              className="w-24 h-24 object-cover rounded-lg border"
                              style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}
                            />
                          </div>
                        )}
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
                        <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          {purchaseItems[0]?.image ? 'وێنە نوێ هەڵبژێرە بۆ گۆڕینی وێنەی ئێستا' : 'وێنەیەک هەڵبژێرە'}
                        </p>
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
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>پۆل *</label>
                        <select
                          value={purchaseItems[0]?.category || ''}
                          onChange={(e) => updatePurchaseItem(0, 'category', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                          style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                          required
                        >
                          <option value="">هەڵبژاردنی پۆل</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
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

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕی پارەی دراو</label>
                        <input
                          type="text"
                          value={purchaseItems[0]?.amount_paid || ''}
                          onChange={(e) => {
                            const westernNum = convertKurdishToWestern(e.target.value)
                            const amountPaid = parseFloat(westernNum) || 0
                            const totalPrice = purchaseItems[0]?.total_purchase_price || 0
                            const debtAmount = Math.max(0, totalPrice - amountPaid)
                            updatePurchaseItem(0, 'amount_paid', amountPaid)
                            updatePurchaseItem(0, 'debt_amount', debtAmount)
                          }}
                          className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                          style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                          placeholder="0.00 د.ع"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕی قەرز</label>
                        <input
                          type="text"
                          value={purchaseItems[0]?.debt_amount ? purchaseItems[0].debt_amount.toFixed(2) : '0.00'}
                          readOnly
                          className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm bg-gray-100"
                          style={{ borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)', color: purchaseItems[0]?.debt_amount > 0 ? '#dc2626' : '#16a34a' }}
                          placeholder="0.00 د.ع"
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

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-2xl max-h-screen overflow-y-auto rounded-2xl shadow-2xl" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                دەستکاریکردنی کاڵا
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناو</label>
                    <input
                      type="text"
                      value={editForm.item_name}
                      onChange={(e) => updateEditForm('item_name', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ</label>
                    <input
                      type="number"
                      value={editForm.quantity}
                      onChange={(e) => updateEditForm('quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>یەکە</label>
                    <select
                      value={editForm.unit}
                      onChange={(e) => updateEditForm('unit', e.target.value)}
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
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>پۆل</label>
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => updateEditForm('category', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                      placeholder="خۆراك، شیرینی..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی کڕین</label>
                    <input
                      type="number"
                      value={editForm.cost_price}
                      onChange={(e) => updateEditForm('cost_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی فرۆشتن</label>
                    <input
                      type="number"
                      value={editForm.selling_price}
                      onChange={(e) => updateEditForm('selling_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بارکۆدی 1</label>
                    <input
                      type="text"
                      value={editForm.barcode1}
                      onChange={(e) => updateEditForm('barcode1', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بارکۆدی 2</label>
                    <input
                      type="text"
                      value={editForm.barcode2}
                      onChange={(e) => updateEditForm('barcode2', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بارکۆدی 3</label>
                    <input
                      type="text"
                      value={editForm.barcode3}
                      onChange={(e) => updateEditForm('barcode3', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بارکۆدی 4</label>
                    <input
                      type="text"
                      value={editForm.barcode4}
                      onChange={(e) => updateEditForm('barcode4', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                      style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەرواری بەسەرچوون</label>
                  <input
                    type="date"
                    value={editForm.expire_date}
                    onChange={(e) => updateEditForm('expire_date', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>تێبینی</label>
                  <textarea
                    value={editForm.note}
                    onChange={(e) => updateEditForm('note', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm resize-none"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: '#6b7280', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  onClick={submitEditForm}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                >
                  نوێکردنەوە
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Edit Modal */}
      {showCategoryModal && editingCategory && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                دەستکاریکردنی پۆل
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی پۆل</label>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: '#6b7280', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  onClick={editCategory}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                >
                  نوێکردنەوە
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                  دڵنیای لە سڕینەوە؟
                </h3>
                <p className="text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  ئایا دڵنیای لە سڕینەوەی <strong>{itemToDelete.item_name}</strong>؟
                </p>
                <p className="text-sm text-red-600 mt-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  ئەم کردارە ناتوانرێت پاشگەز بکرێتەوە
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: '#6b7280', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  onClick={executeDelete}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: '#dc2626', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                >
                  سڕینەوە
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
