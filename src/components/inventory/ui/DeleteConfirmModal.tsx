'use client'

import { Product } from '../types'
import { FaTrash } from 'react-icons/fa'

interface DeleteConfirmModalProps {
  show: boolean
  item: Product | null
  status: 'idle' | 'deleting' | 'success' | 'error'
  message: string
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteConfirmModal({ show, item, status, message, onCancel, onConfirm }: DeleteConfirmModalProps) {
  if (!show || !item) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50" 
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
    >
      <div className="w-full max-w-md rounded-2xl shadow-2xl bg-white/95 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTrash className="text-3xl text-orange-500" />
          </div>
          <h3 
            className="text-xl font-bold mb-3" 
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            سڕینەوەی کاڵا
          </h3>
          <p 
            className="text-gray-600 mb-4" 
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            دڵنیایت لە سڕینەوەی <span className="font-bold">{item.name}</span>؟
          </p>
          <div 
            className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6"
          >
            <p 
              className="text-orange-800 text-sm" 
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              ⚠️ ئاگاداربە: ئەم کاڵایە لە هەردوو خشتەی products و purchase_expenses سڕێتەوە بۆ ئەوەی کۆی داهات لە پەڕەی قازانجدا وردبێتەوە.
            </p>
          </div>

          {status === 'idle' && (
            <div className="flex gap-4 justify-center">
              <button 
                onClick={onCancel}
                className="px-6 py-3 bg-gray-400 text-white rounded-xl font-bold"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                پاشگەزبوونەوە
              </button>
              <button 
                onClick={onConfirm}
                className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                سڕینەوە
              </button>
            </div>
          )}

          {status === 'deleting' && (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p style={{ fontFamily: 'var(--font-uni-salar)' }}>پرۆسەکە بەڕێوەیە...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">✅</div>
              <p 
                className="text-green-600 font-bold" 
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                {message}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">❌</div>
              <p 
                className="text-red-600 font-bold" 
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                {message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
