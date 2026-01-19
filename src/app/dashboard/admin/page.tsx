'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

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

export default function AdminPage() {
  const { profile } = useAuth()
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
    sales: false,
    inventory: false,
    customers: false,
    suppliers: false,
    payroll: false,
    profits: false,
  })

  useEffect(() => {
    // Check for admin access - support role ID, Kurdish, English role names, case-insensitive
    const isAdmin = profile?.role_id === '6dc4d359-8907-4815-baa7-9e003b662f2a' ||
                    profile?.role?.name?.toLowerCase() === 'ئادمین' ||
                    profile?.role?.name?.toLowerCase() === 'admin' ||
                    profile?.role?.name?.toLowerCase() === 'administrator'

    if (isAdmin) {
      fetchUsers()
      fetchRoles()
      fetchShopSettings()
    }
  }, [profile])

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
      // Fetch users with proper join to roles table
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          image,
          phone,
          location,
          email,
          role_id,
          roles!inner (
            id,
            name,
            permissions
          )
        `)

      if (error) {
        console.error('Error fetching users with roles:', error)
        // Fallback: fetch users without role join and manually fetch roles
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, name, image, phone, location, email, role_id')

        if (usersError) throw usersError

        // Fetch all roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('id, name, permissions')

        if (rolesError) throw rolesError

        // Map roles to users
        const usersWithRoles: User[] = usersData?.map(user => ({
          ...user,
          role: rolesData?.find(role => role.id === user.role_id) || undefined
        })) || []

        setUsers(usersWithRoles)
      } else {
        // Transform the data to match our interface
        const transformedData: User[] = data?.map(user => ({
          id: user.id,
          name: user.name,
          image: user.image,
          phone: user.phone,
          location: user.location,
          email: user.email,
          role_id: user.role_id,
          role: user.roles && Array.isArray(user.roles) && user.roles.length > 0 ? {
            name: user.roles[0].name,
            permissions: user.roles[0].permissions
          } : undefined
        })) || []

        setUsers(transformedData)
      }
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
        sales: false,
        inventory: false,
        customers: false,
        suppliers: false,
        payroll: false,
        profits: false,
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

  // Check for admin access - support Kurdish, English role names, and role ID, case-insensitive
  const isAdmin = profile?.role_id === '6dc4d359-8907-4815-baa7-9e003b662f2a' ||
                  profile?.role?.name?.toLowerCase() === 'ئادمین' ||
                  profile?.role?.name?.toLowerCase() === 'admin' ||
                  profile?.role?.name?.toLowerCase() === 'administrator'

  if (!isAdmin) {
    return <div className="text-center text-red-600">دەستپێڕاگەیشتن نیە</div>
  }

  if (loading) {
    return <div className="text-center">چاوەڕوانبە...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">بەڕێوەبردنی بەکارهێنەران و ڕۆڵەکان</h1>

      <div className="space-y-8">
        {/* Users Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەکارهێنەران</h2>
            <button
              onClick={() => setShowCreateUser(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              زیادکردنی بەکارهێنەر
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div key={user.id} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl text-gray-600">👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      {user.name || 'ناوی نەناسراو'}
                    </h3>
                    <p className="text-sm text-gray-600">{user.role?.name || 'ڕۆڵی نەناسراو'}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium" style={{ fontFamily: 'var(--font-uni-salar)' }}>تەلەفۆن:</span>
                    <span>{user.phone || 'نەناسراو'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناونیشان:</span>
                    <span>{user.location || 'نەناسراو'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium" style={{ fontFamily: 'var(--font-uni-salar)' }}>ئیمەیڵ:</span>
                    <span>{user.email || 'نەناسراو'}</span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => editUser(user)}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm"
                  >
                    نوێکردنەوە
                  </button>
                  <button className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm">
                    سڕینەوە
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roles Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">ڕۆڵەکان</h2>
            <button
              onClick={() => setShowCreateRole(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              زیادکردنی ڕۆڵ
            </button>
          </div>

          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="border p-4 rounded">
                <h3 className="font-semibold">{role.name}</h3>
                <p className="text-sm text-gray-600">
                  مۆڵەتەکان: {Object.keys(role.permissions).filter(key => role.permissions[key]).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Shop Settings Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6">ڕێکخستنەکانی فرۆشگا</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shop Name */}
            <div>
              <label className="block text-sm font-medium mb-2">ناوی فرۆشگا</label>
              <input
                type="text"
                value={shopSettingsForm.shopname || ''}
                onChange={(e) => setShopSettingsForm(prev => ({ ...prev, shopname: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                placeholder="ناوی فرۆشگاکەت"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-2">ژمارەی تەلەفۆن</label>
              <input
                type="text"
                value={shopSettingsForm.phone || ''}
                onChange={(e) => setShopSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                placeholder="+964 XXX XXX XXXX"
              />
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">ناونیشان</label>
              <input
                type="text"
                value={shopSettingsForm.location || ''}
                onChange={(e) => setShopSettingsForm(prev => ({ ...prev, location: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                placeholder="ناونیشانی فرۆشگاکەت"
              />
            </div>

            {/* Shop Icon */}
            <div>
              <label className="block text-sm font-medium mb-2">وێنەی ئایکۆن</label>
              {shopSettings?.icon && (
                <div className="mb-2">
                  <img
                    src={shopSettings.icon}
                    alt="Shop Icon"
                    className="w-16 h-16 object-cover rounded border"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImageUpload(file, 'icon')
                  }
                }}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* QR Code Image */}
            <div>
              <label className="block text-sm font-medium mb-2">وێنەی QR کۆد</label>
              {shopSettings?.qrcodeimage && (
                <div className="mb-2">
                  <img
                    src={shopSettings.qrcodeimage}
                    alt="QR Code"
                    className="w-16 h-16 object-cover rounded border"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImageUpload(file, 'qrcodeimage')
                  }
                }}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Update All Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={updateAllShopSettings}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 font-semibold"
            >
              نوێکردنی هەموو زانیارییەکان
            </button>
          </div>

          {/* Current Settings Display */}
          {shopSettings && (
            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">ڕێکخستنەکانی ئێستا:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>ناو:</strong> {shopSettings.shopname}</div>
                <div><strong>تەلەفۆن:</strong> {shopSettings.phone}</div>
                <div className="md:col-span-2"><strong>ناونیشان:</strong> {shopSettings.location}</div>
                <div><strong>ئایکۆن:</strong> {shopSettings.icon ? '✅ هەیە' : '❌ نییە'}</div>
                <div><strong>QR کۆد:</strong> {shopSettings.qrcodeimage ? '✅ هەیە' : '❌ نییە'}</div>
              </div>
            </div>
          )}
        </div>
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
                  onChange={(e) => setNewUserPhone(e.target.value)}
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

      {/* Create Role Modal */}
      {showCreateRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">زیادکردنی ڕۆڵ</h3>
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
                {Object.keys(permissions).map((perm) => (
                  <label key={perm} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions[perm]}
                      onChange={(e) => setPermissions(prev => ({ ...prev, [perm]: e.target.checked }))}
                    />
                    <span>{perm}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowCreateRole(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={createRole}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                زیادکردن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
