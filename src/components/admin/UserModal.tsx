'use client'

import { sanitizePhoneNumber } from '@/lib/numberUtils'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { FaCamera, FaEnvelope, FaLock, FaMapMarkerAlt, FaPhone, FaTimes, FaUser } from 'react-icons/fa'

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

interface Role {
  id: string
  name: string
  permissions: Record<string, boolean>
}

interface UserModalProps {
  showCreateUser: boolean
  editingUser: User | null
  newUserName: string
  newUserImage: string
  newUserPhone: string
  newUserLocation: string
  newUserEmail: string
  newUserPassword: string
  selectedRoleId: string
  newUserIsActive: boolean
  roles: Role[]
  onClose: () => void
  onSetName: (value: string) => void
  onSetImage: (value: string) => void
  onSetPhone: (value: string) => void
  onSetLocation: (value: string) => void
  onSetEmail: (value: string) => void
  onSetPassword: (value: string) => void
  onSetRoleId: (value: string) => void
  onSetIsActive: (value: boolean) => void
  onSubmit: () => void
  onImageUpload: (file: File) => void
}

export default function UserModal({
  showCreateUser,
  editingUser,
  newUserName,
  newUserImage,
  newUserPhone,
  newUserLocation,
  newUserEmail,
  newUserPassword,
  selectedRoleId,
  newUserIsActive,
  roles,
  onClose,
  onSetName,
  onSetImage,
  onSetPhone,
  onSetLocation,
  onSetEmail,
  onSetPassword,
  onSetRoleId,
  onSetIsActive,
  onSubmit,
}: UserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await onSubmit()
    setIsSubmitting(false)
  }

  if (!showCreateUser) return null

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
        className="relative w-[90%] max-w-2xl max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20"
        style={{ fontFamily: 'var(--font-uni-salar)' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl px-8 py-6 border-b border-gray-100 rounded-t-[2.5rem]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {editingUser ? 'نوێکردنەوەی بەکارهێنەر' : 'زیادکردنی بەکارهێنەر'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {editingUser ? 'زانیارەکانی بەکارهێنەرەکە بگۆڕە' : 'بەکارهێنەرێکی نوێ زیاد بکە'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-500 transition-all duration-300"
            >
              <FaTimes className="text-gray-400 hover:text-red-500" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8 space-y-6">
          {/* Avatar Upload - Circular */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-1 shadow-xl shadow-purple-500/20"
              >
                {newUserImage || editingUser?.image ? (
                  <img
                    src={newUserImage || editingUser?.image}
                    alt="User avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                    <FaUser className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </motion.div>
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300">
                <FaCamera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        onSetImage(e.target?.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Active Status Switch */}
          <div className="flex items-center justify-between p-4  from-green-50 to-emerald-50 rounded-2xl border border-green-100">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-7 rounded-full transition-colors duration-300 ${newUserIsActive ? 'bg-green-500' : 'bg-gray-300'} relative cursor-pointer`} onClick={() => onSetIsActive(!newUserIsActive)}>
                <motion.div
                  className="absolute top-1 w-5 h-5 bg-black rounded-full shadow-md"
                  animate={{ right: newUserIsActive ? '22px' : '4px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </div>
              <div>
                <span className="font-bold text-gray-800 block">هەژمارەکە چالاکە</span>
                <span className="text-xs text-gray-500">{newUserIsActive ? 'دەتوانێت بچێتە ناو سیستمەوە' : 'ناتوانێت بچێتە ناو سیستمەوە'}</span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${newUserIsActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {newUserIsActive ? 'چالاک' : ' نا چالاک'}
            </div>
          </div>

          {/* Warning for inactive users */}
          {!newUserIsActive && editingUser && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-amber-50 border border-amber-200 rounded-2xl"
            >
              <p className="text-sm text-amber-700">
                ⚠️ ئاگاداری: ئەم بەکارهێنەرە ناتوانێت بچێتە ناو سیستمەکەوە
              </p>
            </motion.div>
          )}

          {/* 2-Column Grid Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name Field */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 pr-1">ناو</label>
              <div className="relative">
                <FaUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ناوی بەکارهێنەر"
                  value={newUserName}
                  onChange={(e) => onSetName(e.target.value)}
                  className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-gray-50/50 border-0 shadow-inner focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 pr-1">ئیمەیڵ</label>
              <div className="relative flex flex-row-reverse">
                <FaEnvelope className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  dir="ltr"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => onSetEmail(e.target.value)}
                  className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-gray-50/50 border-0 shadow-inner focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-300 text-left"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 pr-1">تەلەفۆن</label>
              <div className="relative flex flex-row-reverse">
                <FaPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  dir="ltr"
                  placeholder="+964 XXX XXX XXXX"
                  value={newUserPhone}
                  onChange={(e) => onSetPhone(sanitizePhoneNumber(e.target.value))}
                  className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-gray-50/50 border-0 shadow-inner focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 text-left"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </div>

            {/* Role Field */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 pr-1">ڕۆڵ</label>
              <div className="relative">
                <FaUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedRoleId}
                  onChange={(e) => onSetRoleId(e.target.value)}
                  className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-gray-50/50 border-0 shadow-inner focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-300 appearance-none cursor-pointer"
                >
                  <option value="">هەڵبژاردنی ڕۆڵ</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location Field - Full Width */}
            <div className="md:col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 pr-1">ناونیشان</label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute right-4 top-4 text-gray-400" />
                <textarea
                  placeholder="ناونیشانی بەکارهێنەر"
                  value={newUserLocation}
                  onChange={(e) => onSetLocation(e.target.value)}
                  rows={2}
                  className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-gray-50/50 border-0 shadow-inner focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 resize-none"
                />
              </div>
            </div>

            {/* Password Field - Full Width */}
            <div className="md:col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 pr-1">
                وشەی نهێنی {editingUser && '(بەتاڵ بهێڵە بۆ نەگۆڕین)'}
              </label>
              <div className="relative flex flex-row-reverse">
                <FaLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  dir="ltr"
                  placeholder={editingUser ? "وشەی نهێنی نوێ (ئارەزوومەندانە)" : "وشەی نهێنی"}
                  value={newUserPassword}
                  onChange={(e) => onSetPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-gray-50/50 border-0 shadow-inner focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-300 text-left"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl px-8 py-6 border-t border-gray-100 rounded-b-[2.5rem]">
          <div className="flex justify-end gap-4">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              پاشگەزبوونەوە
            </motion.button>
            <motion.button
              onClick={handleSubmit}
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold shadow-xl shadow-purple-500/30 hover:shadow-purple-500/40 transition-all duration-500 overflow-hidden disabled:opacity-70"
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    <span>تکایە چاوەڕێ بکە...</span>
                  </>
                ) : (
                  editingUser ? 'نوێکردنەوە' : 'زیادکردن'
                )}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
