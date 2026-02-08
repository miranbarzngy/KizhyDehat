'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FaTh, FaList, FaSearch } from 'react-icons/fa'
import dynamic from 'next/dynamic'

const SupplierCard = dynamic(() => import('@/components/suppliers/SupplierCard').then(mod => mod.default), { ssr: false })
const SupplierTable = dynamic(() => import('@/components/suppliers/SupplierTable').then(mod => mod.default), { ssr: false })
const SupplierForm = dynamic(() => import('@/components/suppliers/SupplierForm').then(mod => mod.default), { ssr: false })

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
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const [supplierToPay, setSupplierToPay] = useState<Supplier | null>(null)
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [supplierHistory, setSupplierHistory] = useState<any[]>([])
  const [totalPaid, setTotalPaid] = useState(0)

  useEffect(() => { fetchSuppliers() }, [])

  const fetchSuppliers = async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false })
    if (!error) setSuppliers(data || [])
    setLoading(false)
  }

  const filteredSuppliers = suppliers.filter(s =>
    !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm)
  )

  const handleSave = async (data: { name: string; company: string; phone: string; address: string; supplier_image?: string }, _file?: File | null) => {
    if (!supabase) return
    try {
      if (editingSupplier) {
        await supabase.from('suppliers').update({
          name: data.name, company: data.company || null, phone: data.phone,
          address: data.address || null, supplier_image: data.supplier_image || null
        }).eq('id', editingSupplier.id)
        setShowEditModal(false)
        setEditingSupplier(null)
      } else {
        await supabase.from('suppliers').insert({
          name: data.name, company: data.company || null, phone: data.phone,
          address: data.address || null, supplier_image: data.supplier_image || null
        })
        setShowAddModal(false)
      }
      fetchSuppliers()
    } catch { alert('هەڵە لە تۆمارکردن') }
  }

  const handlePayment = async () => {
    if (!supplierToPay || !supabase) return
    const amount = parseFloat(paymentForm.amount)
    if (!amount || amount <= 0) { alert('بڕی پارە پێویستە'); return }
    try {
      await supabase.from('supplier_payments').insert({
        supplier_id: supplierToPay.id, date: paymentForm.date, amount, note: paymentForm.note || null
      })
      await supabase.from('suppliers').update({ balance: supplierToPay.balance - amount }).eq('id', supplierToPay.id)
      alert(`بڕی ${amount.toFixed(2)} تۆمار کرا`)
      setShowPaymentModal(false)
      setSupplierToPay(null)
      fetchSuppliers()
    } catch { alert('هەڵە') }
  }

  const handleHistory = async (supplier: Supplier) => {
    if (!supabase) return
    const { data } = await supabase.from('supplier_payments').select('*').eq('supplier_id', supplier.id).order('date', { ascending: false })
    setSupplierHistory(data || [])
    setTotalPaid(data?.reduce((sum, p) => sum + p.amount, 0) || 0)
    setSupplierToPay(supplier)
    setShowHistoryModal(true)
  }

  const handleDelete = async () => {
    if (!supplierToDelete || !supabase) return
    await supabase.from('suppliers').delete().eq('id', supplierToDelete.id)
    setSupplierToDelete(null)
    fetchSuppliers()
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
        بەڕێوەبردنی دابینکەران
      </h1>

      <button onClick={() => setShowAddModal(true)}
        className="px-6 py-3 rounded-lg font-medium hover:scale-105 transition-all mb-6"
        style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>
        زیادکردنی دابینکەر
      </button>

      <div className="p-6 rounded-lg shadow-md" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--theme-primary)' }}>لیستی دابینکەران</h2>
          <div className="flex items-center space-x-2">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}><FaTh size={18} /></button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}><FaList size={18} /></button>
          </div>
        </div>

        <div className="mb-6 relative">
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="گەڕان..." className="w-full px-4 py-3 pr-12 rounded-lg border"
            style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }} />
        </div>

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSuppliers.map(supplier => (
              <SupplierCard key={supplier.id} supplier={supplier}
                onEdit={() => { setEditingSupplier(supplier); setShowEditModal(true) }}
                onDelete={() => setSupplierToDelete(supplier)}
                onHistory={() => handleHistory(supplier)}
                onPayment={() => { setSupplierToPay(supplier); setShowPaymentModal(true) }}
              />
            ))}
          </div>
        )}

        {viewMode === 'table' && <SupplierTable suppliers={filteredSuppliers}
          onEdit={s => { setEditingSupplier(s); setShowEditModal(true) }}
          onDelete={s => setSupplierToDelete(s)}
        />}

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>هیچ دابینکەر نەدۆزرایەوە</h3>
          </div>
        )}
      </div>

      <SupplierForm isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSave} isEdit={false} />
      <SupplierForm isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingSupplier(null) }} onSave={handleSave} isEdit={true} initialData={editingSupplier} />

      {showPaymentModal && supplierToPay && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-8" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
            <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
              دانەوەی قەرز - {supplierToPay.name}
            </h3>
            <div className="mb-6 p-4 rounded-lg bg-red-100 border border-red-300">
              <div className="text-center">
                <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)' }}>قەرزی کۆی گشتی</p>
                <p className="text-2xl font-bold text-red-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>{supplierToPay.balance.toFixed(2)} د.ع</p>
              </div>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕی پارە *</label>
                <input type="text" value={paymentForm.amount} onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border" style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="0.00" /></div>
              <div><label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</label>
                <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border" style={{ fontFamily: 'var(--font-uni-salar)' }} /></div>
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <button onClick={() => setShowPaymentModal(false)} className="px-6 py-3 rounded-lg bg-gray-500 text-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>پاشگەزبوونەوە</button>
              <button onClick={handlePayment} className="px-6 py-3 rounded-lg" style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>پارەدان</button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && supplierToPay && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
            <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
              مێژووی پارەدان - {supplierToPay.name}
            </h3>
            <div className="mb-6 p-4 rounded-lg bg-green-100 border border-green-300">
              <div className="text-center">
                <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی پارەی دراو</p>
                <p className="text-3xl font-bold text-green-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>{totalPaid.toFixed(2)} د.ع</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead><tr style={{ background: 'var(--theme-muted)' }}>
                  <th className="px-4 py-3 text-right" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                  <th className="px-4 py-3 text-right" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>بڕی پارە</th>
                  <th className="px-4 py-3 text-right" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>تێبینی</th>
                </tr></thead>
                <tbody>
                  {supplierHistory.map((p: any) => (
                    <tr key={p.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
                      <td className="px-4 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{new Date(p.date).toLocaleDateString('ku')}</td>
                      <td className="px-4 py-3 font-bold text-green-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>{p.amount.toFixed(2)}</td>
                      <td className="px-4 py-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>{p.note || '-'}</td>
                    </tr>
                  ))}
                  {supplierHistory.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>هیچ مێژوویەک نییە</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-8">
              <button onClick={() => setShowHistoryModal(false)} className="px-6 py-3 rounded-lg bg-gray-500 text-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>داخستن</button>
            </div>
          </div>
        </div>
      )}

      {supplierToDelete && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-8" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>دڵنیای لە سڕینەوە؟</h3>
              <p style={{ fontFamily: 'var(--font-uni-salar)' }}>ئایا دڵنیای لە سڕینەوەی <strong>{supplierToDelete.name}</strong>؟</p>
            </div>
            <div className="flex justify-center space-x-4">
              <button onClick={() => setSupplierToDelete(null)} className="px-6 py-3 rounded-lg bg-gray-500 text-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>پاشگەزبوونەوە</button>
              <button onClick={handleDelete} className="px-6 py-3 rounded-lg bg-red-600 text-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>سڕینەوە</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
