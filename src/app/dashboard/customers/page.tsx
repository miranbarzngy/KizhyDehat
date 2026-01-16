'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Customer {
  id: string
  name: string
  image: string
  phone1: string
  phone2: string
  location: string
  total_debt: number
}

interface PaymentHistory {
  id: string
  date: string
  amount: number
  items: string
  note: string
  type: 'sale' | 'payment'
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone1: '',
    phone2: '',
    location: '',
    image: null as File | null
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
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      fetchPaymentHistory(selectedCustomer.id)
    }
  }, [selectedCustomer])

  const fetchCustomers = async () => {
    // Demo mode: show sample customers data when Supabase is not configured
    if (!supabase) {
      const demoCustomers: Customer[] = [
        {
          id: '1',
          name: 'ئەحمەد محەمەد',
          image: '',
          phone1: '0750-123-4567',
          phone2: '0750-987-6543',
          location: 'هەولێر',
          total_debt: 125.50
        },
        {
          id: '2',
          name: 'فاطمە عەلی',
          image: '',
          phone1: '0750-555-1234',
          phone2: '',
          location: 'سلێمانی',
          total_debt: 0
        },
        {
          id: '3',
          name: 'محەمەد کەریم',
          image: '',
          phone1: '0750-777-8888',
          phone2: '0750-999-0000',
          location: 'دهۆک',
          total_debt: 89.25
        },
        {
          id: '4',
          name: 'سارا ئەحمەد',
          image: '',
          phone1: '0750-111-2222',
          phone2: '',
          location: 'هەولێر',
          total_debt: 234.75
        }
      ]
      setCustomers(demoCustomers)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentHistory = async (customerId: string) => {
    try {
      // Get customer payments
      const { data: payments, error: paymentsError } = await supabase
        .from('customer_payments')
        .select('*')
        .eq('customer_id', customerId)
        .order('date', { ascending: false })

      if (paymentsError) throw paymentsError

      // Get sales to this customer
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          date,
          total,
          sale_items (
            inventory!inner(item_name),
            quantity
          )
        `)
        .eq('customer_id', customerId)
        .order('date', { ascending: false })

      if (salesError) throw salesError

      const history: PaymentHistory[] = []

      // Add sales
      sales?.forEach(sale => {
        const items = sale.sale_items?.map((item: any) =>
          `${item.quantity} ${item.inventory.item_name}`
        ).join(', ') || ''

        history.push({
          id: `sale-${sale.id}`,
          date: sale.date,
          amount: sale.total,
          items,
          note: 'فرۆشتن',
          type: 'sale'
        })
      })

      // Add payments
      payments?.forEach(payment => {
        history.push({
          id: `payment-${payment.id}`,
          date: payment.date,
          amount: -payment.amount, // Negative for payments received
          items: payment.items || '',
          note: payment.note || 'پارەدان',
          type: 'payment'
        })
      })

      // Sort by date descending
      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setPaymentHistory(history)
    } catch (error) {
      console.error('Error fetching payment history:', error)
    }
  }

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `customers/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const addCustomer = async () => {
    if (!newCustomer.name) {
      alert('ناو پێویستە')
      return
    }

    try {
      let imageUrl = ''
      if (newCustomer.image) {
        imageUrl = await uploadImage(newCustomer.image)
      }

      const { error } = await supabase
        .from('customers')
        .insert({
          name: newCustomer.name,
          phone1: newCustomer.phone1,
          phone2: newCustomer.phone2,
          location: newCustomer.location,
          image: imageUrl
        })

      if (error) throw error

      setShowAddCustomer(false)
      setNewCustomer({ name: '', phone1: '', phone2: '', location: '', image: null })
      fetchCustomers()
    } catch (error) {
      console.error('Error adding customer:', error)
      alert('هەڵە لە زیادکردنی کڕیار')
    }
  }

  const addPayment = async () => {
    if (!selectedCustomer || newPayment.amount <= 0) {
      alert('زانیارییەکان پڕبکەرەوە')
      return
    }

    try {
      // Add payment record
      const { error: paymentError } = await supabase
        .from('customer_payments')
        .insert({
          customer_id: selectedCustomer.id,
          date: new Date().toISOString().split('T')[0],
          amount: newPayment.amount,
          note: newPayment.note
        })

      if (paymentError) throw paymentError

      // Update customer debt
      const { error: debtError } = await supabase
        .from('customers')
        .update({
          total_debt: selectedCustomer.total_debt - newPayment.amount
        })
        .eq('id', selectedCustomer.id)

      if (debtError) throw debtError

      setShowAddPayment(false)
      setNewPayment({ amount: 0, note: '' })
      fetchCustomers()
      if (selectedCustomer) {
        fetchPaymentHistory(selectedCustomer.id)
      }
    } catch (error) {
      console.error('Error adding payment:', error)
      alert('هەڵە لە زیادکردنی پارەدان')
    }
  }

  if (loading) {
    return <div className="text-center">بارکردن...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">بەڕێوەبردنی کڕیاران</h1>

      <div className="mb-6">
        <button
          onClick={() => setShowAddCustomer(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          زیادکردنی کڕیار
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customers List */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">کڕیاران</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedCustomer?.id === customer.id
                      ? 'bg-indigo-100 border-2 border-indigo-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={customer.image || '/placeholder-avatar.png'}
                      alt={customer.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{customer.name}</h3>
                      <p className="text-sm text-gray-600">{customer.phone1}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        customer.total_debt > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {customer.total_debt.toFixed(2)} د.ع
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {customers.length === 0 && (
                <p className="text-gray-500 text-center py-4">هیچ کڕیارێک نیە</p>
              )}
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="lg:col-span-2">
          {selectedCustomer ? (
            <div className="space-y-6">
              {/* Customer Profile */}
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
                <div className="flex items-start space-x-6">
                  <img
                    src={selectedCustomer.image || '/placeholder-avatar.png'}
                    alt={selectedCustomer.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                    <div className="mt-2 space-y-1">
                      <p><strong>تەلەفۆن ١:</strong> {selectedCustomer.phone1}</p>
                      <p><strong>تەلەفۆن ٢:</strong> {selectedCustomer.phone2 || '-'}</p>
                      <p><strong>ناونیشان:</strong> {selectedCustomer.location || '-'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-red-100 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">قەرزی گشتی</p>
                      <p className="text-2xl font-bold text-red-600">
                        {selectedCustomer.total_debt.toFixed(2)} د.ع
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddPayment(true)}
                      className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      پارەدان
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">مێژووی پارەدان و کڕین</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-right">بەروار</th>
                        <th className="px-4 py-2 text-right">جۆر</th>
                        <th className="px-4 py-2 text-right">بڕ</th>
                        <th className="px-4 py-2 text-right">کاڵاکان</th>
                        <th className="px-4 py-2 text-right">تێبینی</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-4 py-2">{item.date}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.type === 'sale' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.type === 'sale' ? 'فرۆشتن' : 'پارەدان'}
                            </span>
                          </td>
                          <td className={`px-4 py-2 font-semibold ${
                            item.amount >= 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {item.amount >= 0 ? '+' : ''}{item.amount.toFixed(2)} د.ع
                          </td>
                          <td className="px-4 py-2">{item.items}</td>
                          <td className="px-4 py-2">{item.note}</td>
                        </tr>
                      ))}
                      {paymentHistory.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            هیچ مێژوویەک نیە
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-lg shadow-md text-center">
              <p className="text-gray-500 text-lg">کڕیارێک هەڵبژێرە بۆ بینینی زانیارییەکان</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">زیادکردنی کڕیار</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="ناو"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="تەلەفۆن ١"
                value={newCustomer.phone1}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone1: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="تەلەفۆن ٢"
                value={newCustomer.phone2}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone2: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="ناونیشان"
                value={newCustomer.location}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, location: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewCustomer(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowAddCustomer(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={addCustomer}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                زیادکردن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPayment && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">زیادکردنی پارەدان</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="بڕی پارە"
                value={newPayment.amount}
                onChange={(e) => {
                  const westernNum = convertKurdishToWestern(e.target.value)
                  setNewPayment(prev => ({ ...prev, amount: parseFloat(westernNum) || 0 }))
                }}
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
                onClick={() => setShowAddPayment(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={addPayment}
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
