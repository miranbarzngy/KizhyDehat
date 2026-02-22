'use client'

import { useSyncPause } from '@/contexts/SyncPauseContext'
import { supabase } from '@/lib/supabase'
import { logActivity, ActivityActions, EntityTypes } from '@/lib/activityLogger'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import {
  FaArrowLeft,
  FaArrowRight,
  FaBalanceScale,
  FaBox,
  FaCalculator,
  FaCheck,
  FaExclamationTriangle,
  FaSearch,
  FaSpinner,
  FaTag,
  FaTrash,
  FaUpload
} from 'react-icons/fa'
import type { Product } from './types'

// Kurdish to English number converter
const convertKurdishToEnglish = (input: string): string => {
  if (!input || typeof input !== 'string') return input
  const kurdishToEnglishMap: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  }
  let result = input
  Object.entries(kurdishToEnglishMap).forEach(([kurdish, english]) => {
    result = result.replace(new RegExp(kurdish, 'g'), english)
  })
  return result
}

// Sanitize numeric input
const sanitizeNumericInput = (input: string): string => {
  if (!input || typeof input !== 'string') return ''
  const converted = convertKurdishToEnglish(input)
  return converted.replace(/[^0-9.-]/g, '')
}

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

// NumberInput - uses Inter font to prevent Kurdish numeral conversion
function NumberInput({ value, onChange, placeholder = '0', className = '', style = {}, disabled = false }: { 
  value: string | number, 
  onChange: (value: number) => void, 
  placeholder?: string,
  className?: string,
  style?: React.CSSProperties,
  disabled?: boolean
}) {
  const [displayValue, setDisplayValue] = useState(String(value || ''))
  
  useEffect(() => { setDisplayValue(String(value || '')) }, [value])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const converted = sanitizeNumericInput(e.target.value)
    setDisplayValue(converted)
    onChange(Number(converted) || 0)
  }
  
  return (
    <input 
      type="text" 
      inputMode="decimal" 
      value={displayValue} 
      onChange={handleChange}
      placeholder={placeholder} 
      disabled={disabled} 
      className={className}
      style={{ fontFamily: 'Inter, system-ui, sans-serif', direction: 'ltr', fontSize: '1rem', fontWeight: '500', ...style }} 
    />
  )
}

export default function AddItemModal({ showStockEntry, setShowStockEntry, currentStep, setCurrentStep, editingItem, formData, setFormData, suppliers, units, onSuccess, onAddUnit, onAddCategory }: AddItemModalProps) {
  const { pauseSync, resumeSync } = useSyncPause()
  const [categories, setCategories] = useState<Category[]>([])
  const [localUnits, setLocalUnits] = useState<Unit[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [unitsLoading, setUnitsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false)
  const supplierDropdownRef = useRef<HTMLDivElement>(null)

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter(s => 
    s.name?.toLowerCase().includes(supplierSearch.toLowerCase())
  )

  // Initialize supplier search when editing
  useEffect(() => {
    if (formData.supplier_id && suppliers.length > 0) {
      const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id)
      if (selectedSupplier) {
        setSupplierSearch(selectedSupplier.name)
      }
    }
  }, [formData.supplier_id, suppliers])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setSupplierDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!showStockEntry) return
    const fetchData = async () => {
      setCategoriesLoading(true)
      setUnitsLoading(true)
      if (!supabase) { setCategoriesLoading(false); setUnitsLoading(false); return }
      try {
        const { data: categoriesData } = await supabase.from('categories').select('*').order('name')
        const { data: unitsData } = await supabase.from('units').select('*').order('name')
        setCategories(categoriesData || [])
        setLocalUnits(unitsData || [])
      } catch { setCategories([]); setLocalUnits([]) } 
      finally { setCategoriesLoading(false); setUnitsLoading(false) }
    }
    fetchData()
  }, [showStockEntry])

  useEffect(() => {
    if (isSubmitting) {
      const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = 'تۆمارکردن لە پڕۆسەدایە' }
      window.addEventListener('beforeunload', handler)
      return () => window.removeEventListener('beforeunload', handler)
    }
  }, [isSubmitting])

  const unitCost = formData.quantity > 0 ? formData.price_of_bought / formData.quantity : formData.price_of_bought
  const profitAmount = formData.selling_price - unitCost
  const profitRate = unitCost > 0 ? (profitAmount / unitCost) * 100 : 0
  const totalPrice = formData.quantity > 0 && formData.selling_price > 0 ? formData.quantity * formData.selling_price : 0

  const generateBarcode4 = () => `LOC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  useEffect(() => { 
    if (showStockEntry && !formData.barcode4) {
      setFormData((prev: FormData) => ({ ...prev, barcode4: generateBarcode4() }))
    }
  }, [showStockEntry])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !supabase) return
    try {
      const fileName = `${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('product-images').upload(fileName, file)
      if (error) throw error
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
      setFormData((prev: FormData) => ({ ...prev, image: urlData.publicUrl }))
    } catch { 
      setErrorMessage('هەڵە لە ئەپلۆدکردن')
      setTimeout(() => setErrorMessage(''), 3000) 
    }
  }

  const canProceed = () => {
    if (currentStep === 1) return formData.supplier_id && formData.price_of_bought > 0
    if (currentStep === 2) return formData.quantity > 0 && formData.unit
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
    if (!formData.name?.trim() || !formData.quantity || !formData.selling_price || !formData.unit) { 
      setErrorMessage('تکایە هەموو زانیارییەکان پڕبکەرەوە')
      return 
    }
    if (!supabase) { setShowStockEntry(false); onSuccess(); return }
    setIsSubmitting(true)
    try {
      pauseSync('AddItemModal.submitItem')
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
      if (editingItem) {
        await supabase.from('products').update(productsData).eq('id', editingItem.id)
        
        // Log edit activity
        console.log('[Activity] Logging UPDATE_PRODUCT for:', formData.name)
        await logActivity(
          null,
          null,
          ActivityActions.UPDATE_PRODUCT,
          `دەستکاریکردنی زانیاریەکانی ${formData.name}`,
          EntityTypes.PRODUCT,
          editingItem.id
        )
        
        setErrorMessage('کاڵاکە نوێکرایەوە')
      } else {
        const referenceId = crypto.randomUUID()
        const result = await supabase.from('products').insert({ ...productsData, reference_id: referenceId })
        if (result.error) throw result.error
        
        // Log add activity
        console.log('[Activity] Logging ADD_PRODUCT for:', formData.name)
        await logActivity(
          null,
          null,
          ActivityActions.ADD_PRODUCT,
          `زیادکردنی کاڵای نوێ: ${formData.name}`,
          EntityTypes.PRODUCT,
          null
        )
        
        if (formData.supplier_id) {
          await supabase.from('purchase_expenses').insert({
            item_name: formData.name, 
            total_purchase_price: Number(formData.price_of_bought),
            total_amount_bought: Number(formData.quantity), 
            unit: formData.unit, 
            purchase_date: formData.added_date, 
            reference_id: referenceId
          })
          
          // Handle supplier debt sync
          if (formData.is_not_fully_paid && formData.remain_amount > 0) {
            const debtAmount = Number(formData.remain_amount)
            
            // Get current supplier's total_debt
            const { data: currentSupplier } = await supabase
              .from('suppliers')
              .select('total_debt')
              .eq('id', formData.supplier_id)
              .single()
            
            const newDebt = (currentSupplier?.total_debt || 0) + debtAmount
            
            // Update supplier's total_debt
            await supabase
              .from('suppliers')
              .update({ total_debt: newDebt })
              .eq('id', formData.supplier_id)
            
            // Insert supplier_payment record (negative amount = debt added)
            await supabase.from('supplier_payments').insert({
              supplier_id: formData.supplier_id,
              amount: -debtAmount,
              date: new Date().toISOString(),
              note: `قەرزی کاڵای نوێ: ${formData.name}`
            })
            
            // Log the supplier payment activity
            console.log('[Activity] Logging ADD_SUPPLIER_PAYMENT for debt:', formData.name)
            await logActivity(
              null,
              null,
              ActivityActions.ADD_SUPPLIER_PAYMENT,
              `زیادکردنی قەرزی دابینکار بە بڕی ${debtAmount.toLocaleString()} IQD بۆ کاڵای ${formData.name}`,
              EntityTypes.SUPPLIER_PAYMENT,
              null
            )
          }
        }
      }
      localStorage.removeItem('zombie_submission')
      setIsSubmitting(false)
      setShowStockEntry(false)
      onSuccess()
    } catch (err: any) {
      setErrorMessage(`هەڵە: ${err.message}`)
      setIsSubmitting(false)
    } finally { 
      resumeSync('AddItemModal.submitItem') 
    }
  }

  if (!showStockEntry) return null
  const progress = (currentStep / 4) * 100

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-2xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--theme-card-bg)', border: '1px solid var(--theme-card-border)' }}>
        {errorMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 rounded-xl flex items-center gap-2" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626' }}>
            <FaExclamationTriangle />
            <span style={{ fontFamily: 'var(--font-uni-salar)' }}>{errorMessage}</span>
          </motion.div>
        )}
        
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
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-muted)' }}>
            <motion.div className="h-full" style={{ background: 'linear-gradient(90deg, var(--theme-accent), #8b5cf6)' }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
          </div>
        </div>

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
              >
                {currentStep > step ? <FaCheck /> : step}
              </motion.div>
              {step < 4 && (
                <motion.div 
                  className="w-12 h-1" 
                  style={{ background: currentStep > step ? 'var(--theme-accent)' : 'var(--theme-muted)' }} 
                />
              )}
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold mb-6 text-center" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>
          {currentStep === 1 && 'قۆناغی 1: کڕین و قەرز'}
          {currentStep === 2 && 'قۆناغی 2: بڕ و یەکە'}
          {currentStep === 3 && 'قۆناغی 3: ناساندن'}
          {currentStep === 4 && 'قۆناغی 4: نرخ و قازانج'}
        </h2>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 flex items-center gap-2" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>
                  <FaBalanceScale className="text-sm" style={{ color: 'var(--theme-accent)' }} />
                  دابینکار *
                </label>
                <div className="relative" ref={supplierDropdownRef}>
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={supplierSearch}
                      onChange={e => {
                        setSupplierSearch(e.target.value)
                        setSupplierDropdownOpen(true)
                      }}
                      onFocus={() => setSupplierDropdownOpen(true)}
                      placeholder="گەڕان..."
                      className="w-full px-4 py-3 pr-10 rounded-xl border appearance-none"
                      style={{ fontFamily: 'var(--font-uni-salar)', borderColor: formData.supplier_id ? 'var(--theme-accent)' : 'var(--theme-card-border)', color: 'var(--theme-foreground)', backgroundColor: 'var(--theme-muted)' }}
                    />
                    <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--theme-secondary)' }} />
                  </div>
                  
                  {/* Dropdown Options */}
                  {supplierDropdownOpen && filteredSuppliers.length > 0 && (
                    <div 
                      className="absolute z-10 w-full mt-1 rounded-xl border max-h-48 overflow-y-auto"
                      style={{ backgroundColor: '#2563eb', borderColor: '#1d4ed8' }}
                    >
                      {filteredSuppliers.map((s: any) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev: FormData) => ({...prev, supplier_id: s.id}))
                            setSupplierSearch(s.name)
                            setSupplierDropdownOpen(false)
                          }}
                          className="w-full px-4 py-2 text-right hover:bg-opacity-20 hover:bg-white flex items-center gap-3"
                          style={{ fontFamily: 'var(--font-uni-salar)', color: '#ffffff' }}
                        >
                          {s.supplier_image ? (
                            <img 
                              src={s.supplier_image} 
                              alt={s.name} 
                              className="w-8 h-8 rounded-full object-cover border-2 border-white"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-sm font-bold">
                              {s.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-bold">{s.name}</div>
                            {s.phone && <div className="text-xs opacity-75">{s.phone}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Show selected value when not searching */}
                  {supplierDropdownOpen && supplierSearch === '' && formData.supplier_id && (
                    <div 
                      className="absolute z-10 w-full mt-1 rounded-xl border max-h-48 overflow-y-auto"
                      style={{ backgroundColor: '#2563eb', borderColor: '#1d4ed8' }}
                    >
                      {suppliers.map((s: any) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev: FormData) => ({...prev, supplier_id: s.id}))
                            setSupplierSearch(s.name)
                            setSupplierDropdownOpen(false)
                          }}
                          className="w-full px-4 py-2 text-right hover:bg-opacity-20 hover:bg-white flex items-center gap-3"
                          style={{ fontFamily: 'var(--font-uni-salar)', color: '#ffffff' }}
                        >
                          {s.supplier_image ? (
                            <img 
                              src={s.supplier_image} 
                              alt={s.name} 
                              className="w-8 h-8 rounded-full object-cover border-2 border-white"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-sm font-bold">
                              {s.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-bold">{s.name}</div>
                            {s.phone && <div className="text-xs opacity-75">{s.phone}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {supplierDropdownOpen && filteredSuppliers.length === 0 && supplierSearch !== '' && (
                    <div 
                      className="absolute z-10 w-full mt-1 rounded-xl border p-3 text-center"
                      style={{ backgroundColor: '#2563eb', borderColor: '#1d4ed8' }}
                    >
                      <span style={{ fontFamily: 'var(--font-uni-salar)', color: '#ffffff' }}>داتا نەدۆزرایەوە</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 flex items-center gap-2" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>
                  <FaCalculator className="text-sm" style={{ color: 'var(--theme-accent)' }} />
                  نرخی کڕین (کۆی گشتی) *
                </label>
                <div className="relative">
                  <NumberInput 
                    value={formData.price_of_bought || ''} 
                    onChange={val => setFormData((prev: FormData) => ({...prev, price_of_bought: val}))} 
                    className="w-full px-4 py-3 pr-10 rounded-xl"
                    style={{ borderColor: formData.price_of_bought ? 'var(--theme-accent)' : 'var(--theme-card-border)', color: 'var(--theme-foreground)', backgroundColor: 'var(--theme-muted)' }} 
                    placeholder="0" 
                  />
                  <FaCalculator className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--theme-secondary)' }} />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--theme-muted)' }}>
                <input 
                  type="checkbox" 
                  checked={formData.is_not_fully_paid || false} 
                  onChange={e => setFormData((prev: FormData) => ({...prev, is_not_fully_paid: e.target.checked}))} 
                  className="w-5 h-5" 
                />
                <label style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>پارەکە بە تەواوی نەدراوە (قەرز)</label>
              </div>

              {formData.is_not_fully_paid && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>بڕی قەرز</label>
                  <NumberInput 
                    value={formData.remain_amount || ''} 
                    onChange={val => setFormData((prev: FormData) => ({...prev, remain_amount: val}))} 
                    className="w-full px-4 py-3 rounded-xl border"
                    style={{ borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', backgroundColor: 'var(--theme-muted)' }} 
                    placeholder="0" 
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 flex items-center gap-2" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>
                    <FaBox className="text-sm" style={{ color: 'var(--theme-accent)' }} />
                    بڕ *
                  </label>
                  <NumberInput 
                    value={formData.quantity || ''} 
                    onChange={val => setFormData({...formData, quantity: val})} 
                    className="w-full px-4 py-3 rounded-xl border"
                    style={{ borderColor: formData.quantity ? 'var(--theme-accent)' : 'var(--theme-card-border)', color: 'var(--theme-foreground)', backgroundColor: 'var(--theme-muted)' }} 
                    placeholder="0" 
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 flex items-center gap-2" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>
                    <FaCalculator className="text-sm" style={{ color: 'var(--theme-accent)' }} />
                    یەکە *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      {unitsLoading ? (
                        <div className="w-full px-4 py-3 rounded-xl border flex items-center justify-center" style={{ fontFamily: 'var(--font-uni-salar)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-secondary)' }}>
                          <FaSpinner className="animate-spin ml-2" />
                          چاوەڕێبە...
                        </div>
                      ) : (
                        <>
                          <select 
                            value={formData.unit || ''} 
                            onChange={e => setFormData({...formData, unit: e.target.value})} 
                            className="w-full px-4 py-3 pr-10 rounded-xl border appearance-none"
                            style={{ fontFamily: 'var(--font-uni-salar)', borderColor: formData.unit ? 'var(--theme-accent)' : 'var(--theme-card-border)', color: 'var(--theme-foreground)' }}
                          >
                            <option value="">هەڵبژێرە</option>
                            {localUnits.map((u: Unit) => <option key={u.id} value={u.name}>{u.name}</option>)}
                          </select>
                          <FaCalculator className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--theme-secondary)' }} />
                        </>
                      )}
                    </div>
                    {onAddUnit && (
                      <button type="button" onClick={onAddUnit} className="px-3 py-2 rounded-xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)', backgroundColor: 'var(--theme-accent)', color: '#ffffff' }}>+</button>
                    )}
                  </div>
                </div>
              </div>

              <motion.div className="rounded-2xl p-5 text-center border" style={{ backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'var(--theme-accent)' }}>
                <p style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-secondary)' }}>نرخی هەر یەکەیە:</p>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Inter, system-ui', color: 'var(--theme-accent)' }}>{unitCost.toLocaleString()} IQD</p>
              </motion.div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm mb-3 text-center" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-secondary)' }}>وێنەی کاڵا</label>
                <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed" style={{ borderColor: formData.image ? 'var(--theme-accent)' : 'var(--theme-card-border)', backgroundColor: 'var(--theme-muted)' }}>
                  {formData.image ? (
                    <div className="relative">
                      <img src={formData.image} alt="Preview" className="w-32 h-32 rounded-xl object-cover border-2" style={{ borderColor: 'var(--theme-accent)' }} />
                      <button onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#ef4444' }}><FaTrash className="text-xs" /></button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-xl flex items-center justify-center"><FaUpload className="text-4xl" style={{ color: 'var(--theme-secondary)' }} /></div>
                  )}
                  <label className="flex items-center gap-2 px-5 py-3 rounded-xl cursor-pointer" style={{ fontFamily: 'var(--font-uni-salar)', backgroundColor: 'var(--theme-accent)', color: '#ffffff' }}>
                    <FaUpload /><span>ئەپلۆدکردن</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm mb-2 flex items-center gap-2" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>
                  <FaBox className="text-sm" style={{ color: 'var(--theme-accent)' }} />
                  ناوی کاڵا *
                </label>
                <input 
                  type="text" 
                  value={formData.name || ''} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                  className="w-full px-4 py-3 rounded-xl border"
                  style={{ fontFamily: 'var(--font-uni-salar)', borderColor: formData.name ? 'var(--theme-accent)' : 'var(--theme-card-border)', color: 'var(--theme-foreground)' }} 
                  placeholder="ناوی کاڵا بنووسە" 
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2 flex items-center gap-2" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>
                  <FaTag className="text-sm" style={{ color: 'var(--theme-accent)' }} />
                  پۆڵ *
                </label>
                <div className="relative">
                  {categoriesLoading ? (
                    <div className="w-full px-4 py-3 rounded-xl border flex items-center justify-center" style={{ fontFamily: 'var(--font-uni-salar)', borderColor: 'var(--theme-muted)', color: 'var(--theme-secondary)' }}>
                      <FaSpinner className="animate-spin ml-2" />چاوەڕێبە...
                    </div>
                  ) : (
                    <select 
                      value={formData.category || ''} 
                      onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} 
                      className="w-full px-4 py-3 pr-10 rounded-xl border appearance-none"
                      style={{ fontFamily: 'var(--font-uni-salar)', borderColor: formData.category ? 'var(--theme-accent)' : 'var(--theme-card-border)', color: 'var(--theme-foreground)' }}
                    >
                      <option value="">هەڵبژێرە</option>
                      {categories.map((c: Category) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  )}
                  <FaTag className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--theme-secondary)' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>بارکۆد 1</label>
                  <input 
                    type="text" 
                    value={formData.barcode1 || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, barcode1: e.target.value }))} 
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ fontFamily: 'var(--font-uni-salar)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)' }} 
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>بارکۆد 2</label>
                  <input 
                    type="text" 
                    value={formData.barcode2 || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, barcode2: e.target.value }))} 
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ fontFamily: 'var(--font-uni-salar)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)' }} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>بارکۆد 3</label>
                  <input 
                    type="text" 
                    value={formData.barcode3 || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, barcode3: e.target.value }))} 
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ fontFamily: 'var(--font-uni-salar)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)' }} 
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>بارکۆد 4 (ئۆتۆ)</label>
                  <input 
                    type="text" 
                    value={formData.barcode4 || ''} 
                    className="w-full px-4 py-3 rounded-xl border"
                    style={{ fontFamily: 'var(--font-uni-salar)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-secondary)' }} 
                    readOnly 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>بەرواری کڕین</label>
                  <input 
                    type="date" 
                    value={formData.added_date || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, added_date: e.target.value }))} 
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ fontFamily: 'var(--font-uni-salar)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)' }} 
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>بەرواری بەسەرچوون</label>
                  <input 
                    type="date" 
                    value={formData.expire_date || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, expire_date: e.target.value }))} 
                    className="w-full px-4 py-3 rounded-xl border"
                    style={{ fontFamily: 'var(--font-uni-salar)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)' }} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>تێبینی</label>
                <textarea 
                  value={formData.note || ''} 
                  onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))} 
                  className="w-full px-4 py-3 rounded-xl" 
                  rows={2} 
                  style={{ fontFamily: 'var(--font-uni-salar)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)' }} 
                />
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 flex items-center gap-2" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-foreground)' }}>
                  <FaCalculator className="text-sm" style={{ color: 'var(--theme-accent)' }} />
                  نرخی فرۆشتن *
                </label>
                <NumberInput 
                  value={formData.selling_price || ''} 
                  onChange={val => setFormData(prev => ({ ...prev, selling_price: val }))} 
                  className="w-full px-4 py-3 rounded-xl"
                  style={{ borderColor: formData.selling_price ? 'var(--theme-accent)' : 'var(--theme-card-border)', color: 'var(--theme-foreground)', backgroundColor: 'var(--theme-muted)' }} 
                  placeholder="0" 
                />
              </div>

              {totalPrice > 0 && (
                <motion.div className="rounded-2xl p-4 border" style={{ backgroundColor: 'rgba(16,185,129,0.1)', borderColor: '#10b981' }}>
                  <div className="flex justify-between items-center">
                    <span style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-secondary)' }}>کۆی گشتی:</span>
                    <span className="text-xl font-bold" style={{ fontFamily: 'Inter, system-ui', color: '#10b981' }}>{totalPrice.toLocaleString()} IQD</span>
                  </div>
                </motion.div>
              )}

              <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)' }}>
                <div className="flex justify-between mb-3">
                  <span style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-secondary)' }}>نرخی کڕین بە تاک:</span>
                  <span className="font-bold" style={{ fontFamily: 'Inter, system-ui', color: 'var(--theme-foreground)' }}>{unitCost.toLocaleString()} IQD</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-secondary)' }}>نرخی فرۆشتن بە تاک:</span>
                  <span className="font-bold" style={{ fontFamily: 'Inter, system-ui', color: 'var(--theme-foreground)' }}>{(formData.selling_price || 0).toLocaleString()} IQD</span>
                </div>
                <div className="h-px my-3" style={{ backgroundColor: 'var(--theme-card-border)' }} />
                <div className="flex justify-between mb-3">
                  <span style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-secondary)' }}>قازانج:</span>
                  <span className={`font-bold ${profitAmount >= 0 ? 'text-green-500' : 'text-red-500'}`} style={{ fontFamily: 'Inter, system-ui' }}>{profitAmount.toLocaleString()} IQD</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-secondary)' }}>رێژەی قازانج:</span>
                  <span className={`font-bold ${profitRate >= 0 ? 'text-green-500' : 'text-red-500'}`} style={{ fontFamily: 'Inter, system-ui' }}>{profitRate.toFixed(1)}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-4 mt-8 justify-between">
          <button 
            onClick={() => setShowStockEntry(false)} 
            className="px-6 py-3 rounded-xl font-bold md:px-6 md:py-3 md:text-base px-1 py-0.5 text-[10px]"
            style={{ fontFamily: 'var(--font-uni-salar)', backgroundColor: 'var(--theme-muted)', color: 'var(--theme-secondary)' }}
          >
            پاشگەزبوونەوە
          </button>

          {currentStep > 1 && (
            <button 
              onClick={prevStep} 
              className="px-6 py-3 rounded-xl font-bold flex items-center md:px-6 md:py-3 md:text-base px-1 py-0.5 text-[10px]"
              style={{ fontFamily: 'var(--font-uni-salar)', backgroundColor: 'transparent', color: 'var(--theme-secondary)', border: '1px solid var(--theme-card-border)' }}
            >
              <FaArrowRight className="md:ml-2 ml-0.5 rtl:mr-0.5 rtl:ml-0 text-[8px] md:text-base" />
              قۆناغی پێشوو
            </button>
          )}

          {currentStep < 4 ? (
            <button 
              onClick={nextStep} 
              disabled={!canProceed()} 
              className={`px-6 py-3 rounded-xl font-bold flex items-center md:px-6 md:py-3 md:text-base px-1 py-0.5 text-[10px] ${canProceed() ? '' : 'opacity-50'}`}
              style={{ fontFamily: 'var(--font-uni-salar)', backgroundColor: canProceed() ? '#2563eb' : 'var(--theme-muted)', color: '#ffffff' }}
            >
              قۆناغی داهاتوو
              <FaArrowLeft className="md:mr-2 mr-0.5 rtl:ml-0.5 rtl:mr-0 text-[8px] md:text-base" />
            </button>
          ) : (
            <button 
              onClick={submitItem} 
              disabled={!formData.name?.trim() || !formData.quantity || !formData.selling_price || !formData.unit || isSubmitting} 
              className="px-8 py-3 rounded-xl font-bold flex items-center md:px-8 md:py-3 md:text-base px-1 py-0.5 text-[10px]"
              style={{ fontFamily: 'var(--font-uni-salar)', backgroundColor: formData.name?.trim() && formData.quantity && formData.selling_price && formData.unit ? '#22c55e' : 'var(--theme-muted)', color: '#ffffff' }}
            >
              {isSubmitting ? (
                <><FaSpinner className="animate-spin md:ml-2 ml-0.5 text-[8px] md:text-base" />تۆمارکردن...</>
              ) : (
                <><FaCheck className="md:ml-2 ml-0.5 text-[8px] md:text-base" />تۆمارکردن</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
