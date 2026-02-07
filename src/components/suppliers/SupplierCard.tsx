'use client'

import { FaEdit, FaTrash, FaHistory, FaMoneyBillWave } from 'react-icons/fa'

interface SupplierCardProps {
  supplier: {
    id: string
    name: string
    company?: string
    phone: string
    supplier_image?: string
    balance: number
  }
  onEdit: () => void
  onDelete: () => void
  onHistory: () => void
  onPayment: () => void
}

export default function SupplierCard({ supplier, onEdit, onDelete, onHistory, onPayment }: SupplierCardProps) {
  return (
    <div
      className="relative p-6 rounded-2xl backdrop-blur-md border hover:scale-105 transition-all"
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="text-center mb-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          {supplier.supplier_image ? (
            <img
              src={supplier.supplier_image}
              alt={supplier.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <span className="text-2xl">🏢</span>
          )}
        </div>
        <h3 className="text-lg font-bold mt-2" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-primary)' }}>
          {supplier.name}
        </h3>
        {supplier.company && (
          <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)' }}>{supplier.company}</p>
        )}
        <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)' }}>📞 {supplier.phone}</p>
      </div>

      <div className="text-center mb-4">
        <div className="text-2xl font-bold" style={{ color: supplier.balance > 0 ? '#dc2626' : '#16a34a', fontFamily: 'var(--font-uni-salar)' }}>
          {supplier.balance.toFixed(2)} د.ع
        </div>
        <div className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی قەرز</div>
      </div>

      <div className="flex flex-col space-y-2">
        <div className="flex justify-center space-x-2">
          <button onClick={onEdit} className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg flex items-center gap-1">
            <FaEdit size={14} /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>دەستکاری</span>
          </button>
          <button onClick={onDelete} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg flex items-center gap-1">
            <FaTrash size={14} /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>سڕینەوە</span>
          </button>
        </div>
        <div className="flex justify-center space-x-2">
          <button onClick={onHistory} className="px-3 py-2 bg-purple-100 text-purple-600 rounded-lg flex items-center gap-1">
            <FaHistory size={14} /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>مێژوو</span>
          </button>
          {supplier.balance > 0 && (
            <button onClick={onPayment} className="px-3 py-2 bg-green-100 text-green-600 rounded-lg flex items-center gap-1">
              <FaMoneyBillWave size={14} /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>دانەوە</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
