'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Store } from 'lucide-react'

interface HeaderProps {
  shopSettings: {
    id: string
    shopname: string
    icon: string
    phone: string
    location: string
    qrcodeimage: string
  } | null
  onProfileClick: () => void
}

const menuItems = [
  { name: 'داشبۆرد', href: '/dashboard', icon: '📊', permission: 'dashboard' },
  { name: 'فرۆشتن', href: '/dashboard/sales', icon: '💰', permission: 'sales' },
  { name: 'کۆگا', href: '/dashboard/inventory', icon: '📦', permission: 'inventory' },
  { name: 'کڕیاران', href: '/dashboard/customers', icon: '👥', permission: 'customers' },
  { name: 'دابینکەران', href: '/dashboard/suppliers', icon: '🏭', permission: 'suppliers' },
  { name: 'پسوڵەکان', href: '/dashboard/invoices', icon: '🧾', permission: 'sales' },
  { name: 'خەرجییەکان', href: '/dashboard/expenses', icon: '💸', permission: 'expenses' },
  { name: 'قازانج', href: '/dashboard/profits', icon: '📈', permission: 'profits' },
  { name: 'یارمەتی', href: '/dashboard/help', icon: '❓', permission: 'help' },
  { name: 'بەڕێوەبەران', href: '/dashboard/admin', icon: '⚙️', permission: 'admin' },
]

export default function Header({ shopSettings, onProfileClick }: HeaderProps) {
  const { user, profile } = useAuth()
  const pathname = usePathname()

  // Get permissions from profile role, with fallback for admin access
  const permissions = profile?.role?.permissions || {
    dashboard: true,
    sales: true,
    inventory: true,
    customers: true,
    suppliers: true,
    invoices: true,
    expenses: true,
    profits: true,
    help: true,
    admin: true
  }

  const filteredMenuItems = menuItems.filter(item => {
    if (item.permission === 'dashboard') return true
    if (item.permission) return permissions[item.permission as keyof typeof permissions]
    return true
  })

  return (
    <div 
      className="w-full sticky top-0 z-50"
      dir="rtl"
      style={{ 
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        willChange: 'backdrop-filter'
      }}
    >
      <div className="relative flex items-center px-2 py-3">
        {/* Branding - Far Right */}
        <div className="hidden lg:flex flex-col items-center flex-shrink-0">
          <button
            onClick={onProfileClick}
            className="flex items-center justify-center w-20 h-20 rounded-full shadow-lg overflow-hidden transition-transform hover:scale-105"
            style={{
              background: 'white',
              border: '3px solid rgba(99, 102, 241, 0.2)'
            }}
          >
            {shopSettings?.icon && shopSettings.icon.trim() !== '' ? (
              <img
                src={shopSettings.icon}
                alt="Shop Logo"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <Store 
                className="w-10 h-10" 
                style={{ color: 'var(--theme-primary)' }} 
              />
            )}
          </button>
          <h2 
            className="text-base md:text-lg font-bold leading-tight mt-2"
            style={{ 
              color: 'var(--theme-sidebar-text)',
              fontFamily: 'var(--font-uni-salar)'
            }}
          >
            {shopSettings?.shopname || 'فرۆشگای کوردستان'}
          </h2>
          <p 
            className="text-xs opacity-70 leading-tight"
            style={{ 
              color: 'var(--theme-sidebar-text)',
              fontFamily: 'var(--font-uni-salar)'
            }}
          >
            {profile?.name || user?.email?.split('@')[0] || 'بەڕێوەبەر'}
          </p>
        </div>

        {/* Mobile/Tablet View */}
        <div className="lg:hidden flex flex-col items-center flex-shrink-0">
          <button
            onClick={onProfileClick}
            className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg overflow-hidden transition-transform hover:scale-105"
            style={{
              background: 'white',
              border: '2px solid rgba(99, 102, 241, 0.2)'
            }}
          >
            {shopSettings?.icon && shopSettings.icon.trim() !== '' ? (
              <img
                src={shopSettings.icon}
                alt="Shop Logo"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <Store 
                className="w-5 h-5" 
                style={{ color: 'var(--theme-primary)' }} 
              />
            )}
          </button>
          <h2 
            className="text-xs md:text-sm font-bold leading-tight mt-1"
            style={{ 
              color: 'var(--theme-sidebar-text)',
              fontFamily: 'var(--font-uni-salar)'
            }}
          >
            {shopSettings?.shopname || 'فرۆشگای کوردستان'}
          </h2>
        </div>

        {/* Desktop Navigation */}
        <div 
          className="hidden lg:flex items-center justify-center gap-3 absolute left-1/2 -translate-x-1/2" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105 flex-shrink-0"
                style={{
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
                }}
              >
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-full mb-1 transition-all duration-200"
                  style={{
                    background: isActive ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? '#ffffff' : 'var(--theme-sidebar-text)',
                    boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                </div>
                <span
                  className="text-xs font-medium transition-colors duration-200"
                  style={{
                    color: isActive ? '#6366f1' : 'var(--theme-sidebar-text)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Tablet Navigation */}
        <div 
          className="hidden md:flex lg:hidden flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center px-2 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
                style={{
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
                }}
              >
                <div 
                  className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200"
                  style={{
                    background: isActive ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? '#ffffff' : 'var(--theme-sidebar-text)'
                  }}
                >
                  <span className="text-sm">{item.icon}</span>
                </div>
                <span
                  className="text-xs font-medium transition-colors duration-200 mt-0.5"
                  style={{
                    color: isActive ? '#6366f1' : 'var(--theme-sidebar-text)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Mobile Navigation */}
        <div 
          className="md:hidden flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center px-1.5 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
                style={{
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
                }}
              >
                <div 
                  className="flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200"
                  style={{
                    background: isActive ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? '#ffffff' : 'var(--theme-sidebar-text)'
                  }}
                >
                  <span className="text-xs">{item.icon}</span>
                </div>
                <span
                  className="text-[10px] font-medium transition-colors duration-200 mt-0.5"
                  style={{
                    color: isActive ? '#6366f1' : 'var(--theme-sidebar-text)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
