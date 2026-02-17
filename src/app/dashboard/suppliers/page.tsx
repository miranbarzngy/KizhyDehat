'use client'

import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { FaList, FaSearch, FaTh, FaPlus, FaTimes, FaEdit, FaTrash, FaMoneyBillWave } from 'react-icons/fa'
import { useToast } from '@/components/Toast'

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

export default function SuppliersPage() {
  // Toast notifications
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

  useEffect(() => { fetchSuppliers() }, [])

  const fetchSuppliers = async () => {
    if (!supabase) { setSuppliers([]); setLoading(false); return }
    
    // Fetch suppliers
    const { data: suppliersData } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false })
    
    if (!suppliersData || suppliersData.length === 0) {
      setSuppliers([])
      setLoading(false)
      return
    }

    // Get all supplier IDs
    const supplierIds = suppliersData.map(s => s.id)

    // Efficiently calculate debt using a single query approach
    // Get sum of debt_amount from supplier_transactions grouped by supplier_id
    const { data: transactionDebts } = await supabase
      .from('supplier_transactions')
      .select('supplier_id, debt_amount')
      .in('supplier_id', supplierIds)

    // Get sum of payments from supplier_payments grouped by supplier_id
    const { data: payments } = await supabase
      .from('supplier_payments')
      .select('supplier_id, amount')
      .in('supplier_id', supplierIds)

    // Create lookup maps for efficient calculation
    const debtFromTransactions: Record<string, number> = {}
    const paidFromPayments: Record<string, number> = {}

    // Sum up debts from transactions
    transactionDebts?.forEach(tx => {
      if (tx.supplier_id && tx.debt_amount) {
        debtFromTransactions[tx.supplier_id] = (debtFromTransactions[tx.supplier_id] || 0) + tx.debt_amount
      }
    })

    // Sum up payments
    payments?.forEach(pay => {
      if (pay.supplier_id && pay.amount) {
        paidFromPayments[pay.supplier_id] = (paidFromPayments[pay.supplier_id] || 0) + pay.amount
      }
    })

    // Calculate total debt for each supplier
    // Formula: Total Debt = (Sum of debt_amount from transactions) - (Sum of payments)
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
      }
    } catch (error) {
      console.error('Error saving supplier:', error)
      showError('هەڵە لە تۆمارکردن')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteSupplier = async (supplier: Supplier) => {
    const confirmed = window.confirm(`دڵنیایت لە سڕینەوەی "${supplier.name}"؟`)
    if (!confirmed) return

    if (!supabase) {
      alert('هەڵە لە پەیوەستبوون بە داتابەیس')
      return
    }

    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', supplier.id)

      if (error) {
        console.error('Error deleting supplier:', error)
        alert('هەڵە لە سڕینەوە: ' + error.message)
        return
      }

      await fetchSuppliers()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      alert('هەڵە لە سڕینەوە')
    }
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setShowAddModal(true)
  }

  // Helper function to calculate debt dynamically
  // Formula: Total Debt = (Sum of debt_amount from supplier_transactions) - (Sum of amount from supplier_payments)
  const calculateDebtDynamically = async (supplierId: string): Promise<number> => {
    if (!supabase) return 0
    
    try {
      // Get sum of debt_amount from supplier_transactions
      const { data: transactions } = await supabase
        .from('supplier_transactions')
        .select('debt_amount')
        .eq('supplier_id', supplierId)

      const totalDebtFromTransactions = (transactions || []).reduce((sum, tx) => sum + (tx.debt_amount || 0), 0)

      // Get sum of amount from supplier_payments
      const { data: payments } = await supabase
        .from('supplier_payments')
        .select('amount')
        .eq('supplier_id', supplierId)

      const totalPaidFromPayments = (payments || []).reduce((sum, pay) => sum + (pay.amount || 0), 0)

      // Calculate: Total Debt = Total Debt from Transactions - Total Paid
      const calculatedDebt = totalDebtFromTransactions - totalPaidFromPayments
      
      // Ensure debt is not negative
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
      // Fetch transactions
      const { data: txData } = await supabase
        .from('supplier_transactions')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('date', { ascending: false })

      setTransactions(txData || [])

      // Fetch payments
      const { data: payData } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false })

      setPayments(payData || [])

      // Calculate debt dynamically when modal opens
      const calculatedDebt = await calculateDebtDynamically(supplier.id)
      
      // Update the selected supplier with calculated debt
      setSelectedSupplier({ ...supplier, total_debt: calculatedDebt })
      
      // Also update the supplier in the suppliers list
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

  // Handle adding a new payment
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

    // Format date as YYYY-MM-DD string
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
      console.log('Payment result:', result)
      
      if (!response.ok || !result.success) {
        alert(result.error || 'هەڵە لە تۆمارکردن')
        return
      }

      // Success - refresh payments list
      const { data: payData } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('supplier_id', selectedSupplier.id)
        .order('created_at', { ascending: false })
      setPayments(payData || [])

      // Calculate new debt
      const newDebt = await calculateDebtDynamically(selectedSupplier.id)
      setSelectedSupplier({ ...selectedSupplier, total_debt: newDebt })
      setSuppliers(prev => prev.map(s => 
        s.id === selectedSupplier.id ? { ...s, total_debt: newDebt } : s
      ))

      // Reset form
      setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
      alert('پارەدانەکە بە سەرکەوتوویی تۆمارکرا!')
    } catch (error) {
      console.error('Error adding payment:', error)
      alert('هەڵە لە تۆمارکردن')
    } finally {
      setSubmittingPayment(false)
    }
  }

  // Handle editing a payment
  const handleEditPayment = (payment: SupplierPayment) => {
    setEditingPayment(payment)
    setPaymentForm({
      amount: payment.amount.toString(),
      date: payment.date,
      note: payment.note || ''
    })
  }

  // Handle updating a payment
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

      // Refresh payments
      const { data: payData } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('supplier_id', selectedSupplier.id)
        .order('created_at', { ascending: false })
      setPayments(payData || [])

      // Update local supplier total_debt
      setSelectedSupplier({ ...selectedSupplier, total_debt: result.newDebt })
      
      // Update suppliers list
      setSuppliers(prev => prev.map(s => 
        s.id === selectedSupplier.id ? { ...s, total_debt: result.newDebt } : s
      ))

      // Reset form
      setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
      setEditingPayment(null)
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('هەڵە لە نوێکردنەوە')
    } finally {
      setSubmittingPayment(false)
    }
  }

  // Handle deleting a payment
  const handleDeletePayment = async (payment: SupplierPayment) => {
    const confirmed = window.confirm('دڵنیایت لە سڕینەوەی ئەم پارەدانە؟')
    if (!confirmed || !selectedSupplier) return

    try {
      const response = await fetch(`/api/supplier-payments?id=${payment.id}&supplier_id=${selectedSupplier.id}`, {
        method: 'DELETE'
      })

      // Check if response is OK
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'هەڵە لە سڕینەوە' }))
        alert(errorData.error || 'هەڵە لە سڕینەوە')
        return
      }

      const result = await response.json()

      // Refresh payments
      const { data: payData } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('supplier_id', selectedSupplier.id)
        .order('created_at', { ascending: false })
      setPayments(payData || [])

      // Calculate new debt using the API result or recalculate locally
      const newDebt = result.newDebt !== undefined 
        ? result.newDebt 
        : await calculateDebtDynamically(selectedSupplier.id)
      
      // Update local supplier total_debt
      setSelectedSupplier({ ...selectedSupplier, total_debt: newDebt })
      
      // Update suppliers list
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

  return (
    <div className="p-6 pl-0 md:pl-6">
      <h1 
        className="text-3xl font-bold mb-8"
        style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
      >
        بەڕێوەبردنی دابینکەران
      </h1>

      <div 
        className="rounded-3xl p-6 shadow-lg border"
        style={{ 
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-card-border)'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 
            className="text-xl font-semibold"
            style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
          >
            لیستی دابینکەران
          </h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors`}
              style={{ 
                backgroundColor: viewMode === 'grid' ? 'var(--theme-accent)' : 'var(--theme-muted)',
                color: viewMode === 'grid' ? '#ffffff' : 'var(--theme-secondary)'
              }}
            >
              <FaTh size={18} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors`}
              style={{ 
                backgroundColor: viewMode === 'table' ? 'var(--theme-accent)' : 'var(--theme-muted)',
                color: viewMode === 'table' ? '#ffffff' : 'var(--theme-secondary)'
              }}
            >
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
            style={{ 
              backgroundColor: 'var(--theme-muted)',
              borderColor: 'var(--theme-card-border)',
              color: 'var(--theme-foreground)',
              fontFamily: 'var(--font-uni-salar)'
            }}
          />
        </div>

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
            <motion.div
              onClick={() => { setEditingSupplier(null); setShowAddModal(true) }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer min-h-[200px]"
              style={{
                backgroundColor: 'var(--theme-card-bg)',
                borderColor: 'var(--theme-card-border)',
                borderStyle: 'dashed',
                borderWidth: '2px',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--theme-muted)' }}>
                <FaPlus size={32} style={{ color: 'var(--theme-accent)' }} />
              </div>
              <span
                className="text-lg font-semibold"
                style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
              >
                زیادکردنی دابینکەر
              </span>
            </motion.div>
            
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map(supplier => (
                <SupplierCard key={supplier.id} supplier={supplier}
                  onEdit={() => handleEditSupplier(supplier)}
                  onDelete={() => handleDeleteSupplier(supplier)}
                  onHistory={() => handleHistoryClick(supplier)}
                  onPayment={() => {}}
                />
              ))
            ) : (
              <div 
                className="col-span-full p-12 rounded-2xl shadow-lg text-center"
                style={{ 
                  backgroundColor: 'var(--theme-card-bg)',
                  borderColor: 'var(--theme-card-border)',
                  borderWidth: '1px'
                }}
              >
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

      {/* Enhanced History/Payments Modal with Glassmorphism */}
      {showHistoryModal && selectedSupplier && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div 
            className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            style={{ 
              background: 'rgba(30, 30, 46, 0.95)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: '1px',
              backdropFilter: 'blur(20px)'
            }}
          >
            {/* Header with Debt Badge */}
            <div 
              className="p-6 border-b flex justify-between items-start"
              style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <div>
                <h3 
                  className="text-xl font-bold"
                  style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                >
                  مێژووی پارەدانەکان
                </h3>
                <p 
                  className="text-sm mt-1"
                  style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}
                >
                  {selectedSupplier.name}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Current Debt Badge */}
                <div 
                  className="px-4 py-2 rounded-xl"
                  style={{ 
                    background: selectedSupplier.total_debt && selectedSupplier.total_debt > 0 
                      ? 'rgba(220, 38, 38, 0.2)' 
                      : 'rgba(22, 163, 74, 0.2)',
                    border: `1px solid ${selectedSupplier.total_debt && selectedSupplier.total_debt > 0 
                      ? 'rgba(220, 38, 38, 0.5)' 
                      : 'rgba(22, 163, 74, 0.5)'}`
                  }}
                >
                  <span 
                    className="text-xs block"
                    style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    {selectedSupplier.total_debt && selectedSupplier.total_debt > 0 ? 'قەرزی ئێستا' : 'دۆخی قەرز'}
                  </span>
                  <span 
                    className="text-lg font-bold"
                    style={{ 
                      color: selectedSupplier.total_debt && selectedSupplier.total_debt > 0 
                        ? '#fca5a5' 
                        : '#86efac', 
                      fontFamily: 'var(--font-uni-salar)' 
                    }}
                  >
                    {selectedSupplier.total_debt && selectedSupplier.total_debt > 0 
                      ? `${(selectedSupplier.total_debt || 0).toLocaleString()} د.ع`
                      : 'بێ قەرز ✓'}
                  </span>
                </div>
                <button
                  onClick={handleCloseHistoryModal}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Top Section: Add/Edit Payment Form */}
              <div 
                className="p-4 rounded-xl border"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <h4 
                  className="text-lg font-semibold mb-4"
                  style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                >
                  {editingPayment ? 'دەستکاری پارەدان' : 'زیادکردنی پارەدان'}
                </h4>
                <form onSubmit={editingPayment ? handleUpdatePayment : handleAddPayment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Amount Input */}
                    <div>
                      <label 
                        className="block text-sm mb-1"
                        style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}
                      >
                        بڕی پارە (IQD)
                      </label>
                      <input
                        type="number"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        placeholder="0"
                        required
                        className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2"
                        style={{ 
                          background: 'rgba(0, 0, 0, 0.3)',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          color: '#ffffff',
                          fontFamily: 'var(--font-uni-salar)'
                        }}
                      />
                    </div>
                    
                    {/* Date Input */}
                    <div>
                      <label 
                        className="block text-sm mb-1"
                        style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}
                      >
                        بەروار
                      </label>
                      <input
                        type="date"
                        value={paymentForm.date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2"
                        style={{ 
                          background: 'rgba(0, 0, 0, 0.3)',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          color: '#ffffff',
                          fontFamily: 'var(--font-uni-salar)'
                        }}
                      />
                    </div>
                    
                    {/* Note Input */}
                    <div>
                      <label 
                        className="block text-sm mb-1"
                        style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)' }}
                      >
                        تێبینی
                      </label>
                      <input
                        type="text"
                        value={paymentForm.note}
                        onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                        placeholder="تێبینی..."
                        className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2"
                        style={{ 
                          background: 'rgba(0, 0, 0, 0.3)',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          color: '#ffffff',
                          fontFamily: 'var(--font-uni-salar)'
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submittingPayment}
                      className="px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                      style={{ 
                        background: 'var(--theme-accent)',
                        color: '#ffffff',
                        fontFamily: 'var(--font-uni-salar)'
                      }}
                    >
                      {submittingPayment ? '...' : editingPayment ? 'نوێکردنەوە' : 'تۆمارکردن'}
                    </button>
                    {editingPayment && (
                      <button
                        type="button"
                        onClick={cancelEditPayment}
                        className="px-6 py-2 rounded-lg font-semibold transition-colors"
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontFamily: 'var(--font-uni-salar)'
                        }}
                      >
                        هەڵوەشاندنەوە
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Bottom Section: Payments List */}
              <div>
                <h4 
                  className="text-lg font-semibold mb-4"
                  style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                >
                  لیستی پارەدانەکان
                </h4>
                {loadingPayments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--theme-accent)' }}></div>
                  </div>
                ) : payments.length > 0 ? (
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div 
                        key={payment.id}
                        className="flex items-center justify-between p-3 mb-2 rounded-xl"
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[80px]">
                            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.75rem' }}>بەروار</div>
                            <div style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>
                              {new Date(payment.date).toLocaleDateString('ar-IQ')}
                            </div>
                          </div>
                          <div className="text-center min-w-[100px]">
                            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.75rem' }}>بڕی پارە</div>
                            <div style={{ color: '#86efac', fontFamily: 'var(--font-uni-salar)', fontWeight: 'bold' }}>
                              {payment.amount.toLocaleString()} د.ع
                            </div>
                          </div>
                          <div className="min-w-[120px]">
                            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.75rem' }}>تێبینی</div>
                            <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'var(--font-uni-salar)' }}>
                              {payment.note || '-'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditPayment(payment)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            title="دەستکاری"
                            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                          >
                            <FaEdit size={14} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                          </button>
                          <button
                            onClick={() => handleDeletePayment(payment)}
                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                            title="سڕینەوە"
                            style={{ background: 'rgba(255, 100, 100, 0.1)' }}
                          >
                            <FaTrash size={14} style={{ color: 'rgba(255, 100, 100, 0.8)' }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div 
                    className="text-center py-8 rounded-xl"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="text-4xl mb-2">💰</div>
                    <p style={{ fontFamily: 'var(--font-uni-salar)', color: 'rgba(255, 255, 255, 0.5)' }}>
                      هیچ پارەدانێک نەکراوە
                    </p>
                  </div>
                )}
              </div>

              {/* Transactions Section (kept for reference) */}
              {transactions.length > 0 && (
                <div>
                  <h4 
                    className="text-lg font-semibold mb-4"
                    style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    مێژووی کڕینەکان
                  </h4>
                  <div className="space-y-2">
                    {transactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 rounded-lg border"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderColor: 'rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>{tx.item_name}</p>
                            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.8rem' }}>
                              {new Date(tx.date).toLocaleDateString('ar-IQ')}
                            </p>
                          </div>
                          <div className="text-left">
                            <p style={{ color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>{tx.total_price.toLocaleString()} د.ع</p>
                            {tx.debt_amount > 0 && (
                              <p style={{ color: '#fca5a5', fontFamily: 'var(--font-uni-salar)', fontSize: '0.8rem' }}>
                                قەرز: {tx.debt_amount.toLocaleString()} د.ع
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
