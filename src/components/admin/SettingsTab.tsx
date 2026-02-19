'use client'

import { motion } from 'framer-motion'
import { useState, useRef } from 'react'
import { FaCog, FaImage, FaStore, FaTimes } from 'react-icons/fa'

interface ShopSettings {
  id: string
  shop_name: string
  shop_logo: string
  shop_phone: string
  shop_address: string
  qr_code_url: string
}

interface SettingsTabProps {
  shopSettings: ShopSettings | null
  shopSettingsForm: Partial<ShopSettings>
  onUpdateForm: (field: string, value: string | number) => Promise<void>
  onImageUpload: (file: File, field: string) => Promise<void>
  onQRCodeUpload: (file: File) => Promise<void>
  onSaveAll: () => Promise<void>
}

export default function SettingsTab({ 
  shopSettings, 
  shopSettingsForm, 
  onUpdateForm, 
  onImageUpload, 
  onQRCodeUpload,
  onSaveAll 
}: SettingsTabProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleShopNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateForm('shop_name', e.target.value)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      // Upload
      onImageUpload(file, 'shop_logo')
    }
  }

  const clearImagePreview = () => {
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Current image to show (preview takes priority)
  const displayImage = imagePreview || shopSettingsForm.shop_logo || shopSettings?.shop_logo || ''

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
                onChange={handleShopNameChange}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
                placeholder="ناوی فرۆشگاکەت"
              />
            </div>
          </div>

          {/* Shop Icon / Account Image */}
          <div>
            <label 
              className="block text-sm font-semibold mb-3 text-gray-700"
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              وێنەی ئایکۆن
            </label>
            <div className="relative">
              <FaImage className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
            {/* Image Preview */}
            {displayImage && (
              <div className="mt-3 relative inline-block">
                <img
                  src={displayImage}
                  alt="Shop Icon Preview"
                  className="w-20 h-20 object-cover rounded-xl border-2 border-green-200"
                />
                {imagePreview && (
                  <button
                    onClick={clearImagePreview}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    <FaTimes />
                  </button>
                )}
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
