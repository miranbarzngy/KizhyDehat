'use client'

import { uploadFile } from '@/lib/storage'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { FaBuilding, FaCloudUploadAlt, FaMapMarkerAlt, FaPhone, FaSpinner, FaTimes, FaUser } from 'react-icons/fa'

// Kurdish to English number converter
const convertKurdishToEnglish = (input: string): string => {
  if (!input || typeof input !== 'string') return ''
  const map: Record<string, string> = {'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'}
  return input.replace(/[٠-٩]/g, m => map[m])
}

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
  isLoading?: boolean
}

export default function SupplierForm({ isOpen, onClose, onSave, isEdit = false, initialData = null, isLoading = false }: SupplierFormProps) {
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
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Combine local isUploading with prop isLoading
  const isSubmitting = isUploading || isLoading

  // Use useEffect to initialize form data when initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
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
  }, [isOpen, initialData])

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const processFile = (file: File) => {
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
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
      <div 
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ 
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-card-border)',
          borderWidth: '1px',
          backdropFilter: 'blur(16px)',
          borderStyle: 'solid'
        }}
      >
        <div 
          className="p-8 max-h-[90vh] overflow-y-auto"
          style={{ 
            backgroundColor: 'var(--theme-card-bg)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <h3 
            className="text-2xl font-bold mb-6 text-center"
            style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
          >
            {isEdit ? 'دەستکاریکردن' : 'زیادکردنی دابینکار'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name Field */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
              >
                ناو *
              </label>
              <div className="relative">
                <div 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                  style={{ color: 'var(--theme-secondary)' }}
                >
                  <FaUser />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ناوی دابینکار"
                  className="w-full px-4 py-3 pr-10 rounded-xl border transition-all focus:ring-2 outline-none"
                  style={{
                    backgroundColor: 'var(--theme-muted)',
                    borderColor: 'var(--theme-card-border)',
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)',
                    '--tw-ring-color': 'var(--theme-accent)' as any
                  }}
                />
              </div>
            </div>

            {/* Company Field */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
              >
                کۆمپانیا
              </label>
              <div className="relative">
                <div 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                  style={{ color: 'var(--theme-secondary)' }}
                >
                  <FaBuilding />
                </div>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="ناوی کۆمپانیا"
                  className="w-full px-4 py-3 pr-10 rounded-xl border transition-all focus:ring-2 outline-none"
                  style={{
                    backgroundColor: 'var(--theme-muted)',
                    borderColor: 'var(--theme-card-border)',
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)',
                    '--tw-ring-color': 'var(--theme-accent)' as any
                  }}
                />
              </div>
            </div>

            {/* Phone Field - WITH KURDISH CONVERSION */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
              >
                مۆبایل *
              </label>
              <div className="relative">
                <div 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                  style={{ color: 'var(--theme-secondary)' }}
                >
                  <FaPhone />
                </div>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: convertKurdishToEnglish(e.target.value) }))}
                  placeholder="ژمارەی مۆبایل"
                  className="w-full px-4 py-3 pr-10 rounded-xl border transition-all focus:ring-2 outline-none"
                  style={{
                    backgroundColor: 'var(--theme-muted)',
                    borderColor: 'var(--theme-card-border)',
                    color: 'var(--theme-foreground)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    '--tw-ring-color': 'var(--theme-accent)' as any
                  }}
                />
              </div>
            </div>

            {/* Address Field */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
              >
                ناونیشان
              </label>
              <div className="relative">
                <div 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                  style={{ color: 'var(--theme-secondary)' }}
                >
                  <FaMapMarkerAlt />
                </div>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="ناونیشان"
                  className="w-full px-4 py-3 pr-10 rounded-xl border transition-all focus:ring-2 outline-none"
                  style={{
                    backgroundColor: 'var(--theme-muted)',
                    borderColor: 'var(--theme-card-border)',
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)',
                    '--tw-ring-color': 'var(--theme-accent)' as any
                  }}
                />
              </div>
            </div>
          </div>

          {/* Image Upload - Drag & Drop */}
          <div className="mt-6">
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
            >
              وێنەی دابینکار
            </label>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleFileSelect} 
              className="hidden" 
            />
            
            {!imagePreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
                style={{
                  borderColor: isDragOver ? 'var(--theme-accent)' : 'var(--theme-card-border)',
                  backgroundColor: isDragOver ? 'rgba(var(--theme-accent-rgb), 0.1)' : 'var(--theme-muted)',
                }}
              >
                <div className="flex flex-col items-center">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'var(--theme-card-bg)' }}
                  >
                    <FaCloudUploadAlt size={32} style={{ color: 'var(--theme-accent)' }} />
                  </div>
                  <p 
                    className="text-lg font-medium mb-2"
                    style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    وێنەکەت لێرە فڕێ بدە یان کلیک بکە بۆ هەڵبژاردن
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    PNG, JPG یان WEBP (Max 5MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative inline-block">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto overflow-hidden border-2"
                  style={{
                    backgroundColor: 'var(--theme-muted)',
                    borderColor: 'var(--theme-card-border)'
                  }}
                >
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >
                  <FaTimes size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl transition-all hover:opacity-80 disabled:opacity-50"
              style={{ 
                backgroundColor: 'transparent', 
                color: 'var(--theme-secondary)',
                fontFamily: 'var(--font-uni-salar)',
                border: '1px solid var(--theme-card-border)'
              }}
            >
              پاشگەزبوونەوە
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:opacity-90 shadow-lg disabled:opacity-50"
              style={{ 
                background: 'var(--theme-accent)', 
                color: '#ffffff',
                fontFamily: 'var(--font-uni-salar)'
              }}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" /> بارکردن...
                </>
              ) : (
                <>
                  {isEdit ? 'نوێکردنەوە' : 'زیادکردن'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
