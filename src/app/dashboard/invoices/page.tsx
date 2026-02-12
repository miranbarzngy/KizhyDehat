'use client'

import InvoiceTemplate from '@/components/InvoiceTemplate'
import { formatCurrency } from '@/lib/numberUtils'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { FaCog, FaEye, FaFileInvoice, FaQrcode, FaSave, FaUpload } from 'react-icons/fa'
import InvoiceTable from './components/InvoiceTable'

interface InvoiceSettings {
  id?: number
  shop_name: string
  shop_phone: string
  shop_address: string
  thank_you_note: string
  shop_logo: string
  qr_code_url: string
}

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'invoices' | 'pending'>('pending')
  const [formData, setFormData] = useState<InvoiceSettings>({
    shop_name: 'فرۆشگای کوردستان',
    shop_phone: '',
    shop_address: '',
    thank_you_note: 'سوپاس بۆ کڕینەکەتان!',
    shop_logo: '',
    qr_code_url: ''
  })
  const [pendingSales, setPendingSales] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [previewLogo, setPreviewLogo] = useState<string>('')
  const [previewQr, setPreviewQr] = useState<string>('')
  const logoInputRef = useRef<HTMLInputElement>(null)
  const qrInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchPendingSales(); fetchInvoices(); fetchInvoiceSettings() }, [])

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

  const fetchInvoiceSettings = async () => {
    if (!supabase) return
    try {
      const { data } = await supabase.from('invoice_settings').select('*').maybeSingle()
      if (data) {
        setFormData({
          shop_name: data.shop_name || '',
          shop_phone: data.shop_phone || '',
          shop_address: data.shop_address || '',
          thank_you_note: data.thank_you_note || 'سوپاس بۆ کڕینەکەتان!',
          shop_logo: data.shop_logo || '',
          qr_code_url: data.qr_code_url || ''
        })
        setPreviewLogo(data.shop_logo || '')
        setPreviewQr(data.qr_code_url || '')
      }
    } catch (error) { console.error('Error fetching settings:', error) }
  }

  const saveSettings = async () => {
    if (!supabase) return
    setIsSaving(true)
    try {
      const { data: existing } = await supabase.from('invoice_settings').select('id').maybeSingle()
      const settingsData = {
        shop_name: formData.shop_name,
        shop_phone: formData.shop_phone,
        shop_address: formData.shop_address,
        thank_you_note: formData.thank_you_note,
        shop_logo: formData.shop_logo,
        qr_code_url: formData.qr_code_url,
        updated_at: new Date().toISOString()
      }
      if (existing?.id) {
        await supabase.from('invoice_settings').update(settingsData).eq('id', existing.id)
      } else {
        await supabase.from('invoice_settings').insert(settingsData)
      }
      alert('✅ ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوتکران!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('❌ هەڵە لە پاشەکەوتکردن')
    } finally { setIsSaving(false) }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !supabase) return
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `logo_${Date.now()}.${fileExt}`
      const filePath = `invoice-logos/${fileName}`
      const { error: uploadError } = await supabase.storage.from('shop-assets').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('shop-assets').getPublicUrl(filePath)
      setFormData({ ...formData, shop_logo: publicUrl })
      setPreviewLogo(publicUrl)
    } catch (error) { console.error('Error uploading logo:', error) }
  }

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !supabase) return
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `qr_${Date.now()}.${fileExt}`
      const filePath = `invoice-qrcodes/${fileName}`
      const { error: uploadError } = await supabase.storage.from('shop-assets').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('shop-assets').getPublicUrl(filePath)
      setFormData({ ...formData, qr_code_url: publicUrl })
      setPreviewQr(publicUrl)
    } catch (error) { console.error('Error uploading QR:', error) }
  }

  const filteredInvoices = invoices.filter(inv => !searchTerm || inv.customer_id?.toLowerCase().includes(searchTerm.toLowerCase()))

  const previewInvoiceData = {
    invoiceNumber: 12345,
    customerName: 'کڕیاری نموونە',
    date: new Date().toLocaleDateString('ku'),
    time: new Date().toLocaleTimeString('ku'),
    paymentMethod: 'cash',
    items: [
      { name: 'کاڵای یەکەم', unit: 'دانە', quantity: 2, price: 5000, total: 10000 },
      { name: 'کاڵای دووەم', unit: 'کیلۆ', quantity: 1.5, price: 8000, total: 12000 }
    ],
    subtotal: 22000,
    discount: 2000,
    total: 20000,
    shopName: formData.shop_name || 'ناوی فرۆشگا',
    shopPhone: formData.shop_phone,
    shopAddress: formData.shop_address,
    shopLogo: previewLogo,
    qrCodeUrl: previewQr,
    thankYouNote: formData.thank_you_note
  }

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="w-full max-w-[2800px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>پسوڵە و ڕێکخستنەکان</h1>
            <div className="flex items-center space-x-2" style={{ color: 'var(--theme-secondary)' }}>
              <FaFileInvoice style={{ color: 'var(--theme-accent)' }} />
              <span style={{ fontFamily: 'var(--font-uni-salar)' }}>{filteredInvoices.length} فاکتور</span>
            </div>
          </div>

          <div className="flex flex-row overflow-x-auto whitespace-nowrap space-x-2 mb-8 backdrop-blur-xl border shadow-sm rounded-2xl p-2 transition-all duration-300" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)' }}>
            {['pending', 'invoices', 'settings'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300" style={{ fontFamily: 'var(--font-uni-salar)', background: activeTab === tab ? 'var(--theme-accent)' : 'transparent', color: activeTab === tab ? '#ffffff' : 'var(--theme-secondary)' }}>
                {tab === 'pending' ? '⏳ فرۆشتنە چاوەڕوانکراوەکان' : tab === 'invoices' ? '📋 پسوڵەکان' : '⚙️ ڕێکخستنەکان'}
              </button>
            ))}
          </div>

          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="backdrop-blur-xl border shadow-sm rounded-3xl p-6 md:p-8" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)' }}>
                  <div className="flex items-center mb-8">
                    <FaCog className="text-2xl ml-3" style={{ color: 'var(--theme-accent)' }} />
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>ڕێکخستنەکانی پسوڵە</h2>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>ناوی فرۆشگا</label>
                      <input type="text" value={formData.shop_name} onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })} className="w-full px-4 py-3 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all" style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>ژمارەی تەلەفۆن</label>
                      <input type="text" value={formData.shop_phone} onChange={(e) => setFormData({ ...formData, shop_phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all" style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>ناونیشان</label>
                      <input type="text" value={formData.shop_address} onChange={(e) => setFormData({ ...formData, shop_address: e.target.value })} className="w-full px-4 py-3 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all" style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>پەیامی سوپاس</label>
                      <textarea value={formData.thank_you_note} onChange={(e) => setFormData({ ...formData, thank_you_note: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all resize-none" style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>لۆگۆی فرۆشگا</label>
                      <div className="flex items-center gap-4">
                        <button onClick={() => logoInputRef.current?.click()} className="flex items-center gap-2 px-4 py-3 rounded-xl border transition-all hover:opacity-80" style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>
                          <FaUpload /><span>ئەپلۆدکردن</span>
                        </button>
                        <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        {previewLogo && <div className="relative w-16 h-16 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--theme-card-border)' }}><img src={previewLogo} alt="Logo" className="w-full h-full object-cover" /></div>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>وێنەی QR کۆد</label>
                      <div className="flex items-center gap-4">
                        <button onClick={() => qrInputRef.current?.click()} className="flex items-center gap-2 px-4 py-3 rounded-xl border transition-all hover:opacity-80" style={{ backgroundColor: 'var(--theme-muted)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>
                          <FaQrcode /><span>ئەپلۆدکردن</span>
                        </button>
                        <input ref={qrInputRef} type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                        {previewQr && <div className="relative w-16 h-16 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--theme-card-border)' }}><img src={previewQr} alt="QR" className="w-full h-full object-cover" /></div>}
                      </div>
                    </div>
                    <motion.button onClick={saveSettings} disabled={isSaving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 mt-4" style={{ background: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>
                      <FaSave /><span>{isSaving ? 'پاشەکەوتکردن...' : 'پاشەکەوتکردن'}</span>
                    </motion.button>
                  </div>
                </div>

                <div className="xl:sticky xl:top-6 xl:self-start">
                  <div className="flex items-center mb-4">
                    <FaEye className="ml-2" style={{ color: 'var(--theme-accent)' }} />
                    <h3 className="text-xl font-bold" style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}>پیشاندانی ڕاستەقینەی پسوڵە</h3>
                  </div>
                  <div className="bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <InvoiceTemplate data={previewInvoiceData} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'invoices' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <input type="text" placeholder="گەڕان..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full mb-6 px-4 py-3 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }} />
              <InvoiceTable filteredInvoices={filteredInvoices} onView={() => {}} onReprint={() => {}} onRefund={() => {}} />
            </motion.div>
          )}

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
