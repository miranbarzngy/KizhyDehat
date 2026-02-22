"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaShieldAlt, FaUsers, FaHistory } from "react-icons/fa";
import ConfirmModal from "@/components/ConfirmModal";
import StatCards from "@/components/admin/StatCards";
import UserTab from "@/components/admin/UserTab";
import RoleTab from "@/components/admin/RoleTab";
import ActivityTab from "@/components/admin/ActivityTab";
import UserModal from "@/components/admin/UserModal";
import { useAdminData } from "@/components/admin/useAdminData";
import { ActivityActions, EntityTypes } from "@/lib/activityLogger";
import { logActivity } from "@/lib/activityLogger";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminPage() {
  const {
    users, roles, loading, activeTab, showCreateUser, showCreateRole, editingUser,
    newUserName, newUserImage, newUserPhone, newUserLocation, newUserEmail, newUserPassword, selectedRoleId, newUserIsActive,
    setActiveTab, setShowCreateUser, setShowCreateRole, setNewUserName, setNewUserImage, setNewUserPhone, setNewUserLocation, 
    setNewUserEmail, setNewUserPassword, setSelectedRoleId, setNewUserIsActive,
    fetchUsers, fetchRoles, handleCreateUser, handleUpdateUser, handleDeleteUser, handleEditUser, resetUserForm,
    handleCreateRole, handleUpdateRole, handleDeleteRole, handleEditRole, resetRoleForm
  } = useAdminData();

  // Confirm modal state for delete operations
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'success',
    onConfirm: () => {}
  })
  const [pendingDeleteUser, setPendingDeleteUser] = useState<{userId: string, userName: string} | null>(null)

  // Wrapper function for delete user with confirmation modal
  const handleDeleteUserWithConfirm = async (userId: string, userName: string) => {
    setPendingDeleteUser({ userId, userName })
    setConfirmModalConfig({
      title: 'سڕینەوەی بەکارهێنەر',
      message: `دڵنیایت لە سڕینەوەی "${userName}"؟`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch("/api/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: userId }) });
          if (!response.ok) throw new Error("Failed");
          fetchUsers();
        } catch (error) {
          console.error("Error deleting user:", error);
        }
        setShowConfirmModal(false)
        setPendingDeleteUser(null)
      }
    })
    setShowConfirmModal(true)
  }

  useEffect(() => { fetchUsers(); fetchRoles(); }, []);

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
                بەڕێوەبردنی بەکارهێنەران و ڕۆڵەکان
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
              onClick={() => setActiveTab("activity")} 
              className="flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
              style={{ 
                fontFamily: 'var(--font-uni-salar)',
                background: activeTab === "activity" ? 'var(--theme-accent)' : 'transparent',
                color: activeTab === "activity" ? '#ffffff' : 'var(--theme-secondary)'
              }}
            >
              <FaHistory /> چاودێری سیستم
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
                  onDeleteUser={handleDeleteUserWithConfirm} 
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
            {activeTab === "activity" && (
              <motion.div key="activity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <ActivityTab />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* User Modal */}
      <UserModal
        showCreateUser={showCreateUser}
        editingUser={editingUser}
        newUserName={newUserName}
        newUserImage={newUserImage}
        newUserPhone={newUserPhone}
        newUserLocation={newUserLocation}
        newUserEmail={newUserEmail}
        newUserPassword={newUserPassword}
        selectedRoleId={selectedRoleId}
        newUserIsActive={newUserIsActive}
        roles={roles}
        onClose={() => { setShowCreateUser(false); resetUserForm(); }}
        onSetName={setNewUserName}
        onSetImage={setNewUserImage}
        onSetPhone={setNewUserPhone}
        onSetLocation={setNewUserLocation}
        onSetEmail={setNewUserEmail}
        onSetPassword={setNewUserPassword}
        onSetRoleId={setSelectedRoleId}
        onSetIsActive={setNewUserIsActive}
        onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
      />

      {/* Confirm Modal for delete operations */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText="سڕینەوە"
        cancelText="پاشگەزبوونەوە"
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setShowConfirmModal(false)}
        type={confirmModalConfig.type}
      />
    </div>
  );
}
