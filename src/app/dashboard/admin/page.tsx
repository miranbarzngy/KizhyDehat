'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { sanitizePhoneNumber, formatCurrency } from '@/lib/numberUtils'
import { motion, AnimatePresence } from 'framer-motion'
import { FaUser, FaUsers, FaCog, FaStore, FaPhone, FaMapMarkerAlt, FaImage, FaQrcode, FaPlus, FaEdit, FaTrash, FaEye, FaShieldAlt, FaArrowUp, FaArrowDown, FaShoppingCart, FaMoneyBillWave, FaChartLine, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface User {
  id: string
  name?: string
  image?: string
  phone?: string
  location?: string
  email?: string
  role_id: string
  role?: {
    name: string
    permissions: Record<string, boolean>
  }
}

interface Role {
  id: string
  name: string
  permissions: Record<string, boolean>
}

interface ShopSettings {
  id: string
  shopname: string
  icon: string
  phone: string
  location: string
  qrcodeimage: string
}

interface ChartData {
  date: string
  sales: number
  expenses: number
  profit: number
}

export default function AdminPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'roles' | 'settings'>('analytics')
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [shopSettingsForm, setShopSettingsForm] = useState<Partial<ShopSettings>>({})
  const [loading, setLoading] = useState(true)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserImage, setNewUserImage] = useState('')
  const [newUserPhone, setNewUserPhone] = useState('')
  const [newUserLocation, setNewUserLocation] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newRoleName, setNewRoleName] = useState('')
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    dashboard: false,
    sales: false,
    inventory: false,
    customers: false,
    suppliers: false,
    expenses: false,
    profits: false,
    help: false,
    admin: false,
  })
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  // Financial Analytics State
  const [financialStats, setFinancialStats] = useState({
    totalSales: 0,
    totalExpenses: 0,
    netProfit: 0,
    todaySales: 0,
    yesterdaySales: 0,
    salesTrend: 0, // percentage change from yesterday
  })
  const [chartData, setChartData] = useState<ChartData[]>([])


  useEffect(() => {
    fetchUsers()
    fetchRoles()
    fetchShopSettings()
    fetchFinancialStats()
    setupRealtimeSubscription()
  }, [])

  // Financial Analytics Functions
  const fetchFinancialStats = async () => {
    if (!supabase) {
      // Demo data
      setFinancialStats({
        totalSales: 125000,
        totalExpenses: 87500,
        netProfit: 37500,
        todaySales: 24500,
        yesterdaySales: 18900,
        salesTrend: 29.6
      })
      return
    }

    try {
      // Get today's date and yesterday's date
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

      // Total Sales: Sum of total from sales table
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total')

      if (salesError) throw salesError

      const totalSales = salesData?.reduce((sum, sale) => sum + sale.total, 0) || 0

      // Total Expenses: Include both cost of goods sold AND other expenses
      // 1. Cost of goods sold from sale_items
      const { data: saleItemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          inventory_id
        `)

      if (itemsError) throw itemsError

      // Get inventory data separately
      const inventoryIds = saleItemsData?.map(item => item.inventory_id).filter(Boolean) || []
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, cost_price')
        .in('id', inventoryIds)

      if (inventoryError) throw inventoryError

      const inventoryMap = new Map(inventoryData?.map(inv => [inv.id, inv.cost_price]) || [])

      const cogsExpenses = saleItemsData?.reduce((sum, item) => {
        const costPrice = inventoryMap.get(item.inventory_id) || 0
        return sum + (costPrice * item.quantity)
      }, 0) || 0

      // 2. Other expenses from expenses table
      const { data: otherExpensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')

      if (expensesError) throw expensesError

      const otherExpenses = otherExpensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0

      // Total expenses = COGS + Other expenses
      const totalExpenses = cogsExpenses + otherExpenses

      // Net Profit: Total Sales - Total Expenses
      const netProfit = totalSales - totalExpenses

      // Today's sales - Use date range to avoid timezone issues
      const startOfToday = new Date(today)
      startOfToday.setHours(0, 0, 0, 0)
      const endOfToday = new Date(today)
      endOfToday.setHours(23, 59, 59, 999)

      console.log('Today date range:', startOfToday.toISOString(), 'to', endOfToday.toISOString())

      // Try a simpler approach - filter by date string
      const { data: todaySalesData, error: todayError } = await supabase
        .from('sales')
        .select('total, date')
        .eq('date', today)

      console.log('Today Sales Raw Data:', todaySalesData)
      console.log('Today Sales Error:', todayError)

      const todaySales = todaySalesData?.reduce((sum, sale) => {
        const saleAmount = Number(sale.total || 0)
        console.log('Processing sale:', sale.date, 'amount:', saleAmount)
        return sum + saleAmount
      }, 0) || 0

      console.log('Today Sales Total:', todaySales)

      // Yesterday's sales - Use date range to avoid timezone issues
      const startOfYesterday = new Date(yesterday)
      startOfYesterday.setHours(0, 0, 0, 0)
      const endOfYesterday = new Date(yesterday)
      endOfYesterday.setHours(23, 59, 59, 999)

      const { data: yesterdaySalesData, error: yesterdayError } = await supabase
        .from('sales')
        .select('total, date')
        .gte('date', startOfYesterday.toISOString())
        .lte('date', endOfYesterday.toISOString())

      const yesterdaySales = yesterdaySalesData?.reduce((sum, sale) => sum + Number(sale.total || 0), 0) || 0

      // Sales trend percentage
      const salesTrend = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0

      setFinancialStats({
        totalSales: Math.round(totalSales),
        totalExpenses: Math.round(totalExpenses),
        netProfit: Math.round(netProfit),
        todaySales: Math.round(todaySales),
        yesterdaySales: Math.round(yesterdaySales),
        salesTrend: Math.round(salesTrend * 10) / 10
      })

      // Fetch chart data for last 7 days
      await fetchChartData()

    } catch (error) {
      console.error('Error fetching financial stats:', error)
      // Fallback to demo data
      setFinancialStats({
        totalSales: 125000,
        totalExpenses: 87500,
        netProfit: 37500,
        todaySales: 24500,
        yesterdaySales: 18900,
        salesTrend: 29.6
      })
    }
  }

  const fetchChartData = async () => {
    if (!supabase) {
      // Demo chart data
      const demoData: ChartData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        demoData.push({
          date: dateStr,
          sales: Math.round(Math.random() * 50000 + 10000),
          expenses: Math.round(Math.random() * 30000 + 5000),
          profit: 0 // Will be calculated
        })
      }
      // Calculate profits
      demoData.forEach(item => {
        item.profit = item.sales - item.expenses
      })
      setChartData(demoData)
      return
    }

    try {
      const chartDataPoints: ChartData[] = []

      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        // Daily sales
        const { data: daySales } = await supabase
          .from('sales')
          .select('total')
          .eq('date', dateStr)

        const daySalesTotal = daySales?.reduce((sum, sale) => sum + sale.total, 0) || 0

        // Daily expenses (from sale_items cost_price * quantity)
        // First get sales for this date, then get their items
        const { data: daySalesIds } = await supabase
          .from('sales')
          .select('id')
          .eq('date', dateStr)

        let dayExpensesTotal = 0
        if (daySalesIds && daySalesIds.length > 0) {
          const saleIds = daySalesIds.map(sale => sale.id)
          const { data: dayItems } = await supabase
            .from('sale_items')
            .select(`
              quantity,
              inventory_id
            `)
            .in('sale_id', saleIds)

          // Get inventory data separately
          const inventoryIds = dayItems?.map(item => item.inventory_id).filter(Boolean) || []
          const { data: dayInventoryData } = await supabase
            .from('inventory')
            .select('id, cost_price')
            .in('id', inventoryIds)

          const dayInventoryMap = new Map(dayInventoryData?.map(inv => [inv.id, inv.cost_price]) || [])

          dayExpensesTotal = dayItems?.reduce((sum, item) => {
            const costPrice = dayInventoryMap.get(item.inventory_id) || 0
            return sum + (costPrice * item.quantity)
          }, 0) || 0
        }

        chartDataPoints.push({
          date: dateStr,
          sales: Math.round(daySalesTotal),
          expenses: Math.round(dayExpensesTotal),
          profit: Math.round(daySalesTotal - dayExpensesTotal)
        })
      }

      setChartData(chartDataPoints)
    } catch (error) {
      console.error('Error fetching chart data:', error)
      // Fallback demo data
      const demoData: ChartData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        demoData.push({
          date: dateStr,
          sales: Math.round(Math.random() * 50000 + 10000),
          expenses: Math.round(Math.random() * 30000 + 5000),
          profit: 0
        })
      }
      demoData.forEach(item => {
        item.profit = item.sales - item.expenses
      })
      setChartData(demoData)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!supabase) return

    // Subscribe to sales table changes
    const salesSubscription = supabase
      .channel('sales_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sales'
      }, (payload) => {
        console.log('Sales table changed:', payload)
        // Refresh financial stats when sales data changes
        fetchFinancialStats()
      })
      .subscribe()

    // Subscribe to sale_items table changes
    const itemsSubscription = supabase
      .channel('sale_items_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sale_items'
      }, (payload) => {
        console.log('Sale items table changed:', payload)
        // Refresh financial stats when sale items data changes
        fetchFinancialStats()
      })
      .subscribe()

    // Subscribe to expenses table changes
    const expensesSubscription = supabase
      .channel('expenses_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expenses'
      }, (payload) => {
        console.log('Expenses table changed:', payload)
        // Refresh financial stats when expenses data changes
        fetchFinancialStats()
      })
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      salesSubscription.unsubscribe()
      itemsSubscription.unsubscribe()
      expensesSubscription.unsubscribe()
    }
  }

  const fetchUsers = async () => {
    // Demo mode: show sample users data when Supabase is not configured
    if (!supabase) {
      const demoUsers: User[] = [
        {
          id: 'demo-user-1',
          name: 'ئەحمەد محەمەد',
          image: '',
          phone: '+964 750 123 4567',
          location: 'هەولێر',
          email: 'ahmed@example.com',
          role_id: 'admin-role',
          role: {
            name: 'Admin',
            permissions: {
              sales: true,
              inventory: true,
              customers: true,
              suppliers: true,
              payroll: true,
              profits: true
            }
          }
        },
        {
          id: 'demo-user-2',
          name: 'فاطمە عەلی',
          image: '',
          phone: '+964 751 987 6543',
          location: 'سلێمانی',
          email: 'fatima@example.com',
          role_id: 'manager-role',
          role: {
            name: 'Manager',
            permissions: {
              sales: true,
              inventory: true,
              customers: true,
              suppliers: false,
              payroll: false,
              profits: true
            }
          }
        }
      ]
      setUsers(demoUsers)
      return
    }

    try {
      // First, fetch all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('id, name, permissions')

      if (rolesError) {
        console.error('Error fetching roles:', rolesError)
        setUsers([])
        return
      }

      // Then fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, image, phone, location, email, role_id')

      if (usersError) {
        console.error('Error fetching users:', usersError)
        setUsers([])
        return
      }

      // Map roles to users
      const usersWithRoles: User[] = usersData?.map(user => ({
        ...user,
        role: rolesData?.find(role => role.id === user.role_id) || undefined
      })) || []

      setUsers(usersWithRoles)
    } catch (error) {
      console.error('Error fetching users:', error)
      // Final fallback: show empty array
      setUsers([])
    }
  }

  const fetchRoles = async () => {
    // Demo mode: show sample roles data when Supabase is not configured
    if (!supabase) {
      const demoRoles: Role[] = [
        {
          id: 'admin-role',
          name: 'Admin',
          permissions: {
            sales: true,
            inventory: true,
            customers: true,
            suppliers: true,
            payroll: true,
            profits: true
          }
        },
        {
          id: 'manager-role',
          name: 'Manager',
          permissions: {
            sales: true,
            inventory: true,
            customers: true,
            suppliers: false,
            payroll: false,
            profits: true
          }
        },
        {
          id: 'cashier-role',
          name: 'Cashier',
          permissions: {
            sales: true,
            inventory: false,
            customers: false,
            suppliers: false,
            payroll: false,
            profits: false
          }
        }
      ]
      setRoles(demoRoles)
      setLoading(false)
      return
    }

    try {
      console.log('Fetching roles...')
      const { data, error } = await supabase
        .from('roles')
        .select('*')

      console.log('Roles query result:', { data, error })

      if (error) {
        console.error('Error fetching roles:', error)
        // If roles table doesn't exist or is empty, create default roles
        if (error.code === 'PGRST116' || error.message?.includes('relation "roles" does not exist')) {
          console.log('Roles table not found, using demo data')
          const demoRoles: Role[] = [
            {
              id: 'admin-role',
              name: 'Admin',
              permissions: {
                sales: true,
                inventory: true,
                customers: true,
                suppliers: true,
                payroll: true,
                profits: true
              }
            },
            {
              id: 'manager-role',
              name: 'Manager',
              permissions: {
                sales: true,
                inventory: true,
                customers: true,
                suppliers: false,
                payroll: false,
                profits: true
              }
            },
            {
              id: 'cashier-role',
              name: 'Cashier',
              permissions: {
                sales: true,
                inventory: false,
                customers: false,
                suppliers: false,
                payroll: false,
                profits: false
              }
            }
          ]
          setRoles(demoRoles)
        } else {
          throw error
        }
      } else {
        console.log('Roles loaded:', data)
        setRoles(data || [])
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      // Fallback: use demo roles
      const demoRoles: Role[] = [
        {
          id: 'admin-role',
          name: 'Admin',
          permissions: {
            sales: true,
            inventory: true,
            customers: true,
            suppliers: true,
            payroll: true,
            profits: true
          }
        }
      ]
      setRoles(demoRoles)
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  const createUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUserName,
          image: newUserImage,
          phone: newUserPhone,
          location: newUserLocation,
          email: newUserEmail,
          password: newUserPassword,
          roleId: selectedRoleId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      setShowCreateUser(false)
      setNewUserName('')
      setNewUserImage('')
      setNewUserPhone('')
      setNewUserLocation('')
      setNewUserEmail('')
      setNewUserPassword('')
      setSelectedRoleId('')
      fetchUsers()
      alert('User created successfully!')
    } catch (error) {
      console.error('Error creating user:', error)
      alert(`Error creating user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const createRole = async () => {
    if (!supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت ڕۆڵ زیاد بکرێت')
      return
    }

    try {
      const { error } = await supabase
        .from('roles')
        .insert({
          name: newRoleName,
          permissions
        })

      if (error) throw error

      setShowCreateRole(false)
      setNewRoleName('')
      setPermissions({
        dashboard: false,
        sales: false,
        inventory: false,
        customers: false,
        suppliers: false,
        expenses: false,
        profits: false,
        help: false,
        admin: false,
      })
      fetchRoles()
    } catch (error) {
      console.error('Error creating role:', error)
      alert('Error creating role')
    }
  }

  const fetchShopSettings = async () => {
    // Demo mode: show sample shop settings data when Supabase is not configured
    if (!supabase) {
      const demoSettings: ShopSettings = {
        id: 'demo-shop',
        shopname: 'فرۆشگای کوردستان',
        icon: '',
        phone: '+964 750 123 4567',
        location: 'هەولێر، کوردستان',
        qrcodeimage: ''
      }
      setShopSettings(demoSettings)
      setShopSettingsForm(demoSettings)
      return
    }

    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      const settings = data || null
      setShopSettings(settings)
      if (settings) {
        setShopSettingsForm(settings)
      }
    } catch (error) {
      console.error('Error fetching shop settings:', error)
    }
  }

  const updateShopSettings = async (field: string, value: string) => {
    if (!supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت ڕێکخستنەکان بگۆڕدرێن')
      return
    }

    try {
      const updateData: any = { [field]: value, updated_at: new Date().toISOString() }

      if (shopSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('shop_settings')
          .update(updateData)
          .eq('id', shopSettings.id)

        if (error) throw error
      } else {
        // Create new settings
        const { error } = await supabase
          .from('shop_settings')
          .insert(updateData)

        if (error) throw error
      }

      fetchShopSettings()
    } catch (error) {
      console.error('Error updating shop settings:', error)
      alert('هەڵە لە نوێکردنی ڕێکخستنەکان')
    }
  }

  const handleImageUpload = async (file: File, field: string) => {
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    // File size validation (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      alert('وێنەکە زۆر گەورەیە. دەبێت لە 5MB کەمتر بێت.')
      return
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('جۆری وێنە نادروستە. تکایە JPEG، PNG یان WebP بەکاربهێنە.')
      return
    }

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `shop/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) throw new Error('Failed to get public URL')

      updateShopSettings(field, urlData.publicUrl)
    } catch (error) {
      console.error('Image upload failed:', error)
      alert(`هەڵە لە بارکردنی وێنە: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const updateAllShopSettings = async () => {
    if (!supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت ڕێکخستنەکان بگۆڕدرێن')
      return
    }

    try {
      const updateData = {
        ...shopSettingsForm,
        updated_at: new Date().toISOString()
      }

      if (shopSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('shop_settings')
          .update(updateData)
          .eq('id', shopSettings.id)

        if (error) throw error
      } else {
        // Create new settings
        const { error } = await supabase
          .from('shop_settings')
          .insert(updateData)

        if (error) throw error
      }

      alert('ڕێکخستنەکان بە سەرکەوتوویی نوێکرانەوە')
      fetchShopSettings()

      // Refresh the page to update browser title and favicon
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error updating all shop settings:', error)
      alert('هەڵە لە نوێکردنی ڕێکخستنەکان')
    }
  }

  const updateUserRole = async (userId: string, roleId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role_id: roleId })
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Error updating user role')
    }
  }

  const editUser = (user: User) => {
    setEditingUser(user)
    setNewUserName(user.name || '')
    setNewUserImage(user.image || '')
    setNewUserPhone(user.phone || '')
    setNewUserLocation(user.location || '')
    setNewUserEmail(user.email || '')
    setNewUserPassword('') // Don't pre-fill password for security
    setSelectedRoleId(user.role_id || '')
    setShowCreateUser(true)
  }

  const updateUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingUser.id,
          name: newUserName,
          image: newUserImage,
          phone: newUserPhone,
          location: newUserLocation,
          email: newUserEmail,
          password: newUserPassword || undefined, // Only update if provided
          roleId: selectedRoleId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }

      setShowCreateUser(false)
      setEditingUser(null)
      setNewUserName('')
      setNewUserImage('')
      setNewUserPhone('')
      setNewUserLocation('')
      setNewUserEmail('')
      setNewUserPassword('')
      setSelectedRoleId('')
      fetchUsers()
      alert('User updated successfully!')
    } catch (error) {
      console.error('Error updating user:', error)
      alert(`Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const resetForm = () => {
    setEditingUser(null)
    setNewUserName('')
    setNewUserImage('')
    setNewUserPhone('')
    setNewUserLocation('')
    setNewUserEmail('')
    setNewUserPassword('')
    setSelectedRoleId('')
  }

  const editRole = (role: Role) => {
    setEditingRole(role)
    setNewRoleName(role.name)
    setPermissions(role.permissions)
    setShowCreateRole(true)
  }

  const updateRole = async () => {
    if (!editingRole) return

    try {
      const { error } = await supabase
        .from('roles')
        .update({
          name: newRoleName,
          permissions
        })
        .eq('id', editingRole.id)

      if (error) throw error

      setShowCreateRole(false)
      setEditingRole(null)
      setNewRoleName('')
      setPermissions({
        dashboard: false,
        sales: false,
        inventory: false,
        customers: false,
        suppliers: false,
        expenses: false,
        profits: false,
        help: false,
        admin: false,
      })
      fetchRoles()
      alert('Role updated successfully!')
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Error updating role')
    }
  }

  const deleteRole = async (roleId: string, roleName: string) => {
    // Check if any users are using this role
    const usersWithRole = users.filter(user => user.role_id === roleId)
    if (usersWithRole.length > 0) {
      alert(`ناتوانرێت ڕۆڵ بسڕدرێتەوە چونکە ${usersWithRole.length} بەکارهێنەر ئەم ڕۆڵە بەکاردەهێنن. تکایە یەکەم ڕۆڵی ئەم بەکارهێنەرانە بگۆڕە.`)
      return
    }

    if (!confirm(`دڵنیایت لە سڕینەوەی ڕۆڵی "${roleName}"؟`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId)

      if (error) throw error

      fetchRoles()
      alert('Role deleted successfully!')
    } catch (error) {
      console.error('Error deleting role:', error)
      alert('Error deleting role')
    }
  }

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`دڵنیایت لە سڕینەوەی بەکارهێنەر "${userName}"؟`)) {
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user')
      }

      fetchUsers()
      alert('بەکارهێنەر بە سەرکەوتوویی سڕدرایەوە')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(`هەڵە لە سڕینەوەی بەکارهێنەر: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const resetRoleForm = () => {
    setEditingRole(null)
    setNewRoleName('')
    setPermissions({
      dashboard: false,
      sales: false,
      inventory: false,
      customers: false,
      suppliers: false,
      expenses: false,
      profits: false,
      help: false,
      admin: false,
    })
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl"
        >
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            چاوەڕوانبە...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                بەڕێوەبردنی سیستەم
              </h1>
              <p className="text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                بەڕێوەبردنی بەکارهێنەران، ڕۆڵەکان و ڕێکخستنەکان
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                  بەکارهێنەران
                </p>
                <p className="text-2xl font-bold text-blue-600">{users.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                  ڕۆڵەکان
                </p>
                <p className="text-2xl font-bold text-purple-600">{roles.length}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-white/60 backdrop-blur-xl rounded-2xl p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <FaChartLine className="inline ml-2" />
              شیکارییەکان
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'users'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <FaUsers className="inline ml-2" />
              بەکارهێنەران
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'roles'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <FaShieldAlt className="inline ml-2" />
              ڕۆڵەکان
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'settings'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <FaCog className="inline ml-2" />
              ڕێکخستنەکان
            </button>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {/* Users Tab */}
            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Users Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <FaUsers className="text-blue-500 text-2xl" />
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      بەڕێوەبردنی بەکارهێنەران
                    </h2>
                  </div>
                  <motion.button
                    onClick={() => setShowCreateUser(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaPlus className="inline ml-2" />
                    زیادکردنی بەکارهێنەر
                  </motion.button>
                </div>

                {/* Users Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {users.map((user, index) => (
                      <motion.div
                        key={user.id}
                        className="group bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:shadow-2xl border border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                          delay: index * 0.1,
                          duration: 0.3
                        }}
                        whileHover={{ scale: 1.05 }}
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500 rounded-3xl"></div>

                        <div className="relative z-10">
                          {/* User Avatar */}
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
                              {user.image ? (
                                <img
                                  src={user.image}
                                  alt={user.name || 'User'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FaUser className="w-8 h-8 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-xl text-gray-800 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                {user.name || 'ناوی نەناسراو'}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-xs font-medium">
                                  {user.role?.name || 'ڕۆڵی نەناسراو'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* User Details */}
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center space-x-3 text-sm">
                              <FaPhone className="text-gray-400 w-4 h-4" />
                              <span className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {user.phone || 'نەناسراو'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm">
                              <FaMapMarkerAlt className="text-gray-400 w-4 h-4" />
                              <span className="text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                {user.location || 'نەناسراو'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm">
                              <FaEye className="text-gray-400 w-4 h-4" />
                              <span className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {user.email || 'نەناسراو'}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-3">
                            <motion.button
                              onClick={() => editUser(user)}
                              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                              style={{ fontFamily: 'var(--font-uni-salar)' }}
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FaEdit className="inline ml-2" />
                              نوێکردنەوە
                            </motion.button>
                            <motion.button
                              onClick={() => deleteUser(user.id, user.name || 'ئەم بەکارهێنەرە')}
                              className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FaTrash />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Roles Tab */}
            {activeTab === 'roles' && (
              <motion.div
                key="roles"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Roles Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <FaShieldAlt className="text-purple-500 text-2xl" />
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      بەڕێوەبردنی ڕۆڵەکان
                    </h2>
                  </div>
                  <motion.button
                    onClick={() => setShowCreateRole(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaPlus className="inline ml-2" />
                    زیادکردنی ڕۆڵ
                  </motion.button>
                </div>

                {/* Roles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {roles.map((role, index) => (
                      <motion.div
                        key={role.id}
                        className="group bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:shadow-2xl border border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                          delay: index * 0.1,
                          duration: 0.3
                        }}
                        whileHover={{ scale: 1.05 }}
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500 rounded-3xl"></div>

                        <div className="relative z-10">
                          {/* Role Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
                                <FaShieldAlt className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="font-bold text-xl text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                {role.name}
                              </h3>
                            </div>
                          </div>

                          {/* Permissions */}
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-700 mb-3" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              مۆڵەتەکان:
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(role.permissions).map(([perm, hasAccess]) => (
                                <div key={perm} className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${hasAccess ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                  <span className="text-sm text-gray-600 capitalize" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    {perm}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-3">
                            <motion.button
                              onClick={() => editRole(role)}
                              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                              style={{ fontFamily: 'var(--font-uni-salar)' }}
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FaEdit className="inline ml-2" />
                              نوێکردنەوە
                            </motion.button>
                            <motion.button
                              onClick={() => deleteRole(role.id, role.name)}
                              className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FaTrash />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Analytics Header */}
                <div className="flex items-center space-x-3 mb-6">
                  <FaChartLine className="text-emerald-500 text-2xl" />
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    شیکارییە داراییەکان
                  </h2>
                </div>

                {/* Financial Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <motion.div
                    className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center">
                        <FaShoppingCart className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center space-x-1">
                        {financialStats.salesTrend > 0 ? (
                          <FaArrowUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <FaArrowDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${financialStats.salesTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {Math.abs(financialStats.salesTrend)}%
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      کۆی فرۆشتن
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 mb-1" style={{ fontFamily: 'UniSalar_F_007, sans-serif' }}>
                      {formatCurrency(financialStats.totalSales)}
                    </p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      لەم مانگەدا
                    </p>
                  </motion.div>

                  <motion.div
                    className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl flex items-center justify-center">
                        <FaMoneyBillWave className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center space-x-1">
                        <FaArrowUp className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-500 font-medium">+8%</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      خەرجییەکان
                    </h3>
                    <p className="text-3xl font-bold text-red-600 mb-1" style={{ fontFamily: 'UniSalar_F_007, sans-serif' }}>
                      {formatCurrency(financialStats.totalExpenses)}
                    </p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      لەم مانگەدا
                    </p>
                  </motion.div>

                  <motion.div
                    className={`bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${financialStats.netProfit >= 0 ? 'bg-gradient-to-br from-green-400 to-green-500' : 'bg-gradient-to-br from-red-400 to-red-500'}`}>
                        <FaChartLine className={`w-6 h-6 text-white`} />
                      </div>
                      <div className="flex items-center space-x-1">
                        {financialStats.netProfit >= 0 ? (
                          <FaArrowUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <FaArrowDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${financialStats.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {financialStats.netProfit >= 0 ? '+15%' : '-10%'}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      قازانج
                    </h3>
                    <p className={`text-3xl font-bold mb-1 ${financialStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'UniSalar_F_007, sans-serif' }}>
                      {formatCurrency(Math.abs(financialStats.netProfit))}
                    </p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      {financialStats.netProfit >= 0 ? 'قازانجی پاک' : 'زیان'}
                    </p>
                  </motion.div>

                  <motion.div
                    className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center">
                        <FaCalendarAlt className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center space-x-1">
                        {financialStats.salesTrend > 0 ? (
                          <FaArrowUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <FaArrowDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${financialStats.salesTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {Math.abs(financialStats.salesTrend)}%
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      فرۆشتنی ئەمڕۆ
                    </h3>
                    <p className="text-3xl font-bold text-yellow-600 mb-1" style={{ fontFamily: 'UniSalar_F_007, sans-serif' }}>
                      {formatCurrency(financialStats.todaySales)}
                    </p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      لە بەرامبەر دوێنێ
                    </p>
                  </motion.div>
                </div>

                {/* Chart Section */}
                <motion.div
                  className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <FaChartLine className="text-emerald-500 text-2xl" />
                    <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      تەوەری دارایی ٧ ڕۆژی ڕابردوو
                    </h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) => new Date(date).toLocaleDateString('ku', { month: 'short', day: 'numeric' })}
                          stroke="#6b7280"
                          fontSize={12}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        <YAxis stroke="#6b7280" fontSize={12} style={{ fontFamily: 'UniSalar_F_007, sans-serif' }} />
                        <Tooltip
                          labelFormatter={(date) => new Date(date).toLocaleDateString('ku')}
                          formatter={(value: number | undefined, name: string | undefined) => [
                            `${formatCurrency(Math.abs(value || 0))} IQD`,
                            (name || '') === 'sales' ? 'فرۆشتن' : (name || '') === 'expenses' ? 'خەرجییەکان' : 'قازانج'
                          ]}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '12px',
                            backdropFilter: 'blur(10px)',
                            fontFamily: 'var(--font-uni-salar)'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sales"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                          name="sales"
                        />
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          stroke="#ef4444"
                          strokeWidth={3}
                          dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                          name="expenses"
                        />
                        <Line
                          type="monotone"
                          dataKey="profit"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                          name="profit"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend */}
                  <div className="flex justify-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>فرۆشتن</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>خەرجییەکان</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>قازانج</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Settings Header */}
                <div className="flex items-center space-x-3 mb-6">
                  <FaCog className="text-green-500 text-2xl" />
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    ڕێکخستنەکانی فرۆشگا
                  </h2>
                </div>

                {/* Settings Form */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Shop Name */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        ناوی فرۆشگا
                      </label>
                      <div className="relative">
                        <FaStore className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={shopSettingsForm.shopname || ''}
                          onChange={(e) => setShopSettingsForm(prev => ({ ...prev, shopname: e.target.value }))}
                          className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                          style={{ fontFamily: 'var(--font-uni-salar)' }}
                          placeholder="ناوی فرۆشگاکەت"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        ژمارەی تەلەفۆن
                      </label>
                      <div className="relative">
                        <FaPhone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={shopSettingsForm.phone || ''}
                          onChange={(e) => setShopSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-left"
                          style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                          placeholder="+964 XXX XXX XXXX"
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        ناونیشان
                      </label>
                      <div className="relative">
                        <FaMapMarkerAlt className="absolute right-3 top-3 text-gray-400" />
                        <textarea
                          value={shopSettingsForm.location || ''}
                          onChange={(e) => setShopSettingsForm(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
                          style={{ fontFamily: 'var(--font-uni-salar)' }}
                          placeholder="ناونیشانی فرۆشگاکەت"
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Shop Icon */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
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
                              handleImageUpload(file, 'icon')
                            }
                          }}
                          className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                      </div>
                      {shopSettings?.icon && (
                        <div className="mt-3">
                          <img
                            src={shopSettings.icon}
                            alt="Shop Icon"
                            className="w-16 h-16 object-cover rounded-xl border-2 border-green-200"
                          />
                        </div>
                      )}
                    </div>

                    {/* QR Code Image */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
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
                              handleImageUpload(file, 'qrcodeimage')
                            }
                          }}
                          className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                      </div>
                      {shopSettings?.qrcodeimage && (
                        <div className="mt-3">
                          <img
                            src={shopSettings.qrcodeimage}
                            alt="QR Code"
                            className="w-16 h-16 object-cover rounded-xl border-2 border-green-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Update Button */}
                  <motion.button
                    onClick={updateAllShopSettings}
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

                  {/* Current Settings Display */}
                  {shopSettings && (
                    <motion.div
                      className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        <FaEye className="ml-2 text-green-500" />
                        ڕێکخستنەکانی ئێستا
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                          <span className="font-medium text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناو:</span>
                          <span className="font-bold text-gray-800">{shopSettings.shopname}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                          <span className="font-medium text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>تەلەفۆن:</span>
                          <span className="font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>{shopSettings.phone}</span>
                        </div>
                        <div className="md:col-span-2 flex justify-between items-center p-3 bg-white/60 rounded-xl">
                          <span className="font-medium text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناونیشان:</span>
                          <span className="font-bold text-gray-800">{shopSettings.location}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                          <span className="font-medium text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>ئایکۆن:</span>
                          <span className={`font-bold ${shopSettings.icon ? 'text-green-600' : 'text-red-600'}`}>
                            {shopSettings.icon ? '✅ هەیە' : '❌ نییە'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                          <span className="font-medium text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>QR کۆد:</span>
                          <span className={`font-bold ${shopSettings.qrcodeimage ? 'text-green-600' : 'text-red-600'}`}>
                            {shopSettings.qrcodeimage ? '✅ هەیە' : '❌ نییە'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Create/Edit User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              {editingUser ? 'نوێکردنەوەی بەکارهێنەر' : 'زیادکردنی بەکارهێنەر'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناو</label>
                <input
                  type="text"
                  placeholder="ناوی بەکارهێنەر"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>وێنە</label>
                {editingUser?.image && (
                  <div className="mb-2">
                    <img
                      src={editingUser.image}
                      alt="Current user image"
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <p className="text-xs text-gray-500 mt-1">وێنەی ئێستا (بۆ گۆڕین وێنە نوێ هەڵبژێرە)</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // Handle image upload here
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        setNewUserImage(e.target?.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>تەلەفۆن</label>
                <input
                  type="text"
                  placeholder="+964 XXX XXX XXXX"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(sanitizePhoneNumber(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناونیشان</label>
                <input
                  type="text"
                  placeholder="ناونیشانی بەکارهێنەر"
                  value={newUserLocation}
                  onChange={(e) => setNewUserLocation(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>ئیمەیڵ</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  وشەی نهێنی {editingUser && '(بەتاڵ بهێڵە بۆ نەگۆڕین)'}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? "وشەی نهێنی نوێ (ئارەزوومەندانە)" : "وشەی نهێنی"}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>ڕۆڵ</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">هەڵبژاردنی ڕۆڵ</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateUser(false)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={editingUser ? updateUser : createUser}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {editingUser ? 'نوێکردنەوەی بەکارهێنەر' : 'زیادکردنی بەکارهێنەر'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Role Modal */}
      {showCreateRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">
              {editingRole ? 'نوێکردنەوەی ڕۆڵ' : 'زیادکردنی ڕۆڵ'}
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="ناوی ڕۆڵ"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              <div>
                <h4 className="font-medium mb-2">مۆڵەتەکان</h4>
                <div className="space-y-3">
                  {[
                    { key: 'dashboard', name: 'داشبۆرد', icon: '📊' },
                    { key: 'sales', name: 'فرۆشتن', icon: '💰' },
                    { key: 'inventory', name: 'کۆگا', icon: '📦' },
                    { key: 'customers', name: 'کڕیاران', icon: '👥' },
                    { key: 'suppliers', name: 'دابینکەران', icon: '🏭' },
                    { key: 'expenses', name: 'خەرجییەکان', icon: '💸' },
                    { key: 'profits', name: 'قازانج', icon: '📈' },
                    { key: 'help', name: 'یارمەتی', icon: '❓' },
                    { key: 'admin', name: 'بەڕێوەبەران', icon: '⚙️' }
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions[perm.key]}
                        onChange={(e) => setPermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-lg">{perm.icon}</span>
                      <span className="font-medium" style={{ fontFamily: 'var(--font-uni-salar)' }}>{perm.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setShowCreateRole(false)
                  resetRoleForm()
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={editingRole ? updateRole : createRole}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                {editingRole ? 'نوێکردنەوە' : 'زیادکردن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}