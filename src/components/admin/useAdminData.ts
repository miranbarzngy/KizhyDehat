import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Role, ShopSettings, AdminTab } from './types';

interface UseAdminDataReturn {
  users: User[];
  roles: Role[];
  shopSettings: ShopSettings | null;
  shopSettingsForm: Partial<ShopSettings>;
  loading: boolean;
  activeTab: AdminTab;
  showCreateUser: boolean;
  showCreateRole: boolean;
  editingUser: User | null;
  newUserName: string;
  newUserImage: string;
  newUserPhone: string;
  newUserLocation: string;
  newUserEmail: string;
  newUserPassword: string;
  selectedRoleId: string;
  newUserIsActive: boolean;
  editingRole: Role | null;
  newRoleName: string;
  permissions: Record<string, boolean>;
  setActiveTab: (tab: AdminTab) => void;
  setShowCreateUser: (show: boolean) => void;
  setShowCreateRole: (show: boolean) => void;
  setNewUserName: (name: string) => void;
  setNewUserImage: (image: string) => void;
  setNewUserPhone: (phone: string) => void;
  setNewUserLocation: (location: string) => void;
  setNewUserEmail: (email: string) => void;
  setNewUserPassword: (password: string) => void;
  setSelectedRoleId: (roleId: string) => void;
  setNewUserIsActive: (isActive: boolean) => void;
  setNewRoleName: (name: string) => void;
  setPermissions: (perms: Record<string, boolean>) => void;
  togglePermission: (key: string) => void;
  fetchUsers: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchShopSettings: () => Promise<void>;
  handleCreateUser: () => Promise<void>;
  handleUpdateUser: () => Promise<void>;
  handleDeleteUser: (userId: string, userName: string) => Promise<void>;
  handleEditUser: (user: User) => void;
  resetUserForm: () => void;
  handleCreateRole: () => Promise<void>;
  handleUpdateRole: () => Promise<void>;
  handleDeleteRole: (roleId: string, roleName: string) => Promise<void>;
  handleEditRole: (role: Role) => void;
  resetRoleForm: () => void;
  updateShopSettingsField: (field: string, value: string | number) => Promise<void>;
  handleImageUpload: (file: File, field: string) => Promise<void>;
  handleQRCodeUpload: (file: File) => Promise<void>;
  updateAllShopSettings: () => Promise<void>;
}

const DEFAULT_PERMISSIONS = {
  dashboard: false, sales: false, inventory: false, customers: false,
  suppliers: false, expenses: false, profits: false, help: false, admin: false,
};

const DEMO_USERS: User[] = [
  { id: "demo-user-1", name: "ئەحمەد محەمەد", image: "", phone: "+964 750 123 4567", location: "هەولێر", email: "ahmed@example.com", role_id: "admin-role", role: { name: "Admin", permissions: { sales: true, inventory: true, customers: true, suppliers: true, payroll: true, profits: true } } },
  { id: "demo-user-2", name: "فاطمە عەلی", image: "", phone: "+964 751 987 6543", location: "سلێمانی", email: "fatima@example.com", role_id: "manager-role", role: { name: "Manager", permissions: { sales: true, inventory: true, customers: true, suppliers: false, payroll: false, profits: true } } },
];

const DEMO_ROLES: Role[] = [
  { id: "admin-role", name: "Admin", permissions: { sales: true, inventory: true, customers: true, suppliers: true, payroll: true, profits: true } },
  { id: "manager-role", name: "Manager", permissions: { sales: true, inventory: true, customers: true, suppliers: false, payroll: false, profits: true } },
  { id: "cashier-role", name: "Cashier", permissions: { sales: true, inventory: false, customers: false, suppliers: false, payroll: false, profits: false } },
];

const DEMO_SETTINGS: ShopSettings = {
  id: "demo-shop", shop_name: "فرۆشگای کوردستان", shop_logo: "", shop_phone: "+964 750 123 4567", shop_address: "هەولێر، کوردستان", qr_code_url: "",
};

export function useAdminData(): UseAdminDataReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [shopSettingsForm, setShopSettingsForm] = useState<Partial<ShopSettings>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserImage, setNewUserImage] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserLocation, setNewUserLocation] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [newUserIsActive, setNewUserIsActive] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>(DEFAULT_PERMISSIONS);

  const togglePermission = (key: string) => setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));

  const fetchUsers = useCallback(async () => {
    if (!supabase) { setUsers(DEMO_USERS); return; }
    try {
      const { data: rolesData } = await supabase.from("roles").select("id, name, permissions");
      const { data: usersData } = await supabase.from("profiles").select("id, name, image, phone, location, email, role_id, is_active");
      setUsers(usersData?.map((user) => ({ ...user, role: rolesData?.find((r) => r.id === user.role_id) || undefined })) || []);
    } catch { setUsers([]); }
  }, []);

  const fetchRoles = useCallback(async () => {
    if (!supabase) { setRoles(DEMO_ROLES); setLoading(false); return; }
    try {
      const { data, error } = await supabase.from("roles").select("*");
      if (error) throw error;
      setRoles(data || []);
    } catch { setRoles(DEMO_ROLES); }
    finally { setLoading(false); }
  }, []);

  const fetchShopSettings = useCallback(async () => {
    if (!supabase) { setShopSettings(DEMO_SETTINGS); setShopSettingsForm(DEMO_SETTINGS); return; }
    try {
      // Fetch from shop_settings table
      const { data, error } = await supabase.from("shop_settings").select("*").single();
      if (error && error.code !== "PGRST116") throw error;
      setShopSettings(data || null);
      if (data) setShopSettingsForm({ 
        shop_name: data.shopname || '', 
        shop_logo: data.icon || '', 
        shop_phone: data.phone || '', 
        shop_address: data.location || '', 
        qr_code_url: data.qrcodeimage || ''
      });
    } catch { }
  }, []);

  const handleCreateUser = useCallback(async () => {
    try {
      const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newUserName, image: newUserImage, phone: newUserPhone, location: newUserLocation, email: newUserEmail, password: newUserPassword, roleId: selectedRoleId, isActive: newUserIsActive }) });
      if (!response.ok) throw new Error("Failed");
      setShowCreateUser(false); resetUserForm(); fetchUsers(); alert("بەکارهێنەر زیادکرا");
    } catch (error) { console.error(error); alert("هەڵە"); }
  }, [newUserName, newUserImage, newUserPhone, newUserLocation, newUserEmail, newUserPassword, selectedRoleId, newUserIsActive, fetchUsers]);

  const handleUpdateUser = useCallback(async () => {
    if (!editingUser) return;
    try {
      const response = await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingUser.id, name: newUserName, image: newUserImage, phone: newUserPhone, location: newUserLocation, email: newUserEmail, password: newUserPassword || undefined, roleId: selectedRoleId, isActive: newUserIsActive }) });
      if (!response.ok) throw new Error("Failed");
      setShowCreateUser(false); setEditingUser(null); resetUserForm(); fetchUsers(); alert("بەکارهێنەر نوێکرایەوە");
    } catch (error) { console.error(error); alert("هەڵە"); }
  }, [editingUser, newUserName, newUserImage, newUserPhone, newUserLocation, newUserEmail, newUserPassword, selectedRoleId, newUserIsActive, fetchUsers]);

  const handleDeleteUser = useCallback(async (userId: string, userName: string) => {
    if (!confirm(`سڕینەوەی "${userName}"?`)) return;
    try {
      const response = await fetch("/api/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: userId }) });
      if (!response.ok) throw new Error("Failed");
      fetchUsers(); alert("سڕدرایەوە");
    } catch { alert("هەڵە"); }
  }, [fetchUsers]);

  const handleEditUser = useCallback((user: User) => {
    setEditingUser(user);
    setNewUserName(user.name || ""); setNewUserImage(user.image || ""); setNewUserPhone(user.phone || "");
    setNewUserLocation(user.location || ""); setNewUserEmail(user.email || ""); setNewUserPassword("");
    setSelectedRoleId(user.role_id || ""); setNewUserIsActive(user.is_active !== false); setShowCreateUser(true);
  }, []);

  const resetUserForm = useCallback(() => {
    setNewUserName(""); setNewUserImage(""); setNewUserPhone(""); setNewUserLocation(""); setNewUserEmail(""); setNewUserPassword(""); setSelectedRoleId(""); setNewUserIsActive(true);
  }, []);

  const handleCreateRole = useCallback(async () => {
    if (!supabase) { alert("دیمۆ"); return; }
    try {
      const { error } = await supabase.from("roles").insert({ name: newRoleName, permissions });
      if (error) throw error;
      setShowCreateRole(false); resetRoleForm(); fetchRoles(); alert("ڕۆڵ زیادکرا");
    } catch { alert("هەڵە"); }
  }, [newRoleName, permissions, fetchRoles]);

  const handleUpdateRole = useCallback(async () => {
    if (!editingRole || !supabase) return;
    try {
      const { error } = await supabase.from("roles").update({ name: newRoleName, permissions }).eq("id", editingRole.id);
      if (error) throw error;
      setShowCreateRole(false); setEditingRole(null); resetRoleForm(); fetchRoles(); alert("ڕۆڵ نوێکرایەوە");
    } catch { alert("هەڵە"); }
  }, [editingRole, newRoleName, permissions, fetchRoles]);

  const handleDeleteRole = useCallback(async (roleId: string, roleName: string) => {
    const usersWithRole = users.filter((u) => u.role_id === roleId);
    if (usersWithRole.length > 0) { alert(`ناتوانرێت سڕدرێتەوە`); return; }
    if (!confirm(`سڕینەوەی "${roleName}"?`)) return;
    if (!supabase) return;
    try {
      const { error } = await supabase.from("roles").delete().eq("id", roleId);
      if (error) throw error;
      fetchRoles(); alert("سڕدرایەوە");
    } catch { alert("هەڵە"); }
  }, [users, fetchRoles]);

  const handleEditRole = useCallback((role: Role) => {
    setEditingRole(role); setNewRoleName(role.name); setPermissions(role.permissions); setShowCreateRole(true);
  }, []);

  const resetRoleForm = useCallback(() => {
    setEditingRole(null); setNewRoleName(""); setPermissions(DEFAULT_PERMISSIONS);
  }, []);

  const updateShopSettingsField = useCallback(async (field: string, value: string | number) => {
    if (!supabase) return;
    try {
      // Map form field names to shop_settings table column names
      const fieldMapping: Record<string, string> = { 
        shop_name: 'shopname', 
        shop_phone: 'phone', 
        shop_address: 'location', 
        shop_logo: 'icon', 
        qr_code_url: 'qrcodeimage' 
      };
      const dbField = fieldMapping[field] || field;
      if (shopSettings) await supabase.from("shop_settings").update({ [dbField]: value }).eq("id", shopSettings.id);
      else await supabase.from("shop_settings").insert({ [dbField]: value });
      fetchShopSettings();
    } catch { }
  }, [shopSettings, fetchShopSettings]);

  const handleImageUpload = useCallback(async (file: File, field: string) => {
    if (!supabase) { alert("Supabase not configured"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("وێنە گەورەیە"); return; }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) { alert("جۆر نادروستە"); return; }
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(`shop/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(`shop/${fileName}`);
      if (urlData?.publicUrl) updateShopSettingsField(field, urlData.publicUrl);
    } catch (error) { console.error("Upload failed:", error); alert("هەڵە"); }
  }, [updateShopSettingsField]);

  const handleQRCodeUpload = useCallback(async (file: File) => {
    if (!supabase) { alert("Supabase not configured"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("وێنە گەورەیە"); return; }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) { alert("جۆر نادروستە"); return; }
    
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `qr-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Try 'shop-logos' bucket first, then fallback to 'shop-assets', then 'product-images'
      const bucketNames = ['shop-logos', 'shop-assets', 'product-images'];
      let uploadSuccess = false;
      let publicUrl = '';
      
      for (const bucketName of bucketNames) {
        try {
          const { error: uploadError } = await supabase.storage.from(bucketName).upload(`qr-codes/${fileName}`, file);
          if (uploadError) {
            console.log(`Failed to upload to ${bucketName}:`, uploadError.message);
            continue;
          }
          const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(`qr-codes/${fileName}`);
          if (urlData?.publicUrl) {
            publicUrl = urlData.publicUrl;
            uploadSuccess = true;
            break;
          }
        } catch (bucketError) {
          console.log(`Bucket ${bucketName} error:`, bucketError);
          continue;
        }
      }
      
      if (!uploadSuccess) {
        alert("هەڵە لە ئەپلۆدکردن: تکایە باکێتی 'shop-logos' دروست بکە لە Supabase Storage");
        return;
      }
      
      if (publicUrl) {
        updateShopSettingsField('qr_code_url', publicUrl);
      }
    } catch (error) { 
      console.error("QR Code Upload failed:", error); 
      alert("هەڵە لە ئەپلۆدکردنی QR کۆد: تکایە باکێتی 'shop-logos' دروست بکە لە Supabase Storage بە 'Public' access");
    }
  }, [updateShopSettingsField]);

  const updateAllShopSettings = useCallback(async () => {
    if (!supabase) { alert("دۆخی دیمۆ"); return; }
    try {
      // Map to shop_settings table column names
      const updateData = { 
        shopname: shopSettingsForm.shop_name || '', 
        phone: shopSettingsForm.shop_phone || '', 
        location: shopSettingsForm.shop_address || '', 
        icon: shopSettingsForm.shop_logo || '', 
        qrcodeimage: shopSettingsForm.qr_code_url || '' 
      };
      if (shopSettings) await supabase.from("shop_settings").update(updateData).eq("id", shopSettings.id);
      else await supabase.from("shop_settings").insert(updateData);
      alert("نوێکرایەوە"); fetchShopSettings(); if (typeof window !== "undefined") window.location.reload();
    } catch { alert("هەڵە"); }
  }, [shopSettingsForm, shopSettings, fetchShopSettings]);

  return {
    users, roles, shopSettings, shopSettingsForm, loading, activeTab, showCreateUser, showCreateRole, editingUser,
    newUserName, newUserImage, newUserPhone, newUserLocation, newUserEmail, newUserPassword, selectedRoleId, newUserIsActive,
    editingRole, newRoleName, permissions, setActiveTab, setShowCreateUser, setShowCreateRole, setNewUserName, setNewUserImage,
    setNewUserPhone, setNewUserLocation, setNewUserEmail, setNewUserPassword, setSelectedRoleId, setNewUserIsActive,
    setNewRoleName, setPermissions, togglePermission, fetchUsers, fetchRoles, fetchShopSettings, handleCreateUser,
    handleUpdateUser, handleDeleteUser, handleEditUser, resetUserForm, handleCreateRole, handleUpdateRole, handleDeleteRole,
    handleEditRole, resetRoleForm, updateShopSettingsField, handleImageUpload, handleQRCodeUpload, updateAllShopSettings
  };
}
