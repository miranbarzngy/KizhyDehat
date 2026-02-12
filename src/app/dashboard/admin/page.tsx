"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { FaCog, FaShieldAlt, FaUsers } from "react-icons/fa";
import StatCards from "@/components/admin/StatCards";
import UserTab from "@/components/admin/UserTab";
import RoleTab from "@/components/admin/RoleTab";
import SettingsTab from "@/components/admin/SettingsTab";
import UserModal from "@/components/admin/UserModal";
import RoleModal from "@/components/admin/RoleModal";
import { useAdminData } from "@/components/admin/useAdminData";

export default function AdminPage() {
  const {
    users, roles, shopSettings, shopSettingsForm, loading, activeTab, showCreateUser, showCreateRole, editingUser,
    newUserName, newUserImage, newUserPhone, newUserLocation, newUserEmail, newUserPassword, selectedRoleId, newUserIsActive,
    editingRole, newRoleName, permissions,
    setActiveTab, setShowCreateUser, setShowCreateRole, setNewUserName, setNewUserImage, setNewUserPhone, setNewUserLocation,
    setNewUserEmail, setNewUserPassword, setSelectedRoleId, setNewUserIsActive, setNewRoleName, setPermissions,
    fetchUsers, fetchRoles, fetchShopSettings, handleCreateUser, handleUpdateUser, handleDeleteUser, handleEditUser, resetUserForm,
    handleCreateRole, handleUpdateRole, handleDeleteRole, handleEditRole, resetRoleForm, updateShopSettingsField, handleImageUpload, updateAllShopSettings
  } = useAdminData();

  useEffect(() => { fetchUsers(); fetchRoles(); fetchShopSettings(); }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-transparent w-full p-6 pl-0 md:pl-6 transition-colors duration-300">
      <div className="w-full max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەڕێوەبردنی سیستەم</h1>
              <p className="text-gray-600 dark:text-gray-300" style={{ fontFamily: 'var(--font-uni-salar)' }}>بەڕێوەبردنی بەکارهێنەران، ڕۆڵەکان و ڕێکخستنەکان</p>
            </div>
            <StatCards users={users} roles={roles} />
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-row overflow-x-auto whitespace-nowrap gap-2 mb-8 bg-gray-100/80 dark:bg-[#2a2d3e]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-xl rounded-2xl p-2 transition-all duration-300">
            <button onClick={() => setActiveTab("users")} className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === "users" ? "bg-blue-500 text-white shadow-lg" : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10"}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
              <FaUsers /> بەکارهێنەران
            </button>
            <button onClick={() => setActiveTab("roles")} className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === "roles" ? "bg-purple-500 text-white shadow-lg" : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10"}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
              <FaShieldAlt /> ڕۆڵەکان
            </button>
            <button onClick={() => setActiveTab("settings")} className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === "settings" ? "bg-green-500 text-white shadow-lg" : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10"}`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
              <FaCog /> ڕێکخستنەکان
            </button>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "users" && (
              <motion.div key="users" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                <UserTab users={users} onCreateUser={() => setShowCreateUser(true)} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} />
              </motion.div>
            )}
            {activeTab === "roles" && (
              <motion.div key="roles" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <RoleTab roles={roles} onCreateRole={() => setShowCreateRole(true)} onEditRole={handleEditRole} onDeleteRole={handleDeleteRole} />
              </motion.div>
            )}
            {activeTab === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <SettingsTab shopSettings={shopSettings} shopSettingsForm={shopSettingsForm} onUpdateForm={updateShopSettingsField} onImageUpload={handleImageUpload} onSaveAll={updateAllShopSettings} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Modals */}
      <UserModal showCreateUser={showCreateUser} editingUser={editingUser} newUserName={newUserName} newUserImage={newUserImage} newUserPhone={newUserPhone} newUserLocation={newUserLocation} newUserEmail={newUserEmail} newUserPassword={newUserPassword} selectedRoleId={selectedRoleId} newUserIsActive={newUserIsActive} roles={roles} onClose={() => { setShowCreateUser(false); setEditingUser(null); resetUserForm(); }} onSetName={setNewUserName} onSetImage={setNewUserImage} onSetPhone={setNewUserPhone} onSetLocation={setNewUserLocation} onSetEmail={setNewUserEmail} onSetPassword={setNewUserPassword} onSetRoleId={setSelectedRoleId} onSetIsActive={setNewUserIsActive} onSubmit={editingUser ? handleUpdateUser : handleCreateUser} onImageUpload={() => {}} />
      <RoleModal showCreateRole={showCreateRole} editingRole={editingRole} newRoleName={newRoleName} permissions={permissions} onClose={() => { setShowCreateRole(false); setEditingRole(null); resetRoleForm(); }} onSetName={setNewRoleName} onTogglePermission={(key) => setPermissions((prev) => ({ ...prev, [key]: !prev[key] }))} onSubmit={editingRole ? handleUpdateRole : handleCreateRole} />
    </div>
  );
}
