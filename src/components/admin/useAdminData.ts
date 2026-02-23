import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Role, ShopSettings, AdminTab } from './types';
import { logActivity } from '@/lib/activityLogger';

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
  handleCreateUser: () => Promise<{ success: boolean; message?: string; error?: string }>;
  handleUpdateUser: () => Promise<{ success: boolean; message?: string; error?: string }>;
  handleDeleteUser: (userId: string, userName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  handleEditUser: (user: User) => void;
  resetUserForm: () => void;
  handleCreateRole: () => Promise<{ success: boolean; message?: string; error?: string }>;
  handleUpdateRole: () => Promise<{ success: boolean; message?: string; error?: string }>;
  handleDeleteRole: (roleId: string, roleName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  handleEditRole: (role: Role) => void;
  resetRoleForm: () => void;
  updateShopSettingsField: (field: string, value: string | number) => Promise<void>;
  handleImageUpload: (file: File, field: string) => Promise<void>;
  handleQRCodeUpload: (file: File) => Promise<void>;
  updateAllShopSettings: () => Promise<void>;
}

const DEFAULT_PERMISSIONS = {
  dashboard: false, sales: false, inventory: false, customers: false,
  suppliers: false, invoices: false, expenses: false, profits: false, help: false, admin: false,
};

const DEMO_USERS: User[] = [
  { id: "demo-user-1", name: "ئەحمەد محەمەد", image: "", phone: "+964 750 123 4567", location: "هەولێر", email: "ahmed@example.com", role_id: "admin-role", role: { name: "Admin", permissions: { sales: true, inventory: true, customers: true, suppliers: true, payroll: true, profits: true } } },
  { id: "demo-user-2", name: "فاطمە عەلی", image: "", phone: "+964 751 987 6543", location: "سلێمانی", email: "fatima@example.com", role_id: "manager-role", role: { name: "Manager", permissions: { sales: true, inventory: true, customers: true, suppliers: false, payroll: false, profits: true } } },
];

const DEMO_ROLES: Role[] = [
  { id: "admin-role", name: "Admin", permissions: { dashboard: true, sales: true, inventory: true, customers: true, suppliers: true, invoices: true, expenses: true, profits: true, help: true, admin: true } },
  { id: "manager-role", name: "Manager", permissions: { dashboard: true, sales: true, inventory: true, customers: true, suppliers: false, invoices: true, expenses: true, profits: true, help: false, admin: false } },
  { id: "cashier-role", name: "Cashier", permissions: { dashboard: true, sales: true, inventory: false, customers: false, suppliers: false, invoices: false, expenses: false, profits: false, help: false, admin: false } },
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
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || "هەڵە" };
      }
      
      // Log activity for adding user
      const newUserId = data.user?.id || data.id;
      await logActivity(
        null, 
        null, 
        'add_user', 
        `زیادکردنی بەکارهێنەری نوێ: ${newUserName}`, 
        'user', 
        newUserId
      );
      
      setShowCreateUser(false); resetUserForm(); fetchUsers(); 
      return { success: true, message: "بەکارهێنەر زیادکرا" };
    } catch (error) { 
      console.error(error); 
      return { success: false, error: "هەڵە" };
    }
  }, [newUserName, newUserImage, newUserPhone, newUserLocation, newUserEmail, newUserPassword, selectedRoleId, newUserIsActive, fetchUsers]);

  const handleUpdateUser = useCallback(async () => {
    if (!editingUser) return { success: false, error: "هیچ بەکارهێنەرێک دیارنەکراوە" };
    try {
      // Only include password if it has a value
      const updateData: any = { 
        id: editingUser.id, 
        name: newUserName, 
        image: newUserImage, 
        phone: newUserPhone, 
        location: newUserLocation, 
        email: newUserEmail, 
        roleId: selectedRoleId, 
        isActive: newUserIsActive 
      };
      
      // Only add password to the update if it's not empty
      if (newUserPassword && newUserPassword.trim() !== '') {
        updateData.password = newUserPassword;
      }
      
      const response = await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updateData) });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || "هەڵە لە نوێکردنەوە" };
      }
      
      // Log activity for updating user
      await logActivity(
        null, 
        null, 
        'update_user', 
        `دەستکاریکردنی زانیارییەکانی: ${newUserName}`, 
        'user', 
        editingUser.id
      );
      
      setShowCreateUser(false); setEditingUser(null); resetUserForm(); fetchUsers(); 
      return { success: true, message: "بەکارهێنەر نوێکرایەوە" };
    } catch (error) { 
      console.error(error); 
      return { success: false, error: "هەڵە" };
    }
  }, [editingUser, newUserName, newUserImage, newUserPhone, newUserLocation, newUserEmail, newUserPassword, selectedRoleId, newUserIsActive, fetchUsers]);

  const handleDeleteUser = useCallback(async (userId: string, userName: string) => {
    // Note: Confirmation is handled by ConfirmModal in the admin page
    try {
      const response = await fetch("/api/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: userId }) });
      if (!response.ok) throw new Error("Failed");
      
      // Log activity for deleting user
      await logActivity(
        null, 
        null, 
        'delete_user', 
        `سڕینەوەی بەکارهێنەر: ${userName}`, 
        'user', 
        userId
      );
      
      fetchUsers(); 
      return { success: true, message: "سڕدرایەوە" };
    } catch { 
      return { success: false, error: "هەڵە" };
    }
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
    if (!supabase) { return { success: false, error: "دیمۆ" }; }
    try {
      const { error } = await supabase.from("roles").insert({ name: newRoleName, permissions });
      if (error) throw error;
      
      // Log activity for adding role
      await logActivity(
        null, 
        null, 
        'add_role', 
        `زیادکردنی ڕۆڵی نوێ: ${newRoleName}`, 
        'role', 
        null
      );
      
      setShowCreateRole(false); resetRoleForm(); fetchRoles(); 
      return { success: true, message: "ڕۆڵ زیادکرا" };
    } catch (error) { 
      console.error(error); 
      return { success: false, error: "هەڵە" };
    }
  }, [newRoleName, permissions, fetchRoles]);

  const handleUpdateRole = useCallback(async () => {
    // Helper to check if ID is a valid UUID
    const isValidUUID = (id: any) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return id && uuidRegex.test(String(id))
    }
    
    if (!editingRole || !supabase) return { success: false, error: "هیچ ڕۆڵێک دیارنەکراوە" };
    try {
      const { error } = await supabase.from("roles").update({ name: newRoleName, permissions }).eq("id", editingRole.id);
      if (error) throw error;
      
      // Log activity for updating role - only pass UUID entity_id
      await logActivity(
        null, 
        null, 
        'update_role', 
        `دەستکاریکردنی ڕۆڵ: ${newRoleName}`, 
        'role', 
        isValidUUID(editingRole.id) ? editingRole.id : undefined
      );
      
      setShowCreateRole(false); setEditingRole(null); resetRoleForm(); fetchRoles(); 
      return { success: true, message: "ڕۆڵ نوێکرایەوە" };
    } catch (error) { 
      console.error(error); 
      return { success: false, error: "هەڵە" };
    }
  }, [editingRole, newRoleName, permissions, fetchRoles]);

  const handleDeleteRole = useCallback(async (roleId: string, roleName: string) => {
    // Helper to check if ID is a valid UUID
    const isValidUUID = (id: any) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return id && uuidRegex.test(String(id))
    }
    
    const usersWithRole = users.filter((u) => u.role_id === roleId);
    if (usersWithRole.length > 0) { return { success: false, error: "ناتوانرێت سڕدرێتەوە - بەکارهێنەر بەکاردەهێنێت" }; }
    if (!supabase) return { success: false, error: "هیچ پەیوەندییەک نییە" };
    try {
      const { error } = await supabase.from("roles").delete().eq("id", roleId);
      if (error) throw error;
      
      // Log activity for deleting role - only pass UUID entity_id
      await logActivity(
        null, 
        null, 
        'delete_role', 
        `سڕینەوەی ڕۆڵ: ${roleName}`, 
        'role', 
        isValidUUID(roleId) ? roleId : undefined
      );
      
      fetchRoles(); 
      return { success: true, message: "سڕدرایەوە" };
    } catch (error) { 
      console.error(error); 
      return { success: false, error: "هەڵە" };
    }
  }, [users, fetchRoles]);

  const handleEditRole = useCallback((role: Role) => {
    setEditingRole(role); setNewRoleName(role.name); setPermissions(role.permissions); setShowCreateRole(true);
  }, []);

  const resetRoleForm = useCallback(() => {
    setEditingRole(null); setNewRoleName(""); setPermissions(DEFAULT_PERMISSIONS);
  }, []);

  const updateShopSettingsField = useCallback(async (field: string, value: string | number) => {
    // First update local form state immediately - this will update the UI
    setShopSettingsForm(prev => ({ ...prev, [field]: value }));
    
    // Note: We don't fetch here to avoid re-rendering the form while typing
    // The data will be saved when user clicks the save button
  }, []);

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
      console.log("Saving shop settings...", { shopSettings, shopSettingsForm });
      
      // Get the raw data to see what columns exist
      const { data: currentData } = await supabase.from("shop_settings").select("*").single();
      
      console.log("Current DB data:", currentData);
      
      if (!currentData) {
        alert("هیچ داتایەک نەدۆزرایەوە");
        return;
      }
      
      // Build update data from only the columns that exist in the database
      const updateData: Record<string, string> = {};
      
      if ('shopname' in currentData) {
        updateData.shopname = shopSettingsForm.shop_name || '';
      }
      if ('icon' in currentData) {
        updateData.icon = shopSettingsForm.shop_logo || '';
      }
      
      console.log("Update data:", updateData);
      
      if (Object.keys(updateData).length === 0) {
        alert("هیچ خانەیەک نەدۆزرایەوە بۆ نوێکردنەوە");
        return;
      }
      
      const result = await supabase.from("shop_settings").update(updateData).eq("id", currentData.id);
      
      if (result.error) {
        console.error("Save error:", result.error);
        alert("هەڵە: " + result.error.message);
        return;
      }
      
      console.log("Save successful!");
      alert("نوێکرایەوە"); 
      fetchShopSettings();
      
      // Reload page to reflect changes
      if (typeof window !== "undefined") {
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error) {
      console.error("Save exception:", error);
      alert("هەڵە");
    }
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
