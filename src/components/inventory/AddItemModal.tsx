'use client'

import { useSyncPause } from '@/contexts/SyncPauseContext'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FaArrowLeft, FaArrowRight, FaCheck, FaExclamationTriangle, FaUpload } from 'react-icons/fa'

interface AddItemModalProps {
  showStockEntry: boolean
  setShowStockEntry: (show: boolean) => void
  currentStep: number
  setCurrentStep: (step: number) => void
  editingItem: any
  formData: any
  setFormData: (data: any) => void
  suppliers: any[]
  units: any[]
  onSuccess: () => void
}

interface Supplier { id: string; name: string }
interface Unit { id: string; name: string }
interface Category { id: string; name: string }

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
  onSuccess
}: AddItemModalProps) {
  const { pauseSync } = useSyncPause()
  const [categories, setCategories] = useState<Category[]>([])
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchCategories = async () => {
      if (!supabase) {
        setCategories([
          { id: '1', name: 'خۆراك' },
          { id: '2', name: 'خواردن' },
          { id: '3', name: 'ئاو' },
          { id: '4', name: 'کیلۆ' }
        ])
        return
      }
      try {
        const { data } = await supabase.from('categories').select('*').order('name')
        setCategories(data || [])
      } catch (error) {
        setCategories([
          { id: '1', name: 'خۆراك' },
          { id: '2', name: 'خواردن' },
          { id: '3', name: 'ئاو' }
        ])
      }
    }
    fetchCategories()
  }, [])

  // Calculate unit cost from price_of_bought and quantity
  // When editing, formData.price_of_bought is already calculated from cost_per_unit * total_amount_bought
  const unitCost = formData.quantity > 0 ? formData.price_of_bought / formData.quantity : formData.price_of_bought
  const profitAmount = formData.selling_price - unitCost
  const profitRate = unitCost > 0 ? (profitAmount / unitCost) * 100 : 0

  const generateBarcode4 = () => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `LOC-${timestamp}-${random}`
  }

  useEffect(() => {
    if (showStockEntry && !formData.barcode4) {
      setFormData(prev => ({ ...prev, barcode4: generateBarcode4() }))
    }
  }, [showStockEntry])

  const handleBarcode3Blur = () => {
    if (!formData.barcode4) {
      setFormData(prev => ({ ...prev, barcode4: generateBarcode4() }))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const fileName = `${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('product-images').upload(fileName, file)
      if (error) throw error
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
      setFormData(prev => ({ ...prev, image: urlData.publicUrl }))
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
    
    try {
      pauseSync(10000)
      
      // Prepare products data
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
        // When adding new, insert into products and track expense
        ({ error } = await supabase.from('products').insert(productsData))
        
        if (error) throw error
        console.log('✅ Product inserted into products table:', formData.name)
        
        // Step 2: Sync to purchase_expenses for expense tracking (only for NEW items)
        if (formData.supplier_id && formData.price_of_bought > 0) {
          const { error: purchaseError } = await supabase.from('purchase_expenses').insert({
            item_name: formData.name.trim(),
            total_purchase_price: Number(formData.price_of_bought),
            total_amount_bought: Number(formData.quantity),
            unit: formData.unit,
            purchase_date: formData.added_date
          })
          
          if (purchaseError) throw purchaseError
          console.log('✅ Expense tracked in purchase_expenses:', formData.name)
        }
        
        // Step 3: Track transactions and debts (only for NEW items)
        if (formData.is_not_fully_paid && formData.remain_amount > 0) {
          // Partial payment - record debt
          await supabase.from('supplier_transactions').insert({
            supplier_id: formData.supplier_id,
            item_name: formData.name.trim(),
            total_price: Number(formData.price_of_bought),
            amount_paid: Number(formData.price_of_bought) - Number(formData.remain_amount),
            debt_amount: Number(formData.remain_amount),
            date: formData.added_date
          })
          await supabase.from('supplier_debts').insert({
            supplier_id: formData.supplier_id,
            amount: formData.remain_amount,
            note: formData.name,
            date: formData.added_date
          })
          console.log('✅ Partial payment tracked:', { debt: formData.remain_amount })
        } else {
          // Full payment
          await supabase.from('supplier_transactions').insert({
            supplier_id: formData.supplier_id,
            item_name: formData.name.trim(),
            total_price: Number(formData.price_of_bought),
            amount_paid: Number(formData.price_of_bought),
            debt_amount: 0,
            date: formData.added_date
          })
          console.log('✅ Full payment tracked in supplier_transactions')
        }
      }
      
      // Success
      console.log('✅ All records saved successfully')
      setShowStockEntry(false)
      onSuccess()
    } catch (e: any) {
      console.error('❌ Error saving:', e.message, e.details, e.hint)
      setErrorMessage(`هەڵە: ${e?.message || 'نادیار'}`)
    }
  }

  if (!showStockEntry) return null
  const progress = (currentStep / 4) * 100

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl bg-white/95 p-8 max-h-[90vh] overflow-y-auto">
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <FaExclamationTriangle className="text-red-500" />
            <span style={{ fontFamily: 'var(--font-uni-salar)', color: '#dc2626' }}>{errorMessage}</span>
          </motion.div>
        )}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8rem' }}>قۆناغ {currentStep} لە 4</span>
            <span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8rem' }}>
              {currentStep === 1 && 'کڕین و قەرز'}
              {currentStep === 2 && 'بڕ و یەکە'}
              {currentStep === 3 && 'ناساندن'}
              {currentStep === 4 && 'نرخ و قازانج'}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-blue-600 to-purple-600" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
        <div className="flex justify-center mb-6">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                {currentStep > step ? <FaCheck /> : step}
              </div>
              {step < 4 && <div className={`w-12 h-1 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <h2 className="text-xl font-bold mb-6 text-center" style={{ fontFamily: 'var(--font-uni-salar)' }}>
          {currentStep === 1 && 'قۆناغی 1: کڕین و قەرز'}
          {currentStep === 2 && 'قۆناغی 2: بڕ و یەکە'}
          {currentStep === 3 && 'قۆناغی 3: ناساندن'}
          {currentStep === 4 && 'قۆناغی 4: نرخ و قازانج'}
        </h2>
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>دابینکەر *</label>
                <select value={formData.supplier_id || ''} onChange={e => setFormData({...formData, supplier_id: e.target.value})} className={`w-full px-4 py-3 rounded-lg border bg-white ${!formData.supplier_id ? 'border-red-300' : ''}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  <option value="">هەڵبژێرە</option>
                  {suppliers.map((s: Supplier) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی کڕین (کۆی گشتی) *</label>
                <input type="number" value={formData.price_of_bought || ''} onChange={e => setFormData({...formData, price_of_bought: Number(e.target.value.replace(/^0+/, ''))})} className={`w-full px-4 py-3 rounded-lg border bg-white ${!formData.price_of_bought ? 'border-red-300' : ''}`} style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="0" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={formData.is_not_fully_paid || false} onChange={e => setFormData({...formData, is_not_fully_paid: e.target.checked})} className="w-5 h-5" />
                <label style={{ fontFamily: 'var(--font-uni-salar)' }}>پارەکە بە تەواوی نەدراوە (قەرز)</label>
              </div>
              {formData.is_not_fully_paid && (
                <div>
                  <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕی قەرز</label>
                  <input type="number" value={formData.remain_amount || ''} onChange={e => setFormData({...formData, remain_amount: Number(e.target.value.replace(/^0+/, ''))})} className="w-full px-4 py-3 rounded-lg border bg-white" style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="0" />
                </div>
              )}
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ *</label>
                  <input type="number" value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: Number(e.target.value.replace(/^0+/, ''))})} className={`w-full px-4 py-3 rounded-lg border bg-white ${!formData.quantity ? 'border-red-300' : ''}`} style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>یەکە</label>
                  <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-4 py-3 rounded-lg border bg-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    <option value="دانە">دانە</option>
                    {units.map((u: Unit) => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی هەر یەکەیە:</p>
                <p className="text-2xl font-bold text-blue-600">{unitCost.toLocaleString()} IQD</p>
              </div>
            </motion.div>
          )}
          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm mb-2 text-center" style={{ fontFamily: 'var(--font-uni-salar)' }}>وێنەی کاڵا</label>
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <FaUpload className="text-3xl text-gray-400" />
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    <FaUpload />
                    <span>ئەپلۆدکردن</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {formData.image && (
                    <button onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="text-red-500 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      سڕینەوەی وێنە
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا *</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className={`w-full px-4 py-3 rounded-lg border bg-white ${!formData.name?.trim() ? 'border-red-300' : ''}`} style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="ناوی کاڵا بنووسە" />
              </div>
              
              <div>
                <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>پۆڵ *</label>
                <select value={formData.category || ''} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} className={`w-full px-4 py-3 rounded-lg border bg-white ${!formData.category ? 'border-red-300' : ''}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  <option value="">هەڵبژێرە</option>
                  {categories.map((c: Category) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>بارکۆد 1</label>
                  <input type="text" value={formData.barcode1 || ''} onChange={e => setFormData(prev => ({ ...prev, barcode1: e.target.value }))} className="w-full px-4 py-3 rounded-lg border bg-white" style={{ fontFamily: 'var(--font-uni-salar)' }} />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>بارکۆد 2</label>
                  <input type="text" value={formData.barcode2 || ''} onChange={e => setFormData(prev => ({ ...prev, barcode2: e.target.value }))} className="w-full px-4 py-3 rounded-lg border bg-white" style={{ fontFamily: 'var(--font-uni-salar)' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>بارکۆد 3</label>
                  <input type="text" value={formData.barcode3 || ''} onChange={e => setFormData(prev => ({ ...prev, barcode3: e.target.value }))} onBlur={handleBarcode3Blur} className="w-full px-4 py-3 rounded-lg border bg-white" style={{ fontFamily: 'var(--font-uni-salar)' }} />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>بارکۆد 4 (ئۆتۆ)</label>
                  <input type="text" value={formData.barcode4 || ''} className="w-full px-4 py-3 rounded-lg border bg-gray-100" style={{ fontFamily: 'var(--font-uni-salar)' }} readOnly />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەرواری زیادکردن</label>
                  <input type="date" value={formData.added_date || ''} onChange={e => setFormData(prev => ({ ...prev, added_date: e.target.value }))} className="w-full px-4 py-3 rounded-lg border bg-white" style={{ fontFamily: 'var(--font-uni-salar)' }} />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەرواری تەواوبوون</label>
                  <input type="date" value={formData.expire_date || ''} onChange={e => setFormData(prev => ({ ...prev, expire_date: e.target.value }))} className="w-full px-4 py-3 rounded-lg border bg-white" style={{ fontFamily: 'var(--font-uni-salar)' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>تێبینی</label>
                <textarea value={formData.note || ''} onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))} className="w-full px-4 py-3 rounded-lg border bg-white" rows={2} style={{ fontFamily: 'var(--font-uni-salar)' }} />
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="block text-sm mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی فرۆشتن *</label>
                <input type="number" value={formData.selling_price || ''} onChange={e => setFormData(prev => ({ ...prev, selling_price: Number(e.target.value.replace(/^0+/, '')) }))} className={`w-full px-4 py-3 rounded-lg border bg-white ${!formData.selling_price ? 'border-red-300' : ''}`} style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="0" />
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی کڕین:</span>
                  <span className="font-bold">{unitCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی فرۆشتن:</span>
                  <span className="font-bold">{(formData.selling_price || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span style={{ fontFamily: 'var(--font-uni-salar)' }}>قازانج:</span>
                  <span className={`font-bold ${profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profitAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontFamily: 'var(--font-uni-salar)' }}>رێژەی قازانج:</span>
                  <span className={`font-bold ${profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profitRate.toFixed(1)}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-4 mt-6 justify-between">
          <button onClick={() => setShowStockEntry(false)} className="px-6 py-3 bg-gray-400 text-white rounded-xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            پاشگەزبوونەوە
          </button>
          {currentStep > 1 && (
            <button onClick={prevStep} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold flex items-center" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              <FaArrowRight className="ml-2" />قۆناغی پێشوو
            </button>
          )}
          {currentStep < 4 ? (
            <button onClick={nextStep} disabled={!canProceed()} className={`px-6 py-3 rounded-xl font-bold flex items-center ${canProceed() ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
              قۆناغی داهاتوو <FaArrowLeft className="mr-2" />
            </button>
          ) : (
            <button onClick={submitItem} disabled={!formData.name?.trim() || !formData.quantity || !formData.selling_price} className={`px-6 py-3 rounded-xl font-bold ${formData.name?.trim() && formData.quantity && formData.selling_price ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
              تۆمارکردن
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
