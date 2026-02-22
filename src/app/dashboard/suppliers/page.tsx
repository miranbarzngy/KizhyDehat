'use client'

import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/components/Toast'
import { formatCurrency, toEnglishDigits } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { FaBox, FaEdit, FaList, FaPlus, FaSearch, FaTh, FaTimes, FaTrash } from 'react-icons/fa'
import { logActivity, ActivityActions, EntityTypes } from '@/lib/activityLogger'

const SupplierCard = dynamic(() => import('@/components/suppliers/SupplierCard').then(mod => mod.default), { ssr: false })
const SupplierTable = dynamic(() => import('@/components/suppliers/SupplierTable').then(mod => mod.default), { ssr: false })
const SupplierForm = dynamic(() => import('@/components/suppliers/SupplierForm').then(mod => mod.default), { ssr: false })

interface Supplier {
  id: string
  name: string
  company: string
  phone: string
  address: string
  supplier_image?: string
  balance: number
  total_debt?: number
}

interface SupplierPayment {
  id: string
  supplier_id: string
  amount: number
  date: string
  note?: string
  created_at: string
}

interface SupplierTransaction {
  id: string
  supplier_id: string
  item_name: string
  total_price: number
  amount_paid: number
  debt_amount: number
  date: string
  created_at: string
}

interface Product {
  id: string
  name: string
  category?: string
  image?: string
  total_amount_bought: number
  cost_per_unit: number
  selling_price_per_unit: number
  unit?: string
  added_date?: string
  is_archived?: boolean
}

export default function SuppliersPage() {
  const { showSuccess, showError } = useToast()
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [transactions, setTransactions] = useState<SupplierTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  
  // Payment management state
  const [payments, setPayments] = useState<SupplierPayment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [editingPayment, setEditingPayment] = useState<SupplierPayment | null>(null)

  // Products modal state
  const [showProductsModal, setShowProductsModal] = useState(false)
  const [selectedSupplierProducts, setSelectedSupplierProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Confirm modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {}
  })
  const [pendingDeleteSupplier, setPendingDeleteSupplier] = useState<Supplier | null>(null)

  useEffect(() => { fetchSuppliers() }, [])

  const fetchSuppliers = async () => {
    if (!supabase) { setSuppliers([]); setLoading(false); return }
    
    const { data: suppliersData } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false })
    
    if (!suppliersData || suppliersData.length === 0) {
      setSuppliers([])
      setLoading(false)
      return
    }

    const supplierIds = suppliersData.map(s => s.id)

    const { data: transactionDebts } = await supabase
      .from('supplier_transactions')
      .select('supplier_id, debt_amount')
      .in('supplier_id', supplierIds)

    const { data: payments } = await supabase
      .from('supplier_payments')
      .select('supplier_id, amount')
      .in('supplier_id', supplierIds)

    const debtFromTransactions: Record<string, number> = {}
    const paidFromPayments: Record<string, number> = {}

    transactionDebts?.forEach(tx => {
      if (tx.supplier_id && tx.debt_amount) {
        debtFromTransactions[tx.supplier_id] = (debtFromTransactions[tx.supplier_id] || 0) + tx.debt_amount
      }
    })

    payments?.forEach(pay => {
      if (pay.supplier_id && pay.amount) {
        paidFromPayments[pay.supplier_id] = (paidFromPayments[pay.supplier_id] || 0) + pay.amount
      }
    })

    const suppliersWithDebt = suppliersData.map(s => {
      const totalDebtFromTx = debtFromTransactions[s.id] || 0
      const totalPaid = paidFromPayments[s.id] || 0
      const calculatedDebt = Math.max(0, totalDebtFromTx - totalPaid)
      
      return {
        ...s,
        company: s.company || '',
        address: s.address || '',
        total_debt: calculatedDebt
      }
    })

    setSuppliers(suppliersWithDebt)
    setLoading(false)
  }

  const handleSaveSupplier = async (data: {
    name: string
    company: string
    phone: string
    address: string
    supplier_image?: string
  }, selectedFile?: File | null) => {
    if (!supabase) {
      showError('هەڵە لە پەیوەستبوون بە داتابەیس')
      return
    }

    setFormLoading(true)
    try {
      if (editingSupplier) {
        const { error } = await supabase.from('suppliers').update({
          name: data.name,
          company: data.company || null,
          phone: data.phone || null,
          address: data.address || null,
          supplier_image: data.supplier_image || null,
        }).eq('id', editingSupplier.id)

        if (error) {
          console.error('Error updating supplier:', error)
          showError('هەڵە لە نوێکردنەوە: ' + error.message)
          return
        }

        // Log the activity BEFORE closing modal (using hardcoded strings for testing)
        console.log('Supplier Edit Log Triggered', { name: data.name, id: editingSupplier.id })
        try {
          await logActivity(
            null,
            null,
            'update_supplier',
            `دەستکاریکردنی زانیارییەکانی دابینکەر: ${data.name}`,
            'supplier',
            editingSupplier.id
          )
          console.log('Supplier Edit Log Success')
        } catch (logError) {
          console.error('Supplier Edit Log Error:', logError)
        }

        await fetchSuppliers()
        setEditingSupplier(null)
        setShowAddModal(false)
        showSuccess('دابینکەرەکە نوێکرایەوە')
      } else {
        const { error } = await supabase.from('suppliers').insert({
          name: data.name,
          company: data.company || null,
          phone: data.phone || null,
          address: data.address || null,
          supplier_image: data.supplier_image || null,
          balance: 0,
          total_debt: 0
        })

        if (error) {
          console.error('Error inserting supplier:', error)
          showError('هەڵە لە تۆمارکردن: ' + error.message)
          return
        }

        await fetchSuppliers()
        setShowAddModal(false)
        showSuccess('دابینکەرەکە زیادکرا')
        
        // Log the activity
        await logActivity(
          null,
          null,
          ActivityActions.ADD_SUPPLIER,
          `دابینکەری ${data.name} زیادکرا`,
          EntityTypes.SUPPLIER
        )
      }
    } catch (error) {
      console.error('Error saving supplier:', error)
      showError('هەڵە لە تۆمارکردن')
    } finally {
      setFormLoading(false)
    }
  }

  const confirmDeleteSupplier = (supplier: Supplier) => {
    setPendingDeleteSupplier(supplier)
    setConfirmModalConfig({
      title: 'سڕینەوەی دابینکەر',
      message: `دڵنیایت لە سڕینەوەی "${supplier.name}"؟`,
      onConfirm: () => executeDeleteSupplier(supplier)
    })
    setShowConfirmModal(true)
  }

  const executeDeleteSupplier = async (supplier: Supplier) => {
    if (!supabase) {
      showError('هەڵە لە پەیوەستبوون بە داتابەیس')
      setShowConfirmModal(false)
      return
    }

    try {
      let hasProducts = false
      let hasTransactions = false
      let hasPayments = false
      
      try {
        const { data: productsData, count: productsCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('supplier_id', supplier.id)
        hasProducts = (productsCount || 0) > 0
      } catch (e) {
        console.warn('Could not check products:', e)
      }
      
      try {
        const { data: txData, count: txCount } = await supabase
          .from('supplier_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('supplier_id', supplier.id)
        hasTransactions = (txCount || 0) > 0
      } catch (e) {
        console.warn('Could not check transactions:', e)
      }
      
      try {
        const { data: payData, count: payCount } = await supabase
          .from('supplier_payments')
          .select('id', { count: 'exact', head: true })
          .eq('supplier_id', supplier.id)
        hasPayments = (payCount || 0) > 0
      } catch (e) {
        console.warn('Could not check payments:', e)
      }

      if (hasProducts) {
        showError('ناتوانرێت ئەم دابینکەرە بسڕدرێتەوە چونکە بەرهەمەکانی لە لیستی کاڵاکاندایە')
        setShowConfirmModal(false)
        return
      }

      if (hasTransactions || hasPayments) {
        showError('ناتوانرێت ئەم دابینکەرە بسڕدرێتەوە چونکە مێژووی پارەدانەکانی هەیە')
        setShowConfirmModal(false)
        return
      }

      const { error } = await supabase.from('suppliers').delete().eq('id', supplier.id)

      if (error) {
        console.error('Error deleting supplier:', error)
        showError('هەڵە لە سڕینەوە')
        setShowConfirmModal(false)
        return
      }

      await fetchSuppliers()
      showSuccess('دابینکەرەکە سڕایەوە')

      // Log the activity
      await logActivity(
        null,
        null,
        ActivityActions.DELETE_SUPPLIER,
        `دابینکەر ${supplier.name} سڕایەوە`,
        EntityTypes.SUPPLIER,
        supplier.id
      )
    } catch (error: any) {
      console.error('Error deleting supplier:', error)
      showError('هەڵە لە سڕینەوە')
    } finally {
      setShowConfirmModal(false)
      setPendingDeleteSupplier(null)
    }
  }

  const handleDeleteSupplier = confirmDeleteSupplier

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setShowAddModal(true)
  }

  const calculateDebtDynamically = async (supplierId: string): Promise<number> => {
    if (!supabase) return 0
    
    try {
      const { data: transactions } = await supabase
        .from('supplier_transactions')
        .select('debt_amount')
        .eq('supplier_id', supplierId)

      const totalDebtFromTransactions = (transactions || []).reduce((sum, tx) => sum + (tx.debt_amount || 0), 0)

      const { data: payments } = await supabase
        .from('supplier_payments')
        .select('amount')
        .eq('supplier_id', supplierId)

      const totalPaidFromPayments = (payments || []).reduce((sum, pay) => sum + (pay.amount || 0), 0)

      const calculatedDebt = totalDebtFromTransactions - totalPaidFromPayments
      
      return Math.max(0, calculatedDebt)
    } catch (error) {
      console.error('Error calculating debt:', error)
      return 0
    }
  }

  const handleHistoryClick = async (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setShowHistoryModal(true)
    setLoadingTransactions(true)
    setLoadingPayments(true)
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
    setEditingPayment(null)

    if (!supabase) {
      setLoadingTransactions(false)
      setLoadingPayments(false)
      return
    }

    try {
      const { data: txData } = await supabase
        .from('supplier_transactions')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('date', { ascending: false })

      setTransactions(txData || [])

      const { data: payData } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false })

      setPayments(payData || [])

      const calculatedDebt = await calculateDebtDynamically(supplier.id)
      
      setSelectedSupplier({ ...supplier, total_debt: calculatedDebt })
      
      setSuppliers(prev => prev.map(s => 
        s.id === supplier.id ? { ...s, total_debt: calculatedDebt } : s
      ))
    } catch (error) {
      console.error('Error fetching data:', error)
      setTransactions([])
      setPayments([])
    } finally {
      setLoadingTransactions(false)
      setLoadingPayments(false)
    }
  }

  // Handle View Products click - fetch products for the supplier
  const handleViewProductsClick = async (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setShowProductsModal(true)
    setLoadingProducts(true)
    setSelectedSupplierProducts([])

    if (!supabase) {
      setLoadingProducts(false)
      return
    }

    try {
      // Fetch products where supplier_id matches
      const { data: productsData, error } = await supabase
        .from('products')
        .select('id, name, category, image, total_amount_bought, cost_per_unit, selling_price_per_unit, unit, added_date, is_archived')
        .eq('supplier_id', supplier.id)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching products:', error)
        showError('هەڵە لە فێڵکردنەوەی کاڵاکان: ' + error.message)
        setSelectedSupplierProducts([])
      } else {
        setSelectedSupplierProducts(productsData || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      showError('هەڵە لە فێڵکردنەوەی کاڵاکان')
      setSelectedSupplierProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplier || !paymentForm.amount || !paymentForm.date) {
      alert('تکایە هەموو زانیارییە پێویستەکان پڕبکەرەوە')
      return
    }

    const amount = parseFloat(paymentForm.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('تکایە بڕی پارە بە دروستی بنووسە')
      return
    }

    const dateStr = paymentForm.date
    
    setSubmittingPayment(true)
    try {
      const response = await fetch('/api/supplier-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: selectedSupplier.id,
          amount: amount,
          date: dateStr,
          note: paymentForm.note || ''
        })
      })

      const result = await response.json()
      
      if (!response.ok || !result.success) {
        alert(result.error || 'هەڵە لە تۆمارکردن')
        return
      }

      const { data: payData } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('supplier_id', selectedSupplier.id)
        .order('created_at', { ascending: false })
      setPayments(payData || [])

      const newDebt = await calculateDebtDynamically(selectedSupplier.id)
      setSelectedSupplier({ ...selectedSupplier, total_debt: newDebt })
      setSuppliers(prev => prev.map(s => 
        s.id === selectedSupplier.id ? { ...s, total_debt: newDebt } : s
      ))

      setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
      alert('پارەدانەکە بە سەرکەوتوویی تۆمارکرا!')
    } catch (error) {
      console.error('Error adding payment:', error)
      alert('هەڵە لە تۆمارکردن')
    } finally {
      setSubmittingPayment(false)
    }
  }

  const handleEditPayment = (payment: SupplierPayment) => {
    setEditingPayment(payment)
    setPaymentForm({
      amount: payment.amount.toString(),
      date: payment.date,
      note: payment.note || ''
    })
  }

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplier || !editingPayment || !paymentForm.amount || !paymentForm.date) return

    setSubmittingPayment(true)
    try {
      const response = await fetch('/api/supplier-payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPayment.id,
          supplier_id: selectedSupplier.id,
          amount: parseFloat(paymentForm.amount),
          date: paymentForm.date,
          note: paymentForm.note
        })
      })

      const result = await response.json()
      if (!response.ok) {
        alert(result.error || 'هەڵە لە نوێکردنەوە')
        return
      }

      const { data: payData } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('supplier_id', selectedSupplier.id)
        .order('created_at', { ascending: false })
      setPayments(payData || [])

      setSelectedSupplier({ ...selectedSupplier, total_debt: result.newDebt })
      
      setSuppliers(prev => prev.map(s => 
        s.id === selectedSupplier.id ? { ...s, total_debt: result.newDebt } : s
      ))

      setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
      setEditingPayment(null)
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('هەڵە لە نوێکردنەوە')
    } finally {
      setSubmittingPayment(false)
    }
  }

  const handleDeletePayment = async (payment: SupplierPayment) => {
    const confirmed = window.confirm('دڵنیایت لە سڕینەوەی ئەم پارەدانە؟')
    if (!confirmed || !selectedSupplier) return

    try {
      const response = await fetch(`/api/supplier-payments?id=${payment.id}&supplier_id=${selectedSupplier.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'هەڵە لە سڕینەوە' }))
        alert(errorData.error || 'هەڵە لە سڕینەوە')
        return
      }

      const result = await response.json()

      const { data: payData } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('supplier_id', selectedSupplier.id)
        .order('created_at', { ascending: false })
      setPayments(payData || [])

      const newDebt = result.newDebt !== undefined 
        ? result.newDebt 
        : await calculateDebtDynamically(selectedSupplier.id)
      
      setSelectedSupplier({ ...selectedSupplier, total_debt: newDebt })
      
      setSuppliers(prev => prev.map(s => 
        s.id === selectedSupplier.id ? { ...s, total_debt: newDebt } : s
      ))
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('هەڵە لە سڕینەوە')
    }
  }

  const handleCloseForm = () => {
    setShowAddModal(false)
    setEditingSupplier(null)
  }

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false)
    setSelectedSupplier(null)
    setPayments([])
    setTransactions([])
    setEditingPayment(null)
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
  }

  const cancelEditPayment = () => {
    setEditingPayment(null)
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
  }

  const filteredSuppliers = suppliers.filter(s =>
    !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm)
  )

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--theme-background)' }}><div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--theme-accent)' }}></div></div>
  }

  // Helper function to get stock status color
  const getStockColor = (quantity: number) => {
    if (quantity === 0) return { bg: 'bg-red-600', text: 'text-white', border: 'border-red-500', label: 'تەواو' }
    if (quantity <= 5) return { bg: 'bg-yellow-500', text: 'text-black', border: 'border-yellow-400', label: 'کەمە' }
    return { bg: 'bg-green-600', text: 'text-white', border: 'border-green-500', label: 'باشە' }
  }

  return (
    <div className="p-6 pl-0 md:pl-6">
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>
        بەڕێوەبردنی دابینکەران
      </h1>

      <div className="rounded-3xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>
            لیستی دابینکەران
          </h2>
          <div className="flex items-center space-x-2">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors`} style={{ backgroundColor: viewMode === 'grid' ? 'var(--theme-accent)' : 'var(--theme-muted)', color: viewMode === 'grid' ? '#ffffff' : 'var(--theme-secondary)' }}>
              <FaTh size={18} />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-colors`} style={{ backgroundColor: viewMode === 'table' ? 'var(--theme-accent)' : 'var(--theme-muted)', color: viewMode === 'table' ? '#ffffff' : 'var(--theme-secondary)' }}>
              <FaList size={18} />
            </button>
          </div>
        </div>

        <div className="mb-6 relative">
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--theme-secondary)' }} />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="گەڕان..."
            className="w-full px-4 py-3 pr-12 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all"
            style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
          />
        </div>

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
            <motion.div
              onClick={() => { setEditingSupplier(null); setShowAddModal(true) }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer min-h-[200px]"
              style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)', borderStyle: 'dashed', borderWidth: '2px', backdropFilter: 'blur(12px)' }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--theme-muted)' }}>
                <FaPlus size={32} style={{ color: 'var(--theme-accent)' }} />
              </div>
              <span className="text-lg font-semibold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>
                زیادکردنی دابینکەر
              </span>
            </motion.div>
            
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map(supplier => (
                <SupplierCard key={supplier.id} supplier={supplier}
                  onEdit={() => handleEditSupplier(supplier)}
                  onDelete={() => handleDeleteSupplier(supplier)}
                  onHistory={() => handleHistoryClick(supplier)}
                  onViewProducts={() => handleViewProductsClick(supplier)}
                />
              ))
            ) : (
              <div className="col-span-full p-12 rounded-2xl shadow-lg text-center" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)', borderWidth: '1px' }}>
                <div className="text-6xl mb-4">🏢</div>
                <p style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '1.2rem', color: 'var(--theme-secondary)' }}>
                  هیچ دابینکەر نەدۆزرایەوە
                </p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'table' && (
          <SupplierTable 
            suppliers={filteredSuppliers} 
            onEdit={(supplier) => handleEditSupplier(supplier)} 
            onDelete={(supplier) => handleDeleteSupplier(supplier)} 
          />
        )}
      </div>

      <SupplierForm 
        isOpen={showAddModal} 
        onClose={handleCloseForm} 
        onSave={handleSaveSupplier} 
        isEdit={!!editingSupplier}
        initialData={editingSupplier}
        isLoading={formLoading}
      />

      {/* Products Modal - Glassmorphism */}
      <AnimatePresence>
        {showProductsModal && selectedSupplier && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              style={{ 
                background: 'rgba(15, 23, 42, 0.95)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: '1px',
                backdropFilter: 'blur(20px)'
              }}
            >
              {/* Header */}
              <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>
                    <FaBox className="text-indigo-400" />
                    لیستی کاڵاکانی دابینکەر
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}>
                    {selectedSupplier.name}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontFamily: 'var(--font-uni-salar)' }}>
                    {toEnglishDigits(selectedSupplierProducts.length)} کاڵا
                  </span>
                  <button onClick={() => setShowProductsModal(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <FaTimes size={20} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {loadingProducts ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--theme-accent)' }}></div>
                  </div>
                ) : selectedSupplierProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSupplierProducts.map((product) => {
                      const stockStatus = getStockColor(Math.abs(product.total_amount_bought))
                      return (
                        <div 
                          key={product.id}
                          className="p-4 rounded-xl border flex items-center gap-4"
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          {/* Product Image */}
                          <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <FaBox className="text-gray-600" size={24} />
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            {/* Archived Badge */}
                            {product.is_archived && (
                              <div 
                                className="px-2 py-0.5 rounded-full text-xs text-white font-bold mb-1 inline-block"
                                style={{ 
                                  backgroundColor: '#ef4444',
                                  fontFamily: 'var(--font-uni-salar)'
                                }}
                              >
                                تەواو بووە
                              </div>
                            )}
                            <h4 className="font-bold truncate" style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>
                              {product.name}
                            </h4>
                            {product.category && (
                              <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'var(--font-uni-salar)' }}>
                                {product.category}
                              </p>
                            )}
                            {product.added_date && (
                              <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'var(--font-uni-salar)' }}>
                                {new Date(product.added_date).toLocaleDateString('en-US')}
                              </p>
                            )}
                          </div>

                          {/* Stock & Price */}
                          <div className="text-right flex-shrink-0">
                            <div className={`px-2 py-1 rounded-full text-xs mb-1 inline-block ${stockStatus.bg} ${stockStatus.text} border ${stockStatus.border}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                              {toEnglishDigits(Math.abs(product.total_amount_bought))} {product.unit || 'دانە'}
                            </div>
                            <div className="text-sm font-bold" style={{ color: '#22c55e', fontFamily: 'Inter, sans-serif' }}>
                              {toEnglishDigits(formatCurrency(product.selling_price_per_unit))} د.ع
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <p style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                      هیچ کاڵایەک بۆ ئەم دابینکەرە تۆمار نەکراوە
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal - same as before */}
      {showHistoryModal && selectedSupplier && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ background: 'rgba(30, 30, 46, 0.95)', borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: '1px', backdropFilter: 'blur(20px)' }}>
            <div className="p-6 border-b flex justify-between items-start" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div>
                <h3 className="text-xl font-bold" style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>مێژووی پارەدانەکان</h3>
                <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}>{selectedSupplier.name}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 rounded-xl" style={{ background: selectedSupplier.total_debt && selectedSupplier.total_debt > 0 ? 'rgba(220, 38, 38, 0.2)' : 'rgba(22, 163, 74, 0.2)', border: `1px solid ${selectedSupplier.total_debt && selectedSupplier.total_debt > 0 ? 'rgba(220, 38, 38, 0.5)' : 'rgba(22, 163, 74, 0.5)'}` }}>
                  <span className="text-xs block" style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}>{selectedSupplier.total_debt && selectedSupplier.total_debt > 0 ? 'قەرزی ئێستا' : 'دۆخی قەرز'}</span>
                  <span className="text-lg font-bold" style={{ color: selectedSupplier.total_debt && selectedSupplier.total_debt > 0 ? '#fca5a5' : '#86efac', fontFamily: 'var(--font-uni-salar)' }}>
                    {selectedSupplier.total_debt && selectedSupplier.total_debt > 0 ? `${toEnglishDigits((selectedSupplier.total_debt || 0).toLocaleString('en-US'))} د.ع` : ' قەرز ✓'}
                  </span>
                </div>
                <button onClick={handleCloseHistoryModal} className="p-2 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'rgba(255, 255, 255, 0.7)' }}><FaTimes size={20} /></button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="p-4 rounded-xl border" style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <h4 className="text-lg font-semibold mb-4" style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>{editingPayment ? 'دەستکاری پارەدان' : 'زیادکردنی پارەدان'}</h4>
                <form onSubmit={editingPayment ? handleUpdatePayment : handleAddPayment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm mb-1" style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}>بڕی پارە (IQD)</label>
                      <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="0" required className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2" style={{ background: 'rgba(0, 0, 0, 0.3)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}>بەروار</label>
                      <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} required className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2" style={{ background: 'rgba(0, 0, 0, 0.3)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}>تێبینی</label>
                      <input type="text" value={paymentForm.note} onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })} placeholder="تێبینی..." className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2" style={{ background: 'rgba(0, 0, 0, 0.3)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={submittingPayment} className="px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50" style={{ background: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>
                      {submittingPayment ? '...' : editingPayment ? 'نوێکردنەوە' : 'تۆمارکردن'}
                    </button>
                    {editingPayment && (
                      <button type="button" onClick={cancelEditPayment} className="px-6 py-2 rounded-lg font-semibold transition-colors" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'var(--font-uni-salar)' }}>
                        هەڵوەشاندنەوە
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4" style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>لیستی پارەدانەکان</h4>
                {loadingPayments ? (
                  <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--theme-accent)' }}></div></div>
                ) : payments.length > 0 ? (
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 mb-2 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[80px]">
                            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.75rem' }}>بەروار</div>
                            <div style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>{new Date(payment.date).toLocaleDateString('en-US')}</div>
                          </div>
                          <div className="text-center min-w-[100px]">
                            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.75rem' }}>بڕی پارە</div>
                            <div style={{ color: '#86efac', fontFamily: 'var(--font-uni-salar)', fontWeight: 'bold' }}>{toEnglishDigits(payment.amount.toLocaleString('en-US'))} د.ع</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEditPayment(payment)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" style={{ background: 'rgba(255, 255, 255, 0.1)' }}><FaEdit size={14} style={{ color: 'rgba(255, 255, 255, 0.7)' }} /></button>
                          <button onClick={() => handleDeletePayment(payment)} className="p-2 rounded-lg hover:bg-red-500/20 transition-colors" style={{ background: 'rgba(255, 100, 100, 0.1)' }}><FaTrash size={14} style={{ color: 'rgba(255, 100, 100, 0.8)' }} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <div className="text-4xl mb-2">💰</div>
                    <p style={{ fontFamily: 'var(--font-uni-salar)', color: 'rgba(255, 255, 255, 0.5)' }}>هیچ پارەدانێک نەکراوە</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setShowConfirmModal(false)}
        type="danger"
      />
    </div>
  )
}
