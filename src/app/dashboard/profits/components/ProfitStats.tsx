'use client'

import { motion } from 'framer-motion'
import { DollarSign, Wallet, TrendingUp, Percent } from 'lucide-react'
import { OverviewStats } from './types'
import { formatCurrency } from '@/lib/numberUtils'

interface ProfitStatsProps {
  stats: OverviewStats
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  colorTheme, 
  delay = 0,
  subtitle 
}: { 
  title: string
  value: string
  icon: any
  colorTheme: 'blue' | 'red' | 'green' | 'purple'
  delay?: number
  subtitle?: string
}) {
  const colorSchemes = {
    blue: { bg: 'from-blue-500/20 to-blue-600/10', icon: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-300/30' },
    red: { bg: 'from-red-500/20 to-red-600/10', icon: 'bg-red-500', text: 'text-red-600', border: 'border-red-300/30' },
    green: { bg: 'from-green-500/20 to-green-600/10', icon: 'bg-green-500', text: 'text-green-600', border: 'border-green-300/30' },
    purple: { bg: 'from-purple-500/20 to-purple-600/10', icon: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-300/30' }
  }

  const scheme = colorSchemes[colorTheme]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative overflow-hidden rounded-3xl shadow-xl border ${scheme.border} bg-gradient-to-br ${scheme.bg}`}
    >
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`absolute top-4 left-4 p-3 rounded-2xl ${scheme.icon} shadow-lg`}
      >
        <Icon className="w-6 h-6 text-white" />
      </motion.div>
      <div className="p-6 pr-20">
        <p className="text-sm font-semibold text-gray-600 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>{title}</p>
        <p className={`text-3xl font-bold ${scheme.text}`} style={{ fontFamily: 'Inter, sans-serif' }}>{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>{subtitle}</p>}
      </div>
      <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${scheme.bg} opacity-50 blur-2xl`} />
    </motion.div>
  )
}

function GlassCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  )
}

export default function ProfitStats({ stats }: ProfitStatsProps) {
  return (
    <>
      <StatCard title="کۆی فرۆشتن" value={formatCurrency(stats.totalSales)} icon={DollarSign} colorTheme="blue" delay={0} subtitle="ماوەی دیاریکراو" />
      <StatCard title="کۆی خەرجییەکان" value={formatCurrency(stats.totalExpenses)} icon={Wallet} colorTheme="red" delay={0.1} subtitle="خەرجی گشتی" />
      <StatCard title="کۆی قازانج" value={formatCurrency(Math.abs(stats.totalProfits))} icon={TrendingUp} colorTheme="green" delay={0.2} subtitle={stats.totalProfits >= 0 ? 'قازانجی پاک' : 'زیان'} />
      <StatCard title="ڕێژەی قازانج" value={`${stats.totalSales > 0 ? ((stats.totalProfits / stats.totalSales) * 100).toFixed(1) : 0}%`} icon={Percent} colorTheme="purple" delay={0.3} subtitle="لە کۆی فرۆشتن" />
    </>
  )
}

export function SalesTypeCards({ stats }: { stats: OverviewStats }) {
  const totalSales = stats.totalSales

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <GlassCard className="p-6" delay={0.2}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>فرۆشتنی کاش</h3>
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="p-2 rounded-lg bg-green-100">
            <DollarSign className="w-5 h-5 text-green-600" />
          </motion.div>
        </div>
        <p className="text-3xl font-bold text-green-600 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>{formatCurrency(stats.cashSales)}</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <motion.div initial={{ width: 0 }} animate={{ width: totalSales > 0 ? `${(stats.cashSales / totalSales) * 100}%` : '0%' }} transition={{ duration: 1, delay: 0.5 }} className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" />
        </div>
        <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>{totalSales > 0 ? ((stats.cashSales / totalSales) * 100).toFixed(1) : 0}% of total sales</p>
      </GlassCard>

      <GlassCard className="p-6" delay={0.3}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>فرۆشتنی ئۆنلاین</h3>
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} className="p-2 rounded-lg bg-blue-100">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </motion.div>
        </div>
        <p className="text-3xl font-bold text-blue-600 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>{formatCurrency(stats.onlineSales)}</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <motion.div initial={{ width: 0 }} animate={{ width: totalSales > 0 ? `${(stats.onlineSales / totalSales) * 100}%` : '0%' }} transition={{ duration: 1, delay: 0.6 }} className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" />
        </div>
        <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>{totalSales > 0 ? ((stats.onlineSales / totalSales) * 100).toFixed(1) : 0}% of total sales</p>
      </GlassCard>

      <GlassCard className="p-6" delay={0.4}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>فرۆشتنی قەرز</h3>
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} className="p-2 rounded-lg bg-orange-100">
            <Percent className="w-5 h-5 text-orange-600" />
          </motion.div>
        </div>
        <p className="text-3xl font-bold text-orange-600 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>{formatCurrency(stats.payLaterSales)}</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <motion.div initial={{ width: 0 }} animate={{ width: totalSales > 0 ? `${(stats.payLaterSales / totalSales) * 100}%` : '0%' }} transition={{ duration: 1, delay: 0.7 }} className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full" />
        </div>
        <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>{totalSales > 0 ? ((stats.payLaterSales / totalSales) * 100).toFixed(1) : 0}% of total sales</p>
      </GlassCard>
    </div>
  )
}
