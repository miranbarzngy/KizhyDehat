'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Expense {
  id: string
  name: string
  unit: string
  amount: number
  image: string
  note: string
  date: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [newExpense, setNewExpense] = useState({
    name: '',
    unit: 'دانە',
    amount: 0,
    image: '',
    note: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    if (!supabase) {
      setExpenses([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `expenses/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      setNewExpense(prev => ({ ...prev, image: data.publicUrl }))
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error uploading image')
    }
  }

  const addExpense = async () => {
    if (!newExpense.name || newExpense.amount <= 0) {
      alert('تکایە ناو و بڕ پڕبکەرەوە')
      return
    }

    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          ...newExpense,
          date: new Date().toISOString().split('T')[0]
        })

      if (error) throw error

      setNewExpense({
        name: '',
        unit: 'دانە',
        amount: 0,
        image: '',
        note: ''
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      fetchExpenses()
    } catch (error) {
      console.error('Error adding expense:', error)
      alert('Error adding expense')
    }
  }

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  const startEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setNewExpense({
      name: expense.name,
      unit: expense.unit,
      amount: expense.amount,
      image: expense.image,
      note: expense.note
    })
  }

  const cancelEdit = () => {
    setEditingExpense(null)
    setNewExpense({
      name: '',
      unit: 'دانە',
      amount: 0,
      image: '',
      note: ''
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const updateExpense = async () => {
    if (!editingExpense || !newExpense.name || newExpense.amount <= 0) {
      alert('تکایە ناو و بڕ پڕبکەرەوە')
      return
    }

    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          name: newExpense.name,
          unit: newExpense.unit,
          amount: newExpense.amount,
          image: newExpense.image,
          note: newExpense.note
        })
        .eq('id', editingExpense.id)

      if (error) throw error

      setEditingExpense(null)
      setNewExpense({
        name: '',
        unit: 'دانە',
        amount: 0,
        image: '',
        note: ''
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      fetchExpenses()
    } catch (error) {
      console.error('Error updating expense:', error)
      alert('Error updating expense')
    }
  }

  const deleteExpense = async (id: string) => {
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error

      setShowDeleteConfirm(null)
      fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Error deleting expense')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
        بەڕێوەبردنی خەرجییەکان
      </h1>

      {/* Total Expenses Summary Card */}
      <div className="mb-8">
        <div className="p-6 rounded-2xl shadow-lg backdrop-blur-sm" style={{
          background: 'var(--theme-card-bg)',
          border: '1px solid var(--theme-border)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                کۆی خەرجییەکان
              </h2>
              <p className="text-sm accessible-secondary">لەم مانگەدا</p>
            </div>
            <div className="text-right">
              <p className="numerical-value text-red-600" style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '1.15em' }}>{Math.round(getTotalExpenses())}</p>
              <p className="text-sm accessible-secondary">د.ع</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Expense Form */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-2xl shadow-lg backdrop-blur-sm" style={{
            background: 'var(--theme-card-bg)',
            border: '1px solid var(--theme-border)'
          }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
              {editingExpense ? 'دەستکاری خەرجی' : 'زیادکردنی خەرجی'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  ناو
                </label>
                <input
                  type="text"
                  value={newExpense.name}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    background: 'var(--theme-muted)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-primary)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                  placeholder="ناوی کاڵا"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  یەکە
                </label>
                <select
                  value={newExpense.unit}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    background: 'var(--theme-muted)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-primary)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  <option value="دانە">دانە</option>
                  <option value="کیلۆ">کیلۆ</option>
                  <option value="گرام">گرام</option>
                  <option value="لیتر">لیتر</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  بڕ
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newExpense.amount}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0
                    if (value >= 0) {
                      setNewExpense(prev => ({ ...prev, amount: value }))
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    background: 'var(--theme-muted)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-primary)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  وێنە
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file)
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                  style={{
                    background: 'var(--theme-muted)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-primary)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                />
                {newExpense.image && (
                  <img
                    src={newExpense.image}
                    alt="Preview"
                    className="mt-2 w-20 h-20 object-cover rounded-lg border"
                    style={{ borderColor: 'var(--theme-border)' }}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  تێبینی
                </label>
                <textarea
                  value={newExpense.note}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, note: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border transition-colors resize-none"
                  style={{
                    background: 'var(--theme-muted)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-primary)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                  placeholder="تێبینی زیادە"
                />
              </div>

              {editingExpense ? (
                <div className="flex gap-2">
                  <button
                    onClick={updateExpense}
                    className="flex-1 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: 'var(--theme-accent)',
                      color: '#ffffff',
                      fontFamily: 'var(--font-uni-salar)'
                    }}
                  >
                    نوێکردنەوە
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: '#6b7280',
                      color: '#ffffff',
                      fontFamily: 'var(--font-uni-salar)'
                    }}
                  >
                    پاشگەزبوونەوە
                  </button>
                </div>
              ) : (
                <button
                  onClick={addExpense}
                  className="w-full py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--theme-accent)',
                    color: '#ffffff',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  زیادکردنی خەرجی
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-2xl shadow-lg backdrop-blur-sm" style={{
            background: 'var(--theme-card-bg)',
            border: '1px solid var(--theme-border)'
          }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
              لیستی خەرجییەکان
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    <th className="px-4 py-3 text-right font-semibold accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>وێنە</th>
                    <th className="px-4 py-3 text-right font-semibold accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناو</th>
                    <th className="px-4 py-3 text-right font-semibold accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>یەکە</th>
                    <th className="px-4 py-3 text-right font-semibold accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ</th>
                    <th className="px-4 py-3 text-right font-semibold accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                    <th className="px-4 py-3 text-right font-semibold accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>کردارەکان</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} style={{ borderBottom: '1px solid var(--theme-border)' }}>
                      <td className="px-4 py-3">
                        {expense.image ? (
                          <img
                            src={expense.image}
                            alt={expense.name}
                            className="w-12 h-12 object-cover rounded-lg cursor-pointer border hover:scale-110 transition-transform"
                            style={{ borderColor: 'var(--theme-border)' }}
                            onClick={() => openImageModal(expense.image)}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400">📷</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                        {expense.name}
                      </td>
                      <td className="px-4 py-3 accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        {expense.unit}
                      </td>
                      <td className="px-4 py-3">
                        <span className="numerical-value" style={{ color: 'var(--theme-accent)', fontFamily: 'var(--font-uni-salar)', fontSize: '1.15em' }}>
                          {Math.round(expense.amount)} د.ع
                        </span>
                      </td>
                      <td className="px-4 py-3 accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        {expense.date}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(expense)}
                            className="px-3 py-1 text-xs rounded transition-colors hover:scale-105"
                            style={{
                              backgroundColor: 'var(--theme-accent)',
                              color: '#ffffff',
                              fontFamily: 'var(--font-uni-salar)'
                            }}
                          >
                            دەستکاری
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(expense.id)}
                            className="px-3 py-1 text-xs rounded transition-colors hover:scale-105"
                            style={{
                              backgroundColor: '#ef4444',
                              color: '#ffffff',
                              fontFamily: 'var(--font-uni-salar)'
                            }}
                          >
                            سڕینەوە
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        هیچ خەرجییەک نیە
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closeImageModal}
        >
          <div className="max-w-2xl max-h-screen p-4">
            <img
              src={selectedImage}
              alt="Expense receipt"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="p-6 rounded-2xl shadow-2xl max-w-md" style={{
            background: 'var(--theme-card-bg)',
            border: '1px solid var(--theme-border)'
          }}>
            <h3 className="text-lg font-semibold mb-4 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
              دڵنیای لە سڕینەوە؟
            </h3>
            <p className="text-sm mb-6 text-center accessible-secondary" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              ئەم کردارە پاشگەزبوونەوەی نیە. دەتەوێت بیسڕیتەوە؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 px-4 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: '#6b7280',
                  color: '#ffffff',
                  fontFamily: 'var(--font-uni-salar)'
                }}
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={() => deleteExpense(showDeleteConfirm)}
                className="flex-1 py-2 px-4 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontFamily: 'var(--font-uni-salar)'
                }}
              >
                سڕینەوە
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
