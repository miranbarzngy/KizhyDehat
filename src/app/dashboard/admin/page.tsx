"use client";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaCog, FaShieldAlt, FaUsers } from "react-icons/fa";
import StatCards from "@/components/admin/StatCards";
import UserTab from "@/components/admin/UserTab";
import RoleTab from "@/components/admin/RoleTab";
import SettingsTab from "@/components/admin/SettingsTab";
import UserModal from "@/components/admin/UserModal";
import RoleModal from "@/components/admin/RoleModal";

interface User {
  id: string;
  name?: string;
  image?: string;
  phone?: string;
  location?: string;
  email?: string;
  role_id: string;
  is_active?: boolean;
  role?: {
    name: string;
    permissions: Record<string, boolean>;
  };
}

interface Role {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
}

interface ShopSettings {
  id: string;
  shop_name: string;
  shop_logo: string;
  shop_phone: string;
  shop_address: string;
  qr_code_url: string;
  auto_logout_minutes?: number;
}

type AdminTab = "users" | "roles" | "settings";

export default function AdminPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [shopSettingsForm, setShopSettingsForm] = useState<
    Partial<ShopSettings>
  >({});
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);

  // User form states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserImage, setNewUserImage] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserLocation, setNewUserLocation] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [newUserIsActive, setNewUserIsActive] = useState(true);

  // Role form states
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
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
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchShopSettings();
  }, []);

  const fetchUsers = async () => {
    if (!supabase) {
      const demoUsers: User[] = [
        {
          id: "demo-user-1",
          name: "ئەحمەد محەمەد",
          image: "",
          phone: "+964 750 123 4567",
          location: "هەولێر",
          email: "ahmed@example.com",
          role_id: "admin-role",
          role: {
            name: "Admin",
            permissions: {
              sales: true,
              inventory: true,
              customers: true,
              suppliers: true,
              payroll: true,
              profits: true,
            },
          },
        },
        {
          id: "demo-user-2",
          name: "فاطمە عەلی",
          image: "",
          phone: "+964 751 987 6543",
          location: "سلێمانی",
          email: "fatima@example.com",
          role_id: "manager-role",
          role: {
            name: "Manager",
            permissions: {
              sales: true,
              inventory: true,
              customers: true,
              suppliers: false,
              payroll: false,
              profits: true,
            },
          },
        },
      ];
      setUsers(demoUsers);
      return;
    }

    try {
      const { data: rolesData } = await supabase
        .from("roles")
        .select("id, name, permissions");
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, name, image, phone, location, email, role_id, is_active");

      const usersWithRoles: User[] =
        usersData?.map((user) => ({
          ...user,
          role:
            rolesData?.find((role) => role.id === user.role_id) || undefined,
        })) || [];
      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

  const fetchRoles = async () => {
    if (!supabase) {
      setRoles([
        {
          id: "admin-role",
          name: "Admin",
          permissions: {
            sales: true,
            inventory: true,
            customers: true,
            suppliers: true,
            payroll: true,
            profits: true,
          },
        },
        {
          id: "manager-role",
          name: "Manager",
          permissions: {
            sales: true,
            inventory: true,
            customers: true,
            suppliers: false,
            payroll: false,
            profits: true,
          },
        },
        {
          id: "cashier-role",
          name: "Cashier",
          permissions: {
            sales: true,
            inventory: false,
            customers: false,
            suppliers: false,
            payroll: false,
            profits: false,
          },
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from("roles").select("*");
      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([
        {
          id: "admin-role",
          name: "Admin",
          permissions: {
            sales: true,
            inventory: true,
            customers: true,
            suppliers: true,
            payroll: true,
            profits: true,
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchShopSettings = async () => {
    if (!supabase) {
      const demoSettings: ShopSettings = {
        id: "demo-shop",
        shop_name: "فرۆشگای کوردستان",
        shop_logo: "",
        shop_phone: "+964 750 123 4567",
        shop_address: "هەولێر، کوردستان",
        qr_code_url: "",
        auto_logout_minutes: 15,
      };
      setShopSettings(demoSettings);
      setShopSettingsForm(demoSettings);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("invoice_settings")
        .select("*")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      
      console.log("Fetched shop settings from DB:", data);
      
      setShopSettings(data || null);
      if (data) {
        setShopSettingsForm({
          ...data,
          auto_logout_minutes: data.auto_logout_minutes ?? 15,
        });
      }
    } catch (error) {
      console.error("Error fetching shop settings:", error);
    }
  };

  // User actions
  const handleCreateUser = async () => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          image: newUserImage,
          phone: newUserPhone,
          location: newUserLocation,
          email: newUserEmail,
          password: newUserPassword,
          roleId: selectedRoleId,
          isActive: newUserIsActive,
        }),
      });
      if (!response.ok) throw new Error("Failed to create user");
      setShowCreateUser(false);
      resetUserForm();
      fetchUsers();
      alert("بەکارهێنەر بە سەرکەوتوویی زیادکرا");
    } catch (error) {
      console.error("Error creating user:", error);
      alert(`هەڵە: ${error}`);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          name: newUserName,
          image: newUserImage,
          phone: newUserPhone,
          location: newUserLocation,
          email: newUserEmail,
          password: newUserPassword || undefined,
          roleId: selectedRoleId,
          isActive: newUserIsActive,
        }),
      });
      if (!response.ok) throw new Error("Failed to update user");
      setShowCreateUser(false);
      setEditingUser(null);
      resetUserForm();
      fetchUsers();
      alert("بەکارهێنەر بە سەرکەوتوویی نوێکرایەوە");
    } catch (error) {
      console.error("Error updating user:", error);
      alert(`هەڵە: ${error}`);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`دڵنیایت لە سڕینەوەی بەکارهێنەر "${userName}"؟`)) return;
    try {
      const response = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });
      if (!response.ok) throw new Error("Failed to delete user");
      fetchUsers();
      alert("بەکارهێنەر بە سەرکەوتوویی سڕدرایەوە");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(`هەڵە: ${error}`);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUserName(user.name || "");
    setNewUserImage(user.image || "");
    setNewUserPhone(user.phone || "");
    setNewUserLocation(user.location || "");
    setNewUserEmail(user.email || "");
    setNewUserPassword("");
    setSelectedRoleId(user.role_id || "");
    setNewUserIsActive(user.is_active !== false);
    setShowCreateUser(true);
  };

  const resetUserForm = () => {
    setNewUserName("");
    setNewUserImage("");
    setNewUserPhone("");
    setNewUserLocation("");
    setNewUserEmail("");
    setNewUserPassword("");
    setSelectedRoleId("");
    setNewUserIsActive(true);
  };

  // Role actions
  const handleCreateRole = async () => {
    if (!supabase) {
      alert("دۆخی دیمۆ: ناتوانرێت ڕۆڵ زیاد بکرێت");
      return;
    }
    try {
      const { error } = await supabase
        .from("roles")
        .insert({ name: newRoleName, permissions });
      if (error) throw error;
      setShowCreateRole(false);
      resetRoleForm();
      fetchRoles();
      alert("ڕۆڵ بە سەرکەوتوویی زیادکرا");
    } catch (error) {
      console.error("Error creating role:", error);
      alert("هەڵە لە زیادکردنی ڕۆڵ");
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole || !supabase) return;
    try {
      const { error } = await supabase
        .from("roles")
        .update({ name: newRoleName, permissions })
        .eq("id", editingRole.id);
      if (error) throw error;
      setShowCreateRole(false);
      setEditingRole(null);
      resetRoleForm();
      fetchRoles();
      alert("ڕۆڵ بە سەرکەوتوویی نوێکرایەوە");
    } catch (error) {
      console.error("Error updating role:", error);
      alert("هەڵە لە نوێکردنەوەی ڕۆڵ");
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    const usersWithRole = users.filter((user) => user.role_id === roleId);
    if (usersWithRole.length > 0) {
      alert(
        `ناتوانرێت ڕۆڵ بسڕدرێتەوە چونکە ${usersWithRole.length} بەکارهێنەر ئەم ڕۆڵە بەکاردەهێنن.`,
      );
      return;
    }
    if (!confirm(`دڵنیایت لە سڕینەوەی ڕۆڵی "${roleName}"؟`)) return;
    if (!supabase) return;
    try {
      const { error } = await supabase.from("roles").delete().eq("id", roleId);
      if (error) throw error;
      fetchRoles();
      alert("ڕۆڵ بە سەرکەوتوویی سڕدرایەوە");
    } catch (error) {
      console.error("Error deleting role:", error);
      alert("هەڵە لە سڕینەوەی ڕۆڵ");
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setPermissions(role.permissions);
    setShowCreateRole(true);
  };

  const resetRoleForm = () => {
    setEditingRole(null);
    setNewRoleName("");
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
    });
  };

  // Settings actions
  const updateShopSettingsField = async (field: string, value: string | number) => {
    if (!supabase) return;
    try {
      const fieldMapping: Record<string, string> = {
        shop_name: 'shop_name',
        shop_phone: 'shop_phone', 
        shop_address: 'shop_address',
        shop_logo: 'shop_logo',
        qr_code_url: 'qr_code_url',
        auto_logout_minutes: 'auto_logout_minutes',
      };
      
      const dbField = fieldMapping[field] || field;
      const updateData: any = {
        [dbField]: value,
      };
      
      if (shopSettings) {
        await supabase
          .from("invoice_settings")
          .update(updateData)
          .eq("id", shopSettings.id);
      } else {
        await supabase.from("invoice_settings").insert(updateData);
      }
      fetchShopSettings();
    } catch (error) {
      console.error("Error updating shop settings:", error);
    }
  };

  const handleImageUpload = async (file: File, field: string) => {
    if (!supabase) {
      alert("Supabase not configured");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("وێنەکە زۆر گەورەیە. دەبێت لە 5MB کەمتر بێت.");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("جۆری وێنە نادروستە. تکایە JPEG، PNG یان WebP بەکاربهێنە.");
      return;
    }
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `shop/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);
      if (!urlData?.publicUrl) throw new Error("Failed to get public URL");
      updateShopSettingsField(field, urlData.publicUrl);
    } catch (error) {
      console.error("Image upload failed:", error);
      alert(`هەڵە لە بارکردنی وێنە: ${error}`);
    }
  };

  const updateAllShopSettings = async () => {
    if (!supabase) {
      alert("دۆخی دیمۆ: ناتوانرێت ڕێکخستنەکان بگۆڕدرێن");
      return;
    }
    try {
      // Map to correct column names
      const updateData = {
        shop_name: shopSettingsForm.shop_name || '',
        shop_phone: shopSettingsForm.shop_phone || '',
        shop_address: shopSettingsForm.shop_address || '',
        shop_logo: shopSettingsForm.shop_logo || '',
        qr_code_url: shopSettingsForm.qr_code_url || '',
        auto_logout_minutes: shopSettingsForm.auto_logout_minutes || 15,
      };
      console.log("Saving settings:", updateData);
      
      if (shopSettings) {
        await supabase
          .from("invoice_settings")
          .update(updateData)
          .eq("id", shopSettings.id);
      } else {
        await supabase.from("invoice_settings").insert(updateData);
      }
      alert("ڕێکخستنەکان بە سەرکەوتوویی نوێکرانەوە");
      fetchShopSettings();
      if (typeof window !== "undefined") window.location.reload();
    } catch (error) {
      console.error("Error updating all shop settings:", error);
      alert("هەڵە لە نوێکردنی ڕێکخستنەکان");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 w-full">
      <div className="w-full max-w-7xl mx-auto px-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2"
                style={{ fontFamily: "var(--font-uni-salar)" }}
              >
                بەڕێوەبردنی سیستەم
              </h1>
              <p
                className="text-sm sm:text-base text-gray-600"
                style={{ fontFamily: "var(--font-uni-salar)" }}
              >
                بەڕێوەبردنی بەکارهێنەران، ڕۆڵەکان و ڕێکخستنەکان
              </p>
            </div>
            <StatCards users={users} roles={roles} />
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-row overflow-x-auto whitespace-nowrap gap-1 mb-6 bg-white/60 backdrop-blur-xl rounded-2xl p-1 shadow-lg scrollbar-hide">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-1 ${
                activeTab === "users"
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-white/50"
              }`}
              style={{ fontFamily: "var(--font-uni-salar)" }}
            >
              <FaUsers className="text-base" />
              بەکارهێنەران
            </button>
            <button
              onClick={() => setActiveTab("roles")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-1 ${
                activeTab === "roles"
                  ? "bg-purple-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-white/50"
              }`}
              style={{ fontFamily: "var(--font-uni-salar)" }}
            >
              <FaShieldAlt className="text-base" />
              ڕۆڵەکان
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-1 ${
                activeTab === "settings"
                  ? "bg-green-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-white/50"
              }`}
              style={{ fontFamily: "var(--font-uni-salar)" }}
            >
              <FaCog className="text-base" />
              ڕێکخستنەکان
            </button>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "users" && (
              <motion.div
                key="users"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <UserTab
                  users={users}
                  onCreateUser={() => setShowCreateUser(true)}
                  onEditUser={handleEditUser}
                  onDeleteUser={handleDeleteUser}
                />
              </motion.div>
            )}

            {activeTab === "roles" && (
              <motion.div
                key="roles"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RoleTab
                  roles={roles}
                  onCreateRole={() => setShowCreateRole(true)}
                  onEditRole={handleEditRole}
                  onDeleteRole={handleDeleteRole}
                />
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SettingsTab
                  shopSettings={shopSettings}
                  shopSettingsForm={shopSettingsForm}
                  onUpdateForm={updateShopSettingsField}
                  onImageUpload={handleImageUpload}
                  onSaveAll={updateAllShopSettings}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Modals */}
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
        onClose={() => {
          setShowCreateUser(false);
          setEditingUser(null);
          resetUserForm();
        }}
        onSetName={setNewUserName}
        onSetImage={setNewUserImage}
        onSetPhone={setNewUserPhone}
        onSetLocation={setNewUserLocation}
        onSetEmail={setNewUserEmail}
        onSetPassword={setNewUserPassword}
        onSetRoleId={setSelectedRoleId}
        onSetIsActive={setNewUserIsActive}
        onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
        onImageUpload={() => {}}
      />

      <RoleModal
        showCreateRole={showCreateRole}
        editingRole={editingRole}
        newRoleName={newRoleName}
        permissions={permissions}
        onClose={() => {
          setShowCreateRole(false);
          setEditingRole(null);
          resetRoleForm();
        }}
        onSetName={setNewRoleName}
        onTogglePermission={(key) =>
          setPermissions((prev) => ({ ...prev, [key]: !prev[key] }))
        }
        onSubmit={editingRole ? handleUpdateRole : handleCreateRole}
      />
    </div>
  );
}
