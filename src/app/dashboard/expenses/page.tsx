'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Expense {
  id: string
  description: string
  amount: number
  date: string
  category: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: ''
  })
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  useEffect(() => {
    fetchExpenses()
  }, [filterCategory, filterDateFrom, filterDateTo])

  const fetchExpenses = async () => {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })

      if (filterCategory) {
        query = query.eq('category', filterCategory)
      }
      if (filterDateFrom) {
        query = query.gte('date', filterDateFrom)
      }
      if (filterDateTo) {
        query = query.lte('date', filterDateTo)
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

  const addExpense = async () => {
    if (!newExpense.description || newExpense.amount <= 0 || !newExpense.category) {
      alert('تکایە هەموو زانیارییەکان پڕبکەرەوە')
      return
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .insert(newExpense)

      if (error) throw error

      setShowAddExpense(false)
      setNewExpense({
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: ''
      })
      fetchExpenses()
    } catch (error) {
      console.error('Error adding expense:', error)
      alert('Error adding expense')
    }
  }

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  const getUniqueCategories = () => {
    return [...new Set(expenses.map(e => e.category))]
  }

  if (loading) {
    return <div className="text-center">بارکردن...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">بەڕێوەبردنی خەرجییەکان</h1>

      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => setShowAddExpense(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          زیادکردنی خەرجی
        </button>
        <div className="text-xl font-bold text-red-600">
          کۆی خەرجییەکان: {getTotalExpenses().toFixed(2)} د.ع
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium mb-1">پۆل</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">هەموو</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">لە بەروار</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">بۆ بەروار</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterCategory('')
                setFilterDateFrom('')
                setFilterDateTo('')
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              پاککردنەوە
            </button>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">لیستی خەرجییەکان</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-right">بەروار</th>
                <th className="px-4 py-2 text-right">پۆل</th>
                <th className="px-4 py-2 text-right">وەسف</th>
                <th className="px-4 py-2 text-right">بڕ</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-t">
                  <td className="px-4 py-2">{expense.date}</td>
                  <td className="px-4 py-2">{expense.category}</td>
                  <td className="px-4 py-2">{expense.description}</td>
                  <td className="px-4 py-2 font-semibold">{expense.amount.toFixed(2)} د.ع</td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    هیچ خەرجییەک نیە
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">زیادکردنی خەرجی</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="وەسف"
                value={newExpense.description}
                onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="number"
                step="0.01"
                placeholder="بڕ"
                value={newExpense.amount}
                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">هەڵبژاردنی پۆل</option>
                <option value="کرێ">کرێ</option>
                <option value="کارەبا">کارەبا</option>
                <option value="ئینتەرنێت">ئینتەرنێت</option>
                <option value="گەنەراتۆر">گەنەراتۆر</option>
                <option value="ترانسپۆرت">ترانسپۆرت</option>
                <option value="ئەوانی تر">ئەوانی تر</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowAddExpense(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={addExpense}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                زیادکردن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
