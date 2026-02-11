'use client'

import { motion } from 'framer-motion'
import { FaCog, FaImage, FaMapMarkerAlt, FaPhone, FaQrcode, FaStore } from 'react-icons/fa'

interface ShopSettings {
  id: string
  shopname: string
  icon: string
  phone: string
  location: string
  qrcodeimage: string
}

interface SettingsTabProps {
  shopSettings: ShopSettings | null
  shopSettingsForm: Partial<ShopSettings>
  onUpdateForm: (field: string, value: string) => void
  onImageUpload: (file: File, field: string) => void
  onSaveAll: () => void
}

export default function SettingsTab({ 
  shopSettings, 
  shopSettingsForm, 
  onUpdateForm, 
  onImageUpload, 
  onSaveAll 
}: SettingsTabProps) {
  return (
    <>
      {/* Settings Header */}
      <div className="flex items-center space-x-3 mb-6">
        <FaCog className="text-green-500 text-2xl" />
        <h2 
          className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
          style={{ fontFamily: 'var(--font-uni-salar)' }}
        >
          ڕێکخستنەکانی فرۆشگا
        </h2>
      </div>

      {/* Settings Form */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Shop Name */}
          <div>
            <label 
              className="block text-sm font-semibold mb-3 text-gray-700"
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              ناوی فرۆشگا
            </label>
            <div className="relative">
              <FaStore className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={shopSettingsForm.shopname || ''}
                onChange={(e) => onUpdateForm('shopname', e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
                placeholder="ناوی فرۆشگاکەت"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label 
              className="block text-sm font-semibold mb-3 text-gray-700"
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              ژمارەی تەلەفۆن
            </label>
            <div className="relative">
              <FaPhone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={shopSettingsForm.phone || ''}
                onChange={(e) => onUpdateForm('phone', e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-left"
                style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                placeholder="+964 XXX XXX XXXX"
              />
            </div>
          </div>

          {/* Location */}
          <div className="md:col-span-2">
            <label 
              className="block text-sm font-semibold mb-3 text-gray-700"
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              ناونیشان
            </label>
            <div className="relative">
              <FaMapMarkerAlt className="absolute right-3 top-3 text-gray-400" />
              <textarea
                value={shopSettingsForm.location || ''}
                onChange={(e) => onUpdateForm('location', e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
                placeholder="ناونیشانی فرۆشگاکەت"
                rows={3}
              />
            </div>
          </div>

          {/* Shop Icon */}
          <div>
            <label 
              className="block text-sm font-semibold mb-3 text-gray-700"
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              وێنەی ئایکۆن
            </label>
            <div className="relative">
              <FaImage className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    onImageUpload(file, 'icon')
                  }
                }}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
            {shopSettings?.icon && (
              <div className="mt-3">
                <img
                  src={shopSettings.icon}
                  alt="Shop Icon"
                  className="w-16 h-16 object-cover rounded-xl border-2 border-green-200"
                />
              </div>
            )}
          </div>

          {/* QR Code Image */}
          <div>
            <label 
              className="block text-sm font-semibold mb-3 text-gray-700"
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              وێنەی QR کۆد
            </label>
            <div className="relative">
              <FaQrcode className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    onImageUpload(file, 'qrcodeimage')
                  }
                }}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
            {shopSettings?.qrcodeimage && (
              <div className="mt-3">
                <img
                  src={shopSettings.qrcodeimage}
                  alt="QR Code"
                  className="w-16 h-16 object-cover rounded-xl border-2 border-green-200"
                />
              </div>
            )}
          </div>
        </div>

        {/* Update Button */}
        <motion.button
          onClick={onSaveAll}
          className="w-full mt-8 py-4 px-6 bg-gradient-to-r from-green-600 via-blue-600 to-green-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500"
          style={{ fontFamily: 'var(--font-uni-salar)' }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{
            backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" }
          }}
        >
          <span className="flex items-center justify-center space-x-2">
            <span>نوێکردنی هەموو ڕێکخستنەکان</span>
            <FaCog className="animate-spin" />
          </span>
        </motion.button>
      </div>
    </>
  )
}
