'use client'

import { FaEdit, FaTrash } from 'react-icons/fa'
import { toEnglishDigits } from '@/lib/numberUtils'
import { useTheme } from '@/contexts/ThemeContext'

interface Supplier {
  id: string
  name: string
  company?: string
  phone: string
  supplier_image?: string
  balance: number
}

interface SupplierTableProps {
  suppliers: Supplier[]
  onEdit: (s: Supplier) => void
  onDelete: (s: Supplier) => void
}

export default function SupplierTable({ suppliers, onEdit, onDelete }: SupplierTableProps) {
  const { themeConfig } = useTheme()
  const getPrimaryText = () => themeConfig.primary
  const getSecondaryText = () => themeConfig.secondary
  const getMutedBg = () => themeConfig.muted
  const getBorderColor = () => themeConfig.border
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto">
        <thead>
          <tr style={{ background: getMutedBg() }}>
            <th className="px-3 py-3 text-right" style={{ color: getPrimaryText(), fontFamily: 'var(--font-uni-salar)' }}>وێنە</th>
            <th className="px-3 py-3 text-right" style={{ color: getPrimaryText(), fontFamily: 'var(--font-uni-salar)' }}>ناو</th>
            <th className="px-3 py-3 text-right" style={{ color: getPrimaryText(), fontFamily: 'var(--font-uni-salar)' }}>کۆمپانیا</th>
            <th className="px-3 py-3 text-right" style={{ color: getPrimaryText(), fontFamily: 'var(--font-uni-salar)' }}>مۆبایل</th>
            <th className="px-3 py-3 text-right" style={{ color: getPrimaryText(), fontFamily: 'var(--font-uni-salar)' }}>قەرز</th>
            <th className="px-3 py-3 text-right" style={{ color: getPrimaryText(), fontFamily: 'var(--font-uni-salar)' }}>کردار</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id} style={{ borderTop: `1px solid ${getBorderColor()}` }}>
              <td className="px-3 py-3">
                <div className="w-10 h-10 rounded-full overflow-hidden" style={{ background: getMutedBg() }}>
                  {supplier.supplier_image ? (
                    <img src={supplier.supplier_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-lg">🏢</span>
                  )}
                </div>
              </td>
              <td className="px-3 py-3 font-semibold" style={{ color: getPrimaryText(), fontFamily: 'var(--font-uni-salar)' }}>
                {supplier.name}
              </td>
              <td className="px-3 py-3" style={{ color: getSecondaryText(), fontFamily: 'var(--font-uni-salar)' }}>
                {supplier.company || '-'}
              </td>
              <td className="px-3 py-3" style={{ color: getSecondaryText(), fontFamily: 'sans-serif' }} dir="ltr">
                {toEnglishDigits(supplier.phone)}
              </td>
              <td className="px-3 py-3 font-semibold" style={{ color: supplier.balance > 0 ? '#dc2626' : '#16a34a', fontFamily: 'var(--font-uni-salar)' }}>
                {supplier.balance.toFixed(2)}
              </td>
              <td className="px-3 py-3">
                <div className="flex space-x-2">
                  <button onClick={() => onEdit(supplier)} className="px-2 py-1 bg-blue-100 text-blue-600 rounded">
                    <FaEdit size={12} />
                  </button>
                  <button onClick={() => onDelete(supplier)} className="px-2 py-1 bg-red-100 text-red-600 rounded">
                    <FaTrash size={12} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
