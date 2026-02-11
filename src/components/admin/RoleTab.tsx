'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaEdit, FaPlus, FaSearch, FaShieldAlt, FaTrash } from 'react-icons/fa'

interface Role {
  id: string
  name: string
  permissions: Record<string, boolean>
}

interface RoleTabProps {
  roles: Role[]
  onCreateRole: () => void
  onEditRole: (role: Role) => void
  onDeleteRole: (roleId: string, roleName: string) => void
}

const roleColors: Record<string, string> = {
  'Admin': 'from-blue-500 to-indigo-500',
  'Manager': 'from-green-500 to-emerald-500',
  'Cashier': 'from-orange-500 to-amber-500',
  'Staff': 'from-purple-500 to-pink-500',
}

export default function RoleTab({ roles, onCreateRole, onEditRole, onDeleteRole }: RoleTabProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRoles = roles.filter(role =>
    role.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    Object.keys(role.permissions).some(perm => perm.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <>
      {/* Header with Search Bar */}
      <div className="mb-6">
        <div className="relative w-full sm:w-80">
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="گەڕان... (ناوی ڕۆڵ)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-3 rounded-2xl border-0 bg-white/60 backdrop-blur-lg shadow-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-right"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          />
        </div>
      </div>

      {/* Roles Grid - Responsive: 1 col mobile, 2 tablet, 3-4 large */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1">
        {/* Add New Card - First Item in Grid */}
        <motion.div
          onClick={onCreateRole}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group cursor-pointer relative bg-purple-50/30 backdrop-blur-xl rounded-3xl p-6 shadow-xl border-2 border-dashed border-purple-400/50 hover:border-purple-500 hover:bg-purple-100/50 transition-all duration-300 flex flex-col items-center justify-center min-h-[320px]"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-xl mb-4 group-hover:scale-110 transition-transform duration-300">
            <FaPlus className="w-10 h-10 text-white" />
          </div>
          <p 
            className="text-lg font-bold text-purple-600 group-hover:text-purple-700"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            زیادکردنی ڕۆڵ
          </p>
        </motion.div>

        {/* Role Cards */}
        <AnimatePresence mode="popLayout">
          {filteredRoles.map((role, index) => (
            <motion.div
              key={role.id}
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
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-pink-500/0 to-rose-500/0 group-hover:from-purple-500/5 group-hover:via-pink-500/5 group-hover:to-rose-500/5 transition-all duration-500 rounded-3xl" />

              <div className="relative z-10">
                {/* Role Header - Circular Icon */}
                <div className="flex flex-col items-center mb-4">
                  <div className="relative">
                    <div className={`w-20 h-20 bg-gradient-to-br ${roleColors[role.name] || 'from-gray-400 to-gray-500'} rounded-full flex items-center justify-center shadow-xl shadow-purple-500/20 border-4 border-white/50`}>
                      <FaShieldAlt className="w-10 h-10 text-white" />
                    </div>
                    {/* Active indicator */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg" />
                  </div>
                  
                  {/* Role Name */}
                  <h3 
                    className="mt-3 font-bold text-lg text-gray-800 text-center"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    {role.name}
                  </h3>
                </div>

                {/* Permissions Grid */}
                <div className="mb-4">
                  <h4 
                    className="font-semibold text-gray-700 mb-3 text-sm text-center"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    مۆڵەتەکان
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(role.permissions).map(([perm, hasAccess]) => (
                      <div 
                        key={perm} 
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg transition-colors ${hasAccess ? 'bg-green-50/50' : 'bg-red-50/50'}`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${hasAccess ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span 
                          className={`text-xs capitalize truncate ${hasAccess ? 'text-green-700' : 'text-red-700'}`}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {perm}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons - Gradient Style */}
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => onEditRole(role)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaEdit className="w-4 h-4" />
                    نوێکردنەوە
                  </motion.button>
                  <motion.button
                    onClick={() => onDeleteRole(role.id, role.name)}
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
      {filteredRoles.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 bg-white/40 backdrop-blur-xl border border-white/20 rounded-3xl"
        >
          <div className="bg-gray-100/50 p-6 rounded-full mb-4">
            <FaShieldAlt className="w-16 h-16 text-gray-300" />
          </div>
          <p 
            className="text-gray-400 text-lg"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            هیچ ڕۆڵێک نەدۆزرایەوە
          </p>
        </motion.div>
      )}
    </>
  )
}
