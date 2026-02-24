'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState, useCallback } from 'react'
import { FaSearch, FaClock, FaUser, FaTag, FaInfoCircle } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

interface ActivityLog {
  id: string
  user_id: string | null
  user_name: string | null
  action: string
  details: string | null
  entity_type: string | null
  entity_id: string | null
  created_at: string
  profiles?: {
    name: string | null
    image: string | null
  } | null
}

interface ActivityTabProps {
  onRefresh?: () => void
}

// Kurdish action labels
const ActionLabels: Record<string, string> = {
  add_product: 'زیادکردنی کاڵا',
  update_product: 'دەستکاریکردنی کاڵا',
  delete_product: 'سڕینەوەی کاڵا',
  create_sale: 'فرۆشتن',
  approve_sale: 'پەسەندکردنی فرۆشتن',
  cancel_sale: 'هەڵوەشاندنەوەی فرۆشتن',
  refund_sale: 'گەڕاندنەوەی پارە',
  add_customer: 'زیادکردنی کڕیار',
  update_customer: 'دەستکاریکردنی کڕیار',
  delete_customer: 'سڕینەوەی کڕیار',
  add_supplier: 'زیادکردنی دابینکار',
  update_supplier: 'دەستکاریکردنی دابینکار',
  delete_supplier: 'سڕینەوەی دابینکار',
  add_user: 'زیادکردنی بەکارهێنەر',
  update_user: 'دەستکاریکردنی بەکارهێنەر',
  delete_user: 'سڕینەوەی بەکارهێنەر',
  change_user_role: 'گۆڕینی ڕۆڵی بەکارهێنەر',
  deactivate_user: 'ناچالاککردنی بەکارهێنەر',
  activate_user: 'چالاککردنی بەکارهێنەر',
  add_role: 'زیادکردنی ڕۆڵ',
  update_role: 'دەستکاریکردنی ڕۆڵ',
  delete_role: 'سڕینەوەی ڕۆڵ',
  add_expense: 'زیادکردنی خەرجی',
  update_expense: 'دەستکاریکردنی خەرجی',
  delete_expense: 'سڕینەوەی خەرجی',
  add_customer_payment: 'زیادکردنی پارەدانی کڕیار',
  delete_customer_payment: 'سڕینەوەی پارەدانی کڕیار',
  add_supplier_payment: 'زیادکردنی پارەدانی دابینکار',
  delete_supplier_payment: 'سڕینەوەی پارەدانی دابینکار',
  add_category: 'زیادکردنی پۆل',
  update_category: 'دەستکاریکردنی پۆل',
  delete_category: 'سڕینەوەی پۆل',
  add_unit: 'زیادکردنی یەکە',
  update_unit: 'دەستکاریکردنی یەکە',
  delete_unit: 'سڕینەوەی یەکە'
}

function getActionColor(action: string): { bg: string; text: string; border: string } {
  const addActions = ['add_product', 'add_customer', 'add_supplier', 'add_user', 'add_role', 'add_expense', 'add_customer_payment', 'add_supplier_payment', 'create_sale', 'approve_sale', 'activate_user', 'add_category', 'add_unit']
  const updateActions = ['update_product', 'update_customer', 'update_supplier', 'update_user', 'update_role', 'update_expense', 'change_user_role', 'update_category', 'update_unit']
  const deleteActions = ['delete_product', 'delete_customer', 'delete_supplier', 'delete_user', 'delete_role', 'delete_expense', 'delete_customer_payment', 'delete_supplier_payment', 'delete_category', 'delete_unit']
  const cancelActions = ['cancel_sale', 'refund_sale', 'deactivate_user']
  
  if (addActions.includes(action)) {
    return { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' }
  }
  if (updateActions.includes(action)) {
    return { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' }
  }
  if (deleteActions.includes(action) || cancelActions.includes(action)) {
    return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' }
  }
  
  return { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' }
}

function formatRelativeTime(dateString: string): { relative: string; exact: string } {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  let relative: string
  if (diffInSeconds < 60) {
    relative = 'ئێستا'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    relative = `${minutes} خولەک پێش ئێستا`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    relative = `${hours} کاتژمێر پێش ئێستا`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    relative = `${days} ڕۆژ پێش ئێستا`
  } else {
    relative = date.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  
  // Exact time in 12-hour format
  const exact = date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  })
  
  return { relative, exact }
}

function getEntityIcon(entityType: string | null): string {
  switch (entityType) {
    case 'product': return '📦'
    case 'sale': return '💰'
    case 'customer': return '👤'
    case 'supplier': return '🚚'
    case 'user': return '👨‍💼'
    case 'role': return '🛡️'
    case 'expense': return '💸'
    case 'customer_payment': return '💵'
    case 'supplier_payment': return '💳'
    case 'category': return '🏷️'
    case 'unit': return '⚖️'
    default: return '📋'
  }
}

export default function ActivityTab({ onRefresh }: ActivityTabProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  const fetchLogs = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    
    try {
      // Step 1: Fetch all activity logs - explicitly select user_name
      const { data: logsData, error: logsError } = await supabase
        .from('activity_logs')
        .select('id, user_id, user_name, action, details, entity_type, entity_id, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

      if (logsError) {
        console.error('Error fetching activity logs:', logsError)
        setLoading(false)
        return
      }

      if (!logsData || logsData.length === 0) {
        setLogs([])
        setLoading(false)
        return
      }

      console.log('[ActivityTab] Fetched logs:', logsData)

      // Step 2: Get unique user IDs
      const userIds = [...new Set(logsData.map(l => l.user_id).filter(Boolean) as string[])]
      
      if (userIds.length > 0) {
        // Step 3: Fetch profiles for those user IDs
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, image')
          .in('id', userIds)
        
        // Step 4: Create map and merge
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || [])
        
        const mergedLogs = logsData.map(log => ({
          ...log,
          profiles: log.user_id ? profilesMap.get(log.user_id) || null : null
        }))
        
        setLogs(mergedLogs)
      } else {
        setLogs(logsData)
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Set up real-time subscription
  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs'
        },
        (payload) => {
          console.log('[ActivityTab] Real-time insert:', payload.new)
          // Add new log with empty profiles since we don't have profile lookup for real-time
          setLogs(prev => [payload.new as ActivityLog, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchLogs()
    setRefreshing(false)
    onRefresh?.()
  }

  // Filter logs based on search and action filter
  const filteredLogs = logs.filter(log => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchesSearch = 
        log.profiles?.name?.toLowerCase().includes(search) ||
        (log.user_name?.toLowerCase().includes(search) || '') ||
        log.action?.toLowerCase().includes(search) ||
        (log.details?.toLowerCase().includes(search) || '') ||
        (log.entity_type?.toLowerCase().includes(search) || '')
      if (!matchesSearch) return false
    }
    
    if (actionFilter !== 'all') {
      if (actionFilter === 'add') {
        const addActions = ['add_product', 'add_customer', 'add_supplier', 'add_user', 'add_role', 'add_expense', 'add_customer_payment', 'add_supplier_payment', 'create_sale', 'approve_sale', 'activate_user', 'add_category', 'add_unit']
        if (!addActions.includes(log.action)) return false
      } else if (actionFilter === 'update') {
        const updateActions = ['update_product', 'update_customer', 'update_supplier', 'update_user', 'update_role', 'update_expense', 'change_user_role', 'update_category', 'update_unit']
        if (!updateActions.includes(log.action)) return false
      } else if (actionFilter === 'delete') {
        const deleteActions = ['delete_product', 'delete_customer', 'delete_supplier', 'delete_user', 'delete_role', 'delete_expense', 'delete_customer_payment', 'delete_supplier_payment', 'cancel_sale', 'refund_sale', 'deactivate_user', 'delete_category', 'delete_unit']
        if (!deleteActions.includes(log.action)) return false
      }
    }
    
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div 
        className="rounded-2xl p-6 border"
        style={{ 
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-card-border)'
        }}
      >
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h3 
              className="text-xl font-bold"
              style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
            >
              چاودێری سیستم
            </h3>
            <p 
              className="text-sm mt-1"
              style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
            >
              {filteredLogs.length} تۆمار
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="گەڕان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-xl border outline-none focus:ring-2"
                style={{ 
                  backgroundColor: 'var(--theme-muted)',
                  borderColor: 'var(--theme-card-border)',
                  color: 'var(--theme-foreground)',
                  fontFamily: 'var(--font-uni-salar)'
                }}
              />
              <FaSearch 
                className="absolute right-3 top-1/2 -translate-y-1/2" 
                style={{ color: 'var(--theme-secondary)' }} 
              />
            </div>
            
            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border outline-none focus:ring-2"
              style={{ 
                backgroundColor: 'var(--theme-muted)',
                borderColor: 'var(--theme-card-border)',
                color: 'var(--theme-foreground)',
                fontFamily: 'var(--font-uni-salar)'
              }}
            >
              <option value="all">هەموو</option>
              <option value="add">زیادکردن</option>
              <option value="update">دەستکاری</option>
              <option value="delete">سڕینەوە</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-3 rounded-xl border transition-all hover:opacity-90 disabled:opacity-50"
              style={{ 
                backgroundColor: 'var(--theme-accent)',
                borderColor: 'var(--theme-accent)',
                color: '#ffffff',
                fontFamily: 'var(--font-uni-salar)'
              }}
            >
              {refreshing ? (
                <span className="animate-spin">⏳</span>
              ) : (
                'نوێکردنەوە'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div 
        className="rounded-2xl border overflow-hidden"
        style={{ 
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-card-border)'
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: 'var(--theme-accent)' }}
            ></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center p-12">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'var(--theme-muted)' }}
            >
              <span className="text-3xl">📋</span>
            </div>
            <p style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>
              هیچ تۆمارێک نەدۆزرایەوە
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr 
                  style={{ 
                    backgroundColor: 'var(--theme-muted)',
                    borderBottom: '2px solid var(--theme-card-border)'
                  }}
                >
                  <th 
                    className="text-right py-4 px-4 font-medium"
                    style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    <div className="flex items-center gap-2">
                      <FaClock className="text-sm" />
                      کات
                    </div>
                  </th>
                  <th 
                    className="text-right py-4 px-4 font-medium"
                    style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    <div className="flex items-center gap-2">
                      <FaUser className="text-sm" />
                      بەکارهێنەر
                    </div>
                  </th>
                  <th 
                    className="text-right py-4 px-4 font-medium"
                    style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    <div className="flex items-center gap-2">
                      <FaTag className="text-sm" />
                      کردار
                    </div>
                  </th>
                  <th 
                    className="text-right py-4 px-4 font-medium"
                    style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
                  >
                    <div className="flex items-center gap-2">
                      <FaInfoCircle className="text-sm" />
                      وردەکاری
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredLogs.map((log, index) => {
                    const colors = getActionColor(log.action)
                    // Use profiles.name first, then fall back to user_name from activity_logs, then show unknown
                    const displayName = log.profiles?.name || log.user_name || 'بەکارهێنەری نەناسراو'
                    
                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b last:border-b-0"
                        style={{ borderColor: 'var(--theme-card-border)' }}
                      >
                        {/* Time */}
                        <td className="py-4 px-4">
                          {(() => {
                            const { relative, exact } = formatRelativeTime(log.created_at)
                            return (
                              <div className="flex flex-col">
                                <span 
                                  className="text-sm font-medium whitespace-nowrap"
                                  style={{ 
                                    color: 'var(--theme-foreground)',
                                    fontFamily: 'var(--font-uni-salar)'
                                  }}
                                >
                                  {exact}
                                </span>
                                <span 
                                  className="text-[11px] opacity-60"
                                  style={{ 
                                    color: 'var(--theme-secondary)',
                                    fontFamily: 'var(--font-uni-salar)'
                                  }}
                                >
                                  {relative}
                                </span>
                              </div>
                            )
                          })()}
                        </td>

                        {/* User */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                              style={{ backgroundColor: 'var(--theme-accent)' }}
                            >
                              {log.profiles?.image ? (
                                <img 
                                  src={log.profiles.image} 
                                  alt={displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-bold">
                                  {displayName.charAt(0)}
                                </span>
                              )}
                            </div>
                            <span 
                              className="font-medium"
                              style={{ 
                                color: 'var(--theme-foreground)',
                                fontFamily: 'var(--font-uni-salar)'
                              }}
                            >
                              {displayName}
                            </span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-4 px-4">
                          <span 
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                            style={{ 
                              backgroundColor: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                              fontFamily: 'var(--font-uni-salar)'
                            }}
                          >
                            <span>{getEntityIcon(log.entity_type)}</span>
                            {ActionLabels[log.action] || log.action}
                          </span>
                        </td>

                        {/* Details */}
                        <td className="py-4 px-4">
                          <span 
                            className="text-sm"
                            style={{ 
                              color: 'var(--theme-foreground)',
                              fontFamily: 'var(--font-uni-salar)'
                            }}
                          >
                            {log.details || '-'}
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
