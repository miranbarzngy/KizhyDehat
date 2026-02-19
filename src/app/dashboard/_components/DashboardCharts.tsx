'use client'

import { formatCurrency } from '@/lib/numberUtils'
import { motion } from 'framer-motion'
import { FaChartLine, FaClock, FaExclamationTriangle, FaMoneyBillWave, FaUsers } from 'react-icons/fa'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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
    pendingSales: number
  }
}

export default function DashboardCharts({ chartData, stats }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 3xl:grid-cols-3 gap-6 mb-8">
      {/* Profit Trend Chart */}
      <motion.div
        className="rounded-3xl p-6 shadow-lg border backdrop-blur-md"
        style={{ 
          background: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-card-border)'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="flex items-center space-x-3 mb-6">
          <FaChartLine className="text-2xl" style={{ color: 'var(--theme-accent)' }} />
          <h3 
            className="text-xl font-bold"
            style={{ 
              color: 'var(--theme-foreground)',
              fontFamily: 'var(--font-uni-salar)' 
            }}
          >
            تەوەری قازانج
          </h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="var(--theme-border)" 
              />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('ku', { month: 'short', day: 'numeric' })}
                stroke="var(--theme-secondary)"
                fontSize={12}
                tick={{ fill: 'var(--theme-secondary)' }}
              />
              <YAxis 
                stroke="var(--theme-secondary)" 
                fontSize={12} 
                tick={{ fill: 'var(--theme-secondary)' }} 
              />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString('ku')}
                formatter={(value: number | undefined) => [`${formatCurrency(Math.abs(value || 0))}`, value && value >= 0 ? 'قازانج' : 'زیان']}
                contentStyle={{
                  backgroundColor: 'var(--theme-card-bg)',
                  border: '1px solid var(--theme-card-border)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  color: 'var(--theme-foreground)'
                }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="var(--theme-chart-color)"
                strokeWidth={3}
                dot={{ fill: 'var(--theme-chart-color)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'var(--theme-chart-color)', strokeWidth: 2 }}
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
        <div 
          className="rounded-3xl p-6 shadow-lg border backdrop-blur-md"
          style={{ 
            background: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-card-border)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 backdrop-blur-md rounded-2xl flex items-center justify-center border"
                style={{ 
                  background: 'var(--theme-accent)',
                  borderColor: 'var(--theme-card-border)',
                  color: '#ffffff'
                }}
              >
                <FaMoneyBillWave className="w-5 h-5" />
              </div>
              <div>
                <h4 
                  className="font-semibold"
                  style={{ 
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)' 
                  }}
                >
                  فرۆشتنی ئەمڕۆ
                </h4>
                <p 
                  className="text-sm"
                  style={{ 
                    color: 'var(--theme-secondary)',
                    fontFamily: 'var(--font-uni-salar)' 
                  }}
                >
                  کۆی فرۆشتن
                </p>
              </div>
            </div>
            <div className="text-right">
              <p 
                className="text-2xl font-bold"
                style={{ 
                  color: 'var(--theme-accent)',
                  fontFamily: 'Inter, sans-serif' 
                }}
              >
                {formatCurrency(stats.todaySales)}
              </p>
            </div>
          </div>
        </div>

        {/* Customers */}
        <div 
          className="rounded-3xl p-6 shadow-lg border backdrop-blur-md"
          style={{ 
            background: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-card-border)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 backdrop-blur-md rounded-2xl flex items-center justify-center border"
                style={{ 
                  background: 'var(--theme-primary)',
                  borderColor: 'var(--theme-card-border)',
                  color: '#ffffff'
                }}
              >
                <FaUsers className="w-5 h-5" />
              </div>
              <div>
                <h4 
                  className="font-semibold"
                  style={{ 
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)' 
                  }}
                >
                  کڕیاران
                </h4>
                <p 
                  className="text-sm"
                  style={{ 
                    color: 'var(--theme-secondary)',
                    fontFamily: 'var(--font-uni-salar)' 
                  }}
                >
                  کڕیاری تۆمارکراو
                </p>
              </div>
            </div>
            <div className="text-right">
              <p 
                className="text-2xl font-bold"
                style={{ 
                  color: 'var(--theme-foreground)',
                  fontFamily: 'Inter, sans-serif' 
                }}
              >
                {stats.totalCustomers}
              </p>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div 
          className="rounded-3xl p-6 shadow-lg border backdrop-blur-md"
          style={{ 
            background: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-card-border)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 backdrop-blur-md rounded-2xl flex items-center justify-center border"
                style={{ 
                  background: '#f97316',
                  borderColor: 'var(--theme-card-border)',
                  color: '#ffffff'
                }}
              >
                <FaExclamationTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 
                  className="font-semibold"
                  style={{ 
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)' 
                  }}
                >
                  کەم کۆگا
                </h4>
                <p 
                  className="text-sm"
                  style={{ 
                    color: 'var(--theme-secondary)',
                    fontFamily: 'var(--font-uni-salar)' 
                  }}
                >
                  کاڵای کەم کۆگا
                </p>
              </div>
            </div>
            <div className="text-right">
              <p 
                className="text-2xl font-bold"
                style={{ 
                  color: '#f97316',
                  fontFamily: 'Inter, sans-serif' 
                }}
              >
                {stats.lowStockCount}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Sales */}
        <div 
          className="rounded-3xl p-6 shadow-lg border backdrop-blur-md"
          style={{ 
            background: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-card-border)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 backdrop-blur-md rounded-2xl flex items-center justify-center border"
                style={{ 
                  background: '#eab308',
                  borderColor: 'var(--theme-card-border)',
                  color: '#ffffff'
                }}
              >
                <FaClock className="w-5 h-5" />
              </div>
              <div>
                <h4 
                  className="font-semibold"
                  style={{ 
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)' 
                  }}
                >
                  فرۆشتنی نوێ
                </h4>
                <p 
                  className="text-sm"
                  style={{ 
                    color: 'var(--theme-secondary)',
                    fontFamily: 'var(--font-uni-salar)' 
                  }}
                >
                  چاوەڕوانی پەسەندکردن
                </p>
              </div>
            </div>
            <div className="text-right">
              <p 
                className="text-2xl font-bold"
                style={{ 
                  color: '#eab308',
                  fontFamily: 'Inter, sans-serif' 
                }}
              >
                {stats.pendingSales}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
