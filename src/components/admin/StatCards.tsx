'use client'

import { motion } from 'framer-motion'
import { FaShieldAlt, FaUsers } from 'react-icons/fa'

interface User {
  id: string
}

interface Role {
  id: string
}

interface StatCardsProps {
  users: User[]
  roles: Role[]
}

export default function StatCards({ users, roles }: StatCardsProps) {
  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <div className="text-center sm:text-right">
        <p 
          className="text-xs sm:text-sm text-gray-500" 
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          بەکارهێنەران
        </p>
        <motion.p 
          className="text-xl sm:text-2xl font-bold text-blue-600"
          key={users.length}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {users.length}
        </motion.p>
      </div>
      <div className="text-center sm:text-right">
        <p 
          className="text-xs sm:text-sm text-gray-500" 
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          ڕۆڵەکان
        </p>
        <motion.p 
          className="text-xl sm:text-2xl font-bold text-purple-600"
          key={roles.length}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {roles.length}
        </motion.p>
      </div>
    </div>
  )
}
