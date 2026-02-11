'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaEdit, FaMapMarkerAlt, FaPhone, FaPlus, FaSearch, FaTrash, FaUser } from 'react-icons/fa'

interface User {
  id: string
  name?: string
  image?: string
  phone?: string
  location?: string
  email?: string
  role_id: string
  is_active?: boolean
  role?: {
    name: string
    permissions: Record<string, boolean>
  }
}

interface UserTabProps {
  users: User[]
  onCreateUser: () => void
  onEditUser: (user: User) => void
  onDeleteUser: (userId: string, userName: string) => void
}

const roleColors: Record<string, string> = {
  'Admin': 'from-blue-500 to-indigo-500',
  'Manager': 'from-green-500 to-emerald-500',
  'Cashier': 'from-orange-500 to-amber-500',
  'Staff': 'from-purple-500 to-pink-500',
}

export default function UserTab({ users, onCreateUser, onEditUser, onDeleteUser }: UserTabProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {/* Header with Search Bar */}
      <div className="mb-6">
        <div className="relative w-full sm:w-80">
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="گەڕان... (ناو، تەلەفۆن، ئیمەیڵ)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-3 rounded-2xl border-0 bg-white/60 backdrop-blur-lg shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-right"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          />
        </div>
      </div>

      {/* Users Grid - Responsive: 1 col mobile, 2 tablet, 3-4 large */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1">
        {/* Add New Card - First Item in Grid */}
        <motion.div
          onClick={onCreateUser}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group cursor-pointer relative bg-blue-50/30 backdrop-blur-xl rounded-3xl p-6 shadow-xl border-2 border-dashed border-blue-400/50 hover:border-blue-500 hover:bg-blue-100/50 transition-all duration-300 flex flex-col items-center justify-center min-h-[320px]"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-xl mb-4 group-hover:scale-110 transition-transform duration-300">
            <FaPlus className="w-10 h-10 text-white" />
          </div>
          <p 
            className="text-lg font-bold text-blue-600 group-hover:text-blue-700"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            زیادکردنی بەکارهێنەر
          </p>
        </motion.div>

        {/* User Cards */}
        <AnimatePresence mode="popLayout">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{
                delay: index * 0.05,
                duration: 0.3,
                type: 'spring',
                stiffness: 200,
                damping: 20
              }}
              className="group relative bg-white/40 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:shadow-2xl border border-white/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500 rounded-3xl" />

              <div className="relative z-10">
                {/* User Avatar - Larger & Circular */}
                <div className="flex flex-col items-center mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-xl shadow-purple-500/20 border-4 border-white/50">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || 'User'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <FaUser className="w-10 h-10 text-white" />
                      )}
                    </div>
                    {/* Status indicator dot - Green for active, Gray for inactive */}
                    <div 
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-lg ${
                        user.is_active !== false ? 'bg-green-500' : 'bg-gray-400'
                      }`} 
                      title={user.is_active !== false ? 'چالاک' : 'کۆتایی هاتووە'}
                    />
                  </div>
                  
                  {/* User Name */}
                  <h3 
                    className="mt-3 font-bold text-lg text-gray-800 text-center"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    {user.name || 'ناوی نەناسراو'}
                  </h3>
                  
                  {/* Role Badge */}
                  <span 
                    className={`mt-2 px-4 py-1 bg-gradient-to-r ${roleColors[user.role?.name || ''] || 'from-gray-400 to-gray-500'} text-white text-xs font-bold rounded-full shadow-lg`}
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    {user.role?.name || 'ڕۆڵی نەناسراو'}
                  </span>
                </div>

                {/* User Details - Organized with Icons */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-3 p-2 bg-white/40 rounded-xl">
                    <FaPhone className="text-blue-500 w-4 h-4 flex-shrink-0" />
                    <span 
                      className="text-sm text-gray-700 truncate"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {user.phone || 'نەناسراو'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-white/40 rounded-xl">
                    <FaMapMarkerAlt className="text-red-500 w-4 h-4 flex-shrink-0" />
                    <span 
                      className="text-sm text-gray-700 truncate"
                      style={{ fontFamily: 'var(--font-uni-salar)' }}
                    >
                      {user.location || 'نەناسراو'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-white/40 rounded-xl">
                    <FaUser className="text-purple-500 w-4 h-4 flex-shrink-0" />
                    <span 
                      className="text-sm text-gray-700 truncate"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {user.email || 'نەناسراو'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons - Gradient Style */}
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => onEditUser(user)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/30 transition-all duration-300"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaEdit className="w-4 h-4" />
                    نوێکردنەوە
                  </motion.button>
                  <motion.button
                    onClick={() => onDeleteUser(user.id, user.name || 'ئەم بەکارهێنەرە')}
                    className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/30 transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaTrash className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 bg-white/40 backdrop-blur-xl border border-white/20 rounded-3xl"
        >
          <div className="bg-gray-100/50 p-6 rounded-full mb-4">
            <FaUser className="w-16 h-16 text-gray-300" />
          </div>
          <p 
            className="text-gray-400 text-lg"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            هیچ بەکارهێنەرێک نەدۆزرایەوە
          </p>
        </motion.div>
      )}
    </>
  )
}
