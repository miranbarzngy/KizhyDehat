'use client'

import InvoiceTable from './components/InvoiceTable'
import InvoiceDetailsModal from './components/InvoiceDetailsModal'
import PendingSalesModal from './components/PendingSalesModal'
import { formatCurrency } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FaCog, FaFileInvoice, FaImage, FaMapMarkerAlt, FaPhone, FaQrcode, FaSearch, FaStore } from 'react-icons/fa'
import { Invoice, InvoiceSettings, SaleData } from './components/invoiceUtils'

interface PendingSale {
  id: string
  customer_name: string
  customer_phone: string
  total: number
  discount_amount: number
  date: string
  items: Array<{ name: string; quantity: number; unit: string; price: number; total: number }>
}

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'invoices' | 'pending'>('pending')
  const [settings, setSettings] = useState<InvoiceSettings | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([])
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoiceDetails, setInvoiceDetails] = useState<SaleData | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [pendingSale, setPendingSale] = useState<PendingSale | null>(null)
  const [isPendingModal, setIsPendingModal] = useState(false)
  const [formData, setFormData] = useState({ shop_name: '', shop_phone: '', shop_address: '', shop_logo: null as File | null, thank_you_note: '', qr_code_url: '', qr_code_file: null as File | null })

  useEffect(() => { fetchSettings(); fetchInvoices(); fetchPendingSales() }, [])

  const fetchPendingSales = async () => {
    if (!supabase) { setPendingSales([]); return }
    try {
      const { data } = await supabase.from('sales').select('id,total,discount_amount,payment_method,date,customer_id,customers(name,phone1),sale_items(id,item_id,quantity,price,unit)').eq('status', 'pending').order('created_at', { ascending: false })
      if (!data) { setPendingSales([]); return }
      const allItemIds = data.flatMap((s: any) => (s.sale_items || []).map((i: any) => i.item_id)).filter(Boolean)
      let productsMap: Record<string, string> = {}
      if (allItemIds.length > 0) {
        const { data: prodData } = await supabase.from('products').select('id,name').in('id', [...new Set(allItemIds)])
        if (prodData) prodData.forEach((p: any) => { productsMap[p.id] = p.name })
      }
      const transformed: PendingSale[] = data.map((sale: any) => ({
        id: sale.id, customer_name: sale.customers?.name || 'نەناسراو', customer_phone: sale.customers?.phone1 || '', total: sale.total, discount_amount: sale.discount_amount || 0, date: sale.date,
        items: (sale.sale_items || []).map((item: any) => ({ name: productsMap[item.item_id] || 'کاڵا', quantity: item.quantity, unit: item.unit || 'دانە', price: item.price, total: item.price * item.quantity }))
      }))
      setPendingSales(transformed)
    } catch { setPendingSales([]) }
  }

  const confirmSale = async (sale: PendingSale) => {
    if (!supabase) return
    if (!confirm(`دڵنیایت لە پشتڕاستکردنەوەی فرۆشتنی ${sale.customer_name}؟`)) return
    try {
      await supabase.from('sales').update({ status: 'completed' }).eq('id', sale.id)
      fetchPendingSales(); fetchInvoices()
      alert('فرۆشتن پشتڕاستکرایەوە!')
    } catch { alert('هەڵە') }
  }

  const cancelSale = async (sale: PendingSale) => {
    if (!supabase) return
    if (!confirm(`دڵنیایت لە هەڵوەشاندنەوەی فرۆشتنی ${sale.customer_name}؟`)) return
    try { await supabase.from('sales').update({ status: 'cancelled' }).eq('id', sale.id); fetchPendingSales(); fetchInvoices(); alert('هەڵوەشێنرایەوە!') } catch { alert('هەڵە') }
  }

  const returnSale = async (sale: PendingSale) => {
    if (!supabase) return
    if (!confirm(`دڵنیایت لە گەڕاندنەوەی فرۆشتنی ${sale.customer_name}؟`)) return
    try { await supabase.from('sales').update({ status: 'refunded' }).eq('id', sale.id); fetchPendingSales(); fetchInvoices(); alert('گەڕێندرایەوە!') } catch { alert('هەڵە') }
  }

  const refundInvoice = async (invoice: Invoice) => {
    if (!supabase) return
    if (!confirm(`دڵنیایت لە گەڕاندنەوەی فاکتور ${invoice.invoice_number}؟`)) return
    try { await supabase.from('sales').update({ status: 'refunded' }).eq('id', invoice.id); fetchInvoices(); alert('فاکتور گەڕێندرایەوە!') } catch { alert('هەڵە') }
  }

  const fetchSettings = async () => {
    if (!supabase) { setFormData({ shop_name: 'فرۆشگای کوردستان', shop_phone: '', shop_address: '', shop_logo: null, thank_you_note: 'سوپاس بۆ کڕینەکەتان!', qr_code_url: '', qr_code_file: null }); return }
    try {
      const { data } = await supabase.from('invoice_settings').select('*').single()
      if (data) { setSettings(data); setFormData({ shop_name: data.shop_name || '', shop_phone: data.shop_phone || '', shop_address: data.shop_address || '', shop_logo: null, thank_you_note: data.thank_you_note || '', qr_code_url: data.qr_code_url || '', qr_code_file: null }) }
    } catch { setFormData({ shop_name: 'فرۆشگای کوردستان', shop_phone: '', shop_address: '', shop_logo: null, thank_you_note: 'سوپاس بۆ کڕینەکەتان!', qr_code_url: '', qr_code_file: null }) }
  }

  const fetchInvoices = async () => {
    if (!supabase) { setInvoices([]); return }
    try {
      const { data } = await supabase.from('sales').select('id,invoice_number,total,status,payment_method,date,customers(name)').order('date', { ascending: false })
      if (data) { setInvoices(data.map((s: any, i: number) => ({ id: s.id, invoice_number: s.invoice_number || (1000 + i), customer_name: s.customers?.name || 'نەناسراو', total: s.total, status: s.status, payment_method: s.payment_method, date: s.date, items_count: 0 }))) }
    } catch { setInvoices([]) }
  }

  const handleImageUpload = async (file: File) => {
    if (!supabase) return null
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`
      const { data } = await supabase.storage.from('product-images').upload(fileName, file)
      if (data) { const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName); return urlData.publicUrl }
    } catch { }
    return null
  }

  const saveSettings = async () => {
    if (!supabase) return
    setSaving(true)
    try {
      let logoUrl = settings?.shop_logo || ''
      let qrUrl = settings?.qr_code_url || ''
      if (formData.shop_logo) logoUrl = await handleImageUpload(formData.shop_logo) || logoUrl
      if (formData.qr_code_file) qrUrl = await handleImageUpload(formData.qr_code_file) || qrUrl
      const data = { shop_name: formData.shop_name, shop_phone: formData.shop_phone, shop_address: formData.shop_address, shop_logo: logoUrl, thank_you_note: formData.thank_you_note, qr_code_url: qrUrl, updated_at: new Date().toISOString() }
      if (settings) await supabase.from('invoice_settings').update(data).eq('id', settings.id)
      else await supabase.from('invoice_settings').insert(data)
      await fetchSettings()
      alert('پاشەکەوت کرا!')
    } catch { alert('هەڵە') }
    setSaving(false)
  }

  const viewInvoiceDetails = async (invoice: Invoice) => {
    if (!supabase) return
    try {
      const { data: saleData } = await supabase.from('sales').select('*, customers(name,phone1)').eq('id', invoice.id).single()
      const { data: saleItemsData } = await supabase.from('sale_items').select('*, inventory(item_name)').eq('sale_id', invoice.id)
      const saleItemsWithNames = (saleItemsData || []).map((item: any) => ({ ...item, products: { name: item.inventory?.item_name || 'کاڵا', unit: item.unit } }))
      setSelectedInvoice(invoice); setInvoiceDetails({ ...saleData, sale_items: saleItemsWithNames } as SaleData); setShowInvoiceModal(true); setIsPendingModal(false)
    } catch { }
  }

  const viewPendingSaleDetails = async (sale: PendingSale) => {
    const saleItemsWithNames = sale.items.map((item, i) => ({ id: i + 1, quantity: item.quantity, price: item.price, unit: item.unit, total: item.price * item.quantity, products: { name: item.name, unit: item.unit } }))
    const mockInvoice: Invoice & { payment_method?: string } = { id: sale.id, invoice_number: 0, customer_name: sale.customer_name, total: sale.total, status: 'completed', date: sale.date, items_count: sale.items.length, payment_method: 'cash' }
    setPendingSale(sale); setSelectedInvoice(mockInvoice); setInvoiceDetails({ sale_items: saleItemsWithNames, customers: { name: sale.customer_name } } as SaleData); setShowInvoiceModal(true); setIsPendingModal(true)
  }

  const reprintInvoice = (invoice: Invoice) => alert(`چاپکردنی فاکتور ${invoice.invoice_number}`)
  const downloadInvoice = () => alert('داگرتن')

  const filteredInvoices = invoices.filter(inv => !searchTerm || inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || inv.invoice_number.toString().includes(searchTerm) || inv.status.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1c2e] via-[#2d1b4e] to-[#0f0c29] p-6 pl-0 md:pl-6">
      <div className="w-full max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>پسوڵە و ڕێکخستنەکان</h1>
            <div className="flex items-center space-x-2 text-gray-300"><FaFileInvoice className="text-blue-400" /><span style={{ fontFamily: 'var(--font-uni-salar)' }}>{filteredInvoices.length} فاکتور</span></div>
          </div>

          {/* Floating Glass Tab Bar */}
          <div className="flex flex-row overflow-x-auto whitespace-nowrap space-x-2 mb-8 bg-[#2a2d3e]/60 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-2">
            <button onClick={() => setActiveTab('pending')} className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${activeTab === 'pending' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-300 hover:bg-white/10'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
              ⏳ فرۆشتنە چاوەڕوانکراوەکان
            </button>
            <button onClick={() => setActiveTab('invoices')} className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${activeTab === 'invoices' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-300 hover:bg-white/10'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
              <FaFileInvoice className="inline ml-2" />پسوڵەی فرۆشتنەکان
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${activeTab === 'settings' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-300 hover:bg-white/10'}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
              <FaCog className="inline ml-2" />ڕێکخستنەکان
            </button>
          </div>

          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Main Glass Container - Dark Style */}
              <div className="bg-[#2a2d3e]/50 backdrop-blur-xl border border-white/10 shadow-xl rounded-3xl p-6 md:p-8">
                <div className="flex items-center mb-8">
                  <FaCog className="text-blue-400 text-2xl ml-3" />
                  <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>ڕێکخستنەکان</h2>
                </div>

                {/* Grid Layout: 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Shop Info Card */}
                  <div className="bg-[#1a1c2e]/50 backdrop-blur-md border border-white/10 shadow-lg rounded-3xl p-6">
                    <div className="flex items-center mb-4">
                      <FaStore className="text-blue-400 text-xl ml-2" />
                      <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>زانیاری فرۆشگا</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناوی فرۆشگا</label>
                        <div className="relative">
                          <FaStore className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input type="text" value={formData.shop_name} onChange={(e) => setFormData(prev => ({ ...prev, shop_name: e.target.value }))}
                            className="w-full pr-10 pl-4 py-2.5 bg-[#1a1c2e]/50 border border-white/10 rounded-xl focus:bg-[#1a1c2e]/70 focus:border-blue-400 outline-none transition-all text-white placeholder-gray-500"
                            style={{ fontFamily: 'var(--font-uni-salar)' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>ژمارەی تەلەفۆن</label>
                        <div className="relative">
                          <FaPhone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input type="text" value={formData.shop_phone} onChange={(e) => setFormData(prev => ({ ...prev, shop_phone: e.target.value }))}
                            className="w-full pr-10 pl-4 py-2.5 bg-[#1a1c2e]/50 border border-white/10 rounded-xl focus:bg-[#1a1c2e]/70 focus:border-blue-400 outline-none transition-all text-white placeholder-gray-500"
                            style={{ fontFamily: 'Inter' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناونیشان</label>
                        <div className="relative">
                          <FaMapMarkerAlt className="absolute right-3 top-3 text-gray-500" />
                          <textarea value={formData.shop_address} onChange={(e) => setFormData(prev => ({ ...prev, shop_address: e.target.value }))}
                            className="w-full pr-10 pl-4 py-2.5 bg-[#1a1c2e]/50 border border-white/10 rounded-xl focus:bg-[#1a1c2e]/70 focus:border-blue-400 outline-none transition-all resize-none text-white placeholder-gray-500"
                            rows={2}
                            style={{ fontFamily: 'var(--font-uni-salar)' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Branding Card */}
                  <div className="bg-[#1a1c2e]/50 backdrop-blur-md border border-white/10 shadow-lg rounded-3xl p-6">
                    <div className="flex items-center mb-4">
                      <FaImage className="text-purple-400 text-xl ml-2" />
                      <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>براندینگ</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>لۆگۆ</label>
                        <div className="border-2 border-dashed border-white/20 rounded-xl p-4 bg-[#1a1c2e]/30 hover:bg-[#1a1c2e]/50 transition-colors text-center cursor-pointer">
                          <FaImage className="text-gray-500 mx-auto mb-2" />
                          <input type="file" accept="image/*" onChange={(e) => setFormData(prev => ({ ...prev, shop_logo: e.target.files?.[0] || null }))} className="hidden" id="logo-upload" />
                          <label htmlFor="logo-upload" className="cursor-pointer text-sm text-blue-400 hover:text-blue-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>کلیک</label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>QR کۆد</label>
                        <div className="border-2 border-dashed border-white/20 rounded-xl p-4 bg-[#1a1c2e]/30 hover:bg-[#1a1c2e]/50 transition-colors text-center cursor-pointer">
                          <FaQrcode className="text-gray-500 mx-auto mb-2" />
                          <input type="file" accept="image/*" onChange={(e) => setFormData(prev => ({ ...prev, qr_code_file: e.target.files?.[0] || null }))} className="hidden" id="qr-upload" />
                          <label htmlFor="qr-upload" className="cursor-pointer text-sm text-blue-400 hover:text-blue-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>کلیک</label>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2 text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>پەیام</label>
                      <textarea value={formData.thank_you_note} onChange={(e) => setFormData(prev => ({ ...prev, thank_you_note: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-[#1a1c2e]/50 border border-white/10 rounded-xl focus:bg-[#1a1c2e]/70 focus:border-blue-400 outline-none transition-all resize-none text-white placeholder-gray-500"
                        rows={2}
                        style={{ fontFamily: 'var(--font-uni-salar)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <motion.button onClick={saveSettings} disabled={saving} className="w-full mt-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50" style={{ fontFamily: 'var(--font-uni-salar)' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  {saving ? '...' : 'پاشەکەوتکردن'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === 'invoices' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="relative mb-6">
                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="گەڕان..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 bg-[#2a2d3e]/60 backdrop-blur-xl border border-white/10 shadow-xl rounded-xl focus:bg-[#2a2d3e]/80 focus:border-blue-400 outline-none transition-all text-white placeholder-gray-400"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                />
              </div>
              <InvoiceTable filteredInvoices={filteredInvoices} onView={viewInvoiceDetails} onReprint={reprintInvoice} onRefund={refundInvoice} />
            </motion.div>
          )}

          {activeTab === 'pending' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-[#2a2d3e]/50 backdrop-blur-xl border border-white/10 shadow-xl rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-[#2a2d3e]/60">
                        <th className="px-4 py-3 text-right font-semibold text-gray-200" style={{ fontFamily: 'var(--font-uni-salar)' }}>کڕیار</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-200" style={{ fontFamily: 'var(--font-uni-salar)' }}>تەلەفۆن</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-200" style={{ fontFamily: 'var(--font-uni-salar)' }}>کاڵا</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-200" style={{ fontFamily: 'var(--font-uni-salar)' }}>بڕ</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-200" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-200" style={{ fontFamily: 'var(--font-uni-salar)' }}>دۆخ</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-200" style={{ fontFamily: 'var(--font-uni-salar)' }}>کردار</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingSales.map((sale) => (
                        <motion.tr key={sale.id} className="border-b border-white/5 hover:bg-white/5 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <td className="px-4 py-3 text-gray-200" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.customer_name}</td>
                          <td className="px-4 py-3 text-gray-400" style={{ fontFamily: 'Inter' }}>{sale.customer_phone || '—'}</td>
                          <td className="px-4 py-3 text-gray-200" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.items.map(i => i.name).join(', ')}</td>
                          <td className="px-4 py-3 font-bold text-gray-200" style={{ fontFamily: 'Inter' }}>{formatCurrency(sale.total)}</td>
                          <td className="px-4 py-3 text-gray-400" style={{ fontFamily: 'Inter' }}>{new Date(sale.date).toLocaleDateString('ku')}</td>
                          <td className="px-4 py-2"><span className="px-3 py-1 rounded-full text-xs bg-orange-500/20 text-orange-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>⏳ چاوەڕوان</span></td>
                          <td className="px-4 py-3">
                            <div className="flex flex-row-reverse gap-2 items-start justify-center">
                              <div className="flex flex-col items-center gap-1">
                                <motion.button onClick={() => viewPendingSaleDetails(sale)} className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </motion.button>
                                <span className="text-[10px] text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>بینین</span>
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                <motion.button onClick={() => confirmSale(sale)} className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </motion.button>
                                <span className="text-[10px] text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>پشتڕاست</span>
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                <motion.button onClick={() => returnSale(sale)} className="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                </motion.button>
                                <span className="text-[10px] text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>گەڕاندنەوە</span>
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                <motion.button onClick={() => cancelSale(sale)} className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </motion.button>
                                <span className="text-[10px] text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>هەڵوەشاندنەوە</span>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                      {pendingSales.length === 0 && (
                        <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>هیچ فرۆشتنێکی چاوەڕوانکراو نیە</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <InvoiceDetailsModal showInvoiceModal={showInvoiceModal && !isPendingModal} setShowInvoiceModal={(show) => { setShowInvoiceModal(show); if (!show) { setSelectedInvoice(null); setInvoiceDetails(null) } }} selectedInvoice={selectedInvoice} invoiceDetails={invoiceDetails} onDownload={downloadInvoice} />
      
      <PendingSalesModal showInvoiceModal={showInvoiceModal && isPendingModal} setShowInvoiceModal={(show) => { setShowInvoiceModal(show); if (!show) { setSelectedInvoice(null); setInvoiceDetails(null); setPendingSale(null) } }} selectedInvoice={selectedInvoice} invoiceDetails={invoiceDetails} pendingSale={pendingSale} />
    </div>
  )
}
