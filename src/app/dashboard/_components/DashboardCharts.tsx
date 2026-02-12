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
        className="bg-white dark:bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="flex items-center space-x-3 mb-6">
          <FaChartLine className="text-blue-600 dark:text-blue-400 text-2xl" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            تەوەری قازانج
          </h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('ku', { month: 'short', day: 'numeric' })}
                stroke={document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'}
                fontSize={12}
                tick={{ fill: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' }}
              />
              <YAxis stroke={document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'} fontSize={12} tick={{ fill: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' }} />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString('ku')}
                formatter={(value: number | undefined) => [`${formatCurrency(Math.abs(value || 0))}`, value && value >= 0 ? 'قازانج' : 'زیان']}
                contentStyle={{
                  backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(30, 30, 50, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                  border: document.documentElement.classList.contains('dark') ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  color: document.documentElement.classList.contains('dark') ? '#fff' : '#1f2937'
                }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke={document.documentElement.classList.contains('dark') ? '#60a5fa' : '#2563eb'}
                strokeWidth={3}
                dot={{ fill: document.documentElement.classList.contains('dark') ? '#60a5fa' : '#2563eb', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: document.documentElement.classList.contains('dark') ? '#60a5fa' : '#2563eb', strokeWidth: 2 }}
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
        <div className="bg-white dark:bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-blue-200 dark:border-blue-500/30">
                <FaMoneyBillWave className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  فرۆشتنی ئەمڕۆ
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کۆی فرۆشتن
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-950 dark:text-blue-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                {formatCurrency(stats.todaySales)}
              </p>
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white dark:bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-purple-200 dark:border-purple-500/30">
                <FaUsers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کڕیاران
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کڕیاری تۆمارکراو
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-950 dark:text-purple-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                {stats.totalCustomers}
              </p>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white dark:bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-orange-200 dark:border-orange-500/30">
                <FaExclamationTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کەم کۆگا
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  کاڵای کەم کۆگا
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-950 dark:text-orange-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                {stats.lowStockCount}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
