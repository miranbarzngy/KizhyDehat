'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { FaShieldAlt, FaTimes, FaExclamationCircle } from 'react-icons/fa'

interface Role {
  id: string
  name: string
  permissions: Record<string, boolean>
}

interface RoleModalProps {
  showCreateRole: boolean
  editingRole: Role | null
  newRoleName: string
  permissions: Record<string, boolean>
  onClose: () => void
  onSetName: (value: string) => void
  onTogglePermission: (key: string) => void
  onSubmit: () => void
}

const permissionList = [
  { key: 'dashboard', name: 'داشبۆرد', icon: '📊' },
  { key: 'sales', name: 'فرۆشتن', icon: '💰' },
  { key: 'inventory', name: 'کۆگا', icon: '📦' },
  { key: 'customers', name: 'کڕیاران', icon: '👥' },
  { key: 'suppliers', name: 'دابینکاران', icon: '🏭' },
  { key: 'invoices', name: 'پسوڵەکان', icon: '🧾' },
  { key: 'expenses', name: 'خەرجییەکان', icon: '💸' },
  { key: 'profits', name: 'قازانج', icon: '📈' },
  { key: 'help', name: 'یارمەتی', icon: '❓' },
  { key: 'admin', name: 'بەڕێوەبەران', icon: '⚙️' }
]

export default function RoleModal({
  showCreateRole,
  editingRole,
  newRoleName,
  permissions,
  onClose,
  onSetName,
  onTogglePermission,
  onSubmit,
}: RoleModalProps) {
  const [nameError, setNameError] = useState(false)

  const handleSubmit = () => {
    // Validate role name is required
    if (!newRoleName.trim()) {
      setNameError(true)
      return
    }
    setNameError(false)
    onSubmit()
  }

  const handleNameChange = (value: string) => {
    onSetName(value)
    if (nameError && value.trim()) {
      setNameError(false)
    }
  }

  if (!showCreateRole) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Modal Container - Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative w-[90%] max-w-lg max-h-[90vh] flex flex-col bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20"
        style={{ fontFamily: 'var(--font-uni-salar)' }}
      >
        {/* Header */}
        <div 
          className="flex-shrink-0 bg-white/80 backdrop-blur-xl px-4 md:px-8 py-4 md:py-6 border-b border-gray-100 rounded-t-[2.5rem] z-10"
          style={{ background: 'var(--theme-card-bg)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--theme-foreground)' }}>
                {editingRole ? 'نوێکردنەوەی ڕۆڵ' : 'زیادکردنی ڕۆڵ'}
              </h3>
              <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--theme-secondary)' }}>
                {editingRole ? 'مۆڵەتەکانی ڕۆڵەکە بگۆڕە' : 'ڕۆڵێکی نوێ دروست بکە'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 md:w-10 h-8 md:h-10 flex items-center justify-center rounded-full transition-all duration-300"
              style={{ 
                background: 'var(--theme-muted)',
                color: 'var(--theme-secondary)'
              }}
            >
              <FaTimes className="w-3 md:w-4" />
            </button>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 custom-scrollbar">
          {/* Role Name */}
          <div className="relative">
            <label 
              className="block text-sm font-medium mb-2 pr-1" 
              style={{ color: 'var(--theme-foreground)' }}
            >
              ناوی ڕۆڵ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaShieldAlt 
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: nameError ? '#ef4444' : 'var(--theme-secondary)' }}
              />
              <input
                type="text"
                placeholder="ناوی ڕۆڵ"
                value={newRoleName}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`w-full pl-4 pr-12 py-3.5 rounded-2xl border-0 shadow-inner focus:ring-2 transition-all duration-300 ${nameError ? 'ring-2 ring-red-500' : ''}`}
                style={{ 
                  background: 'var(--theme-muted)',
                  color: 'var(--theme-foreground)',
                  '--tw-ring-color': 'var(--theme-accent)'
                } as React.CSSProperties}
              />
              {nameError && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-6 right-0 flex items-center gap-1 text-xs text-red-500"
                >
                  <FaExclamationCircle className="w-3 h-3" />
                  <span>تکایە ناوی ڕۆڵ بنووسە</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label 
              className="block text-sm font-medium mb-3 pr-1" 
              style={{ color: 'var(--theme-foreground)' }}
            >
              مۆڵەتەکان
            </label>
            <div 
              className="space-y-2 rounded-2xl p-2"
              style={{ background: 'var(--theme-muted)' }}
            >
              {permissionList.map((perm) => (
                <motion.label 
                  key={perm.key} 
                  className="flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-colors"
                  style={{ color: 'var(--theme-foreground)' }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300"
                    style={{ 
                      background: permissions[perm.key] ? 'var(--theme-accent)' : 'rgba(156, 163, 175, 0.3)',
                      border: '2px solid',
                      borderColor: permissions[perm.key] ? 'var(--theme-accent)' : 'var(--theme-border)'
                    }}
                  >
                    {permissions[perm.key] && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions[perm.key]}
                    onChange={() => onTogglePermission(perm.key)}
                    className="sr-only"
                  />
                  <span className="text-xl">{perm.icon}</span>
                  <span className="font-medium">{perm.name}</span>
                </motion.label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div 
          className="flex-shrink-0 bg-white/80 backdrop-blur-xl px-4 md:px-8 py-3 md:py-6 border-t border-gray-100 rounded-b-[2.5rem]"
          style={{ background: 'var(--theme-card-bg)' }}
        >
          <div className="flex justify-end gap-2 md:gap-4">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl border-2 text-sm md:text-base font-medium transition-all duration-300"
              style={{ 
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-secondary)',
                background: 'transparent'
              }}
            >
              پاشگەزبوونەوە
            </motion.button>
            <motion.button
              onClick={handleSubmit}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl text-sm md:text-base font-bold shadow-lg transition-all duration-300"
              style={{ 
                background: 'var(--theme-accent)',
                color: 'white'
              }}
            >
              {editingRole ? 'نوێکردنەوە' : 'زیادکردن'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
