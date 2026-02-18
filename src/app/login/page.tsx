'use client'

import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface InvoiceSettings {
  shop_logo?: string
  shop_name?: string
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shopLogo, setShopLogo] = useState<string | null>(null)
  const { signIn } = useAuth()
  const router = useRouter()
  const { theme, themeConfig } = useTheme()
  
  // Get theme-aware colors
  const getBackgroundClass = () => {
    if (theme === 'dark') return 'from-slate-900 via-blue-900 to-slate-900'
    if (theme === 'purple') return 'from-purple-900 via-violet-900 to-purple-900'
    if (theme === 'colorful') return 'from-amber-100 via-orange-100 to-rose-100'
    return 'from-slate-100 via-blue-50 to-indigo-100'
  }
  
  const getCardBgClass = () => {
    if (theme === 'dark') return 'bg-gray-900/80'
    if (theme === 'purple') return 'bg-purple-900/40'
    if (theme === 'colorful') return 'bg-white/60'
    return 'bg-white/70'
  }
  
  const getButtonGradient = () => {
    if (theme === 'dark') return 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
    if (theme === 'purple') return 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
    if (theme === 'colorful') return 'from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600'
    return 'from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
  }
  
  const getInputBgClass = () => {
    if (theme === 'dark') return 'bg-gray-800/50'
    if (theme === 'purple') return 'bg-purple-800/30'
    if (theme === 'colorful') return 'bg-white/50'
    return 'bg-white/50'
  }
  
  const getBorderClass = () => {
    if (theme === 'dark') return 'border-gray-700'
    if (theme === 'purple') return 'border-purple-600/30'
    if (theme === 'colorful') return 'border-amber-200/50'
    return 'border-gray-200'
  }
  
  const getTextClass = () => {
    if (theme === 'dark') return 'text-gray-100'
    if (theme === 'purple') return 'text-purple-100'
    if (theme === 'colorful') return 'text-gray-700'
    return 'text-gray-600'
  }
  
  const getLabelClass = () => {
    if (theme === 'dark') return 'text-gray-300'
    if (theme === 'purple') return 'text-purple-200'
    if (theme === 'colorful') return 'text-gray-600'
    return 'text-gray-700'
  }
  
  const getFocusRingClass = () => {
    if (theme === 'dark') return 'focus:ring-blue-500 focus:border-blue-500'
    if (theme === 'purple') return 'focus:ring-purple-500 focus:border-purple-500'
    if (theme === 'colorful') return 'focus:ring-orange-500 focus:border-orange-500'
    return 'focus:ring-indigo-500 focus:border-indigo-500'
  }
  
  const getLogoGradient = () => {
    if (theme === 'dark') return 'from-blue-500 to-cyan-500'
    if (theme === 'purple') return 'from-purple-500 to-pink-500'
    if (theme === 'colorful') return 'from-orange-500 to-rose-500'
    return 'from-indigo-500 to-purple-600'
  }
  
  const getFooterTextClass = () => {
    if (theme === 'dark') return 'text-gray-500'
    if (theme === 'purple') return 'text-purple-300/70'
    if (theme === 'colorful') return 'text-gray-500'
    return 'text-gray-500'
  }

  useEffect(() => {
    const fetchShopLogo = async () => {
      if (!supabase) return
      try {
        const { data } = await supabase
          .from('invoice_settings')
          .select('shop_logo')
          .single()
        
        if (data?.shop_logo) {
          setShopLogo(data.shop_logo)
        }
      } catch (err) {
        console.error('Error fetching shop logo:', err)
      }
    }

    fetchShopLogo()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('چوونە ژوورەوە سەرکەوتوو نەبوو')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${getBackgroundClass()} px-4`}>
      <div className="w-full max-w-md">
        {/* Glassmorphism Login Card */}
        <div className={`${getCardBgClass()} backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/10 dark:border-gray-700/30`}>
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-6">
            {shopLogo ? (
              <img
                src={shopLogo}
                alt="Shop Logo"
                className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white/50 dark:border-gray-600/50 bg-white"
              />
            ) : (
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getLogoGradient()} shadow-lg flex items-center justify-center`}>
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            )}
            <p className={`mt-4 text-lg ${getTextClass()} font-uni-salar`}>
              بەخێربێیتەوە
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${getLabelClass()} mb-1.5 font-uni-salar`}>
                ئیمەیڵ
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`block w-full px-4 py-3 ${getInputBgClass()} ${getBorderClass()} rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 ${getFocusRingClass()} transition-all duration-200 text-left font-sans ${getTextClass()}`}
                placeholder="example@email.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${getLabelClass()} mb-1.5 font-uni-salar`}>
                وشەی نهێنی
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`block w-full px-4 py-3 ${getInputBgClass()} ${getBorderClass()} rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 ${getFocusRingClass()} transition-all duration-200 text-left font-sans ${getTextClass()}`}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {/* Error Message - Styled nicely for blocked users */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-red-600 dark:text-red-400 text-sm font-uni-salar text-center">
                    {error}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={`w-full py-3 px-4 bg-gradient-to-r ${getButtonGradient()} text-white font-medium rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 font-uni-salar flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  <span>چاوەڕوان بە...</span>
                </>
              ) : (
                'چوونە ژوورەوە'
              )}
            </motion.button>
          </form>
        </div>

        {/* Footer Text */}
        <p className={`mt-6 text-center text-sm ${getFooterTextClass()} font-uni-salar`}>
          سیستەمی فرۆشتن<br />
          گەشپێدراوە لەلایەن کلیک گروپ <br />
          <span className="font-uni-salar" suppressHydrationWarning>٠٧٧٠١٤٦٦٧٨٧</span>
        </p>
      </div>
    </div>
  )
}
