'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface User {
  id: string
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

export default function AdminPage() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')
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
    if (profile?.role?.name === 'Admin') {
      fetchUsers()
      fetchRoles()
    }
  }, [profile])

  const fetchUsers = async () => {
    // Demo mode: show sample users data when Supabase is not configured
    if (!supabase) {
      const demoUsers: User[] = [
        {
          id: 'demo-user-1',
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
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          role_id,
          roles (
            name,
            permissions
          )
        `)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
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
      const { data, error } = await supabase
        .from('roles')
        .select('*')

      if (error) throw error
      setRoles(data || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true
      })

      if (authError) throw authError

      // Then create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          role_id: selectedRoleId
        })

      if (profileError) throw profileError

      setShowCreateUser(false)
      setNewUserEmail('')
      setNewUserPassword('')
      setSelectedRoleId('')
      fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Error creating user')
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

  if (profile?.role?.name !== 'Admin') {
    return <div className="text-center text-red-600">دەستپێڕاگەیشتن نیە</div>
  }

  if (loading) {
    return <div className="text-center">بارکردن...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">بەڕێوەبردنی بەکارهێنەران و ڕۆڵەکان</h1>

      <div className="space-y-8">
        {/* Users Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">بەکارهێنەران</h2>
            <button
              onClick={() => setShowCreateUser(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              زیادکردنی بەکارهێنەر
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-right">ID بەکارهێنەر</th>
                  <th className="px-4 py-2 text-right">ڕۆڵ</th>
                  <th className="px-4 py-2 text-right">کردارەکان</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-2">{user.id}</td>
                    <td className="px-4 py-2">
                      <select
                        value={user.role_id || ''}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="">هەڵبژاردن</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <button className="text-red-600 hover:text-red-800">سڕینەوە</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">زیادکردنی بەکارهێنەر</h3>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="ئیمەیڵ"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="password"
                placeholder="وشەی نهێنی"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
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
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowCreateUser(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={createUser}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                زیادکردن
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
