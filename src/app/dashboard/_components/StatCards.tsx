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
          className="group bg-white dark:bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-lg hover:shadow-xl border border-gray-100 dark:border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer"
          onClick={() => router.push('/dashboard/sales')}
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/30 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md border border-blue-200 dark:border-blue-500/30">
              <FaShoppingCart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              فرۆشتن نوێ
            </h3>
            <p className="text-gray-700 dark:text-gray-400 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              تۆمارکردنی فرۆشتنی نوێ
            </p>
          </div>
        </motion.div>

        <motion.div
          className="group bg-white dark:bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-lg hover:shadow-xl border border-gray-100 dark:border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer"
          onClick={() => router.push('/dashboard/inventory')}
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-500/30 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md border border-green-200 dark:border-green-500/30">
              <FaBox className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              کاڵاکان
            </h3>
            <p className="text-gray-700 dark:text-gray-400 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              بەڕێوەبردنی کۆگا
            </p>
          </div>
        </motion.div>

        <motion.div
          className="group bg-white dark:bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-lg hover:shadow-xl border border-gray-100 dark:border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer"
          onClick={() => router.push('/dashboard/customers')}
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/30 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md border border-purple-200 dark:border-purple-500/30">
              <FaUsers className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              کڕیاران
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              بەڕێوەبردنی کڕیاران
            </p>
          </div>
        </motion.div>

        <motion.div
          className="group bg-white dark:bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-lg hover:shadow-xl border border-gray-100 dark:border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer"
          onClick={() => router.push('/dashboard/expenses')}
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/30 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md border border-red-200 dark:border-red-500/30">
              <FaDollarSign className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              خەرجییەکان
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              تۆمارکردنی خەرجییەکان
            </p>
          </div>
        </motion.div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          className="bg-white dark:bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-white/20"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-blue-200 dark:border-blue-500/30">
              <FaShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex items-center space-x-1">
              <FaArrowUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">+12%</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            کۆی فرۆشتن
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-blue-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            {formatCurrency(stats.totalSales)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            لەم مانگەدا
          </p>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-white/20"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-500/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-red-200 dark:border-red-500/30">
              <FaMoneyBillWave className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex items-center space-x-1">
              <FaArrowUp className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">+8%</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            خەرجییەکان
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-red-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            {formatCurrency(stats.totalExpenses)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            لەم مانگەدا
          </p>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-white/20"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stats.netProfit >= 0 ? 'bg-green-100 dark:bg-green-500/30 border-green-200 dark:border-green-500/30' : 'bg-red-100 dark:bg-red-500/30 border-red-200 dark:border-red-500/30'}`}>
              <FaChartLine className={`w-6 h-6 ${stats.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
            <div className="flex items-center space-x-1">
              <FaArrowUp className={`w-4 h-4 ${stats.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              <span className={`text-sm font-medium ${stats.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.netProfit >= 0 ? '+15%' : '-10%'}
              </span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            قازانج
          </h3>
          <p className={`text-3xl font-bold mb-1 ${stats.netProfit >= 0 ? 'text-gray-900 dark:text-green-400' : 'text-gray-900 dark:text-red-400'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
            {formatCurrency(Math.abs(stats.netProfit))}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            {stats.netProfit >= 0 ? 'قازانجی پاک' : 'زیان' }
          </p>
        </motion.div>
      </div>
    </>
  )
}
