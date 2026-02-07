'use client'

import { formatCurrency } from '@/lib/numberUtils'

interface SaleItem {
  id: string
  customer_name?: string
  total: number
  payment_method: string
  date: string
  time?: string
}

interface SalesTableProps {
  sales: SaleItem[]
  emptyMessage: string
}

export default function SalesTable({ sales, emptyMessage }: SalesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-3 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>کڕیار</th>
            <th className="px-3 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>نرخ</th>
            <th className="px-3 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەروار</th>
            <th className="px-3 py-2 text-right" style={{ fontFamily: 'var(--font-uni-salar)' }}>کات</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id} className="border-t">
              <td className="px-3 py-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.customer_name}</td>
              <td className="px-3 py-2 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>{formatCurrency(sale.total)}</td>
              <td className="px-3 py-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.date}</td>
              <td className="px-3 py-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>{sale.time}</td>
            </tr>
          ))}
          {sales.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
