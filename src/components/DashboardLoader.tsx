'use client'

import { motion } from 'framer-motion'

interface DashboardLoaderProps {
  message?: string
}

export default function DashboardLoader({ message = 'چاوەڕوانبە...' }: DashboardLoaderProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl"
      >
        <div className="text-6xl mb-4">⏳</div>
        <p 
          className="text-xl text-gray-600"
          style={{ fontFamily: 'var(--font-uni-salar)' }}
        >
          {message}
        </p>
      </motion.div>
    </div>
  )
}
