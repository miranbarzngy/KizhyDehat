'use client'

import { motion } from 'framer-motion'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartData } from './types'
import { formatCurrency } from '@/lib/numberUtils'

interface ProfitsChartsProps {
  chartData: ChartData[]
  isMounted: boolean
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

export default function ProfitsCharts({ chartData, isMounted }: ProfitsChartsProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-xl rounded-xl p-3 shadow-xl border border-white/20">
          <p className="text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            {new Date(label).toLocaleDateString('ku')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="font-medium" style={{ color: entry.color }}>
                {entry.name === 'sales' ? 'فرۆشتن: ' : entry.name === 'expenses' ? 'خەرجی: ' : 'قازانج: '}
              </span>
              <span className="font-bold">{formatCurrency(Math.abs(entry.value))} IQD</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6" delay={0.5}>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>چاوەڕێ بکە...</div>
          </div>
        </GlassCard>
        <GlassCard className="p-6" delay={0.6}>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>چاوەڕێ بکە...</div>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <GlassCard className="p-6" delay={0.5}>
        <h3 className="text-lg font-semibold mb-4 text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
          تەوەری قازانج
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(d) => new Date(d).toLocaleDateString('ku', { month: 'short', day: 'numeric' })} 
                stroke="#6b7280" 
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12}
                tick={{ fill: '#6b7280' }}
                tickFormatter={(v) => formatCurrency(v).replace(' IQD', '')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#8b5cf6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorProfit)"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="p-6" delay={0.6}>
        <h3 className="text-lg font-semibold mb-4 text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
          فرۆشتن بەراورد خەرجییەکان
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(d) => new Date(d).toLocaleDateString('ku', { month: 'short', day: 'numeric' })} 
                stroke="#6b7280" 
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12}
                tick={{ fill: '#6b7280' }}
                tickFormatter={(v) => formatCurrency(v).replace(' IQD', '')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="sales" 
                fill="url(#colorSales)" 
                name="sales" 
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Bar 
                dataKey="expenses" 
                fill="url(#colorExpenses)" 
                name="expenses" 
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  )
}
