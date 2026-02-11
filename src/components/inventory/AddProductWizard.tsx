'use client'

import { useSyncPause } from '@/contexts/SyncPauseContext'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FaArrowLeft, FaArrowRight, FaCheck, FaExclamationTriangle, FaUpload, FaTag, FaBox, FaBarcode, FaDollarSign } from 'react-icons/fa'

interface Supplier { id: string; name: string }
interface Unit { id: string; name: string }
interface Category { id: string; name: string }

interface AddProductWizardProps {
  showWizard: boolean
  setShowWizard: (show: boolean) => void
  editingItem?: any
  suppliers: Supplier[]
  onSuccess: () => void
}

interface FormData {
  name: string
  category: string
  unit: string
  purchase_price: number
  selling_price: number
  supplier_id: string
  initial_quantity: number
  min_stock_alert: number
  image: string
  barcode: string
  added_date: string
  expire_date: string
  note: string
}

const initialFormData: FormData = {
  name: '',
  category: '',
  unit: 'دانە',
  purchase_price: 0,
  selling_price: 0,
  supplier_id: '',
  initial_quantity: 0,
  min_stock_alert: 0,
  image: '',
  barcode: '',
  added_date: new Date().toISOString().split('T')[0],
  expire_date: '',
  note: ''
}

const steps = [
  { id: 1, title: 'زانیاری گشتی', icon: FaTag },
  { id: 2, title: 'نرخ و کڕین', icon: FaDollarSign },
  { id: 3, title: 'کۆگا و بڕ', icon: FaBox },
  { id: 4, title: 'وێنە و بارکۆد', icon: FaBarcode },
  { id: 5, title: 'کۆتایی', icon: FaCheck }
]

export default function AddProductWizard({ showWizard, setShowWizard, editingItem, suppliers, onSuccess }: AddProductWizardProps) {
  const { pauseSync, resumeSync } = useSyncPause()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isSubmitting) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = 'تۆمارکردن لە پڕۆسەدایە!'
        return e.returnValue
      }
      window.addEventListener('beforeunload', handler)
      return () => window.removeEventListener('beforeunload', handler)
    }
  }, [isSubmitting])

  useEffect(() => {
    if (!showWizard) return
    const fetchData = async () => {
      try {
        if (supabase) {
          const { data: cats } = await supabase.from('categories').select('*').order('name')
          const { data: uns } = await supabase.from('units').select('*').order('name')
          setCategories(cats || [])
          setUnits(uns || [])
        } else {
          setCategories([{ id: '1', name: 'خۆراك' }, { id: '2', name: 'خواردن' }, { id: '3', name: 'ئاو' }])
          setUnits([{ id: '1', name: 'کیلۆ' }, { id: '2', name: 'دانە' }])
        }
      } catch {
        setCategories([{ id: '1', name: 'خۆراك' }])
        setUnits([{ id: '1', name: 'دانە' }])
      }
    }
    fetchData()
    if (editingItem) {
      setFormData({ name: editingItem.name || '', category: editingItem.category || '', unit: editingItem.unit || 'دانە', purchase_price: editingItem.cost_per_unit ? editingItem.cost_per_unit * editingItem.total_amount_bought : 0, selling_price: editingItem.selling_price_per_unit || 0, supplier_id: editingItem.supplier_id || '', initial_quantity: editingItem.total_amount_bought || 0, min_stock_alert: editingItem.min_stock_alert || 0, image: editingItem.image || '', barcode: editingItem.barcode1 || '', added_date: editingItem.added_date || new Date().toISOString().split('T')[0], expire_date: editingItem.expire_date || '', note: editingItem.note || '' })
      setCurrentStep(5)
    } else {
      setFormData(initialFormData)
      setCurrentStep(1)
    }
  }, [showWizard, editingItem])

  const generateBarcode = () => `PRD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const fileName = `${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('product-images').upload(fileName, file)
      if (error) throw error
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
      setFormData(prev => ({ ...prev, image: urlData.publicUrl }))
    } catch {
      setErrorMessage('هەڵە لە ئەپلۆدکردن')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const canProceed = () => {
    if (currentStep === 1) return formData.name.trim() && formData.category && formData.unit
    if (currentStep === 2) return formData.purchase_price > 0 && formData.selling_price > 0
    if (currentStep === 3) return formData.initial_quantity > 0
    return true
  }

  const nextStep = () => {
    if (!canProceed()) {
      setErrorMessage('تکایە هەموو زانیارییەکان پڕبکەرەوە')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    setCurrentStep(Math.min(currentStep + 1, 5))
  }

  const prevStep = () => setCurrentStep(Math.max(currentStep - 1, 1))
  const costPerUnit = formData.initial_quantity > 0 ? formData.purchase_price / formData.initial_quantity : formData.purchase_price
  const profitAmount = formData.selling_price - costPerUnit
  const profitRate = costPerUnit > 0 ? (profitAmount / costPerUnit) * 100 : 0

  const submitProduct = async () => {
    if (!formData.name.trim() || !formData.initial_quantity || !formData.selling_price) {
      setErrorMessage('تکایە هەموو زانیارییە پێویستەکان پڕبکەرەوە')
      return
    }
    setIsSubmitting(true)
    let wakeLock: any = null
    try {
      if ('wakeLock' in navigator) wakeLock = await (navigator as any).wakeLock?.request('screen')
      pauseSync('AddProductWizard')
      const productsData = {
        name: formData.name.trim(),
        total_amount_bought: Number(formData.initial_quantity),
        unit: formData.unit,
        cost_per_unit: costPerUnit,
        selling_price_per_unit: Number(formData.selling_price),
        total_purchase_price: Number(formData.purchase_price),
        category: formData.category,
        image: formData.image || null,
        barcode1: formData.barcode || null,
        barcode4: generateBarcode(),
        added_date: formData.added_date,
        expire_date: formData.expire_date || null,
        supplier_id: formData.supplier_id || null,
        note: formData.note || null,
        min_stock_alert: Number(formData.min_stock_alert) || null
      }
      if (editingItem) {
        await supabase.from('products').update(productsData).eq('id', editingItem.id)
      } else {
        await supabase.from('products').insert(productsData)
        if (formData.supplier_id && formData.purchase_price > 0) {
          await supabase.from('purchase_expenses').insert({ item_name: formData.name.trim(), total_purchase_price: Number(formData.purchase_price), total_amount_bought: Number(formData.initial_quantity), unit: formData.unit, purchase_date: formData.added_date })
        }
      }
      setIsSubmitting(false)
      setShowWizard(false)
      onSuccess()
    } catch (e: any) {
      setErrorMessage(`هەڵە: ${e?.message || 'نادیار'}`)
      setIsSubmitting(false)
    } finally {
      resumeSync('AddProductWizard')
      if (wakeLock) wakeLock.release().catch(() => {})
    }
  }

  if (!showWizard) return null
  const progress = (currentStep / 5) * 100

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl rounded-2xl shadow-2xl bg-white/95 p-8 max-h-[90vh] overflow-y-auto">
        {errorMessage && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2"><FaExclamationTriangle className="text-red-500" /><span style={{ fontFamily: 'var(--font-uni-salar)' }}>{errorMessage}</span></motion.div>}
        <div className="mb-6">
          <div className="flex justify-between mb-2"><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8rem' }}>قۆناغ {currentStep} لە 5</span><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8rem' }}>{steps[currentStep - 1].title}</span></div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-blue-600 to-purple-600" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} /></div>
        </div>
        <div className="flex justify-center mb-6">{steps.map((step) => (<div key={step.id} className="flex items-center"><div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStep >= step.id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>{currentStep > step.id ? <FaCheck /> : <step.icon className="text-sm" />}</div>{step.id < 5 && <div className={`w-8 h-1 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'} transition-all`} />}</div>))}</div>
        <h2 className="text-xl font-bold mb-6 text-center" style={{ fontFamily: 'var(--font-uni-salar)' }}>قۆناغی {currentStep}: {steps[currentStep - 1].title}</h2>
        <AnimatePresence mode="wait">
          {currentStep === 1 && <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div><label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا *</label><input type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className={`w-full px-4 py-3 rounded-xl border bg-white/80 ${!formData.name.trim() ? 'border-red-300' : 'border-gray-200'}`} style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="ناوی کاڵا بنووسە" /></div>
            <div><label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>پۆل *</label><select value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} className={`w-full px-4 py-3 rounded-xl border bg-white/80 ${!formData.category ? 'border-red-300' : 'border-gray-200'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}><option value="">هەڵبژێرە</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>یەکە *</label><select value={formData.unit} onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80" style={{ fontFamily: 'var(--font-uni-salar)' }}>{units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
          </motion.div>}
          {currentStep === 2 && <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div><label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی کڕین (کۆی گشتی) *</label><input type="number" value={formData.purchase_price || ''} onChange={e => setFormData(prev => ({ ...prev, purchase_price: Number(e.target.value) }))} className={`w-full px-4 py-3 rounded-xl border bg-white/80 ${!formData.purchase_price ? 'border-red-300' : 'border-gray-200'}`} style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="0" /></div>
            <div><label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی فرۆشتن *</label><input type="number" value={formData.selling_price || ''} onChange={e => setFormData(prev => ({ ...prev, selling_price: Number(e.target.value) }))} className={`w-full px-4 py-3 rounded-xl border bg-white/80 ${!formData.selling_price ? 'border-red-300' : 'border-gray-200'}`} style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="0" /></div>
            <div><label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>دابینکەر</label><select value={formData.supplier_id} onChange={e => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80" style={{ fontFamily: 'var(--font-uni-salar)' }}><option value="">هەڵبژێرە</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4"><p style={{ fontFamily: 'var(--font-uni-salar)' }}>قازانج: <span className={`font-bold ${profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profitAmount.toLocaleString()} IQD ({profitRate.toFixed(1)}%)</span></p></div>
          </motion.div>}
          {currentStep === 3 && <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div><label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕی سەرەتایی *</label><input type="number" value={formData.initial_quantity || ''} onChange={e => setFormData(prev => ({ ...prev, initial_quantity: Number(e.target.value) }))} className={`w-full px-4 py-3 rounded-xl border bg-white/80 ${!formData.initial_quantity ? 'border-red-300' : 'border-gray-200'}`} style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="0" /></div>
            <div><label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ئاگادارکردنەوەی کەمبوونەوە</label><input type="number" value={formData.min_stock_alert || ''} onChange={e => setFormData(prev => ({ ...prev, min_stock_alert: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80" style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="0" /></div>
            <div><label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەرواری زیادکردن</label><input type="date" value={formData.added_date} onChange={e => setFormData(prev => ({ ...prev, added_date: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80" style={{ fontFamily: 'var(--font-uni-salar)' }} /></div>
            <div><label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەرواری تەواوبوون</label><input type="date" value={formData.expire_date} onChange={e => setFormData(prev => ({ ...prev, expire_date: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80" style={{ fontFamily: 'var(--font-uni-salar)' }} /></div>
          </motion.div>}
          {currentStep === 4 && <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="flex flex-col items-center mb-4"><div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 mb-3">{formData.image ? <img src={formData.image} alt="Preview" className="w-full h-full object-cover" /> : <FaUpload className="text-3xl text-gray-400" />}</div><label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer" style={{ fontFamily: 'var(--font-uni-salar)' }}><FaUpload /><span>ئەپلۆدکردن</span><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>{formData.image && <button onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="text-red-500 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>سڕینەوە</button>}</div>
            <div><label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بارکۆد</label><div className="flex gap-2"><input type="text" value={formData.barcode} onChange={e => setFormData(prev => ({ ...prev, barcode: e.target.value }))} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white/80" style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="بارکۆد بنووسە" /><button onClick={() => setFormData(prev => ({ ...prev, barcode: generateBarcode() }))} className="px-4 py-3 bg-purple-500 text-white rounded-xl" style={{ fontFamily: 'var(--font-uni-salar)' }}>دروستکردن</button></div></div>
          </motion.div>}
          {currentStep === 5 && <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between border-b border-gray-200 pb-2"><span style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی کاڵا:</span><span className="font-bold">{formData.name}</span></div>
              <div className="flex justify-between border-b border-gray-200 pb-2"><span style={{ fontFamily: 'var(--font-uni-salar)' }}>پۆل:</span><span className="font-bold">{formData.category}</span></div>
              <div className="flex justify-between border-b border-gray-200 pb-2"><span style={{ fontFamily: 'var(--font-uni-salar)' }}>یەکە:</span><span className="font-bold">{formData.unit}</span></div>
              <div className="flex justify-between border-b border-gray-200 pb-2"><span style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ:</span><span className="font-bold">{formData.initial_quantity} {formData.unit}</span></div>
              <div className="flex justify-between border-b border-gray-200 pb-2"><span style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی کڕین:</span><span className="font-bold">{formData.purchase_price.toLocaleString()} IQD</span></div>
              <div className="flex justify-between border-b border-gray-200 pb-2"><span style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخی فرۆشتن:</span><span className="font-bold">{formData.selling_price.toLocaleString()} IQD</span></div>
              <div className="flex justify-between"><span style={{ fontFamily: 'var(--font-uni-salar)' }}>قازانج:</span><span className={`font-bold ${profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profitAmount.toLocaleString()} IQD</span></div>
            </div>
          </motion.div>}
        </AnimatePresence>
        <div className="flex gap-4 mt-6 justify-between">
          <button onClick={() => setShowWizard(false)} className="px-6 py-3 bg-gray-400 text-white rounded-xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>پاشگەزبوونەوە</button>
          <div className="flex gap-4">
            {currentStep > 1 && <button onClick={prevStep} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold flex items-center" style={{ fontFamily: 'var(--font-uni-salar)' }}><FaArrowRight className="ml-2" />پێشوو</button>}
            {currentStep < 5 ? <button onClick={nextStep} disabled={!canProceed()} className={`px-6 py-3 rounded-xl font-bold flex items-center ${canProceed() ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>دواتر<FaArrowLeft className="mr-2" /></button> : <button onClick={submitProduct} disabled={isSubmitting || !formData.name.trim() || !formData.initial_quantity || !formData.selling_price} className={`px-6 py-3 rounded-xl font-bold ${isSubmitting || !formData.name.trim() || !formData.initial_quantity || !formData.selling_price ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>{isSubmitting ? '...' : 'پاشەکەوتکردن'}</button>}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
