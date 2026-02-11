'use client'

import { motion } from 'framer-motion'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FaChartLine, FaExclamationTriangle, FaMoneyBillWave, FaUsers } from 'react-icons/fa'
import { formatCurrency } from '@/lib/numberUtils'

interface ChartData {
  date: string
  sales: number
  expenses: number
  profit: number
}

interface DashboardChartsProps {
  chartData: ChartData[]
  stats: {
    todaySales: number
    totalCustomers: number
    lowStockCount: number
  }
}

export default function DashboardCharts({ chartData, stats }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Profit Trend Chart */}
      <motion.div
        className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="flex items-center space-x-3 mb-6">
          <FaChartLine className="text-blue-400 text-2xl" />
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            تەوەری قازانج
          </h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('ku', { month: 'short', day: 'numeric' })}
                stroke="#9ca3af"
                fontSize={12}
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString('ku')}
                formatter={(value: number | undefined) => [`${formatCurrency(Math.abs(value || 0))}`, value && value >= 0 ? 'قازانج' : 'زیان']}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  color: '#fff'
                }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#60a5fa"
                strokeWidth={3}
                dot={{ fill: '#60a5fa', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#60a5fa', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Additional Stats */}
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        {/* Today's Sales */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500/30 to-green-600/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-green-500/30">
                <FaMoneyBillWave className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-100" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  فرۆشتنی ئەمڕۆ
                </h4>
                <p className="text-sm text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کۆی فرۆشتن
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                {formatCurrency(stats.todaySales)}
              </p>
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500/30 to-purple-600/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-purple-500/30">
                <FaUsers className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-100" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کڕیاران
                </h4>
                <p className="text-sm text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کڕیاری تۆمارکراو
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                {stats.totalCustomers}
              </p>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500/30 to-orange-600/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-orange-500/30">
                <FaExclamationTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-100" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کەم کۆگا
                </h4>
                <p className="text-sm text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کاڵای کەم کۆگا
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                {stats.lowStockCount}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
