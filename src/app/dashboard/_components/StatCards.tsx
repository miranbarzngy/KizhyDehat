'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { FaChartLine, FaMoneyBillWave, FaShoppingCart, FaArrowUp } from 'react-icons/fa'
import { formatCurrency } from '@/lib/numberUtils'

interface Stats {
  totalSales: number
  pendingOrders: number
  totalExpenses: number
  netProfit: number
  todaySales: number
  totalCustomers: number
  lowStockCount: number
}

interface StatCardsProps {
  stats: Stats
}

function StatCardsComponent({ stats }: StatCardsProps) {

  return (
    <>
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4 mb-8">
        <motion.div
          className="backdrop-blur-xl rounded-3xl p-6 shadow-lg border"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          style={{ 
            background: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-card-border)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 backdrop-blur-md rounded-2xl flex items-center justify-center border"
              style={{ 
                background: 'var(--theme-accent)',
                borderColor: 'var(--theme-card-border)',
                color: '#ffffff'
              }}
            >
              <FaShoppingCart className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-1">
              <FaArrowUp className="w-4 h-4" style={{ color: '#22c55e' }} />
              <span className="text-sm font-medium" style={{ color: '#22c55e' }}>+12%</span>
            </div>
          </div>
          <h3 
            className="text-lg font-semibold mb-2" 
            style={{ 
              color: 'var(--theme-foreground)',
              fontFamily: 'var(--font-uni-salar)' 
            }}
          >
            کۆی فرۆشتن
          </h3>
          <p 
            className="text-3xl font-bold mb-1" 
            style={{ 
              color: 'var(--theme-accent)',
              fontFamily: 'Inter, sans-serif' 
            }}
          >
            {formatCurrency(stats.totalSales)}
          </p>
          <p 
            className="text-sm"
            style={{ 
              color: 'var(--theme-secondary)',
              fontFamily: 'var(--font-uni-salar)' 
            }}
          >
            لەم مانگەدا
          </p>
        </motion.div>

        <motion.div
          className="backdrop-blur-xl rounded-3xl p-6 shadow-lg border"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          style={{ 
            background: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-card-border)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 backdrop-blur-md rounded-2xl flex items-center justify-center border"
              style={{ 
                background: '#ef4444',
                borderColor: 'var(--theme-card-border)',
                color: '#ffffff'
              }}
            >
              <FaMoneyBillWave className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-1">
              <FaArrowUp className="w-4 h-4" style={{ color: '#ef4444' }} />
              <span className="text-sm font-medium" style={{ color: '#ef4444' }}>+8%</span>
            </div>
          </div>
          <h3 
            className="text-lg font-semibold mb-2" 
            style={{ 
              color: 'var(--theme-foreground)',
              fontFamily: 'var(--font-uni-salar)' 
            }}
          >
            خەرجییەکان
          </h3>
          <p 
            className="text-3xl font-bold mb-1" 
            style={{ 
              color: '#ef4444',
              fontFamily: 'Inter, sans-serif' 
            }}
          >
            {formatCurrency(stats.totalExpenses)}
          </p>
          <p 
            className="text-sm"
            style={{ 
              color: 'var(--theme-secondary)',
              fontFamily: 'var(--font-uni-salar)' 
            }}
          >
            لەم مانگەدا
          </p>
        </motion.div>

        <motion.div
          className="backdrop-blur-xl rounded-3xl p-6 shadow-lg border"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          style={{ 
            background: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-card-border)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${stats.netProfit >= 0 ? '' : ''}`}
              style={{ 
                background: stats.netProfit >= 0 ? '#22c55e' : '#ef4444',
                borderColor: 'var(--theme-card-border)',
                color: '#ffffff'
              }}
            >
              <FaChartLine className={`w-6 h-6 ${stats.netProfit >= 0 ? '' : ''}`} />
            </div>
            <div className="flex items-center space-x-1">
              <FaArrowUp className={`w-4 h-4 ${stats.netProfit >= 0 ? '' : 'rotate-180'}`} style={{ color: stats.netProfit >= 0 ? '#22c55e' : '#ef4444' }} />
              <span className={`text-sm font-medium ${stats.netProfit >= 0 ? '' : ''}`} style={{ color: stats.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                {stats.netProfit >= 0 ? '+15%' : '-10%'}
              </span>
            </div>
          </div>
          <h3 
            className="text-lg font-semibold mb-2" 
            style={{ 
              color: 'var(--theme-foreground)',
              fontFamily: 'var(--font-uni-salar)' 
            }}
          >
            قازانج
          </h3>
          <p 
            className={`text-3xl font-bold mb-1 ${stats.netProfit >= 0 ? '' : ''}`}
            style={{ 
              color: stats.netProfit >= 0 ? '#22c55e' : '#ef4444',
              fontFamily: 'Inter, sans-serif' 
            }}
          >
            {formatCurrency(Math.abs(stats.netProfit))}
          </p>
          <p 
            className="text-sm"
            style={{ 
              color: 'var(--theme-secondary)',
              fontFamily: 'var(--font-uni-salar)' 
            }}
          >
            {stats.netProfit >= 0 ? 'قازانجی پاک' : 'زیان' }
          </p>
        </motion.div>
      </div>
    </>
  )
}

export default memo(StatCardsComponent)
