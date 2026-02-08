'use client'

import { useAuth } from '@/contexts/AuthContext'
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

  useEffect(() => {
    const fetchShopLogo = async () => {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        {/* Glassmorphism Login Card */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/30">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-6">
            {shopLogo ? (
              <img
                src={shopLogo}
                alt="Shop Logo"
                className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white/50 dark:border-gray-600/50 bg-white"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            )}
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 font-uni-salar">
              بەخێربێیتەوە
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 font-uni-salar">
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
                className="block w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-left font-sans"
                placeholder="example@email.com"
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 font-uni-salar">
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
                className="block w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-left font-sans"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 text-sm text-center font-uni-salar">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 font-uni-salar"
            >
              {loading ? 'چاوەڕوان بە...' : 'چوونە ژوورەوە'}
            </button>
          </form>
        </div>

        {/* Footer Text */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 font-uni-salar">
            سیستەمی فرۆشتن<br />گەشپێدراوە لەلایەن کلیک گروپ <br/><span className="font-uni-salar" suppressHydrationWarning>٠٧٧٠١٤٦٦٧٨٧</span></p>
      </div>
    </div>
  )
}
