'use client'

import { useSyncPause } from '@/contexts/SyncPauseContext'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  FaArrowLeft,
  FaArrowRight,
  FaBalanceScale,
  FaBox,
  FaCalculator,
  FaCheck,
  FaExclamationTriangle,
  FaSpinner,
  FaTag,
  FaTrash,
  FaUpload
} from 'react-icons/fa'
import type { Product } from './types'

interface AddItemModalProps {
  showStockEntry: boolean
  setShowStockEntry: (show: boolean) => void
  currentStep: number
  setCurrentStep: (step: number) => void
  editingItem: Product | null
  formData: any
  setFormData: (data: any) => void
  suppliers: any[]
  units: any[]
  onSuccess: () => void
  onAddUnit?: () => void
  onAddCategory?: () => void
}

interface Supplier { id: string; name: string }
interface Unit { id: string; name: string; symbol?: string }
interface Category { id: string; name: string }

type FormData = Record<string, any>

export default function AddItemModal({
  showStockEntry,
  setShowStockEntry,
  currentStep,
  setCurrentStep,
  editingItem,
  formData,
  setFormData,
  suppliers,
  units,
  onSuccess,
  onAddUnit,
  onAddCategory
}: AddItemModalProps) {
  const { pauseSync, resumeSync } = useSyncPause()
  const [categories, setCategories] = useState<Category[]>([])
  const [localUnits, setLocalUnits] = useState<Unit[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [unitsLoading, setUnitsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch categories from database - runs every time modal opens
  useEffect(() => {
    if (!showStockEntry) return
    
    const fetchData = async () => {
      setCategoriesLoading(true)
      setUnitsLoading(true)
      
      if (!supabase) {
        console.log('No supabase client - using props')
        // Use props if available
        if (units && units.length > 0) {
          const uniqueCategories = categories.filter((c: any, i: number, arr: any[]) => 
            arr.findIndex((x: any) => x.name === c.name) === i
          )
          setCategories(uniqueCategories)
        }
        setCategoriesLoading(false)
        if (units && units.length > 0) {
          const uniqueUnits = units.filter((u: any, i: number, arr: any[]) => 
            arr.findIndex((x: any) => x.name === u.name) === i
          )
          console.log('Using units from props:', uniqueUnits)
          setLocalUnits(uniqueUnits)
        }
        setUnitsLoading(false)
        return
      }
      
      try {
        console.log('Fetching categories and units from database...')
        
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase.from('categories').select('*').order('name')
        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError)
          setCategories([])
        } else {
          console.log('Categories fetched:', categoriesData)
          const uniqueCategories = categoriesData ? categoriesData.filter((category, index, self) => 
            index === self.findIndex((c) => c.name === category.name)
          ) : []
          setCategories(uniqueCategories)
        }
        
        // Fetch units
        const { data: unitsData, error: unitsError } = await supabase.from('units').select('*').order('name')
        if (unitsError) {
          console.error('Error fetching units:', unitsError)
          setLocalUnits([])
        } else {
          console.log('Units fetched from DB:', unitsData)
          const uniqueUnits = unitsData ? unitsData.filter((unit, index, self) => 
            index === self.findIndex((u) => u.name === unit.name)
          ) : []
          console.log('Unique units:', uniqueUnits)
          setLocalUnits(uniqueUnits)
        }
      } catch (error) {
        console.error('Exception fetching data:', error)
        setCategories([])
        setLocalUnits([])
      } finally {
        setCategoriesLoading(false)
        setUnitsLoading(false)
      }
    }
    
    fetchData()
  }, [showStockEntry, units])

  // Block browser refresh during submission
  useEffect(() => {
    if (isSubmitting) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = 'تۆمارکردن لە پڕۆسەدایە، تکایە چاوەڕوانبە!'
        return e.returnValue
      }
      window.addEventListener('beforeunload', handler)
      return () => {
        window.removeEventListener('beforeunload', handler)
      }
    }
  }, [isSubmitting])

  // Calculate unit cost from price_of_bought and quantity
  const unitCost = formData.quantity > 0 ? formData.price_of_bought / formData.quantity : formData.price_of_bought
  const profitAmount = formData.selling_price - unitCost
  const profitRate = unitCost > 0 ? (profitAmount / unitCost) * 100 : 0
  
  // Calculate total price automatically
  const totalPrice = formData.quantity > 0 && formData.selling_price > 0 
    ? formData.quantity * formData.selling_price 
    : 0

  const generateBarcode4 = () => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `LOC-${timestamp}-${random}`
  }

  useEffect(() => {
    if (showStockEntry && !formData.barcode4) {
      setFormData((prev: FormData) => ({ ...prev, barcode4: generateBarcode4() }))
    }
  }, [showStockEntry])

  const handleBarcode3Blur = () => {
    if (!formData.barcode4) {
      setFormData((prev: FormData) => ({ ...prev, barcode4: generateBarcode4() }))
    }
  }

  const generateReferenceId = () => {
    // Generate a unique reference ID that will be used to link all related records
    return crypto.randomUUID()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !supabase) return
    try {
      const fileName = `${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('product-images').upload(fileName, file)
      if (error) throw error
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
      setFormData((prev: FormData) => ({ ...prev, image: urlData.publicUrl }))
    } catch (error) {
      setErrorMessage('هەڵە لە ئەپلۆدکردنی وێنە')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const canProceed = () => {
    if (currentStep === 1) return formData.supplier_id && formData.price_of_bought > 0
    if (currentStep === 2) return formData.quantity > 0
    if (currentStep === 3) return formData.name?.trim() && formData.category
    return true
  }

  const nextStep = () => {
    if (!canProceed()) {
      setErrorMessage('تکایە هەموو زانیارییەکان پڕبکەرەوە')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    setCurrentStep(Math.min(currentStep + 1, 4))
  }
  const prevStep = () => setCurrentStep(Math.max(currentStep - 1, 1))

  const submitItem = async () => {
    if (!formData.name?.trim() || !formData.quantity || !formData.selling_price) {
      setErrorMessage('تکایە هەموو زانیارییە پێویستەکان پڕبکەرەوە')
      return
    }
    if (!supabase) {
      setShowStockEntry(false)
      onSuccess()
      return
    }
    
    setIsSubmitting(true)
    
    // 1. WAKE LOCK - Prevent browser from sleeping
    let wakeLock: any = null
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await (navigator as any).wakeLock?.request('screen')
        console.log('🔒 WakeLock acquired')
      }
    } catch (e) {
      console.warn('WakeLock not supported:', e)
    }
    
    // 2. PREPARE DATA
    const productsData = {
      name: formData.name.trim(),
      total_amount_bought: Number(formData.quantity),
      unit: formData.unit,
      total_purchase_price: Number(formData.price_of_bought),
      selling_price_per_unit: Number(formData.selling_price),
      cost_per_unit: unitCost,
      category: formData.category || null,
      image: formData.image || null,
      barcode1: formData.barcode1 || null,
      barcode2: formData.barcode2 || null,
      barcode3: formData.barcode3 || null,
      barcode4: formData.barcode4 || null,
      added_date: formData.added_date,
      expire_date: formData.expire_date || null,
      supplier_id: formData.supplier_id || null,
      note: formData.note || null
    }
    
    // 3. LOCAL STORAGE BACKUP - Zombie proof!
    const backupData = {
      productsData,
      formData: {
        supplier_id: formData.supplier_id,
        is_not_fully_paid: formData.is_not_fully_paid,
        remain_amount: formData.remain_amount
      },
      timestamp: Date.now(),
      editingItemId: editingItem?.id || null
    }
    localStorage.setItem('zombie_submission', JSON.stringify(backupData))
    console.log('💾 Zombie submission backup saved')
    
    try {
      pauseSync('AddItemModal.submitItem')
      
      // Step 1: Insert into products table FIRST (atomic)
      let error
      if (editingItem) {
        // When editing, ONLY update the products table - don't touch purchase_expenses
        ({ error } = await supabase.from('products').update(productsData).eq('id', editingItem.id))
        console.log('✅ Product updated in products table:', formData.name)
        
        // Show success notification for editing
        setErrorMessage('کاڵاکە بە سەرکەوتوویی نوێکرایەوە')
        setTimeout(() => setErrorMessage(''), 3000)
      } else {
        // Generate a unique reference_id to link all related records
        const referenceId = generateReferenceId()
        
        // When adding new, insert into products and track expense
        const productsDataWithRef = {
          ...productsData,
          reference_id: referenceId
        }
        
        ({ error } = await supabase.from('products').insert(productsDataWithRef))
        
        if (error) throw error
        console.log('✅ Product inserted into products table:', formData.name, 'with reference_id:', referenceId)
        
        // Step 2: Sync to purchase_expenses for expense tracking (only for NEW items)
        if (formData.supplier_id && formData.price_of_bought > 0) {
          const { error: purchaseError } = await supabase.from('purchase_expenses').insert({
            item_name: formData.name.trim(),
            total_purchase_price: Number(formData.price_of_bought),
            total_amount_bought: Number(formData.quantity),
            unit: formData.unit,
            purchase_date: formData.added_date,
            reference_id: referenceId
          })
          
          if (purchaseError) {
            // Rollback: Delete the product we just created
            await supabase.from('products').delete().eq('reference_id', referenceId)
            throw new Error(`هەڵە لە تۆمارکردنی خەرجی: ${purchaseError.message}`)
          }
          console.log('✅ Expense tracked in purchase_expenses:', formData.name, 'with reference_id:', referenceId)
        }
        
        // Step 3: Track transactions and debts (only for NEW items)
        if (formData.is_not_fully_paid && formData.remain_amount > 0) {
          // Partial payment - record debt
          const { error: transactionError } = await supabase.from('supplier_transactions').insert({
            supplier_id: formData.supplier_id,
            item_name: formData.name.trim(),
            total_price: Number(formData.price_of_bought),
            amount_paid: Number(formData.price_of_bought) - Number(formData.remain_amount),
            debt_amount: Number(formData.remain_amount),
            date: formData.added_date,
            reference_id: referenceId
          })
          
          if (transactionError) {
            // Rollback: Delete product and expense
            await supabase.from('products').delete().eq('reference_id', referenceId)
            await supabase.from('purchase_expenses').delete().eq('reference_id', referenceId)
            throw new Error(`هەڵە لە تۆمارکردنی مامەڵە: ${transactionError.message}`)
          }
          
          const { error: debtError } = await supabase.from('supplier_debts').insert({
            supplier_id: formData.supplier_id,
            amount: formData.remain_amount,
            note: formData.name,
            date: formData.added_date,
            reference_id: referenceId
          })
          
          if (debtError) {
            // Rollback: Delete product, expense, and transaction
            await supabase.from('products').delete().eq('reference_id', referenceId)
            await supabase.from('purchase_expenses').delete().eq('reference_id', referenceId)
            await supabase.from('supplier_transactions').delete().eq('reference_id', referenceId)
            throw new Error(`هەڵە لە تۆمارکردنی قەرز: ${debtError.message}`)
          }
          
          console.log('✅ Partial payment tracked:', { debt: formData.remain_amount, reference_id: referenceId })
        } else {
          // Full payment
          const { error: transactionError } = await supabase.from('supplier_transactions').insert({
            supplier_id: formData.supplier_id,
            item_name: formData.name.trim(),
            total_price: Number(formData.price_of_bought),
            amount_paid: Number(formData.price_of_bought),
            debt_amount: 0,
            date: formData.added_date,
            reference_id: referenceId
          })
          
          if (transactionError) {
            // Rollback: Delete product and expense
            await supabase.from('products').delete().eq('reference_id', referenceId)
            await supabase.from('purchase_expenses').delete().eq('reference_id', referenceId)
            throw new Error(`هەڵە لە تۆمارکردنی مامەڵە: ${transactionError.message}`)
          }
          
          console.log('✅ Full payment tracked in supplier_transactions with reference_id:', referenceId)
        }
      }
      
      // Success
      console.log('✅ All records saved successfully')
      localStorage.removeItem('zombie_submission')
      console.log('💾 Zombie backup cleared')
      setIsSubmitting(false)
      setShowStockEntry(false)
      onSuccess()
    } catch (e: any) {
      console.error('❌ Error saving:', e.message, e.details, e.hint)
      setErrorMessage(`هەڵە: ${e?.message || 'نادیار'}`)
      setIsSubmitting(false)
    } finally {
      resumeSync('AddItemModal.submitItem')
      if (wakeLock) {
        wakeLock.release().catch(() => {})
      }
    }
  }

  if (!showStockEntry) return null
  const progress = (currentStep / 4) * 100

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div 
        className="w-full max-w-2xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
        style={{ 
          backgroundColor: 'var(--theme-card-bg)',
          border: '1px solid var(--theme-card-border)'
        }}
      >
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mb-4 p-4 rounded-xl flex items-center gap-2"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#dc2626'
            }}
          >
            <FaExclamationTriangle />
            <span style={{ fontFamily: 'var(--font-uni-salar)' }}>{errorMessage}</span>
          </motion.div>
        )}
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8rem', color: 'var(--theme-secondary)' }}>
              قۆناغ {currentStep} لە 4
            </span>
            <span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8rem', color: 'var(--theme-secondary)' }}>
              {currentStep === 1 && 'کڕین و قەرز'}
              {currentStep === 2 && 'بڕ و یەکە'}
              {currentStep === 3 && 'ناساندن'}
              {currentStep === 4 && 'نرخ و قازانج'}
            </span>
          </div>
          <div 
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--theme-muted)' }}
          >
            <motion.div 
              className="h-full"
              style={{ 
                background: 'linear-gradient(90deg, var(--theme-accent), #8b5cf6)'
              }}
              initial={{ width: 0 }} 
              animate={{ width: `${progress}%` }} 
              transition={{ duration: 0.4, ease: 'easeInOut' }} 
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center mb-6">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className="flex items-center">
              <motion.div 
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{ 
                  fontFamily: 'var(--font-uni-salar)',
                  background: currentStep >= step ? 'var(--theme-accent)' : 'var(--theme-muted)',
                  color: currentStep >= step ? '#ffffff' : 'var(--theme-secondary)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {currentStep > step ? <FaCheck /> : step}
              </motion.div>
              {step < 4 && (
                <motion.div 
                  className="w-12 h-1"
                  style={{ 
                    background: currentStep > step ? 'var(--theme-accent)' : 'var(--theme-muted)'
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: currentStep > step ? '3rem' : '0rem' }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Title */}
        <h2 
          className="text-xl font-bold mb-6 text-center"
          style={{ 
            fontFamily: 'var(--font-uni-salar)',
            color: 'var(--theme-foreground)'
          }}
        >
          {currentStep === 1 && 'قۆناغی 1: کڕین و قەرز'}
          {currentStep === 2 && 'قۆناغی 2: بڕ و یەکە'}
          {currentStep === 3 && 'قۆناغی 3: ناساندن'}
          {currentStep === 4 && 'قۆناغی 4: نرخ و قازانج'}
        </h2>

        <AnimatePresence mode="wait">
          {/* Step 1: Purchase & Debt */}
          {currentStep === 1 && (
            <motion.div 
              key="step1" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }} 
              className="space-y-4"
            >
              {/* Supplier with Icon */}
              <div>
                <label 
                  className="block text-sm mb-2 flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                >
                  <FaBalanceScale className="text-sm" style={{ color: 'var(--theme-accent)' }} />
                  دابینکەر *
                </label>
                <div className="relative">
                  <select 
                    value={formData.supplier_id || ''} 
                    onChange={e => setFormData((prev: FormData) => ({...prev, supplier_id: e.target.value}))} 
                    className={`w-full px-4 py-3 pr-10 rounded-xl border appearance-none bg-transparent ${!formData.supplier_id ? 'border-red-400' : ''}`}
                    style={{ 
                      fontFamily: 'var(--font-uni-salar)',
                      borderColor: !formData.supplier_id ? 'var(--theme-card-border)' : 'var(--theme-accent)',
                      color: 'var(--theme-foreground)',
                      backgroundColor: 'var(--theme-muted)'
                    }}
                  >
                    <option value="">هەڵبژێرە</option>
                    {suppliers.map((s: Supplier) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <FaBalanceScale 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: 'var(--theme-secondary)' }}
                  />
                </div>
              </div>

              {/* Purchase Price with Icon */}
              <div>
                <label 
                  className="block text-sm mb-2 flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                >
                  <FaCalculator className="text-sm" style={{ color: 'var(--theme-accent)' }} />
                  نرخی کڕین (کۆی گشتی) *
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.price_of_bought || ''} 
                    onChange={e => setFormData((prev: FormData) => ({...prev, price_of_bought: Number(e.target.value.replace(/^0+/, ''))}))} 
                    className={`w-full px-4 py-3 pr-10 rounded-xl  ${!formData.price_of_bought ? 'border-red-400' : ''}`}
                    style={{ 
                      fontFamily: 'var(--font-uni-salar)',
                      borderColor: !formData.price_of_bought ? 'var(--theme-card-border)' : 'var(--theme-accent)',
                      color: 'var(--theme-foreground)'
                    }}
                    placeholder="0"
                  />
                  <FaCalculator 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: 'var(--theme-secondary)' }}
                  />
                </div>
              </div>

              {/* Debt Checkbox */}
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--theme-muted)' }}>
                <input 
                  type="checkbox" 
                  checked={formData.is_not_fully_paid || false} 
                  onChange={e => setFormData((prev: FormData) => ({...prev, is_not_fully_paid: e.target.checked}))} 
                  className="w-5 h-5 accent-blue-600" 
                />
                <label 
                  style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                >
                  پارەکە بە تەواوی نەدراوە (قەرز)
                </label>
              </div>

              {/* Remaining Amount */}
              {formData.is_not_fully_paid && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label 
                    className="block text-sm mb-2"
                    style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                  >
                    بڕی قەرز
                  </label>
                  <input 
                    type="number" 
                    value={formData.remain_amount || ''} 
                    onChange={e => setFormData((prev: FormData) => ({...prev, remain_amount: Number(e.target.value.replace(/^0+/, ''))}))} 
                    className="w-full px-4 py-3 rounded-xl border bg-transparent"
                    style={{ 
                      fontFamily: 'var(--font-uni-salar)',
                      borderColor: 'var(--theme-card-border)',
                      color: 'var(--theme-foreground)'
                    }}
                    placeholder="0"
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Quantity & Unit */}
          {currentStep === 2 && (
            <motion.div 
              key="step2" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }} 
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Quantity */}
                <div>
                  <label 
                    className="block text-sm mb-2 flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                  >
                    <FaBox className="text-sm" style={{ color: 'var(--theme-accent)' }} />
                    بڕ *
                  </label>
                  <input 
                    type="number" 
                    value={formData.quantity || ''} 
                    onChange={e => setFormData({...formData, quantity: Number(e.target.value.replace(/^0+/, ''))})} 
                    className={`w-full px-4 py-3 rounded-xl border  transition-all ${!formData.quantity ? 'border-red-400' : ''}`}
                    style={{ 
                      fontFamily: 'var(--font-uni-salar)',
                      borderColor: !formData.quantity ? 'var(--theme-card-border)' : 'var(--theme-accent)',
                      color: 'var(--theme-foreground)'
                    }}
                    placeholder="0"
                  />
                </div>

                {/* Unit with Loading State */}
                <div>
                  <label 
                    className="block text-sm mb-2 flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                  >
              <FaCalculator className="text-sm" style={{ color: 'var(--theme-accent)' }} />
                    یەکە
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      {unitsLoading ? (
                        <div 
                          className="w-full px-4 py-3 rounded-xl border flex items-center justify-center"
                          style={{ 
                            fontFamily: 'var(--font-uni-salar)',
                            borderColor: 'var(--theme-card-border)',
                            color: 'var(--theme-secondary)',
                            backgroundColor: 'var(--theme-muted)'
                          }}
                        >
                          <FaSpinner className="animate-spin ml-2" />
                          چاوەڕێبە...
                        </div>
                      ) : (
                        <>
                          <select 
                            value={formData.unit || ''} 
                            onChange={e => setFormData({...formData, unit: e.target.value})} 
                            className="w-full px-4 py-3 pr-10 rounded-xl border appearance-none bg-transparent"
                            style={{ 
                              fontFamily: 'var(--font-uni-salar)',
                              borderColor: 'var(--theme-accent)',
                              color: 'var(--theme-foreground)',
                              backgroundColor: 'var(--theme-muted)'
                            }}
                          >
                            <option value="">هەڵبژێرە</option>
                            {localUnits.length === 0 ? (
                              <option value="" disabled>یەکە نییە - زیادکراوەکە بکە</option>
                            ) : (
                              localUnits.map((u: Unit) => (
                                <option key={u.id} value={u.name}>
                                  {u.name} {u.symbol ? `(${u.symbol})` : ''}
                                </option>
                              ))
                            )}
                          </select>
                          <FaCalculator 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                            style={{ color: 'var(--theme-secondary)' }}
                          />
                        </>
                      )}
                    </div>
                    {onAddUnit && (
                      <button
                        type="button"
                        onClick={onAddUnit}
                        className="px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-center"
                        style={{ 
                          fontFamily: 'var(--font-uni-salar)',
                          backgroundColor: 'var(--theme-accent)',
                          color: '#ffffff'
                        }}
                        title="زیادکردنی یەکە"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Unit Cost Display */}
              <motion.div 
                className="rounded-2xl p-5 text-center border"
                style={{ 
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderColor: 'var(--theme-accent)'
                }}
                initial={{ scale: 0.95, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <p 
                  style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-secondary)' }}
                >
                  نرخی هەر یەکەیە:
                </p>
                <p 
                  className="text-3xl font-bold"
                  style={{ 
                    fontFamily: 'var(--font-uni-salar)', 
                    color: 'var(--theme-accent)'
                  }}
                >
                  {unitCost.toLocaleString()} IQD
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* Step 3: Product Info */}
          {currentStep === 3 && (
            <motion.div 
              key="step3" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }} 
              className="space-y-4"
            >
              {/* Image Upload */}
              <div className="mb-4">
                <label 
                  className="block text-sm mb-3 text-center"
                  style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-secondary)' }}
                >
                  وێنەی کاڵا
                </label>
                <div 
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed transition-all"
                  style={{ 
                    borderColor: formData.image ? 'var(--theme-accent)' : 'var(--theme-card-border)',
                    backgroundColor: 'var(--theme-muted)'
                  }}
                >
                  {formData.image ? (
                    <div className="relative">
                      <img 
                        src={formData.image} 
                        alt="Preview" 
                        className="w-32 h-32 rounded-xl object-cover border-2"
                        style={{ borderColor: 'var(--theme-accent)' }}
                      />
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: '#ef4444' }}
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-xl flex items-center justify-center">
                      <FaUpload className="text-4xl" style={{ color: 'var(--theme-secondary)' }} />
                    </div>
                  )}
                  <label 
                    className="flex items-center gap-2 px-5 py-3 rounded-xl cursor-pointer transition-all hover:opacity-90"
                    style={{ 
                      fontFamily: 'var(--font-uni-salar)',
                      backgroundColor: 'var(--theme-accent)',
                      color: '#ffffff'
                    }}
                  >
                    <FaUpload />
                    <span>ئەپلۆدکردن</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <p 
                    className="text-xs"
                    style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-secondary)' }}
                  >
                    PNG، JPG، JPEG
                  </p>
                </div>
              </div>
              
              {/* Product Name with Icon */}
              <div>
                <label 
                  className="block text-sm mb-2 flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                >
                  <FaBox className="text-sm" style={{ color: 'var(--theme-accent)' }} />
                  ناوی کاڵا *
                </label>
                <input 
                  type="text" 
                  value={formData.name || ''} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                  className={`w-full px-4 py-3 rounded-xl border transition-all ${!formData.name?.trim() ? 'border-red-400' : ''}`}
                  style={{ 
                    fontFamily: 'var(--font-uni-salar)',
                    borderColor: !formData.name?.trim() ? 'var(--theme-card-border)' : 'var(--theme-accent)',
                    color: 'var(--theme-foreground)'
                  }}
                  placeholder="ناوی کاڵا بنووسە"
                />
              </div>
              
              {/* Category with Loading State */}
              <div>
                <label 
                  className="block text-sm mb-2 flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                >
                  <FaTag className="text-sm" style={{ color: 'var(--theme-accent)' }} />
                  پۆڵ *
                </label>
                <div className="relative">
                  {categoriesLoading ? (
                    <div 
                      className="w-full px-4 py-3 rounded-xl border flex items-center justify-center"
                      style={{ 
                        fontFamily: 'var(--font-uni-salar)',
                        borderColor: 'var(--theme-card-border)',
                        color: 'var(--theme-secondary)',
                        backgroundColor: 'var(--theme-muted)'
                      }}
                    >
                      <FaSpinner className="animate-spin ml-2" />
                      چاوەڕێبە...
                    </div>
                  ) : (
                    <>
                      <select 
                        value={formData.category || ''} 
                        onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} 
                        className={`w-full px-4 py-3 pr-10 rounded-xl border appearance-none bg-transparent ${!formData.category ? 'border-red-400' : ''}`}
                        style={{ 
                          fontFamily: 'var(--font-uni-salar)',
                          borderColor: !formData.category ? 'var(--theme-card-border)' : 'var(--theme-accent)',
                          color: 'var(--theme-foreground)',
                          backgroundColor: 'var(--theme-muted)'
                        }}
                      >
                        <option value="">هەڵبژێرە</option>
                        {categories.length === 0 ? (
                          <option value="" disabled>هیچ پۆلێک نییە</option>
                        ) : (
                          categories.map((c: Category) => <option key={c.id} value={c.name}>{c.name}</option>)
                        )}
                      </select>
                      <FaTag 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                        style={{ color: 'var(--theme-secondary)' }}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Barcodes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label 
                    className="block text-sm mb-1"
                    style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                  >
                    بارکۆد 1
                  </label>
                  <input 
                    type="text" 
                    value={formData.barcode1 || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, barcode1: e.target.value }))} 
                    className="w-full px-4 py-3 rounded-xl "
                    style={{ 
                      fontFamily: 'var(--font-uni-salar)',
                      borderColor: 'var(--theme-card-border)',
                      color: 'var(--theme-foreground)'
                    }}
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm mb-1"
                    style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                  >
                    بارکۆد 2
                  </label>
                  <input 
                    type="text" 
                    value={formData.barcode2 || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, barcode2: e.target.value }))} 
                    className="w-full px-4 py-3 rounded-xl "
                    style={{ 
                      fontFamily: 'var(--font-uni-salar)',
                      borderColor: 'var(--theme-card-border)',
                      color: 'var(--theme-foreground)'
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label 
                    className="block text-sm mb-1"
                    style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                  >
                    بارکۆد 3
                  </label>
                  <input 
                    type="text" 
                    value={formData.barcode3 || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, barcode3: e.target.value }))} 
                    onBlur={handleBarcode3Blur} 
                    className="w-full px-4 py-3 rounded-xl "
                    style={{ 
                      fontFamily: 'var(--font-uni-salar)',
                      borderColor: 'var(--theme-card-border)',
                      color: 'var(--theme-foreground)'
                    }}
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm mb-1"
                    style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                  >
                    بارکۆد 4 (ئۆتۆ)
                  </label>
                  <input 
                    type="text" 
                    value={formData.barcode4 || ''} 
                    className="w-full px-4 py-3 rounded-xl border"
                    style={{ 
                      fontFamily: 'var(--font-uni-salar)',
                      borderColor: 'var(--theme-card-border)',
                      color: 'var(--theme-secondary)',
                      backgroundColor: 'var(--theme-muted)'
                    }}
                    readOnly 
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label 
                    className="block text-sm mb-1"
                    style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                  >
                    بەرواری کڕین
                  </label>
                  <input 
                    type="date" 
                    value={formData.added_date || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, added_date: e.target.value }))} 
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ 
                      fontFamily: 'var(--font-uni-salar)',
                      borderColor: 'var(--theme-card-border)',
                      color: 'var(--theme-foreground)'
                    }}
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm mb-1"
                    style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                  >
                    بەرواری بەسەرچوون
                  </label>
                  <input 
                    type="date" 
                    value={formData.expire_date || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, expire_date: e.target.value }))} 
                    className="w-full px-4 py-3 rounded-xl border bg-transparent"
                    style={{ 
                      fontFamily: 'var(--font-uni-salar)',
                      borderColor: 'var(--theme-card-border)',
                      color: 'var(--theme-foreground)'
                    }}
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label 
                  className="block text-sm mb-1"
                  style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                >
                  تێبینی
                </label>
                <textarea 
                  value={formData.note || ''} 
                  onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))} 
                  className="w-full px-4 py-3 rounded-xl "
                  rows={2}
                  style={{ 
                    fontFamily: 'var(--font-uni-salar)',
                    borderColor: 'var(--theme-card-border)',
                    color: 'var(--theme-foreground)'
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Step 4: Pricing */}
          {currentStep === 4 && (
            <motion.div 
              key="step4" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }} 
              className="space-y-4"
            >
              {/* Selling Price */}
              <div>
                <label 
                  className="block text-sm mb-2 flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}
                >
                  <FaCalculator className="text-sm" style={{ color: 'var(--theme-accent)' }} />
                  نرخی فرۆشتن *
                </label>
                <input 
                  type="number" 
                  value={formData.selling_price || ''} 
                  onChange={e => setFormData(prev => ({ ...prev, selling_price: Number(e.target.value.replace(/^0+/, '')) }))} 
                  className={`w-full px-4 py-3 rounded-xl  ${!formData.selling_price ? 'border-red-800' : ''}`}
                  style={{ 
                    fontFamily: 'var(--font-uni-salar)',
                    borderColor: !formData.selling_price ? 'var(--theme-card-border)' : 'var(--theme-accent)',
                    color: 'var(--theme-foreground)'
                  }}
                  placeholder="0"
                />
              </div>

              {/* Auto-calculated Total Price */}
              {totalPrice > 0 && (
                <motion.div 
                  className="rounded-2xl p-4 border"
                  style={{ 
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderColor: '#10b981'
                  }}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="flex justify-between items-center">
                    <span style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-secondary)' }}>
                      کۆی گشتی (بڕ × نرخ):
                    </span>
                    <span 
                      className="text-xl font-bold"
                      style={{ 
                        fontFamily: 'var(--font-uni-salar)', 
                        color: '#10b981'
                      }}
                    >
                      {totalPrice.toLocaleString()} IQD
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Profit Summary */}
              <div 
                className="rounded-2xl p-5 border"
                style={{ 
                  backgroundColor: 'var(--theme-muted)',
                  borderColor: 'var(--theme-card-border)'
                }}
              >
                <div className="flex justify-between mb-3">
                  <span style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-secondary)' }}>
                    نرخی کڕین بە تاک:
                  </span>
                  <span 
                    className="font-bold"
                    style={{ 
                      fontFamily: 'var(--font-uni-salar)', 
                      color: 'var(--theme-foreground)'
                    }}
                  >
                    {unitCost.toLocaleString()} IQD
                  </span>
                </div>
                <div className="flex justify-between mb-3">
                  <span style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-secondary)' }}>
                    نرخی فرۆشتن بە تاک:
                  </span>
                  <span 
                    className="font-bold"
                    style={{ 
                      fontFamily: 'var(--font-uni-salar)', 
                      color: 'var(--theme-foreground)'
                    }}
                  >
                    {(formData.selling_price || 0).toLocaleString()} IQD
                  </span>
                </div>
                <div className="h-px my-3" style={{ backgroundColor: 'var(--theme-card-border)' }} />
                <div className="flex justify-between mb-3">
                  <span style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-secondary)' }}>
                    قازانج:
                  </span>
                  <span 
                    className={`font-bold ${profitAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    {profitAmount.toLocaleString()} IQD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-secondary)' }}>
                    رێژەی قازانج:
                  </span>
                  <span 
                    className={`font-bold ${profitRate >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    {profitRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 justify-between">
          {/* Cancel Button */}
          <button 
            onClick={() => setShowStockEntry(false)} 
            className="px-6 py-3 rounded-xl font-bold transition-all"
            style={{ 
              fontFamily: 'var(--font-uni-salar)',
              backgroundColor: 'var(--theme-muted)',
              color: 'var(--theme-secondary)'
            }}
          >
            پاشگەزبوونەوە
          </button>

          {/* Previous Button */}
          {currentStep > 1 && (
            <button 
              onClick={prevStep} 
              className="px-6 py-3 rounded-xl font-bold flex items-center transition-all hover:opacity-80"
              style={{ 
                fontFamily: 'var(--font-uni-salar)',
                backgroundColor: 'transparent',
                color: 'var(--theme-secondary)',
                border: '1px solid var(--theme-card-border)'
              }}
            >
              <FaArrowRight className="ml-2" />
              قۆناغی پێشوو
            </button>
          )}

          {/* Next Button */}
          {currentStep < 4 ? (
            <button 
              onClick={nextStep} 
              disabled={!canProceed()} 
              className={`px-6 py-3 rounded-xl font-bold flex items-center transition-all ${canProceed() ? 'hover:bg-blue-700' : 'opacity-50 cursor-not-allowed'}`}
              style={{ 
                fontFamily: 'var(--font-uni-salar)',
                backgroundColor: canProceed() ? '#2563eb' : 'var(--theme-muted)',
                color: '#ffffff'
              }}
            >
              قۆناغی داهاتوو
              <FaArrowLeft className="mr-2" />
            </button>
          ) : (
            /* Save Button with Spinner */
            <button 
              onClick={submitItem} 
              disabled={!formData.name?.trim() || !formData.quantity || !formData.selling_price || isSubmitting}
              className={`px-8 py-3 rounded-xl font-bold flex items-center transition-all ${formData.name?.trim() && formData.quantity && formData.selling_price && !isSubmitting ? 'hover:bg-green-700' : 'opacity-50 cursor-not-allowed'}`}
              style={{ 
                fontFamily: 'var(--font-uni-salar)',
                backgroundColor: isSubmitting ? '#1d4ed8' : (formData.name?.trim() && formData.quantity && formData.selling_price ? '#22c55e' : 'var(--theme-muted)'),
                color: '#ffffff'
              }}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin ml-2" />
                  تۆمارکردن...
                </>
              ) : (
                <>
                  <FaCheck className="ml-2" />
                  تۆمارکردن
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
