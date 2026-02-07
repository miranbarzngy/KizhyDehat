'use client'

import { formatCurrency } from '@/lib/numberUtils'

interface OverviewStats {
  totalSales: number
  totalExpenses: number
  totalProfits: number
  totalReturns: number
}

interface OverviewCardsProps {
  stats: OverviewStats
}

export default function OverviewCards({ stats }: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
        <p className="text-sm text-blue-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>فرۆشتن</p>
        <p className="text-xl font-bold text-blue-800">{formatCurrency(stats.totalSales)}</p>
      </div>
      <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl">
        <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>خەرجی</p>
        <p className="text-xl font-bold text-red-800">{formatCurrency(stats.totalExpenses)}</p>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
        <p className="text-sm text-green-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>قازانج</p>
        <p className="text-xl font-bold text-green-800">{formatCurrency(Math.abs(stats.totalProfits))}</p>
      </div>
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
        <p className="text-sm text-orange-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>گەڕاوە</p>
        <p className="text-xl font-bold text-orange-800">{formatCurrency(Math.abs(stats.totalReturns))}</p>
      </div>
    </div>
  )
}
