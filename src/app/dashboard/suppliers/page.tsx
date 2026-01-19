'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FaTh, FaList, FaEdit, FaTrash, FaSearch } from 'react-icons/fa'

interface Supplier {
  id: string
  name: string
  company?: string
  phone: string
  address?: string
  balance: number
  created_at?: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    company: '',
    phone: '',
    address: ''
  })
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    console.log('🔄 Fetching suppliers data...')

    // Demo mode: show sample suppliers data when Supabase is not configured
    if (!supabase) {
      console.log('⚠️ Supabase not configured, showing demo data')
      const demoSuppliers: Supplier[] = [
        {
          id: '1',
          name: 'کۆمپانیای برنجی کوردستان',
          company: 'کۆمپانیای برنجی کوردستان',
          phone: '0750-123-4567',
          address: 'هەولێر، کوردستان',
          balance: 1250.75
        },
        {
          id: '2',
          name: 'فرۆشیاری شەکر',
          company: 'فرۆشیاری شەکر',
          phone: '0750-987-6543',
          address: 'سلێمانی، کوردستان',
          balance: 890.50
        },
        {
          id: '3',
          name: 'کۆمپانیای چای ناوەندی',
          company: 'کۆمپانیای چای ناوەندی',
          phone: '0750-555-1234',
          address: 'دهۆک، کوردستان',
          balance: 2340.25
        }
      ]
      setSuppliers(demoSuppliers)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSuppliers(data || [])
      console.log('✅ Suppliers fetched:', data?.length || 0, 'suppliers')
    } catch (error) {
      console.error('❌ Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtered suppliers based on search term
  const filteredSuppliers = suppliers.filter((supplier) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return supplier.name.toLowerCase().includes(searchLower) ||
           (supplier.company && supplier.company.toLowerCase().includes(searchLower))
  })

  // Add supplier function
  const addSupplier = async () => {
    if (!newSupplier.name.trim()) {
      alert('ناو پێویستە')
      return
    }

    if (!supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت دابینکەر زیاد بکرێت')
      return
    }

    try {
      console.log('➕ Adding new supplier:', newSupplier)
      const { error } = await supabase
        .from('suppliers')
        .insert({
          name: newSupplier.name.trim(),
          company: newSupplier.company.trim() || null,
          phone: newSupplier.phone.trim(),
          address: newSupplier.address.trim() || null
        })

      if (error) throw error

      console.log('✅ Supplier added successfully')
      alert('دابینکەرەکە بە سەرکەوتوویی زیادکرا')
      setShowAddSupplier(false)
      setNewSupplier({ name: '', company: '', phone: '', address: '' })
      fetchSuppliers()
    } catch (error) {
      console.error('❌ Error adding supplier:', error)
      alert('هەڵە لە زیادکردنی دابینکەر')
    }
  }

  // Edit supplier functions
  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setEditForm({
      name: supplier.name,
      company: supplier.company || '',
      phone: supplier.phone,
      address: supplier.address || ''
    })
    setShowEditModal(true)
  }

  const updateEditForm = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const submitEditForm = async () => {
    if (!editingSupplier || !supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت دابینکەر دەستکاری بکرێت')
      return
    }

    if (!editForm.name.trim()) {
      alert('ناو پێویستە')
      return
    }

    try {
      console.log('✏️ Updating supplier:', editingSupplier.id, editForm)
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: editForm.name.trim(),
          company: editForm.company.trim() || null,
          phone: editForm.phone.trim(),
          address: editForm.address.trim() || null
        })
        .eq('id', editingSupplier.id)

      if (error) throw error

      console.log('✅ Supplier updated successfully')
      alert('دابینکەرەکە بە سەرکەوتوویی نوێکرایەوە')
      setShowEditModal(false)
      setEditingSupplier(null)
      fetchSuppliers()
    } catch (error) {
      console.error('❌ Error updating supplier:', error)
      alert('هەڵە لە نوێکردنی دابینکەر')
    }
  }

  // Delete supplier functions
  const confirmDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier)
    setShowDeleteConfirm(true)
  }

  const executeDelete = async () => {
    if (!supplierToDelete || !supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت دابینکەر بسڕدرێتەوە')
      return
    }

    console.log('🗑️ Starting delete operation for supplier:', supplierToDelete.name, 'ID:', supplierToDelete.id)

    try {
      // Check if supplier has related transactions
      console.log('🔍 Checking for related transactions...')
      const { data: transactions, error: transactionCheckError } = await supabase
        .from('supplier_transactions')
        .select('id')
        .eq('supplier_id', supplierToDelete.id)
        .limit(1)

      if (transactionCheckError) {
        console.error('❌ Error checking transactions:', transactionCheckError)
      } else if (transactions && transactions.length > 0) {
        console.error('❌ Cannot delete: Supplier has related transactions')
        alert('ناتوانرێت دابینکەرەکە بسڕدرێتەوە چونکە مامەڵەی کڕین و پارەدانی هەیە. سەرەتا مامەڵەکان بسڕەوە.')
        return
      }

      // Delete supplier (CASCADE will handle related records)
      console.log('🗑️ Deleting supplier from database...')
      const { error: deleteError } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierToDelete.id)

      if (deleteError) {
        console.error('❌ Error deleting supplier:', deleteError)
        throw deleteError
      }

      console.log('✅ Supplier deleted successfully')
      alert('دابینکەرەکە بە سەرکەوتوویی سڕدرایەوە')
      setShowDeleteConfirm(false)
      setSupplierToDelete(null)
      fetchSuppliers()
    } catch (error) {
      console.error('💥 Delete operation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`هەڵە لە سڕینەوەی دابینکەر: ${errorMessage}`)
    }
  }

  if (loading) {
    return <div className="text-center py-12">چاوەڕوانبە...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
        بەڕێوەبردنی دابینکەران
      </h1>

      <div className="mb-6">
        <button
          onClick={() => setShowAddSupplier(true)}
          className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
          style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
        >
          زیادکردنی دابینکەر
        </button>
      </div>

      <div className="p-6 rounded-lg shadow-md" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--theme-primary)' }}>لیستی دابینکەران</h2>

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

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="گەڕان بە ناو یان کۆمپانیا..."
              className="w-full px-4 py-3 pr-12 rounded-lg border backdrop-blur-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(0, 0, 0, 0.1)',
                fontFamily: 'var(--font-uni-salar)',
                color: 'var(--theme-primary)'
              }}
            />
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="relative p-6 rounded-2xl backdrop-blur-md border transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Supplier Info */}
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-primary)' }}>
                    {supplier.name}
                  </h3>
                  {supplier.company && (
                    <p className="text-sm opacity-75 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      {supplier.company}
                    </p>
                  )}
                  <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    📞 {supplier.phone}
                  </p>
                  {supplier.address && (
                    <p className="text-xs opacity-60 mt-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      📍 {supplier.address}
                    </p>
                  )}
                </div>

                {/* Balance */}
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold" style={{ color: supplier.balance > 0 ? '#dc2626' : '#16a34a', fontFamily: 'var(--font-uni-salar)' }}>
                    {supplier.balance.toFixed(2)} د.ع
                  </div>
                  <div className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    کۆی گشتی قەرز
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => openEditModal(supplier)}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <FaEdit size={14} />
                    <span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>دەستکاری</span>
                  </button>
                  <button
                    onClick={() => confirmDelete(supplier)}
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
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>کۆمپانیا</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>مۆبایل</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>ناونیشان</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>قەرز</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>کردارەکان</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
                    <td className="px-3 py-3 font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                      {supplier.name}
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                      {supplier.company || '-'}
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                      {supplier.phone}
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                      {supplier.address || '-'}
                    </td>
                    <td className="px-3 py-3 font-semibold" style={{ color: supplier.balance > 0 ? '#dc2626' : '#16a34a', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                      {supplier.balance.toFixed(2)} د.ع
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button
                          onClick={() => confirmDelete(supplier)}
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
        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
              هیچ دابینکەرێک نەدۆزرایەوە
            </h3>
            <p className="text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              {searchTerm ? 'گەڕانەکەت بگۆڕە' : 'دابینکەری نوێ زیادبکە'}
            </p>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                زیادکردنی دابینکەر
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناو *</label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    placeholder="ناوی دابینکەر"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆمپانیا</label>
                  <input
                    type="text"
                    value={newSupplier.company}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    placeholder="ناوی کۆمپانیا"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>مۆبایل *</label>
                  <input
                    type="text"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    placeholder="0750-123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناونیشان</label>
                  <input
                    type="text"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    placeholder="ناونیشانی دابینکەر"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowAddSupplier(false)}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: '#6b7280', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  onClick={addSupplier}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                >
                  زیادکردن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingSupplier && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                دەستکاریکردنی دابینکەر
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناو *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => updateEditForm('name', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆمپانیا</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => updateEditForm('company', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>مۆبایل *</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => updateEditForm('phone', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناونیشان</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => updateEditForm('address', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && supplierToDelete && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                  دڵنیای لە سڕینەوە؟
                </h3>
                <p className="text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  ئایا دڵنیای لە سڕینەوەی <strong>{supplierToDelete.name}</strong>؟
                </p>
                <p className="text-sm text-red-600 mt-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  ئەم کردارە ناتوانرێت پاشگەز بکرێتەوە و هەموو مامەڵەکانی دەسڕێتەوە
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
