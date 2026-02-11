'use client'

import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'

interface ProfitFiltersProps {
  dateFrom: string
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onClearDates: () => void
}

export default function ProfitFilters({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearDates
}: ProfitFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-4 md:p-6 mb-8"
    >
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div className="w-full sm:w-auto flex-1">
          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            <Calendar className="inline ml-2 w-4 h-4" />
            لە بەروار
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          />
        </div>
        <div className="w-full sm:w-auto flex-1">
          <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            <Calendar className="inline ml-2 w-4 h-4" />
            بۆ بەروار
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          />
        </div>
        <div className="flex items-end w-full sm:w-auto">
          <motion.button
            onClick={onClearDates}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-gray-500 to-gray-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            پاککردنەوە
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
