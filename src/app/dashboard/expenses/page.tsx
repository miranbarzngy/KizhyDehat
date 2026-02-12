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
      <div className="min-h-screen bg-gradient-to-br from-[#1a1c2e] via-[#2d1b4e] to-[#0f0c29] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1c2e] via-[#2d1b4e] to-[#0f0c29] p-6 pl-0 md:pl-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەڕێوەبردنی خەرجییەکان</h1>
              <p className="text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>تۆمارکردن و بەڕێوەبردنی هەموو خەرجییەکان</p>
            </div>
            <FaCalculator className="text-red-400 text-3xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div className="bg-[#2a2d3e]/60 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-6" whileHover={{ scale: 1.02 }}>
              <div className="flex items-center justify-between mb-4">
                <FaMoneyBillWave className="text-red-400 text-2xl" />
                <span className="text-sm text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی خەرجییەکان</span>
              </div>
              <div className="text-3xl font-bold text-red-400 mb-1" style={{ fontFamily: 'Inter' }}>{formatSmartCurrency(getTotalExpenses())}</div>
              <p className="text-sm text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی گشتی</p>
            </motion.div>
            <motion.div className="bg-[#2a2d3e]/60 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-6" whileHover={{ scale: 1.02 }}>
              <div className="flex items-center justify-between mb-4">
                <FaPlus className="text-blue-400 text-2xl" />
                <span className="text-sm text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>ژمارە</span>
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-1" style={{ fontFamily: 'Inter' }}>{expenses.length}</div>
              <p className="text-sm text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>خەرجی</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <motion.div className="bg-[#2a2d3e]/60 backdrop-blur-xl border border-white/10 shadow-xl rounded-3xl p-6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <div className="flex items-center space-x-3 mb-6">
                  <FaPlus className="text-red-400 text-xl" />
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>{editingExpense ? 'دەستکاری' : 'زیادکردن'}</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناو</label>
                    <input type="text" value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-[#1a1c2e]/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-red-400 outline-none"
                      style={{ fontFamily: 'var(--font-uni-salar)' }} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ</label>
                    <input type="number" step="0.01" value={formData.amount || ''} onChange={(e) => handleFormChange('amount', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-[#1a1c2e]/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-red-400 outline-none"
                      style={{ fontFamily: 'Inter', direction: 'ltr' }} />
                  </div>

                  {formData.image && (
                    <div className="relative mb-4">
                      <img src={formData.image} alt="Preview" className="w-full h-32 object-cover rounded-xl border border-white/20" />
                      <button onClick={() => handleFormChange('image', '')} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  )}

                  <motion.button onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#1a1c2e]/50 border border-white/10 rounded-xl text-gray-300"
                    whileHover={{ scale: 1.02 }}>
                    <FaUpload /><span style={{ fontFamily: 'var(--font-uni-salar)' }}>وێنە</span>
                  </motion.button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>تێبینی</label>
                    <textarea value={formData.note} onChange={(e) => handleFormChange('note', e.target.value)} rows={3}
                      className="w-full px-4 py-3 bg-[#1a1c2e]/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-red-400 outline-none resize-none"
                      style={{ fontFamily: 'var(--font-uni-salar)' }} />
                  </div>

                  {editingExpense ? (
                    <div className="flex gap-3">
                      <motion.button onClick={updateExpense} disabled={!formData.name || formData.amount <= 0}
                        className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                        whileHover={{ scale: 1.02 }} style={{ fontFamily: 'var(--font-uni-salar)' }}>نوێکردنەوە</motion.button>
                      <motion.button onClick={cancelEdit} className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
                        whileHover={{ scale: 1.02 }} style={{ fontFamily: 'var(--font-uni-salar)' }}>پاشگەزبوونەوە</motion.button>
                    </div>
                  ) : (
                    <motion.button onClick={addExpense} disabled={!formData.name || formData.amount <= 0}
                      className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                      whileHover={{ scale: 1.02 }} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      <span className="flex items-center justify-center space-x-2"><FaPlus /><span>زیادکردن</span></span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-2">
              <motion.div className="bg-[#2a2d3e]/60 backdrop-blur-xl border border-white/10 shadow-xl rounded-3xl p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <FaMoneyBillWave className="text-red-400 text-xl" />
                    <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>لیست</h2>
                  </div>
                  <span className="text-sm text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expenses.length}</span>
                </div>

                <div className="flex space-x-1 mb-6 bg-[#1a1c2e]/50 p-1 rounded-xl">
                  <button onClick={() => setActiveTab('all')} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${activeTab === 'all' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>هەموو</button>
                  <button onClick={() => setActiveTab('filter')} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${activeTab === 'filter' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>گەڕان</button>
                </div>

                {activeTab === 'filter' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-[#1a1c2e]/50 rounded-xl border border-white/10">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>لە</label>
                        <input type="date" value={dateFilters.fromDate} onChange={(e) => setDateFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                          className="w-full px-3 py-2 bg-[#1a1c2e]/50 border border-white/10 rounded-xl text-white" style={{ fontFamily: 'Inter' }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>بۆ</label>
                        <input type="date" value={dateFilters.toDate} onChange={(e) => setDateFilters(prev => ({ ...prev, toDate: e.target.value }))}
                          className="w-full px-3 py-2 bg-[#1a1c2e]/50 border border-white/10 rounded-xl text-white" style={{ fontFamily: 'Inter' }} />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {expenses.map((expense, index) => (
                      <motion.div key={expense.id} className="bg-[#1a1c2e]/50 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.02 }}>
                        <div className="flex gap-4">
                          {expense.image ? (
                            <img src={expense.image} alt={expense.name} onClick={() => setSelectedImage(expense.image)} className="w-24 h-24 object-cover rounded-xl cursor-pointer" />
                          ) : (
                            <div className="w-24 h-24 bg-[#2a2d3e]/50 rounded-xl flex items-center justify-center"><FaImage className="text-gray-500 text-xl" /></div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold text-white mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.name}</h3>
                            {expense.note && <p className="text-sm text-gray-400 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>{expense.note}</p>}
                            <div className="text-xl font-bold text-red-400 mb-1" style={{ fontFamily: 'Inter' }}>{formatSmartCurrency(expense.amount)}</div>
                            <div className="text-sm text-gray-500 mb-2">{expense.date}</div>
                            <div className="flex gap-2">
                              <button onClick={() => startEdit(expense)} className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><FaEdit /></button>
                              <button onClick={() => setShowDeleteConfirm(expense.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg"><FaTrash /></button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {expenses.length === 0 && (
                  <motion.div className="text-center py-16" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="text-6xl mb-4">💸</div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>هیچ خەرجییەک نیە</h3>
                    <p className="text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>زیادی بکە</p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedImage(null)}>
            <motion.div className="max-w-2xl max-h-screen" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <img src={selectedImage} alt="Expense" className="max-w-full max-h-full object-contain rounded-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-[#2a2d3e] rounded-3xl p-6 max-w-md w-full shadow-2xl" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-uni-salar)' }}>سڕینەوە؟</h3>
              <p className="text-gray-400 mb-6" style={{ fontFamily: 'var(--font-uni-salar)' }}>دڵنیایت؟</p>
              <div className="flex gap-3">
                <motion.button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl transition-all" whileHover={{ scale: 1.02 }} style={{ fontFamily: 'var(--font-uni-salar)' }}>پاشگەزبوونەوە</motion.button>
                <motion.button onClick={() => deleteExpense(showDeleteConfirm)} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all" whileHover={{ scale: 1.02 }} style={{ fontFamily: 'var(--font-uni-salar)' }}>سڕینەوە</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
