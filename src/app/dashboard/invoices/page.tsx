'use client'

import InvoiceTable from './components/InvoiceTable'
import InvoiceDetailsModal from './components/InvoiceDetailsModal'
import PendingSalesModal from './components/PendingSalesModal'
import { formatCurrency } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FaCog, FaFileInvoice } from 'react-icons/fa'

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'invoices' | 'pending'>('pending')
  const [formData, setFormData] = useState({ shop_name: 'فرۆشگای کوردستان', shop_phone: '', shop_address: '', thank_you_note: 'سوپاس بۆ کڕینەکەتان!' })
  const [pendingSales, setPendingSales] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { fetchPendingSales(); fetchInvoices() }, [])

  const fetchPendingSales = async () => {
    if (!supabase) return
    try {
      const { data } = await supabase.from('sales').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(10)
      setPendingSales(data || [])
    } catch { setPendingSales([]) }
  }

  const fetchInvoices = async () => {
    if (!supabase) return
    try {
      const { data } = await supabase.from('sales').select('*').order('created_at', { ascending: false })
      setInvoices(data || [])
    } catch { setInvoices([]) }
  }

  const filteredInvoices = invoices.filter(inv => !searchTerm || inv.customer_id?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="w-full max-w-[2800px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>
              پسوڵە و ڕێکخستنەکان
            </h1>
            <div className="flex items-center space-x-2" style={{ color: 'var(--theme-secondary)' }}>
              <FaFileInvoice style={{ color: 'var(--theme-accent)' }} />
              <span style={{ fontFamily: 'var(--font-uni-salar)' }}>{filteredInvoices.length} فاکتور</span>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex flex-row overflow-x-auto whitespace-nowrap space-x-2 mb-8 backdrop-blur-xl border shadow-sm rounded-2xl p-2 transition-all duration-300" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)' }}>
            {['pending', 'invoices', 'settings'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300" style={{ fontFamily: 'var(--font-uni-salar)', background: activeTab === tab ? 'var(--theme-accent)' : 'transparent', color: activeTab === tab ? '#ffffff' : 'var(--theme-secondary)' }}>
                {tab === 'pending' ? '⏳ فرۆشتنە چاوەڕوانکراوەکان' : tab === 'invoices' ? '📋 پسوڵەکان' : '⚙️ ڕێکخستنەکان'}
              </button>
            ))}
          </div>

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="backdrop-blur-xl border shadow-sm rounded-3xl p-6 md:p-8" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)' }}>
                <div className="flex items-center mb-8">
                  <FaCog className="text-2xl ml-3" style={{ color: 'var(--theme-accent)' }} />
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>ڕێکخستنەکان</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {['shop_name:ناوی فرۆشگا', 'shop_phone:ژمارەی تەلەفۆن', 'shop_address:ناونیشان', 'thank_you_note:پەیام'].map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>{label}</label>
                      {key === 'thank_you_note' ? (
                        <textarea value={formData[key as keyof typeof formData]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} rows={3} className="w-full px-4 py-2 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all" style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }} />
                      ) : (
                        <input type="text" value={formData[key as keyof typeof formData]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} className="w-full px-4 py-2 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all" style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)' }} />
                      )}
                    </div>
                  ))}
                </div>
                <motion.button onClick={() => alert('پاشەکەوت کرا!')} className="w-full mt-6 py-3 rounded-xl font-bold shadow-lg transition-all" style={{ background: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>پاشەکەوتکردن</motion.button>
              </div>
            </motion.div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <input type="text" placeholder="گەڕان..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full mb-6 px-4 py-3 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }} />
              <InvoiceTable filteredInvoices={filteredInvoices} onView={() => {}} onReprint={() => {}} onRefund={() => {}} />
            </motion.div>
          )}

          {/* Pending Tab */}
          {activeTab === 'pending' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="backdrop-blur-xl border shadow-sm rounded-3xl overflow-hidden" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)' }}>
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--theme-border)' }}>
                      <th className="px-6 py-4 text-right font-bold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>کڕیار</th>
                      <th className="px-6 py-4 text-right font-bold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>بڕ</th>
                      <th className="px-6 py-4 text-right font-bold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                      <th className="px-6 py-4 text-center font-bold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>کردار</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSales.length > 0 ? pendingSales.map((sale) => (
                      <motion.tr key={sale.id} className="border-b transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderColor: 'var(--theme-border)' }}>
                        <td className="px-6 py-4" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>{sale.customer_id || 'نەناسراو'}</td>
                        <td className="px-6 py-4 font-bold" style={{ color: 'var(--theme-foreground)', fontFamily: 'Inter' }}>{formatCurrency(sale.total)}</td>
                        <td className="px-6 py-4" style={{ color: 'var(--theme-secondary)', fontFamily: 'Inter' }}>{new Date(sale.date).toLocaleDateString('ku')}</td>
                        <td className="px-6 py-4 text-center">
                          <motion.button onClick={() => { if (confirm('پشتڕاستکردن؟')) { supabase?.from('sales').update({ status: 'completed' }).eq('id', sale.id).then(() => fetchPendingSales()) } }} className="px-3 py-1 rounded-lg text-white mr-2" whileHover={{ scale: 1.05 }} style={{ background: 'var(--theme-accent)' }}>✅</motion.button>
                          <motion.button onClick={() => { if (confirm('هەڵوەشاندن؟')) { supabase?.from('sales').update({ status: 'cancelled' }).eq('id', sale.id).then(() => fetchPendingSales()) } }} className="px-3 py-1 rounded-lg text-white" whileHover={{ scale: 1.05 }} style={{ background: '#ef4444' }}>❌</motion.button>
                        </td>
                      </motion.tr>
                    )) : (
                      <tr><td colSpan={4} className="px-6 py-12 text-center" style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>هیچ فرۆشتنێکی چاوەڕوانکراو نیە</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
