'use client'

import { formatCurrency } from '@/lib/numberUtils'

interface ReturnedItem {
  id: string
  invoice_number?: number
  customer_name: string
  date: string
  total_price: number
  status: string
  sold_by?: string
}

interface ReturnsTableProps {
  returns: ReturnedItem[]
}

export default function ReturnsTable({ returns }: ReturnsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-3 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>فاکتور</th>
            <th className="px-3 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>کڕیار</th>
            <th className="px-3 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
            <th className="px-3 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>فرۆشیار</th>
            <th className="px-3 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخ</th>
            <th className="px-3 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>دۆخ</th>
          </tr>
        </thead>
        <tbody>
          {returns.map((item) => (
            <tr key={item.id} className="border-t bg-red-50">
              <td className="px-3 py-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>#{item.invoice_number || item.id.slice(0, 8)}</td>
              <td className="px-3 py-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>{item.customer_name}</td>
              <td className="px-3 py-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>{item.date}</td>
              <td className="px-3 py-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>{item.sold_by || '-'}</td>
              <td className="px-3 py-2 font-bold text-red-600" style={{ fontFamily: 'Inter, sans-serif' }}>{formatCurrency(item.total_price)}</td>
              <td className="px-3 py-2">
                <span className="px-2 py-1 rounded-full text-xs bg-red-200 text-red-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>گەڕاوە</span>
              </td>
            </tr>
          ))}
          {returns.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>هیچ کاڵایەکی گەڕاوە نیە</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
