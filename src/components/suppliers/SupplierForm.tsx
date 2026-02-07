'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { uploadFile } from '@/lib/storage'
import { FaImage, FaTimes, FaSpinner } from 'react-icons/fa'

interface SupplierFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    name: string
    company: string
    phone: string
    address: string
    supplier_image?: string
  }, selectedFile?: File | null) => Promise<void>
  isEdit?: boolean
  initialData?: {
    name: string
    company: string
    phone: string
    address: string
    supplier_image?: string
  } | null
}

export default function SupplierForm({ isOpen, onClose, onSave, isEdit = false, initialData = null }: SupplierFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    address: '',
    supplier_image: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (isOpen && formData.name === '' && initialData) {
    setFormData({
      name: initialData.name || '',
      company: initialData.company || '',
      phone: initialData.phone || '',
      address: initialData.address || '',
      supplier_image: initialData.supplier_image || ''
    })
    if (initialData.supplier_image) {
      setImagePreview(initialData.supplier_image)
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
      alert('تکایە وێنەیەکی دروست هەڵبژێرە')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('قەبارەی وێنەکە دەبێت کەمتر بێت لە 5 مێگابایت')
      return
    }

    setSelectedFile(file)
    setImagePreview(URL.createObjectURL(file))
    setFormData(prev => ({ ...prev, supplier_image: '' }))
  }

  const clearImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, supplier_image: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('ناو پێویستە')
      return
    }

    setIsUploading(true)
    try {
      let imageUrl = formData.supplier_image

      if (selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile, 'suppliers')
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        } else {
          setIsUploading(false)
          alert('هەڵە لە بارکردنی وێنە')
          return
        }
      }

      await onSave({ ...formData, supplier_image: imageUrl || undefined }, selectedFile)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', company: '', phone: '', address: '', supplier_image: '' })
    setSelectedFile(null)
    setImagePreview(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
        <div className="p-8 max-h-[90vh] overflow-y-auto">
          <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
            {isEdit ? 'دەستکاریکردن' : 'زیادکردنی دابینکەر'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناو *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆمپانیا</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>مۆبایل *</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناونیشان</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>وێنە</label>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileSelect} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 rounded-lg border flex items-center justify-center gap-2"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                <FaImage /> هەڵبژاردنی وێنە
              </button>

              {imagePreview && (
                <div className="mt-4 relative inline-block">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto overflow-hidden"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              onClick={handleClose}
              className="px-6 py-3 rounded-lg"
              style={{ backgroundColor: '#6b7280', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
            >
              پاشگەزبوونەوە
            </button>
            <button
              onClick={handleSave}
              disabled={isUploading}
              className="px-6 py-3 rounded-lg flex items-center gap-2"
              style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}
            >
              {isUploading ? <><FaSpinner className="animate-spin" /> بارکردن...</> : isEdit ? 'نوێکردنەوە' : 'زیادکردن'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
