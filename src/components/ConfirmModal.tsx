'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FaCheck, FaTimes } from 'react-icons/fa'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'success' | 'warning' | 'info'
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'پەسەندکردن',
  cancelText = 'پاشگەزبوونەوە',
  onConfirm,
  onCancel,
  type = 'info'
}: ConfirmModalProps) {
  const getThemeColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'rgba(220, 38, 38, 0.1)',
          border: 'rgba(220, 38, 38, 0.5)',
          icon: '#ef4444'
        }
      case 'success':
        return {
          bg: 'rgba(22, 163, 74, 0.1)',
          border: 'rgba(22, 163, 74, 0.5)',
          icon: '#22c55e'
        }
      case 'warning':
        return {
          bg: 'rgba(234, 179, 8, 0.1)',
          border: 'rgba(234, 179, 8, 0.5)',
          icon: '#eab308'
        }
      default:
        return {
          bg: 'rgba(59, 130, 246, 0.1)',
          border: 'rgba(59, 130, 246, 0.5)',
          icon: '#3b82f6'
        }
    }
  }

  const colors = getThemeColors()

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
            onClick={onCancel}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: 'var(--theme-card-bg)',
              border: '1px solid var(--theme-card-border)'
            }}
          >
            {/* Header */}
            <div 
              className="p-6 border-b text-center"
              style={{ borderColor: 'var(--theme-card-border)' }}
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: colors.bg }}
              >
                <FaCheck className="text-2xl" style={{ color: colors.icon }} />
              </div>
              <h3 
                className="text-xl font-bold"
                style={{ 
                  color: 'var(--theme-foreground)',
                  fontFamily: 'var(--font-uni-salar)' 
                }}
              >
                {title}
              </h3>
            </div>

            {/* Body */}
            <div className="p-6">
              <p 
                className="text-center"
                style={{ 
                  color: 'var(--theme-secondary)',
                  fontFamily: 'var(--font-uni-salar)' 
                }}
              >
                {message}
              </p>
            </div>

            {/* Buttons */}
            <div 
              className="p-6 pt-0 flex gap-3 justify-center"
            >
              <motion.button
                onClick={onCancel}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                style={{ 
                  backgroundColor: 'var(--theme-muted)',
                  color: 'var(--theme-foreground)',
                  fontFamily: 'var(--font-uni-salar)'
                }}
              >
                <FaTimes />
                <span>{cancelText}</span>
              </motion.button>
              
              <motion.button
                onClick={onConfirm}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                style={{ 
                  background: 'var(--theme-accent)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-uni-salar)'
                }}
              >
                <FaCheck />
                <span>{confirmText}</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
