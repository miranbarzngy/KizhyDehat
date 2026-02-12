'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency, toEnglishDigits } from '@/lib/numberUtils'

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
  payment_method?: string
  sale_id?: string
}

const CustomerImage = ({ customer, className = "" }: { customer: Customer, className?: string }) => (
  <div
    className={`rounded-2xl flex items-center justify-center overflow-hidden shadow-inner ${className}`}
    style={{ backgroundColor: 'var(--theme-muted)' }}
  >
    {customer.image ? (
      <img src={customer.image} alt={customer.name} className="w-full h-full object-cover rounded-2xl" />
    ) : (
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--theme-accent)' }}
      >
        <span className="text-white text-2xl font-bold">{customer.name.charAt(0)}</span>
      </div>
    )}
  </div>
)

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone1: '', phone2: '', location: '', image: null as File | null })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    if (!supabase) {
      setCustomers([
        { id: '1', name: 'ئەحمەد محەمەد', image: '', phone1: '0750-123-4567', phone2: '', location: 'هەولێر', total_debt: 125.50 },
        { id: '2', name: 'فاطمە عەلی', image: '', phone1: '0750-555-1234', phone2: '', location: 'سلێمانی', total_debt: 0 },
        { id: '3', name: 'محەمەد کەریم', image: '', phone1: '0750-777-8888', phone2: '', location: 'دهۆک', total_debt: 89.25 },
      ])
      setLoading(false)
      return
    }
    try {
      const { data } = await supabase.from('customers').select('*').order('name')
      setCustomers(data || [])
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  const filteredCustomers = customers.filter(c => 
    !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone1.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--theme-background)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--theme-accent)' }}></div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--theme-background)', minHeight: '100vh' }}>
      <h1 
        className="text-3xl font-bold mb-8 p-6 pl-0"
        style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
      >
        بەڕێوەبردنی کڕیاران
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6">
        {/* Customers List */}
        <div className="lg:col-span-1">
          <div 
            className="rounded-3xl p-6 shadow-lg border"
            style={{ 
              backgroundColor: 'var(--theme-card-bg)',
              borderColor: 'var(--theme-card-border)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-xl font-semibold"
                style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
              >
                کڕیاران
              </h2>
              <span style={{ color: 'var(--theme-secondary)' }}>{filteredCustomers.length}</span>
            </div>

            <div className="mb-6 relative">
              <input
                type="text"
                placeholder="گەڕان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all"
                style={{ 
                  backgroundColor: 'var(--theme-muted)',
                  borderColor: 'var(--theme-card-border)',
                  color: 'var(--theme-foreground)',
                  fontFamily: 'var(--font-uni-salar)'
                }}
              />
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCustomers.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    selectedCustomer?.id === customer.id ? '' : ''
                  }`}
                  style={{ 
                    backgroundColor: selectedCustomer?.id === customer.id ? 'var(--theme-accent)' : 'var(--theme-muted)',
                    borderColor: 'var(--theme-card-border)'
                  }}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="flex items-center space-x-3">
                    <CustomerImage customer={customer} className="w-10 h-10" />
                    <div className="flex-1">
                      <h3 
                        className="font-medium"
                        style={{ 
                          color: selectedCustomer?.id === customer.id ? '#ffffff' : 'var(--theme-foreground)',
                          fontFamily: 'var(--font-uni-salar)'
                        }}
                      >
                        {customer.name}
                      </h3>
                      <p 
                        className="text-sm"
                        style={{ 
                          color: selectedCustomer?.id === customer.id ? 'rgba(255,255,255,0.8)' : 'var(--theme-secondary)',
                          fontFamily: 'Inter'
                        }}
                      >
                        {customer.phone1}
                      </p>
                    </div>
                    <div className="text-right">
                      <p 
                        className="text-sm font-semibold"
                        style={{ 
                          color: selectedCustomer?.id === customer.id ? '#ffffff' : customer.total_debt > 0 ? '#ef4444' : '#22c55e',
                          fontFamily: 'Inter'
                        }}
                      >
                        {formatCurrency(customer.total_debt)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Profile */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedCustomer ? (
              <motion.div
                key={selectedCustomer.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Header Card */}
                <div 
                  className="rounded-3xl p-8 shadow-lg border"
                  style={{ 
                    backgroundColor: 'var(--theme-card-bg)',
                    borderColor: 'var(--theme-card-border)'
                  }}
                >
                  <div className="flex items-center space-x-8">
                    <CustomerImage customer={selectedCustomer} className="w-24 h-24" />
                    <div className="flex-1">
                      <h2 
                        className="text-3xl font-bold mb-4"
                        style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                      >
                        {selectedCustomer.name}
                      </h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm" style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>تەلەفۆن</p>
                          <p className="font-semibold" style={{ color: 'var(--theme-foreground)', fontFamily: 'Inter' }}>{selectedCustomer.phone1}</p>
                        </div>
                        <div>
                          <p className="text-sm" style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>ناونیشان</p>
                          <p className="font-semibold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>{selectedCustomer.location || 'نەناسراو'}</p>
                        </div>
                      </div>
                    </div>
                    <div 
                      className="text-center p-4 rounded-2xl"
                      style={{ backgroundColor: 'var(--theme-muted)' }}
                    >
                      <p className="text-sm mb-2" style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>قەرز</p>
                      <p 
                        className="text-2xl font-bold"
                        style={{ color: selectedCustomer.total_debt > 0 ? '#ef4444' : '#22c55e', fontFamily: 'Inter' }}
                      >
                        {formatCurrency(selectedCustomer.total_debt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Empty State for Demo */}
                <div 
                  className="rounded-3xl p-12 text-center shadow-lg border"
                  style={{ 
                    backgroundColor: 'var(--theme-card-bg)',
                    borderColor: 'var(--theme-card-border)'
                  }}
                >
                  <div className="text-6xl mb-4">📋</div>
                  <p style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>
                    مێژووی کڕینەکان بەردەست نیە لە دۆمۆدا
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl p-12 text-center shadow-lg border"
                style={{ 
                  backgroundColor: 'var(--theme-card-bg)',
                  borderColor: 'var(--theme-card-border)'
                }}
              >
                <div className="text-6xl mb-4">👤</div>
                <p style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>
                  کڕیارێک هەڵبژێرە
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
