'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { FaBox, FaChartLine, FaDollarSign, FaMoneyBillWave, FaShoppingCart, FaUsers, FaArrowUp } from 'react-icons/fa'
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

export default function StatCards({ stats }: StatCardsProps) {
  const router = useRouter()

  return (
    <>
      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          className="group backdrop-blur-xl rounded-3xl p-6 shadow-lg border transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer"
          onClick={() => router.push('/dashboard/sales')}
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ 
            background: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-card-border)'
          }}
        >
          <div className="text-center">
            <div 
              className="w-16 h-16 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md border"
              style={{ 
                background: 'var(--theme-accent)',
                borderColor: 'var(--theme-card-border)',
                color: '#ffffff'
              }}
            >
              <FaShoppingCart className="w-8 h-8" />
            </div>
            <h3 
              className="text-xl font-bold mb-2" 
              style={{ 
                color: 'var(--theme-foreground)',
                fontFamily: 'var(--font-uni-salar)' 
              }}
            >
              فرۆشتن نوێ
            </h3>
            <p 
              className="text-sm"
              style={{ 
                color: 'var(--theme-secondary)',
                fontFamily: 'var(--font-uni-salar)' 
              }}
            >
              تۆمارکردنی فرۆشتنی نوێ
            </p>
          </div>
        </motion.div>

        <motion.div
          className="group backdrop-blur-xl rounded-3xl p-6 shadow-lg border transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer"
          onClick={() => router.push('/dashboard/inventory')}
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ 
            background: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-card-border)'
          }}
        >
          <div className="text-center">
            <div 
              className="w-16 h-16 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md border"
              style={{ 
                background: '#22c55e',
                borderColor: 'var(--theme-card-border)',
                color: '#ffffff'
              }}
            >
              <FaBox className="w-8 h-8" />
            </div>
            <h3 
              className="text-xl font-bold mb-2" 
              style={{ 
                color: 'var(--theme-foreground)',
                fontFamily: 'var(--font-uni-salar)' 
              }}
            >
              کاڵاکان
            </h3>
            <p 
              className="text-sm"
              style={{ 
                color: 'var(--theme-secondary)',
                fontFamily: 'var(--font-uni-salar)' 
              }}
            >
              بەڕێوەبردنی کۆگا
            </p>
          </div>
        </motion.div>

        <motion.div
          className="group backdrop-blur-xl rounded-3xl p-6 shadow-lg border transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer"
          onClick={() => router.push('/dashboard/customers')}
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ 
            background: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-card-border)'
          }}
        >
          <div className="text-center">
            <div 
              className="w-16 h-16 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md border"
              style={{ 
                background: 'var(--theme-primary)',
                borderColor: 'var(--theme-card-border)',
                color: '#ffffff'
              }}
            >
              <FaUsers className="w-8 h-8" />
            </div>
            <h3 
              className="text-xl font-bold mb-2" 
              style={{ 
                color: 'var(--theme-foreground)',
                fontFamily: 'var(--font-uni-salar)' 
              }}
            >
              کڕیاران
            </h3>
            <p 
              className="text-sm"
              style={{ 
                color: 'var(--theme-secondary)',
                fontFamily: 'var(--font-uni-salar)' 
              }}
            >
              بەڕێوەبردنی کڕیاران
            </p>
          </div>
        </motion.div>

        <motion.div
          className="group backdrop-blur-xl rounded-3xl p-6 shadow-lg border transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer"
          onClick={() => router.push('/dashboard/expenses')}
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ 
            background: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-card-border)'
          }}
        >
          <div className="text-center">
            <div 
              className="w-16 h-16 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md border"
              style={{ 
                background: '#ef4444',
                borderColor: 'var(--theme-card-border)',
                color: '#ffffff'
              }}
            >
              <FaDollarSign className="w-8 h-8" />
            </div>
            <h3 
              className="text-xl font-bold mb-2" 
              style={{ 
                color: 'var(--theme-foreground)',
                fontFamily: 'var(--font-uni-salar)' 
              }}
            >
              خەرجییەکان
            </h3>
            <p 
              className="text-sm"
              style={{ 
                color: 'var(--theme-secondary)',
                fontFamily: 'var(--font-uni-salar)' 
              }}
            >
              تۆمارکردنی خەرجییەکان
            </p>
          </div>
        </motion.div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
