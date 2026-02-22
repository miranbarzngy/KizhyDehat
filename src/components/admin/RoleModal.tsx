'use client'

interface Role {
  id: string
  name: string
  permissions: Record<string, boolean>
}

interface RoleModalProps {
  showCreateRole: boolean
  editingRole: Role | null
  newRoleName: string
  permissions: Record<string, boolean>
  onClose: () => void
  onSetName: (value: string) => void
  onTogglePermission: (key: string) => void
  onSubmit: () => void
}

const permissionList = [
  { key: 'dashboard', name: 'داشبۆرد', icon: '📊' },
  { key: 'sales', name: 'فرۆشتن', icon: '💰' },
  { key: 'inventory', name: 'کۆگا', icon: '📦' },
  { key: 'customers', name: 'کڕیاران', icon: '👥' },
  { key: 'suppliers', name: 'دابینکاران', icon: '🏭' },
  { key: 'expenses', name: 'خەرجییەکان', icon: '💸' },
  { key: 'profits', name: 'قازانج', icon: '📈' },
  { key: 'help', name: 'یارمەتی', icon: '❓' },
  { key: 'admin', name: 'بەڕێوەبەران', icon: '⚙️' }
]

export default function RoleModal({
  showCreateRole,
  editingRole,
  newRoleName,
  permissions,
  onClose,
  onSetName,
  onTogglePermission,
  onSubmit,
}: RoleModalProps) {
  if (!showCreateRole) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white p-6 rounded-2xl w-[90%] max-w-md max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: 'var(--font-uni-salar)' }}
      >
        <h3 
          className="text-xl font-bold mb-4 text-gray-800"
        >
          {editingRole ? 'نوێکردنەوەی ڕۆڵ' : 'زیادکردنی ڕۆڵ'}
        </h3>
        
        {/* Role Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">ناوی ڕۆڵ</label>
          <input
            type="text"
            placeholder="ناوی ڕۆڵ"
            value={newRoleName}
            onChange={(e) => onSetName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Permissions */}
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-700">مۆڵەتەکان</label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {permissionList.map((perm) => (
              <label 
                key={perm.key} 
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={permissions[perm.key]}
                  onChange={() => onTogglePermission(perm.key)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-lg">{perm.icon}</span>
                <span className="font-medium text-gray-700">{perm.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => {
              onClose()
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            پاشگەزبوونەوە
          </button>
          <button
            onClick={onSubmit}
            className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            {editingRole ? 'نوێکردنەوە' : 'زیادکردن'}
          </button>
        </div>
      </div>
    </div>
  )
}
