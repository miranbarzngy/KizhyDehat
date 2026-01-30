'use client'

import { useShopSettings } from '@/app/dashboard/layout'
import PermissionGuard from '@/components/PermissionGuard'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FaMapMarkerAlt, FaPlus, FaSave, FaShieldAlt, FaStore, FaTrash, FaUser, FaUsers } from 'react-icons/fa'

interface ShopSettings {
  id?: string
  shop_name: string
  logo_url: string
  address: string
  currency: string
  tax_rate: number
}

interface User {
  id: string
  email: string
  name?: string
  role_id?: string
  role?: {
    name: string
    description?: string
  }
}

interface Role {
  id: string
  name: string
  description?: string
  permissions: Record<string, boolean>
}

export default function AdminPage() {
  return (
    <PermissionGuard permission="admin">
      <AdminPageContent />
    </PermissionGuard>
  )
}

function AdminPageContent() {
  const { refreshShopSettings } = useShopSettings()
  const [activeTab, setActiveTab] = useState<'shop-info' | 'users' | 'roles' | 'system'>('shop-info')
  const [settings, setSettings] = useState<ShopSettings>({
    shop_name: 'فرۆشگای کوردستان',
    logo_url: '',
    address: 'هەولێر، کوردستان',
    currency: 'IQD',
    tax_rate: 0.00
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  // Role creation state
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: {
      dashboard: true, // Dashboard enabled by default
      sales: false,
      inventory: false,
      customers: false,
      suppliers: false,
      invoices: false,
      expenses: false,
      profits: false,
      help: false,
      admin: false
    }
  })
  const [creatingRole, setCreatingRole] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // User creation state
  const [showUserModal, setShowUserModal] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role_id: ''
  })
  const [userImageFile, setUserImageFile] = useState<File | null>(null)
  const [creatingUser, setCreatingUser] = useState(false)

  // User editing state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role_id: ''
  })
  const [editUserImageFile, setEditUserImageFile] = useState<File | null>(null)
  const [updatingUser, setUpdatingUser] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchRoles()
    fetchUsers()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setSettings({
          id: data.id,
          shop_name: data.shop_name || 'فرۆشگای کوردستان',
          logo_url: data.logo_url || '',
          address: data.address || 'هەولێر، کوردستان',
          currency: data.currency || 'IQD',
          tax_rate: data.tax_rate || 0.00
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setSettings(prev => ({ ...prev, logo_url: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMessage('')

    try {
      let logoUrl = settings.logo_url

      // Upload image if there's a new file
      if (imageFile && supabase) {
        const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `shop-logos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        if (!urlData?.publicUrl) throw new Error('Failed to get public URL')
        logoUrl = urlData.publicUrl
      }

      const updateData = {
        shop_name: settings.shop_name,
        logo_url: logoUrl,
        address: settings.address,
        currency: settings.currency,
        tax_rate: settings.tax_rate,
        updated_at: new Date().toISOString()
      }

      if (settings.id) {
        // Update existing settings
        const { error } = await supabase
          .from('shop_settings')
          .update(updateData)
          .eq('id', settings.id)

        if (error) throw error
      } else {
        // Create new settings
        const { error } = await supabase
          .from('shop_settings')
          .insert(updateData)

        if (error) throw error
      }

      // Refresh shop settings in the layout to update branding immediately
      await refreshShopSettings()

      setSuccessMessage('زانیاری دوکان بە سەرکەوتوویی نوێکرایەوە!')
      setTimeout(() => setSuccessMessage(''), 3000)

    } catch (error) {
      console.error('Error saving settings:', error)
      alert(`هەڵە لە نوێکردنەوەی زانیاری دوکان: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingRole(true)

    try {
      const { error } = await supabase
        .from('roles')
        .insert({
          name: newRole.name,
          description: newRole.description,
          permissions: newRole.permissions
        })

      if (error) throw error

      // Reset form
      setNewRole({
        name: '',
        description: '',
        permissions: {
          sales: false,
          inventory: false,
          customers: false,
          suppliers: false,
          invoices: false,
          expenses: false,
          profits: false,
          help: false,
          admin: false
        }
      })
      setShowRoleModal(false)
      alert('ڕۆڵ بە سەرکەوتوویی دروستکرا!')

    } catch (error) {
      console.error('Error creating role:', error)
      alert(`هەڵە لە دروستکردنی ڕۆڵ: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreatingRole(false)
    }
  }

  const fetchRoles = async () => {
    setLoadingRoles(true)
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRoles(data || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setLoadingRoles(false)
    }
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      if (!supabase) {
        console.log('Supabase not configured, using demo data')
        setUsers([])
        return
      }

      // First fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          phone,
          image,
          role_id
        `)
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Then fetch roles separately
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('id, name, description')

      if (rolesError) throw rolesError

      // Combine the data
      const usersWithRoles = (profilesData || []).map(profile => ({
        ...profile,
        role: rolesData?.find(role => role.id === profile.role_id) || null
      }))

      setUsers(usersWithRoles)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingUser(true)

    try {
      // Validate required fields
      if (!newUser.email || !newUser.password || !newUser.role_id) {
        throw new Error('ئیمەیڵ، وشەی نهێنی، و ڕۆڵ پێویستە')
      }

      // Upload user image if provided
      let imageUrl = ''
      if (userImageFile) {
        const fileExt = userImageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `temp-${Date.now()}.${fileExt}`
        const filePath = `user-images/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, userImageFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath)

          if (urlData?.publicUrl) {
            imageUrl = urlData.publicUrl
          }
        }
      }

      // Create user via API (this creates both auth user and profile)
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          phone: newUser.phone || null,
          image: imageUrl || null,
          roleId: newUser.role_id
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user')
      }

      // Reset form
      setNewUser({
        name: '',
        email: '',
        password: '',
        phone: '',
        role_id: ''
      })
      setUserImageFile(null)
      setShowUserModal(false)

      // Refresh users list
      fetchUsers()

      alert(`بەکارهێنەر بە سەرکەوتوویی دروستکرا!\n\n✅ بەکارهێنەر ئێستا دەتوانێت بچێتە ژوورەوە بە:\nئیمەیڵ: ${newUser.email}\nوشەی نهێنی: ${newUser.password}`)

    } catch (error) {
      console.error('Error creating user:', error)
      alert(`هەڵە لە دروستکردنی بەکارهێنەر: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreatingUser(false)
    }
  }

  const handleUserImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUserImageFile(file)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditUser({
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      password: '',
      role_id: user.role_id || ''
    })
    setShowEditUserModal(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setUpdatingUser(true)

    try {
      // Upload new image if provided
      let imageUrl = editingUser.image
      if (editUserImageFile) {
        const fileExt = editUserImageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${editingUser.id}-${Date.now()}.${fileExt}`
        const filePath = `user-images/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, editUserImageFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath)

          if (urlData?.publicUrl) {
            imageUrl = urlData.publicUrl
          }
        }
      }

      // Update user via API
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingUser.id,
          name: editUser.name,
          email: editUser.email, // Allow email update
          password: editUser.password || null, // Allow password update
          phone: editUser.phone || null,
          image: imageUrl,
          roleId: editUser.role_id || null
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user')
      }

      // Reset form and close modal
      setEditingUser(null)
      setEditUser({
        name: '',
        email: '',
        phone: '',
        role_id: ''
      })
      setEditUserImageFile(null)
      setShowEditUserModal(false)

      // Refresh users list
      fetchUsers()

      alert('بەکارهێنەر بە سەرکەوتوویی نوێکرایەوە!')

    } catch (error) {
      console.error('Error updating user:', error)
      alert(`هەڵە لە نوێکردنەوەی بەکارهێنەر: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUpdatingUser(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`ئایا دڵنیایت لە سڕینەوەی بەکارهێنەر "${user.name || user.email}"؟\n\nئەم کردارە ناتوانرێتەوە پاشگەز بکرێتەوە.`)) {
      return
    }

    try {
      console.log('Attempting to delete user:', user.id)

      // Delete user via API (this deletes both auth user and profile)
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user')
      }

      // Refresh users list
      await fetchUsers()

      alert('بەکارهێنەر بە سەرکەوتوویی سڕایەوە!')

    } catch (error) {
      console.error('Error deleting user:', error)
      alert(`هەڵە لە سڕینەوەی بەکارهێنەر: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleEditUserImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditUserImageFile(file)
    }
  }

  const updatePermission = (permission: string, value: boolean) => {
    setNewRole(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-8">
            <span className="text-blue-500 text-3xl">⚙️</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-uni-salar)' }}>
              بەڕێوەبەرایەتی دوکان
            </h1>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto whitespace-nowrap space-x-1 mb-8 bg-white/60 backdrop-blur-xl rounded-2xl p-1 shadow-lg scrollbar-hide">
            <button
              onClick={() => setActiveTab('shop-info')}
              className={`flex-shrink-0 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'shop-info'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <FaStore className="inline ml-2" />
              زانیاری دوکان
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-shrink-0 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'users'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <FaUsers className="inline ml-2" />
              بەکارهێنەران
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex-shrink-0 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
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
              onClick={() => setActiveTab('system')}
              className={`flex-shrink-0 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'system'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              <FaUser className="inline ml-2" />
              سیستەم
            </button>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            {/* Shop Info Tab */}
            {activeTab === 'shop-info' && (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Shop Logo Section */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <FaStore className="text-blue-500 text-xl" />
                    <h2 className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      لۆگۆ و ناو 
                    </h2>
                  </div>

                  {/* Mobile: Stack vertically, Desktop: Side by side */}
                  <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
                    {/* Shop Logo */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        لۆگۆ
                      </label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="w-24 h-24 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {settings.logo_url ? (
                            <img
                              src={settings.logo_url}
                              alt="Shop Logo"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-4xl">🏪</span>
                          )}
                        </div>
                        <div className="flex-1 w-full sm:w-auto">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            وێنەیەکی بچووک هەڵبژێرە (PNG, JPG, SVG)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Shop Name */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        ناو
                      </label>
                      <div className="relative">
                        <FaStore className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={settings.shop_name}
                          onChange={(e) => setSettings(prev => ({ ...prev, shop_name: e.target.value }))}
                          className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          style={{ fontFamily: 'var(--font-uni-salar)' }}
                          placeholder="ناوی دوکانەکەت"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <FaMapMarkerAlt className="text-green-500 text-xl" />
                    <h2 className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      ناونیشان و شوێن
                    </h2>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      ناونیشانی تەواو
                    </label>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute right-3 top-3 text-gray-400" />
                      <textarea
                        value={settings.address}
                        onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full pr-10 pl-4 py-3 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                        style={{ fontFamily: 'var(--font-uni-salar)' }}
                        placeholder="ناونیشانی دوکانەکەت"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6">
                  <motion.button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {saving ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        چاوەڕوانکە...
                      </>
                    ) : (
                      <>
                        <FaSave className="inline mr-2" />
                        نوێکردنەوەی زانیاری دوکان
                      </>
                    )}
                  </motion.button>
                </div>

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-green-100 border border-green-200 rounded-xl text-green-700 text-center"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    {successMessage}
                  </motion.div>
                )}
              </form>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-primary)' }}>
                    بەڕێوەبەرایەتی بەکارهێنەران
                  </h2>
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-1 text-sm"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    <FaPlus className="ml-1 text-sm" />
                    <span>بەکارهێنەری نوێ</span>
                  </button>
                </div>

                {/* Mobile Compact List / Desktop Cards */}
                <div className="lg:hidden space-y-2 max-h-[70vh] overflow-y-auto">
                  {loadingUsers ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : users.length > 0 ? (
                    users.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="w-full h-16 bg-white/60 backdrop-blur-xl rounded-lg shadow-md hover:shadow-lg border border-white/20 flex items-center p-2"
                      >
                        {/* Left: Small Profile Image */}
                        <div className="flex-shrink-0 ml-2">
                          <div className="relative w-12 h-12 rounded-full border-2 border-[#D4AF37] shadow-lg flex items-center justify-center overflow-hidden bg-gradient-to-br from-black/10 to-gray-900/10">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name || 'User'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-lg">👤</span>
                            )}
                          </div>
                        </div>

                        {/* Center: User Info */}
                        <div className="flex-1 text-right mr-3 min-w-0">
                          <h3 className="font-bold text-sm text-gray-800 truncate" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            {user.name || 'ناوی نەزانراو'}
                          </h3>
                          <p className="text-xs text-gray-600 truncate" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                            🏷️ {user.role?.name || 'ڕۆڵی دیاری نەکراوە'}
                          </p>
                          <p className="text-xs text-gray-500 truncate" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>
                            {user.email}
                          </p>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex-shrink-0">
                          <motion.button
                            onClick={() => handleEditUser(user)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded text-xs font-medium transition-all duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ fontFamily: 'var(--font-uni-salar)' }}
                          >
                            دەستکاری
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4 opacity-50">👥</div>
                      <h3 className="text-sm font-semibold mb-2 text-gray-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        هیچ بەکارهێنەرێک نییە
                      </h3>
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        بەکارهێنەری نوێ زیاد بکە
                      </p>
                    </div>
                  )}
                </div>

                {/* Desktop Cards */}
                <div className="hidden lg:block">
                  <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                    {/* Created Users */}
                    {loadingUsers ? (
                      <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    ) : users.length > 0 ? (
                      <div className="divide-y divide-white/10">
                        {users.map((user, index) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-6 hover:bg-white/5 transition-all duration-300 group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-6">
                                {/* Avatar */}
                                <div className="relative">
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden shadow-lg border-4 border-yellow-500">
                                    {user.image ? (
                                      <img
                                        src={user.image}
                                        alt={user.name || 'User'}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-2xl">👤</span>
                                    )}
                                  </div>
                                  {/* Online status indicator */}
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="mb-2">
                                    <h3 className="text-xl font-bold text-black" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                      {user.name || 'ناوی نەزانراو'}
                                    </h3>
                                    {/* Role as text under name - always visible with black color and no background */}
                                    <p className="text-base font-semibold text-black mb-1" style={{
                                      fontFamily: 'var(--font-uni-salar)',
                                      color: '#000000',
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      padding: '2px 0',
                                      marginTop: '4px'
                                    }}>
                                      🏷️ ڕۆڵ: {user.role?.name || 'ڕۆڵی دیاری نەکراوە'}
                                    </p>
                                  </div>

                                  <p className="text-black text-sm mb-1" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr', color: 'black' }}>
                                    📧 {user.email}
                                  </p>

                                  {user.phone && (
                                    <p className="text-black text-sm" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr', color: 'black' }}>
                                      📱 {user.phone}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center space-x-2">
                                <motion.button
                                  onClick={() => handleEditUser(user)}
                                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg flex items-center justify-center transition-all duration-200 font-medium"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                                >
                                  دەستکاری
                                </motion.button>
                                <motion.button
                                  onClick={() => handleDeleteUser(user)}
                                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-lg flex items-center justify-center transition-all duration-200 font-medium"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                                >
                                  سڕینەوە
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="text-6xl mb-6 opacity-50">👥</div>
                        <h3 className="text-xl font-semibold mb-4 text-white" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          هیچ بەکارهێنەرێک نییە
                        </h3>
                        <p className="text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                          بەکارهێنەری نوێ زیاد بکە بۆ دەستپێکردنی کارکردن
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Roles Tab */}
            {activeTab === 'roles' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-primary)' }}>
                    بەڕێوەبەرایەتی ڕۆڵەکان
                  </h2>
                  <button
                    onClick={() => setShowRoleModal(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-1 text-sm"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    <FaShieldAlt className="ml-1 text-sm" />
                    <span>ڕۆڵی نوێ</span>
                  </button>
                </div>

                {/* Created Roles */}
                {loadingRoles ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : roles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map((role) => (
                      <div key={role.id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                              {role.name}
                            </h3>
                            {role.description && (
                              <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                                {role.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(role.permissions).map(([perm, hasAccess]) =>
                                hasAccess ? (
                                  <span key={perm} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    {perm === 'dashboard' && 'داشبۆرد'}
                                    {perm === 'sales' && 'فرۆشتن'}
                                    {perm === 'inventory' && 'کۆگا'}
                                    {perm === 'customers' && 'کڕیاران'}
                                    {perm === 'suppliers' && 'دابینکەران'}
                                    {perm === 'invoices' && 'فاکتورەکان'}
                                    {perm === 'expenses' && 'خەرجییەکان'}
                                    {perm === 'profits' && 'قازانج'}
                                    {perm === 'help' && 'یارمەتی'}
                                    {perm === 'admin' && 'بەڕێوەبەران'}
                                  </span>
                                ) : null
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛡️</div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                      هیچ ڕۆڵێک نییە
                    </h3>
                    <p className="text-gray-500" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      ڕۆڵی نوێ دروست بکە بۆ بەڕێوەبەرایەتی دەستکەوتەکان
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚙️</div>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>
                    بینینی هەموو کارەکانی سیستەم
                  </h3>
                  <p className="text-gray-600 text-lg" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    لەم بەشەدا دەتوانیت هەموو کارەکانی سیستەم ببینیت و بەڕێوەیان ببەیت
                  </p>
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                      <div className="text-3xl mb-3">📊</div>
                      <h4 className="font-bold text-blue-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        راپۆرتەکان
                      </h4>
                      <p className="text-sm text-blue-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        بینینی راپۆرتەکانی فرۆشتن و قازانج
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                      <div className="text-3xl mb-3">🔧</div>
                      <h4 className="font-bold text-green-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        ڕێکخستنەکان
                      </h4>
                      <p className="text-sm text-green-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        ڕێکخستنی سیستەم و پەیڕەوەکان
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                      <div className="text-3xl mb-3">📋</div>
                      <h4 className="font-bold text-purple-800 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        لۆگەکان
                      </h4>
                      <p className="text-sm text-purple-600" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                        بینینی لۆگەکانی سیستەم و چالاکییەکان
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Role Creation Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                دروستکردنی ڕۆڵی نوێ
              </h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTrash className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-6">
              {/* Role Name */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  ناوی ڕۆڵ
                </label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                  placeholder="ناوی ڕۆڵەکە"
                  required
                />
              </div>

              {/* Role Description */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  وەسف
                </label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                  placeholder="وەسفی ڕۆڵەکە"
                  rows={3}
                />
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-semibold mb-4 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  دەستکەوتەکان
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(newRole.permissions).map(([permission, value]) => (
                    <div key={permission} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={permission}
                        checked={value}
                        onChange={(e) => updatePermission(permission, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor={permission}
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                        style={{ fontFamily: 'var(--font-uni-salar)' }}
                      >
                        {permission === 'dashboard' && 'داشبۆرد'}
                        {permission === 'sales' && 'فرۆشتن'}
                        {permission === 'inventory' && 'کۆگا'}
                        {permission === 'customers' && 'کڕیاران'}
                        {permission === 'suppliers' && 'دابینکەران'}
                        {permission === 'invoices' && 'فاکتورەکان'}
                        {permission === 'expenses' && 'خەرجییەکان'}
                        {permission === 'profits' && 'قازانج'}
                        {permission === 'help' && 'یارمەتی'}
                        {permission === 'admin' && 'بەڕێوەبەران'}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 py-3 px-6 bg-gray-500 text-white font-bold rounded-xl hover:bg-gray-600 transition-colors"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  disabled={creatingRole}
                  className="flex-1 py-3 px-6 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  {creatingRole ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      دروستدەکرێت...
                    </>
                  ) : (
                    <>
                      <FaPlus className="inline mr-2" />
                      دروستکردن
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Creation Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                زیادکردنی بەکارهێنەری نوێ
              </h2>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTrash className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-6">
              {/* User Image */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  وێنەی بەکارهێنەر
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full backdrop-blur-md bg-white/10 border border-white/20 shadow-lg flex items-center justify-center overflow-hidden">
                    <span className="text-3xl">👤</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUserImageChange}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      وێنەیەکی بچووک هەڵبژێرە (ئارەزوومەندانە)
                    </p>
                  </div>
                </div>
              </div>

              {/* User Name */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  ناوی بەکارهێنەر
                </label>
                <div className="relative">
                  <FaUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                    placeholder="ناوی بەکارهێنەر"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  ئیمەیڵ
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                  placeholder="user@example.com"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  وشەی نهێنی
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                  placeholder="وشەی نهێنی"
                  required
                  minLength={6}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  ژمارەی تەلەفۆن
                </label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                  placeholder="+964 750 123 4567"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  ڕۆڵ
                </label>
                <select
                  value={newUser.role_id}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  <option value="">ڕۆڵ هەڵبژێرە (ئارەزوومەندانە)</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-3 px-6 bg-gray-500 text-white font-bold rounded-xl hover:bg-gray-600 transition-colors"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex-1 py-3 px-6 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  {creatingUser ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      دروستدەکرێت...
                    </>
                  ) : (
                    <>
                      <FaPlus className="inline mr-2" />
                      دروستکردنی بەکارهێنەر
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                دەستکاریکردنی بەکارهێنەر
              </h2>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTrash className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-6">
              {/* User Image */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  وێنەی بەکارهێنەر
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full backdrop-blur-md bg-white/10 border border-white/20 shadow-lg flex items-center justify-center overflow-hidden">
                    {editingUser.image ? (
                      <img
                        src={editingUser.image}
                        alt={editingUser.name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditUserImageChange}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      وێنەی نوێ هەڵبژێرە (ئارەزوومەندانە)
                    </p>
                  </div>
                </div>
              </div>

              {/* User Name */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  ناوی بەکارهێنەر
                </label>
                <div className="relative">
                  <FaUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={editUser.name}
                    onChange={(e) => setEditUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                    placeholder="ناوی بەکارهێنەر"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  ئیمەیڵ
                </label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                  placeholder="user@example.com"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  وشەی نهێنی نوێ (بەتاڵ بهێڵە بۆ نەگۆڕین)
                </label>
                <input
                  type="password"
                  value={editUser.password}
                  onChange={(e) => setEditUser(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                  placeholder="وشەی نهێنی نوێ"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  بەتاڵ بهێڵە ئەگەر نەتەوێت وشەی نهێنی بگۆڕیت
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  ژمارەی تەلەفۆن
                </label>
                <input
                  type="tel"
                  value={editUser.phone}
                  onChange={(e) => setEditUser(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}
                  placeholder="+964 750 123 4567"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  ڕۆڵ
                </label>
                <select
                  value={editUser.role_id}
                  onChange={(e) => setEditUser(prev => ({ ...prev, role_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  <option value="">ڕۆڵ هەڵبژێرە (ئارەزوومەندانە)</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="flex-1 py-3 px-6 bg-gray-500 text-white font-bold rounded-xl hover:bg-gray-600 transition-colors"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  disabled={updatingUser}
                  className="flex-1 py-3 px-6 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'var(--font-uni-salar)' }}
                >
                  {updatingUser ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      نوێدەکرێتەوە...
                    </>
                  ) : (
                    <>
                      <FaSave className="inline mr-2" />
                      نوێکردنەوە
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}