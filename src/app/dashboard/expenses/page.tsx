'use client'

import { formatSmartCurrency } from '@/lib/numberUtils'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { FaCalculator, FaEdit, FaImage, FaMoneyBillWave, FaPlus, FaTrash, FaUpload } from 'react-icons/fa'
import { useExpensesData } from '@/components/expenses/useExpensesData'

export default function ExpensesPage() {
  const {
    expenses, loading, activeTab, dateFilters, formData, editingExpense, showDeleteConfirm,
    selectedImage, fileInputRef,
    setActiveTab, setDateFilters, setFormData, setEditingExpense, setShowDeleteConfirm, setSelectedImage,
    fetchExpenses, handleFileSelect,
    addExpense, updateExpense, deleteExpense, startEdit, cancelEdit, getTotalExpenses
  } = useExpensesData()

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--theme-background)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--theme-accent)' }}></div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 md:p-6"
      style={{ background: 'var(--theme-background)', minHeight: '100vh' }}
    >
      <div className="max-w-[2800px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 
                className="text-4xl font-bold mb-2"
                style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
              >
                بەڕێوەبردنی خەرجییەکان
              </h1>
              <p 
                style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
              >
                تۆمارکردن و بەڕێوەبردنی هەموو خەرجییەکان
              </p>
            </div>
            <FaCalculator className="text-3xl" style={{ color: 'var(--theme-accent)' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div 
              className="rounded-2xl p-6 shadow-lg border"
              whileHover={{ scale: 1.02 }}
              style={{ 
                backgroundColor: 'var(--theme-card-bg)',
                borderColor: 'var(--theme-card-border)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <FaMoneyBillWave className="text-2xl" style={{ color: '#ef4444' }} />
                <span 
                  className="text-sm"
                  style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
                >
                  کۆی خەرجییەکان
                </span>
              </div>
              <div 
                className="text-3xl font-bold mb-1"
                style={{ color: '#ef4444', fontFamily: 'Inter' }}
              >
                {formatSmartCurrency(getTotalExpenses())}
              </div>
              <p 
                className="text-sm"
                style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
              >
                کۆی گشتی
              </p>
            </motion.div>
            <motion.div 
              className="rounded-2xl p-6 shadow-lg border"
              whileHover={{ scale: 1.02 }}
              style={{ 
                backgroundColor: 'var(--theme-card-bg)',
                borderColor: 'var(--theme-card-border)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <FaPlus className="text-2xl" style={{ color: 'var(--theme-accent)' }} />
                <span 
                  className="text-sm"
                  style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
                >
                  ژمارە
                </span>
              </div>
              <div 
                className="text-3xl font-bold mb-1"
                style={{ color: 'var(--theme-foreground)', fontFamily: 'Inter' }}
              >
                {expenses.length}
              </div>
              <p 
                className="text-sm"
                style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
              >
                خەرجی
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <motion.div 
                className="rounded-3xl p-6 shadow-lg border"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                style={{ 
                  backgroundColor: 'var(--theme-card-bg)',
                  borderColor: 'var(--theme-card-border)'
                }}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <FaPlus className="text-xl" style={{ color: 'var(--theme-accent)' }} />
                  <h2 
                    className="text-xl font-bold"
                    style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    {editingExpense ? 'دەستکاری' : 'زیادکردن'}
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                    >
                      ناو
                    </label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all"
                      style={{ 
                        backgroundColor: 'var(--theme-muted)',
                        borderColor: 'var(--theme-card-border)',
                        color: 'var(--theme-foreground)',
                        fontFamily: 'var(--font-uni-salar)'
                      }}
                    />
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                    >
                      بڕ
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={formData.amount || ''} 
                      onChange={(e) => handleFormChange('amount', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all"
                      style={{ 
                        backgroundColor: 'var(--theme-muted)',
                        borderColor: 'var(--theme-card-border)',
                        color: 'var(--theme-foreground)',
                        fontFamily: 'Inter',
                        direction: 'ltr'
                      }}
                    />
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                    >
                      تێبینی
                    </label>
                    <textarea 
                      value={formData.note} 
                      onChange={(e) => handleFormChange('note', e.target.value)} 
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all resize-none"
                      style={{ 
                        backgroundColor: 'var(--theme-muted)',
                        borderColor: 'var(--theme-card-border)',
                        color: 'var(--theme-foreground)',
                        fontFamily: 'var(--font-uni-salar)'
                      }}
                    />
                  </div>

                  {editingExpense ? (
                    <div className="flex gap-3">
                      <motion.button 
                        onClick={updateExpense} 
                        disabled={!formData.name || formData.amount <= 0}
                        className="flex-1 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        style={{ 
                          backgroundColor: 'var(--theme-accent)',
                          color: '#ffffff',
                          fontFamily: 'var(--font-uni-salar)'
                        }}
                      >
                        نوێکردنەوە
                      </motion.button>
                      <motion.button 
                        onClick={cancelEdit} 
                        className="flex-1 py-3 rounded-xl font-bold transition-all"
                        whileHover={{ scale: 1.02 }}
                        style={{ 
                          backgroundColor: 'var(--theme-muted)',
                          color: 'var(--theme-foreground)',
                          fontFamily: 'var(--font-uni-salar)'
                        }}
                      >
                        پاشگەزبوونەوە
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button 
                      onClick={addExpense} 
                      disabled={!formData.name || formData.amount <= 0}
                      className="w-full py-3 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      style={{ 
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        fontFamily: 'var(--font-uni-salar)'
                      }}
                    >
                      زیادکردن
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-2">
              <motion.div 
                className="rounded-3xl p-6 shadow-lg border"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                style={{ 
                  backgroundColor: 'var(--theme-card-bg)',
                  borderColor: 'var(--theme-card-border)'
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <FaMoneyBillWave className="text-xl" style={{ color: '#ef4444' }} />
                    <h2 
                      className="text-xl font-bold"
                      style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                    >
                      لیست
                    </h2>
                  </div>
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    {expenses.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-4">
                  <AnimatePresence mode="popLayout">
                    {expenses.map((expense, index) => (
                      <motion.div 
                        key={expense.id} 
                        layout 
                        className="rounded-2xl p-4 border hover:border-gray-300 transition-all"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: index * 0.1 }}
                        style={{ 
                          backgroundColor: 'var(--theme-muted)',
                          borderColor: 'var(--theme-card-border)'
                        }}
                      >
                        <div className="flex gap-4">
                          <div 
                            className="w-24 h-24 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: 'var(--theme-card-bg)' }}
                          >
                            <FaImage className="text-gray-400 text-xl" />
                          </div>
                          <div className="flex-1">
                            <h3 
                              className="font-bold mb-2"
                              style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                            >
                              {expense.name}
                            </h3>
                            <div 
                              className="text-xl font-bold mb-1"
                              style={{ color: '#ef4444', fontFamily: 'Inter' }}
                            >
                              {formatSmartCurrency(expense.amount)}
                            </div>
                            <div 
                              className="text-sm mb-2"
                              style={{ color: 'var(--theme-secondary)' }}
                            >
                              {expense.date}
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => startEdit(expense)}
                                className="p-2 rounded-lg transition-colors"
                                style={{ 
                                  backgroundColor: 'var(--theme-accent)',
                                  color: '#ffffff'
                                }}
                              >
                                <FaEdit className="text-sm" />
                              </button>
                              <button 
                                onClick={() => setShowDeleteConfirm(expense.id)}
                                className="p-2 rounded-lg transition-colors"
                                style={{ 
                                  backgroundColor: '#ef4444',
                                  color: '#ffffff'
                                }}
                              >
                                <FaTrash className="text-sm" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {expenses.length === 0 && (
                  <motion.div 
                    className="text-center py-16"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="text-6xl mb-4">💸</div>
                    <h3 
                      className="text-xl font-semibold mb-2"
                      style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
                    >
                      هیچ خەرجییەک نیە
                    </h3>
                    <p 
                      style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
                    >
                      زیادی بکە
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div 
              className="rounded-3xl p-6 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              style={{ 
                backgroundColor: 'var(--theme-card-bg)',
                borderColor: 'var(--theme-card-border)'
              }}
            >
              <h3 
                className="text-xl font-bold mb-4"
                style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
              >
                سڕینەوە؟
              </h3>
              <p 
                className="mb-6"
                style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
              >
                دڵنیایت؟
              </p>
              <div className="flex gap-3">
                <motion.button 
                  onClick={() => setShowDeleteConfirm(null)} 
                  className="flex-1 py-3 rounded-xl font-bold transition-all"
                  whileHover={{ scale: 1.02 }}
                  style={{ 
                    backgroundColor: 'var(--theme-muted)',
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  پاشگەزبوونەوە
                </motion.button>
                <motion.button 
                  onClick={() => deleteExpense(showDeleteConfirm)} 
                  className="flex-1 py-3 rounded-xl font-bold transition-all"
                  whileHover={{ scale: 1.02 }}
                  style={{ 
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  سڕینەوە
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
