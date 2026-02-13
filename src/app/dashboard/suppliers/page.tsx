'use client'

import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { FaList, FaSearch, FaTh, FaPlus } from 'react-icons/fa'

const SupplierCard = dynamic(() => import('@/components/suppliers/SupplierCard').then(mod => mod.default), { ssr: false })
const SupplierTable = dynamic(() => import('@/components/suppliers/SupplierTable').then(mod => mod.default), { ssr: false })
const SupplierForm = dynamic(() => import('@/components/suppliers/SupplierForm').then(mod => mod.default), { ssr: false })

interface Supplier {
  id: string
  name: string
  company: string
  phone: string
  address: string
  supplier_image?: string
  balance: number
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => { fetchSuppliers() }, [])

  const fetchSuppliers = async () => {
    if (!supabase) { setSuppliers([]); setLoading(false); return }
    const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false })
    setSuppliers((data || []).map(s => ({ ...s, company: s.company || '', address: s.address || '' })))
    setLoading(false)
  }

  const handleSaveSupplier = async (data: {
    name: string
    company: string
    phone: string
    address: string
    supplier_image?: string
  }, selectedFile?: File | null) => {
    if (!supabase) {
      alert('هەڵە لە پەیوەستبوون بە داتابەیس')
      return
    }

    setFormLoading(true)
    try {
      const { error } = await supabase.from('suppliers').insert({
        name: data.name,
        company: data.company || null,
        phone: data.phone || null,
        address: data.address || null,
        supplier_image: data.supplier_image || null,
        balance: 0
      })

      if (error) {
        console.error('Error inserting supplier:', error)
        alert('هەڵە لە تۆمارکردن: ' + error.message)
        return
      }

      // Refresh the list
      await fetchSuppliers()
      setShowAddModal(false)
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert('هەڵە لە تۆمارکردن')
    } finally {
      setFormLoading(false)
    }
  }

  const filteredSuppliers = suppliers.filter(s =>
    !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm)
  )

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--theme-background)' }}><div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--theme-accent)' }}></div></div>
  }

  return (
    <div className="p-6 pl-0 md:pl-6">
      <h1 
        className="text-3xl font-bold mb-8"
        style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
      >
        بەڕێوەبردنی دابینکەران
      </h1>

      <div 
        className="rounded-3xl p-6 shadow-lg border"
        style={{ 
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-card-border)'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 
            className="text-xl font-semibold"
            style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
          >
            لیستی دابینکەران
          </h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? '' : ''}`}
              style={{ 
                backgroundColor: viewMode === 'grid' ? 'var(--theme-accent)' : 'var(--theme-muted)',
                color: viewMode === 'grid' ? '#ffffff' : 'var(--theme-secondary)'
              }}
            >
              <FaTh size={18} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? '' : ''}`}
              style={{ 
                backgroundColor: viewMode === 'table' ? 'var(--theme-accent)' : 'var(--theme-muted)',
                color: viewMode === 'table' ? '#ffffff' : 'var(--theme-secondary)'
              }}
            >
              <FaList size={18} />
            </button>
          </div>
        </div>

        <div className="mb-6 relative">
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--theme-secondary)' }} />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="گەڕان..."
            className="w-full px-4 py-3 pr-12 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all"
            style={{ 
              backgroundColor: 'var(--theme-muted)',
              borderColor: 'var(--theme-card-border)',
              color: 'var(--theme-foreground)',
              fontFamily: 'var(--font-uni-salar)'
            }}
          />
        </div>

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
            {/* Add New Supplier Card - Always show first */}
            <motion.div
              onClick={() => setShowAddModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer min-h-[200px]"
              style={{
                backgroundColor: 'var(--theme-card-bg)',
                borderColor: 'var(--theme-card-border)',
                borderStyle: 'dashed',
                borderWidth: '2px',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--theme-muted)' }}>
                <FaPlus size={32} style={{ color: 'var(--theme-accent)' }} />
              </div>
              <span
                className="text-lg font-semibold"
                style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
              >
                زیادکردنی دابینکەر
              </span>
            </motion.div>
            
            {/* Show suppliers or empty message */}
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map(supplier => (
                <SupplierCard key={supplier.id} supplier={supplier}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onHistory={() => {}}
                  onPayment={() => {}}
                />
              ))
            ) : (
              <div 
                className="col-span-full p-12 rounded-2xl shadow-lg text-center"
                style={{ 
                  backgroundColor: 'var(--theme-card-bg)',
                  borderColor: 'var(--theme-card-border)',
                  borderWidth: '1px'
                }}
              >
                <div className="text-6xl mb-4">🏢</div>
                <p style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '1.2rem', color: 'var(--theme-secondary)' }}>
                  هیچ دابینکەر نەدۆزرایەوە
                </p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'table' && (
          <SupplierTable suppliers={filteredSuppliers} onEdit={() => {}} onDelete={() => {}} />
        )}
      </div>

      <SupplierForm 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSave={handleSaveSupplier} 
        isEdit={false}
        isLoading={formLoading}
      />
    </div>
  )
}
