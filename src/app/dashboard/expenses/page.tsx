'use client'

import { formatSmartCurrency } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { FaCalculator, FaCamera, FaEdit, FaImage, FaMoneyBillWave, FaPlus, FaTrash, FaUpload } from 'react-icons/fa'

interface Expense {
  id: string
  name: string
  unit: string
  amount: number
  image: string
  note: string
  date: string
  category?: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'filter'>('all')
  const [dateFilters, setDateFilters] = useState({
    fromDate: '',
    toDate: ''
  })
  const [newExpense, setNewExpense] = useState({
    name: '',
    unit: 'دانە',
    amount: 0,
    image: '',
    note: ''
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      setCameraStream(stream)
      setShowCamera(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('ناتوانرێت کامێرا بکرێتەوە')
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `expense-${Date.now()}.jpg`, { type: 'image/jpeg' })
            await handleImageUpload(file)
            stopCamera()
          }
        }, 'image/jpeg', 0.8)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [activeTab, dateFilters])

  const fetchExpenses = async () => {
    if (!supabase) {
      setExpenses([])
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })

      // Apply date filters if in filter tab and dates are provided
      if (activeTab === 'filter') {
        if (dateFilters.fromDate) {
          query = query.gte('date', dateFilters.fromDate)
        }
        if (dateFilters.toDate) {
          query = query.lte('date', dateFilters.toDate)
        }
      }

      const { data, error } = await query

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
          description: newExpense.name, // Use description field for backward compatibility
          name: newExpense.name, // Also set name field
          amount: newExpense.amount,
          image: newExpense.image,
          note: newExpense.note,
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                بەڕێوەبردنی خەرجییەکان
              </h1>
              <p className="text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                تۆمارکردن و بەڕێوەبردنی هەموو خەرجییەکان
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <FaCalculator className="text-red-500 text-3xl" />
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <FaMoneyBillWave className="text-red-600 text-2xl" />
                <span className="text-sm text-red-600 font-medium">کۆی خەرجییەکان</span>
              </div>
              <div className="text-3xl font-bold text-red-700 mb-1">
                {formatSmartCurrency(getTotalExpenses())}
              </div>
              <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                لەم مانگەدا
              </p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <FaPlus className="text-blue-600 text-2xl" />
                <span className="text-sm text-blue-600 font-medium">ژمارەی خەرجییەکان</span>
              </div>
              <div className="text-3xl font-bold text-blue-700 mb-1">
                {expenses.length}
              </div>
              <p className="text-sm text-blue-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                تۆمارکراوە
              </p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <FaImage className="text-green-600 text-2xl" />
                <span className="text-sm text-green-600 font-medium">خەرجییەکان بە وێنە</span>
              </div>
              <div className="text-3xl font-bold text-green-700 mb-1">
                {expenses.filter(e => e.image).length}
              </div>
              <p className="text-sm text-green-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                وێنەیان هەیە
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Expense Form */}
            <div className="lg:col-span-1">
              <motion.div
                className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <FaPlus className="text-red-500 text-xl" />
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    {editingExpense ? 'دەستکاری خەرجی' : 'زیادکردنی خەرجی'}
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      ناوی خەرجی
                    </label>
                    <input
                      type="text"
                      value={newExpense.name}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                      placeholder="بۆ نموونە: کڕینی قەڵەم"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      بڕ (د.ع)
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
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                      style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                      placeholder="0.00"
                      required
                    />
                  </div>



                  {/* Image Upload with Camera Option */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      وێنە (داخستن یان کامێرا)
                    </label>

                    {/* Image Preview */}
                    {newExpense.image && (
                      <div className="mb-4 relative">
                        <img
                          src={newExpense.image}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-xl border-2 border-red-200"
                        />
                        <button
                          onClick={() => setNewExpense(prev => ({ ...prev, image: '' }))}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    )}

                    {/* Upload Options */}
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaUpload />
                        <span style={{ fontFamily: 'var(--font-uni-salar)' }}>داخستن</span>
                      </motion.button>

                      <motion.button
                        onClick={startCamera}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl border-2 border-green-200 hover:border-green-300 transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaCamera />
                        <span style={{ fontFamily: 'var(--font-uni-salar)' }}>کامێرا</span>
                      </motion.button>
                    </div>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      تێبینی
                    </label>
                    <textarea
                      value={newExpense.note}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, note: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                      placeholder="تێبینی زیادە دەربارەی خەرجییەکە..."
                    />
                  </div>

                  {/* Action Buttons */}
                  {editingExpense ? (
                    <div className="flex gap-3">
                      <motion.button
                        onClick={updateExpense}
                        disabled={!newExpense.name || newExpense.amount <= 0}
                        className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ fontFamily: 'var(--font-uni-salar)' }}
                      >
                        نوێکردنەوە
                      </motion.button>
                      <motion.button
                        onClick={cancelEdit}
                        className="flex-1 py-4 px-6 bg-gray-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ fontFamily: 'var(--font-uni-salar)' }}
                      >
                        پاشگەزبوونەوە
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      onClick={addExpense}
                      disabled={!newExpense.name || newExpense.amount <= 0}
                      className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-red-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <FaPlus />
                        <span>زیادکردنی خەرجی</span>
                      </span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Expenses List */}
            <div className="lg:col-span-2">
              <motion.div
                className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                {/* Tabs */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <FaMoneyBillWave className="text-red-500 text-2xl" />
                    <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      لیستی خەرجییەکان
                    </h2>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      {expenses.length} خەرجی
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'all'
                        ? 'bg-white text-red-600 shadow-md'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    هەموو خەرجییەکان
                  </button>
                  <button
                    onClick={() => setActiveTab('filter')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'filter'
                        ? 'bg-white text-red-600 shadow-md'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    گەڕان بەپێی بەروار
                  </button>
                </div>

                {/* Date Filters */}
                {activeTab === 'filter' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-red-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          لە ڕێکەوتی
                        </label>
                        <input
                          type="date"
                          value={dateFilters.fromDate}
                          onChange={(e) => setDateFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-red-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                          style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-red-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          بۆ ڕێکەوتی
                        </label>
                        <input
                          type="date"
                          value={dateFilters.toDate}
                          onChange={(e) => setDateFilters(prev => ({ ...prev, toDate: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-red-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                          style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-red-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      تکایە ڕێکەوتەکان هەڵبژێرە بۆ پاراستنی خەرجییەکان
                    </div>
                  </motion.div>
                )}

                {/* Expenses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence>
                    {expenses.map((expense, index) => (
                      <motion.div
                        key={expense.id}
                        className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                          delay: index * 0.1,
                          duration: 0.3
                        }}
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex flex-col items-center space-y-3 mb-2">
                              {expense.image ? (
                                <img
                                  src={expense.image}
                                  alt={expense.name}
                                  className="w-72 h-32 object-cover rounded-lg border-2 border-red-200 cursor-pointer hover:scale-110 transition-transform"
                                  onClick={() => openImageModal(expense.image)}
                                />
                              ) : (
                                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                                  <FaImage className="text-gray-400 text-2xl" />
                                </div>
                              )}
                              <div className="text-center">
                                <h3 className="font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                  {expense.name}
                                </h3>
                              </div>
                            </div>

                            {expense.note && (
                              <p className="text-sm text-gray-700 mb-3 leading-relaxed" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                {expense.note}
                              </p>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-red-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  {formatSmartCurrency(expense.amount)}
                                </div>
                                <div className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                  {expense.date}
                                </div>
                              </div>

                              <div className="flex space-x-2">
                                <motion.button
                                  onClick={() => startEdit(expense)}
                                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <FaEdit />
                                </motion.button>
                                <motion.button
                                  onClick={() => setShowDeleteConfirm(expense.id)}
                                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <FaTrash />
                                </motion.button>
                              </div>
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
                    transition={{ delay: 0.3 }}
                  >
                    <div className="text-6xl mb-4">💸</div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      {activeTab === 'filter' ? 'هیچ خەرجییەک بەپێی ڕێکەوتی هەڵبژێردراو نیە' : 'هیچ خەرجییەک نیە'}
                    </h3>
                    <p className="text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      {activeTab === 'filter'
                        ? 'تکایە ڕێکەوتەکان بگۆڕە یان بگەڕێوە بۆ تابەی هەموو خەرجییەکان'
                        : 'خەرجییەکانت لێرە زیاد بکە بۆ بەڕێوەبردنی باشتر'
                      }
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    وێنەگرتن
                  </h3>
                  <button
                    onClick={stopCamera}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTrash className="text-xl" />
                  </button>
                </div>

                <div className="relative mb-6">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover rounded-2xl bg-black"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={capturePhoto}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <FaCamera />
                      <span>وێنەگرتن</span>
                    </span>
                  </motion.button>
                  <motion.button
                    onClick={stopCamera}
                    className="flex-1 py-4 px-6 bg-gray-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    پاشگەزبوونەوە
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImageModal}
          >
            <motion.div
              className="max-w-2xl max-h-screen"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <img
                src={selectedImage}
                alt="Expense receipt"
                className="max-w-full max-h-full object-contain rounded-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  دڵنیای لە سڕینەوە؟
                </h3>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTrash className="text-xl" />
                </button>
              </div>

              <p className="text-gray-600 mb-8 leading-relaxed" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                ئەم کردارە پاشگەزبوونەوەی نیە. دەتەوێت خەرجییەکە بسڕیتەوە؟
              </p>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 px-6 bg-gray-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  پاشگەزبوونەوە
                </motion.button>
                <motion.button
                  onClick={() => deleteExpense(showDeleteConfirm)}
                  className="flex-1 py-3 px-6 bg-red-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  سڕینەوە
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}