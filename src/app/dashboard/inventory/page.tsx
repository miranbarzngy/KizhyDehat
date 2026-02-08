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
  has_sales?: boolean
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
  price_of_bought?: number
  amount_of_pay?: number
  debt_pay?: number
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
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([{ item_name: '', cost_price: 0, selling_price: 0, quantity: 0, unit: 'دانە' }])
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

  useEffect(() => { fetchInventory(); fetchSuppliers(); fetchCategories(); fetchUnits() }, [])

  const fetchCategories = async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('categories').select('*').order('name')
    if (error) console.error('Error fetching categories:', error)
    else setCategories(data || [])
  }

  const createCategory = async () => {
    if (!newCategoryName.trim()) { alert('تکایە ناوی پۆل بنووسە'); return }
    if (!supabase) { alert('دۆخی دیمۆ: پۆل دروست نەکراوە'); return }
    const { error } = await supabase.from('categories').insert({ name: newCategoryName.trim() })
    if (error) { alert('هەڵە لە دروستکردنی پۆل'); console.error(error) }
    else { alert('پۆل بە سەرکەوتوویی دروستکرا'); setShowCategoryModal(false); setNewCategoryName(''); fetchCategories() }
  }

  const updateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) { alert('تکایە ناوی پۆل بنووسە'); return }
    if (!supabase) { alert('دۆخی دیمۆ: پۆل نوێ نەکرایەوە'); return }
    const { error } = await supabase.from('categories').update({ name: newCategoryName.trim() }).eq('id', editingCategory.id)
    if (error) { alert('هەڵە لە نوێکردنەوەی پۆل'); console.error(error) }
    else { alert('پۆل بە سەرکەوتوویی نوێکرایەوە'); setShowCategoryModal(false); setEditingCategory(null); setNewCategoryName(''); fetchCategories() }
  }

  const deleteCategory = async (categoryId: string, categoryName: string) => {
    const itemsWithCategory = inventory.filter(item => item.category === categoryName)
    if (itemsWithCategory.length > 0) { alert(`ناتوانرێت پۆل بسڕدرێتەوە چونکە ${itemsWithCategory.length} کاڵا بەکاردەهێنن.`); return }
    if (!confirm(`دڵنیایت لە سڕینەوەی پۆلی "${categoryName}"؟`)) return
    if (!supabase) { alert('دۆخی دیمۆ: پۆل سڕاوە نەکراوە'); return }
    const { error } = await supabase.from('categories').delete().eq('id', categoryId)
    if (error) { alert('هەڵە لە سڕینەوەی پۆل'); console.error(error) }
    else { alert('پۆل بە سەرکەوتوویی سڕایەوە'); fetchCategories() }
  }

  const fetchUnits = async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('units').select('*').order('name')
    if (error) console.error('Error fetching units:', error)
    else setUnits(data || [])
  }

  const createUnit = async () => {
    if (!newUnitName.trim()) { alert('تکایە ناوی یەکە بنووسە'); return }
    if (!supabase) { alert('دۆخی دیمۆ: یەکە بە سەرکەوتوویی دروستکرا'); setShowUnitModal(false); setNewUnitName(''); setNewUnitSymbol(''); return }
    let { error } = await supabase.from('units').insert({ name: newUnitName.trim(), symbol: newUnitSymbol.trim() || null }).select()
    if (error?.code === 'PGRST204' && error.message.includes('symbol')) {
      const fallback = await supabase.from('units').insert({ name: newUnitName.trim() }).select()
      error = fallback.error
    }
    if (error) { alert('هەڵە لە دروستکردنی یەکە'); console.error(error) }
    else { alert('یەکە بە سەرکەوتوویی دروستکرا'); setEditingUnit(null); setNewUnitName(''); setNewUnitSymbol(''); fetchUnits() }
  }

  const updateUnit = async () => {
    if (!editingUnit || !newUnitName.trim()) { alert('تکایە ناوی یەکە بنووسە'); return }
    if (!supabase) { alert('دۆخی دیمۆ: یەکە نوێ نەکرایەوە'); return }
    const { error } = await supabase.from('units').update({ name: newUnitName.trim(), symbol: newUnitSymbol.trim() || null }).eq('id', editingUnit.id)
    if (error) { alert('هەڵە لە نوێکردنەوەی یەکە'); console.error(error) }
    else { alert('یەکە بە سەرکەوتوویی نوێکرایەوە'); setEditingUnit(null); setNewUnitName(''); setNewUnitSymbol(''); fetchUnits() }
  }

  const deleteUnit = async (unitId: string, unitName: string) => {
    const itemsWithUnit = inventory.filter(item => item.unit === unitName)
    if (itemsWithUnit.length > 0) { alert(`ناتوانرێت یەکە بسڕدرێتەوە چونکە ${itemsWithUnit.length} کاڵا بەکاردەهێنن.`); return }
    if (!confirm(`دڵنیایت لە سڕینەوەی یەکەی "${unitName}"؟`)) return
    if (!supabase) { alert('دۆخی دیمۆ: یەکە سڕاوە نەکراوە'); return }
    const { error } = await supabase.from('units').delete().eq('id', unitId)
    if (error) { alert('هەڵە لە سڕینەوەی یەکە'); console.error(error) }
    else { alert('یەکە بە سەرکەوتوویی سڕایەوە'); fetchUnits() }
  }

  const fetchInventory = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    try {
      const { data: inventoryData, error: inventoryError } = await supabase.from('inventory').select('id,item_name,quantity,unit,low_stock_threshold,cost_price,selling_price,category,is_online_visible,image,expire_date').or('is_archived.is.null,is_archived.eq.false').gt('quantity', 0).order('created_at', { ascending: false }).limit(50)
      if (inventoryError) throw inventoryError
      let itemsWithSales: string[] = []
      try { const { data: salesData } = await supabase.from('sale_items').select('item_id'); if (salesData) itemsWithSales = salesData.map(s => s.item_id) } catch {}
      const mergedInventory = (inventoryData || []).map((inventoryItem: any) => ({ ...inventoryItem, supplier_name: '', note: '', has_sales: itemsWithSales.includes(inventoryItem.id) }))
      setInventory(mergedInventory)
    } catch (error) { console.error('Error fetching inventory:', error) }
    finally { setLoading(false) }
  }

  const fetchArchivedItems = async () => {
    if (!supabase || archivedItems.length > 0) return
    try {
      const { data: archivedData, error: archivedError } = await supabase.from('inventory').select('id,item_name,quantity,unit,low_stock_threshold,cost_price,selling_price,category,image,expire_date').or('is_archived.eq.true,quantity.lte.0').order('created_at', { ascending: false }).limit(50)
      if (archivedError) throw archivedError
      setArchivedItems((archivedData || []).map((item: any) => ({ ...item, supplier_name: '', note: '' })))
    } catch (error) { console.error('Error fetching archived items:', error) }
  }

  const fetchSuppliers = async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('suppliers').select('id, name, balance')
    if (error) console.error('Error fetching suppliers:', error)
    else setSuppliers(data || [])
  }

  const updatePurchaseItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    setPurchaseItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
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
    input.capture = 'environment'
    input.onchange = (e) => handleImageUpload(e as any)
   