"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { FaCog, FaShieldAlt, FaUsers } from "react-icons/fa";
import StatCards from "@/components/admin/StatCards";
import UserTab from "@/components/admin/UserTab";
import RoleTab from "@/components/admin/RoleTab";
import SettingsTab from "@/components/admin/SettingsTab";
import { useAdminData } from "@/components/admin/useAdminData";

export default function AdminPage() {
  const {
    users, roles, shopSettings, loading, activeTab, showCreateUser, showCreateRole, editingUser,
    newUserName, newUserEmail, selectedRoleId,
    setActiveTab, setShowCreateUser, setShowCreateRole, setNewUserName, setNewUserEmail, setSelectedRoleId,
    fetchUsers, fetchRoles, fetchShopSettings, handleCreateUser, handleUpdateUser, handleDeleteUser, handleEditUser, resetUserForm,
    handleCreateRole, handleUpdateRole, handleDeleteRole, handleEditRole, resetRoleForm
  } = useAdminData();

  useEffect(() => { fetchUsers(); fetchRoles(); fetchShopSettings(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--theme-background)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--theme-accent)' }}></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 w-full" style={{ background: 'var(--theme-background)', minHeight: '100vh' }}>
      <div className="w-full max-w-[2800px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex-1">
              <h1 
                className="text-4xl font-bold mb-2"
                style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
              >
                بەڕێوەبردنی سیستەم
              </h1>
              <p 
                style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
              >
                بەڕێوەبردنی بەکارهێنەران، ڕۆڵەکان و ڕێکخستنەکان
              </p>
            </div>
            <StatCards users={users} roles={roles} />
          </div>

          {/* Tab Navigation */}
          <div 
            className="flex flex-row overflow-x-auto whitespace-nowrap gap-2 mb-8 backdrop-blur-xl border shadow-sm rounded-2xl p-2 transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--theme-card-bg)',
              borderColor: 'var(--theme-card-border)'
            }}
          >
            <button 
              onClick={() => setActiveTab("users")} 
              className="flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
              style={{ 
                fontFamily: 'var(--font-uni-salar)',
                background: activeTab === "users" ? 'var(--theme-accent)' : 'transparent',
                color: activeTab === "users" ? '#ffffff' : 'var(--theme-secondary)'
              }}
            >
              <FaUsers /> بەکارهێنەران
            </button>
            <button 
              onClick={() => setActiveTab("roles")} 
              className="flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
              style={{ 
                fontFamily: 'var(--font-uni-salar)',
                background: activeTab === "roles" ? 'var(--theme-accent)' : 'transparent',
                color: activeTab === "roles" ? '#ffffff' : 'var(--theme-secondary)'
              }}
            >
              <FaShieldAlt /> ڕۆڵەکان
            </button>
            <button 
              onClick={() => setActiveTab("settings")} 
              className="flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
              style={{ 
                fontFamily: 'var(--font-uni-salar)',
                background: activeTab === "settings" ? 'var(--theme-accent)' : 'transparent',
                color: activeTab === "settings" ? '#ffffff' : 'var(--theme-secondary)'
              }}
            >
              <FaCog /> ڕێکخستنەکان
            </button>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "users" && (
              <motion.div key="users" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                <UserTab 
                  users={users} 
                  onCreateUser={() => setShowCreateUser(true)} 
                  onEditUser={handleEditUser} 
                  onDeleteUser={handleDeleteUser} 
                />
              </motion.div>
            )}
            {activeTab === "roles" && (
              <motion.div key="roles" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <RoleTab 
                  roles={roles} 
                  onCreateRole={() => setShowCreateRole(true)} 
                  onEditRole={handleEditRole} 
                  onDeleteRole={handleDeleteRole} 
                />
              </motion.div>
            )}
            {activeTab === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <SettingsTab shopSettings={shopSettings} onUpdateForm={() => {}} onImageUpload={() => {}} onSaveAll={() => {}} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
