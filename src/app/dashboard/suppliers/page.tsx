'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FaTh, FaList, FaEdit, FaTrash, FaMoneyBillWave, FaHistory, FaSearch } from 'react-icons/fa'
import dynamic from 'next/dynamic'

// Dynamic import for modal to reduce initial bundle size
const SupplierModal = dynamic(
  () => import('@/components/suppliers/SupplierModal').then(mod => mod.default),
  { ssr: false }
)

interface Supplier {
  id: string
  name: string
  company?: string
  phone: string
  address?: string
  supplier_image?: string
  balance: number
  created_at?: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const [supplierToPay, setSupplierToPay] = useState<Supplier | null>(null)
  const [supplierHistory, setSupplierHistory] = useState<any[]>([])
  const [totalPaid, setTotalPaid] = useState(0)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    console.log('🔄 Fetching suppliers data...')

    if (!supabase) {
      console.log('⚠️ Supabase not configured, showing demo data')
      const demoSuppliers: Supplier[] = [
        { id: '1', name: 'کۆمپانیای برنجی کوردستان', company: 'کۆمپانیای برنجی کوردستان', phone: '0750-123-4567', address: 'هەولێر، کوردستان', balance: 1250.75 },
        { id: '2', name: 'فرۆشیاری شەکر', company: 'فرۆشیاری شەکر', phone: '0750-987-6543', address: 'سلێمانی، کوردستان', balance: 890.50 },
        { id: '3', name: 'کۆمپانیای چای ناوەندی', company: 'کۆمپانیای چای ناوەندی', phone: '0770-555-1234', address: 'دهۆک، کوردستان', balance: 2340.25 }
      ]
      setSuppliers(demoSuppliers)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setSuppliers(data || [])
      console.log('✅ Suppliers fetched:', data?.length || 0)
    } catch (error) {
      console.error('❌ Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSuppliers = suppliers.filter(s =>
    !searchTerm ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  )

  // Save supplier (add or edit)
  const handleSaveSupplier = async (data: {
    name: string
    company: string
    phone: string
    address: string
    supplier_image?: string
  }, _selectedFile?: File | null) => {
    if (!supabase) return

    try {
      if (editingSupplier) {
        // Update existing supplier
        const { error } = await supabase.from('suppliers').update({
          name: data.name.trim(),
          company: data.company.trim() || null,
          phone: data.phone.trim(),
          address: data.address.trim() || null,
          supplier_image: data.supplier_image || null
        }).eq('id', editingSupplier.id)

        if (error) throw error
        console.log('✅ Supplier updated')
        setShowEditModal(false)
        setEditingSupplier(null)
      } else {
        // Add new supplier
        const { error } = await supabase.from('suppliers').insert({
          name: data.name.trim(),
          company: data.company.trim() || null,
          phone: data.phone.trim(),
          address: data.address.trim() || null,
          supplier_image: data.supplier_image || null
        })

        if (error) throw error
        console.log('✅ Supplier added')
        setShowAddModal(false)
      }

      fetchSuppliers()
    } catch (error) {
      console.error('❌ Error saving supplier:', error)
      alert('هەڵە لە تۆمارکردن')
    }
  }

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setShowEditModal(true)
  }

  // Payment functions
  const openPaymentModal = (supplier: Supplier) => {
    setSupplierToPay(supplier)
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
    setShowPaymentModal(true)
  }

  const submitPayment = async () => {
    if (!supplierToPay || !supabase) return
    const amount = parseFloat(paymentForm.amount)
    if (!amount || amount <= 0) {
      alert('بڕی پارە پێویستە')
      return
    }

    try {
      await supabase.from('supplier_payments').insert({
        supplier_id: supplierToPay.id,
        date: paymentForm.date,
        amount: amount,
        note: paymentForm.note.trim() || null
      })

      const newBalance = supplierToPay.balance - amount
      await supabase.from('suppliers').update({ balance: newBalance }).eq('id', supplierToPay.id)

      alert(`بڕی ${amount.toFixed(2)} بە سەرکەوتوویی تۆمار کرا`)
      setShowPaymentModal(false)
      setSupplierToPay(null)
      fetchSuppliers()
    } catch (error) {
      console.error('💥 Payment failed:', error)
      alert('هەڵە لە تۆمارکردنی پارەدان')
    }
  }

  // History functions
  const openHistoryModal = async (supplier: Supplier) => {
    if (!supabase) return

    try {
      const { data: payments, error } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('date', { ascending: false })

      if (error) throw error

      const total = payments?.reduce((sum, p) => sum + p.amount, 0) || 0
      setSupplierHistory(payments || [])
      setTotalPaid(total)
      setSupplierToPay(supplier)
      setShowHistoryModal(true)
    } catch (error) {
      console.error('❌ Error fetching history:', error)
    }
  }

  // Delete functions
  const confirmDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier)
    setShowDeleteConfirm(true)
  }

  const executeDelete = async () => {
    if (!supplierToDelete || !supabase) return

    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', supplierToDelete.id)
      if (error) throw error

      alert('دابینکەر سڕدرایەوە')
      setShowDeleteConfirm(false)
      setSupplierToDelete(null)
      fetchSuppliers()
    } catch (error) {
      console.error('💥 Delete failed:', error)
      alert('هەڵە لە سڕینەوە')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
        بەڕێوەبردنی دابینکەران
      </h1>

      <div className="mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 rounded-lg font-medium hover:scale-105 transition-all"
          style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
        >
          زیادکردنی دابینکەر
        </button>
      </div>

      <div className="p-6 rounded-lg shadow-md" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--theme-primary)' }}>لیستی دابینکەران</h2>
          <div className="flex items-center space-x-2">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}>
              <FaTh size={18} />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}>
              <FaList size={18} />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="گەڕان..."
              className="w-full px-4 py-3 pr-12 rounded-lg border"
              style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
            />
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="relative p-6 rounded-2xl backdrop-blur-md border hover:scale-105 transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Avatar */}
                <div className="text-center mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto overflow-hidden"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    {supplier.supplier_image ? (
                      <img
                        src={supplier.supplier_image}
                        alt={supplier.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <span className="text-2xl">🏢</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mt-2" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-primary)' }}>
                    {supplier.name}
                  </h3>
                  {supplier.company && (
                    <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)' }}>{supplier.company}</p>
                  )}
                  <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)' }}>📞 {supplier.phone}</p>
                </div>

                {/* Balance */}
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold" style={{ color: supplier.balance > 0 ? '#dc2626' : '#16a34a', fontFamily: 'var(--font-uni-salar)' }}>
                    {supplier.balance.toFixed(2)} د.ع
                  </div>
                  <div className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی قەرز</div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-center space-x-2">
                    <button onClick={() => openEditModal(supplier)} className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg flex items-center gap-1">
                      <FaEdit size={14} /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>دەستکاری</span>
                    </button>
                    <button onClick={() => confirmDelete(supplier)} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg flex items-center gap-1">
                      <FaTrash size={14} /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>سڕینەوە</span>
                    </button>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <button onClick={() => openHistoryModal(supplier)} className="px-3 py-2 bg-purple-100 text-purple-600 rounded-lg flex items-center gap-1">
                      <FaHistory size={14} /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>مێژوو</span>
                    </button>
                    {supplier.balance > 0 && (
                      <button onClick={() => openPaymentModal(supplier)} className="px-3 py-2 bg-green-100 text-green-600 rounded-lg flex items-center gap-1">
                        <FaMoneyBillWave size={14} /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>دانەوە</span>
                      </button>
                    )}
                  </div>
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
                  <th className="px-3 py-3 text-right" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>وێنە</th>
                  <th className="px-3 py-3 text-right" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>ناو</th>
                  <th className="px-3 py-3 text-right" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>کۆمپانیا</th>
                  <th className="px-3 py-3 text-right" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>مۆبایل</th>
                  <th className="px-3 py-3 text-right" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>قەرز</th>
                  <th className="px-3 py-3 text-right" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>کردار