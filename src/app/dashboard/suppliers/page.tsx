'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Supplier {
  id: string
  name: string
  image?: string
  phone1: string
  phone2?: string
  note?: string
  balance: number
  created_at?: string
}

interface PurchaseHistory {
  id: string
  item_name: string
  quantity: number
  unit: string
  total_price: number
  amount_paid: number
  debt_amount: number
  date: string
}

interface Payment {
  id: string
  date: string
  amount: number
  note: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchaseHistory, setPurchaseHistory] = useState<Record<string, PurchaseHistory[]>>({})
  const [payments, setPayments] = useState<Record<string, Payment[]>>({})
  const [loading, setLoading] = useState(true)
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showPurchaseHistory, setShowPurchaseHistory] = useState<string | null>(null)
  const [showAddPayment, setShowAddPayment] = useState<string | null>(null)
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    image: null as File | null,
    phone1: '',
    phone2: '',
    note: ''
  })
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    note: ''
  })

  // Convert Kurdish numerals to Western numerals
  const convertKurdishToWestern = (kurdishNum: string): string => {
    // Handle Arabic decimal separator (٫) and convert to Western decimal point (.)
    const processedNum = kurdishNum.replace(/٫/g, '.')

    const kurdishToWestern: { [key: string]: string } = {
      '٠': '0',
      '١': '1',
      '٢': '2',
      '٣': '3',
      '٤': '4',
      '٥': '5',
      '٦': '6',
      '٧': '7',
      '٨': '8',
      '٩': '9'
    }

    return processedNum.split('').map(char => kurdishToWestern[char] || char).join('')
  }

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
          image: '',
          phone1: '0750-123-4567',
          phone2: '0750-765-4321',
          note: 'دابینکەری برنجی باشی کوردستانی',
          balance: 1250.75
        },
        {
          id: '2',
          name: 'فرۆشیاری شەکر',
          image: '',
          phone1: '0750-987-6543',
          phone2: '',
          note: 'شەکری پاک و خاوێن',
          balance: 890.50
        },
        {
          id: '3',
          name: 'کۆمپانیای چای ناوەندی',
          image: '',
          phone1: '0750-555-1234',
          phone2: '0750-444-5678',
          note: 'چای ڕەسەنی کوردستانی',
          balance: 2340.25
        }
      ]

      const demoPurchaseHistory: Record<string, PurchaseHistory[]> = {
        '1': [
          { id: '1', item_name: 'برنج', quantity: 25, unit: 'کیلۆ', total_price: 625.00, amount_paid: 500.00, debt_amount: 125.00, date: '2024-01-15' },
          { id: '2', item_name: 'گۆشت', quantity: 10, unit: 'کیلۆ', total_price: 350.00, amount_paid: 350.00, debt_amount: 0.00, date: '2024-01-10' }
        ],
        '2': [
          { id: '3', item_name: 'شەکر', quantity: 50, unit: 'کیلۆ', total_price: 2250.00, amount_paid: 1800.00, debt_amount: 450.00, date: '2024-01-12' }
        ],
        '3': [
          { id: '4', item_name: 'چای', quantity: 100, unit: 'پاکێت', total_price: 1000.00, amount_paid: 800.00, debt_amount: 200.00, date: '2024-01-14' },
          { id: '5', item_name: 'قاوە', quantity: 20, unit: 'کیلۆ', total_price: 800.00, amount_paid: 600.00, debt_amount: 200.00, date: '2024-01-08' }
        ]
      }

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
      setPurchaseHistory(demoPurchaseHistory)
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

      // Fetch purchase history for each supplier
      const purchaseData: Record<string, PurchaseHistory[]> = {}
      const paymentsData: Record<string, Payment[]> = {}

      for (const supplier of data || []) {
        // Fetch purchase history from supplier_transactions table
        const { data: purchaseDataResult, error: purchaseError } = await supabase
          .from('supplier_transactions')
          .select('*')
          .eq('supplier_id', supplier.id)
          .order('date', { ascending: false })

        if (!purchaseError) {
          purchaseData[supplier.id] = purchaseDataResult || []
        }

        // Fetch payments
        const { data: paymentData, error: paymentError } = await supabase
          .from('supplier_payments')
          .select('*')
          .eq('supplier_id', supplier.id)
          .order('date', { ascending: false })

        if (!paymentError) {
          paymentsData[supplier.id] = paymentData || []
        }
      }

      setPurchaseHistory(purchaseData)
      setPayments(paymentsData)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `suppliers/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const addSupplier = async () => {
    if (!newSupplier.name) {
      alert('ناو پێویستە')
      return
    }

    try {
      let imageUrl = ''
      if (newSupplier.image) {
        imageUrl = await uploadImage(newSupplier.image)
      }

      const { error } = await supabase
        .from('suppliers')
        .insert({
          name: newSupplier.name,
          image: imageUrl,
          phone1: newSupplier.phone1,
          phone2: newSupplier.phone2,
          note: newSupplier.note
        })

      if (error) throw error

      setShowAddSupplier(false)
      setNewSupplier({ name: '', image: null, phone1: '', phone2: '', note: '' })
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
    return <div className="text-center">چاوەڕوانبە...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>بەڕێوەبردنی دابینکەران</h1>

      <div className="mb-6">
        <button
          onClick={() => setShowAddSupplier(true)}
          className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
          style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
        >
          زیادکردنی دابینکەر
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="backdrop-blur-md bg-white/80 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={supplier.image || '/placeholder-avatar.png'}
                  alt={supplier.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                    {supplier.name}
                  </h3>
                  <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    📞 {supplier.phone1}
                  </p>
                  {supplier.phone2 && (
                    <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      📞 {supplier.phone2}
                    </p>
                  )}
                </div>
              </div>

              {supplier.note && (
                <p className="text-sm mb-4 opacity-80" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  {supplier.note}
                </p>
              )}

              <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                  <p className="text-sm opacity-75 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>قەرز</p>
                  <p className="text-2xl font-bold text-red-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    {supplier.balance.toFixed(2)} د.ع
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowPurchaseHistory(supplier.id)}
                    className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    پیشاندانی مێژووی کڕین
                  </button>
                  <button
                    onClick={() => setShowAddPayment(supplier.id)}
                    className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    پارەدان
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
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
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>وێنە</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>مۆبایل 1</label>
                  <input
                    type="text"
                    value={newSupplier.phone1}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone1: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    placeholder="0750-123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>مۆبایل 2</label>
                  <input
                    type="text"
                    value={newSupplier.phone2}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone2: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    placeholder="0750-987-6543"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>تێبینی</label>
                  <textarea
                    value={newSupplier.note}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, note: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm resize-none"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    placeholder="زانیارییەکانی دابینکەر..."
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

      {/* Purchase History Modal */}
      {showPurchaseHistory && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-4xl max-h-screen overflow-y-auto rounded-2xl shadow-2xl" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                مێژووی کڕین - {suppliers.find(s => s.id === showPurchaseHistory)?.name}
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr style={{ background: 'var(--theme-muted)' }}>
                      <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                        بەروار
                      </th>
                      <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                        وەسف
                      </th>
                      <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                        نرخی کۆی گشتی
                      </th>
                      <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                        بڕی پارەی دراو
                      </th>
                      <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                        قەرزی ماوە
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(purchaseHistory[showPurchaseHistory] || []).map((purchase) => (
                      <tr key={purchase.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
                        <td className="px-4 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                          {purchase.date}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                          کڕینی {purchase.quantity} {purchase.unit} {purchase.item_name}
                        </td>
                        <td className="px-4 py-3 font-semibold" style={{ color: 'var(--theme-accent)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                          {purchase.total_price.toFixed(2)} د.ع
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                          {purchase.amount_paid.toFixed(2)} د.ع
                        </td>
                        <td className="px-4 py-3 font-semibold" style={{ color: purchase.debt_amount > 0 ? '#dc2626' : '#16a34a', fontFamily: 'var(--font-uni-salar)', fontSize: '0.9em' }}>
                          {purchase.debt_amount.toFixed(2)} د.ع
                        </td>
                      </tr>
                    ))}
                    {(purchaseHistory[showPurchaseHistory] || []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          هیچ مێژوویەکی کڕین نیە
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setShowPurchaseHistory(null)}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: '#6b7280', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                >
                  داخستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPayment && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                زیادکردنی پارەدان
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕی پارە</label>
                  <input
                    type="text"
                    value={newPayment.amount}
                    onChange={(e) => {
                      const westernNum = convertKurdishToWestern(e.target.value)
                      setNewPayment(prev => ({ ...prev, amount: parseFloat(westernNum) || 0 }))
                    }}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>تێبینی</label>
                  <input
                    type="text"
                    value={newPayment.note}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-uni-salar)' }}
                    placeholder="تێبینی پارەدان"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowAddPayment(null)}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: '#6b7280', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  onClick={() => addPayment(showAddPayment)}
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
    </div>
  )
}
