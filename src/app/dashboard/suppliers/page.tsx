'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Supplier {
  id: string
  name: string
  company: string
  phone: string
  address: string
  balance: number
}

interface Payment {
  id: string
  date: string
  amount: number
  note: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [payments, setPayments] = useState<Record<string, Payment[]>>({})
  const [loading, setLoading] = useState(true)
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState<string | null>(null)
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    company: '',
    phone: '',
    address: ''
  })
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    note: ''
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    // Demo mode: show sample suppliers data when Supabase is not configured
    if (!supabase) {
      const demoSuppliers: Supplier[] = [
        {
          id: '1',
          name: 'کۆمپانیای برنجی کوردستان',
          company: 'کۆمپانیای برنجی کوردستان',
          phone: '0750-123-4567',
          address: 'هەولێر، شەقڵاوە',
          balance: 1250.75
        },
        {
          id: '2',
          name: 'فرۆشیاری شەکر',
          company: 'فرۆشیاری شەکر',
          phone: '0750-987-6543',
          address: 'سلێمانی، بازاڕی ناوەندی',
          balance: 890.50
        },
        {
          id: '3',
          name: 'کۆمپانیای چای ناوەندی',
          company: 'کۆمپانیای چای ناوەندی',
          phone: '0750-555-1234',
          address: 'دهۆک، بازاڕی سەرەکی',
          balance: 2340.25
        }
      ]

      const demoPayments: Record<string, Payment[]> = {
        '1': [
          { id: '1', date: '2024-01-15', amount: 500.00, note: 'پارەدانی یەکەم' },
          { id: '2', date: '2024-01-10', amount: 750.25, note: 'پارەدانی دووەم' }
        ],
        '2': [
          { id: '3', date: '2024-01-12', amount: 890.50, note: 'پارەدانی تەواو' }
        ],
        '3': [
          { id: '4', date: '2024-01-14', amount: 1200.00, note: 'پارەدانی قەرز' },
          { id: '5', date: '2024-01-08', amount: 1140.25, note: 'پارەدانی ماوە' }
        ]
      }

      setSuppliers(demoSuppliers)
      setPayments(demoPayments)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')

      if (error) throw error
      setSuppliers(data || [])

      // Fetch payments for each supplier
      const paymentsData: Record<string, Payment[]> = {}
      for (const supplier of data || []) {
        const { data: paymentData, error: paymentError } = await supabase
          .from('supplier_payments')
          .select('*')
          .eq('supplier_id', supplier.id)
          .order('date', { ascending: false })

        if (!paymentError) {
          paymentsData[supplier.id] = paymentData || []
        }
      }
      setPayments(paymentsData)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const addSupplier = async () => {
    if (!newSupplier.name) {
      alert('ناو پێویستە')
      return
    }

    // Demo mode: show message instead of actually adding
    if (!supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت دابینکەر زیاد بکرێت. تەنها بۆ پیشاندانە.')
      setShowAddSupplier(false)
      setNewSupplier({ name: '', company: '', phone: '', address: '' })
      return
    }

    try {
      const { error } = await supabase
        .from('suppliers')
        .insert(newSupplier)

      if (error) throw error

      setShowAddSupplier(false)
      setNewSupplier({ name: '', company: '', phone: '', address: '' })
      fetchSuppliers()
    } catch (error) {
      console.error('Error adding supplier:', error)
      alert('Error adding supplier')
    }
  }

  const addPayment = async (supplierId: string) => {
    if (newPayment.amount <= 0) {
      alert('بڕی پارە پێویستە')
      return
    }

    // Demo mode: show message instead of actually adding payment
    if (!supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت پارەدان زیاد بکرێت. تەنها بۆ پیشاندانە.')
      setShowAddPayment(null)
      setNewPayment({ amount: 0, note: '' })
      return
    }

    try {
      // Insert payment
      const { error: paymentError } = await supabase
        .from('supplier_payments')
        .insert({
          supplier_id: supplierId,
          date: new Date().toISOString().split('T')[0],
          amount: newPayment.amount,
          note: newPayment.note
        })

      if (paymentError) throw paymentError

      // Update supplier balance
      const supplier = suppliers.find(s => s.id === supplierId)
      if (supplier) {
        const { error: balanceError } = await supabase
          .from('suppliers')
          .update({
            balance: supplier.balance - newPayment.amount
          })
          .eq('id', supplierId)

        if (balanceError) throw balanceError
      }

      setShowAddPayment(null)
      setNewPayment({ amount: 0, note: '' })
      fetchSuppliers()
    } catch (error) {
      console.error('Error adding payment:', error)
      alert('Error adding payment')
    }
  }

  if (loading) {
    return <div className="text-center">بارکردن...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">بەڕێوەبردنی دابینکەران</h1>

      <div className="mb-6">
        <button
          onClick={() => setShowAddSupplier(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          زیادکردنی دابینکەر
        </button>
      </div>

      <div className="space-y-6">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{supplier.name}</h3>
                <p className="text-gray-600">{supplier.company}</p>
                <p className="text-sm text-gray-500">📞 {supplier.phone}</p>
                <p className="text-sm text-gray-500">📍 {supplier.address}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">
                  قەرز: {supplier.balance.toFixed(2)} د.ع
                </p>
                <button
                  onClick={() => setShowAddPayment(supplier.id)}
                  className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  پارەدان
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">مێژووی پارەدان</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-right">بەروار</th>
                      <th className="px-3 py-2 text-right">بڕ</th>
                      <th className="px-3 py-2 text-right">تێبینی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(payments[supplier.id] || []).map((payment) => (
                      <tr key={payment.id} className="border-t">
                        <td className="px-3 py-2">{payment.date}</td>
                        <td className="px-3 py-2">{payment.amount.toFixed(2)} د.ع</td>
                        <td className="px-3 py-2">{payment.note}</td>
                      </tr>
                    ))}
                    {(payments[supplier.id] || []).length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-center text-gray-500">
                          هیچ پارەدانێک نیە
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">زیادکردنی دابینکەر</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="ناو"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="کۆمپانیا"
                value={newSupplier.company}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, company: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="تەلەفۆن"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="ناونیشان"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowAddSupplier(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={addSupplier}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                زیادکردن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">زیادکردنی پارەدان</h3>
            <div className="space-y-4">
              <input
                type="number"
                step="0.01"
                placeholder="بڕی پارە"
                value={newPayment.amount}
                onChange={(e) => setNewPayment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="تێبینی"
                value={newPayment.note}
                onChange={(e) => setNewPayment(prev => ({ ...prev, note: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowAddPayment(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={() => addPayment(showAddPayment)}
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
