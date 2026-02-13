'use client'

import { motion } from 'framer-motion'
import { FaClock, FaCog, FaImage, FaMapMarkerAlt, FaPhone, FaQrcode, FaStore } from 'react-icons/fa'

interface ShopSettings {
  id: string
  shop_name: string
  shop_logo: string
  shop_phone: string
  shop_address: string
  qr_code_url: string
  auto_logout_minutes?: number
}

interface SettingsTabProps {
  shopSettings: ShopSettings | null
  shopSettingsForm: Partial<ShopSettings>
  onUpdateForm: (field: string, value: string | number) => Promise<void>
  onImageUpload: (file: File, field: string) => Promise<void>
  onQRCodeUpload: (file: File) => Promise<void>
  onSaveAll: () => Promise<void>
}

const timeoutOptions = [
  { value: 1, label: '1 خولەک' },
  { value: 5, label: '5 خولەک' },
  { value: 15, label: '15 خولەک' },
  { value: 30, label: '30 خولەک' },
  { value: 60, label: '1 کاتژمێر' },
]

export default function SettingsTab({ 
  shopSettings, 
  shopSettingsForm, 
  onUpdateForm, 
  onImageUpload, 
  onQRCodeUpload,
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
                value={shopSettingsForm.shop_name || ''}
                onChange={(e) => onUpdateForm('shop_name', e.target.value)}
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
                value={shopSettingsForm.shop_phone || ''}
                onChange={(e) => onUpdateForm('shop_phone', e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-left"
                style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                placeholder="+964 XXX XXX XXXX"
              />
            </div>
          </div>

          {/* Auto Logout Timeout */}
          <div>
            <label 
              className="block text-sm font-semibold mb-3 text-gray-700"
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <FaClock className="inline ml-2 text-blue-500" />
              چوونە دەرەوەی خۆکارانە
            </label>
            <div className="relative">
              <FaClock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={shopSettingsForm.auto_logout_minutes || 15}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  console.log("Dropdown changed to:", value)
                  onUpdateForm('auto_logout_minutes', value)
                }}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                {timeoutOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              دوای ئەوەی بەکارهێنەر بۆ ماوەی ئەوەی لێی دەرنەچێت، سیستەمەکە بە شێوەیەکی خۆکار دەچێتە دەرەوە
            </p>
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
                value={shopSettingsForm.shop_address || ''}
                onChange={(e) => onUpdateForm('shop_address', e.target.value)}
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
                    onImageUpload(file, 'shop_logo')
                  }
                }}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
            {shopSettings?.shop_logo && (
              <div className="mt-3">
                <img
                  src={shopSettings.shop_logo}
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
                    onQRCodeUpload(file)
                  }
                }}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
            {(shopSettings?.qr_code_url || shopSettingsForm?.qr_code_url) && (
              <div className="mt-3">
                <img
                  src={shopSettingsForm?.qr_code_url || shopSettings?.qr_code_url || ''}
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
