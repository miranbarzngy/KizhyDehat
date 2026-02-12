'use client'

import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { FaList, FaSearch, FaTh } from 'react-icons/fa'

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

  useEffect(() => { fetchSuppliers() }, [])

  const fetchSuppliers = async () => {
    if (!supabase) { setSuppliers([]); setLoading(false); return }
    const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false })
    setSuppliers((data || []).map(s => ({ ...s, company: s.company || '', address: s.address || '' })))
    setLoading(false)
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSuppliers.map(supplier => (
              <SupplierCard key={supplier.id} supplier={supplier}
                onEdit={() => {}}
                onDelete={() => {}}
                onHistory={() => {}}
                onPayment={() => {}}
              />
            ))}
          </div>
        )}

        {viewMode === 'table' && (
          <SupplierTable suppliers={filteredSuppliers} onEdit={() => {}} onDelete={() => {}} />
        )}

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏢</div>
            <h3 
              className="text-xl font-semibold"
              style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
            >
              هیچ دابینکەر نەدۆزرایەوە
            </h3>
          </div>
        )}
      </div>

      <SupplierForm isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={() => {}} isEdit={false} />
    </div>
  )
}
