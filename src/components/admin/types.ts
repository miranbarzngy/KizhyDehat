export interface User {
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

export interface Role {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
}

export interface ShopSettings {
  id: string;
  shop_name: string;
  shop_logo: string;
  shop_phone: string;
  shop_address: string;
  qr_code_url: string;
}

export interface UserFormData {
  name: string;
  image: string;
  phone: string;
  location: string;
  email: string;
  password: string;
  roleId: string;
  isActive: boolean;
}

export interface RoleFormData {
  name: string;
  permissions: Record<string, boolean>;
}

export type AdminTab = "users" | "roles" | "settings" | "activity" | "backup";

export interface Permission {
  key: string;
  label: string;
  icon?: string;
}

export const DEFAULT_PERMISSIONS: Permission[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'sales', label: 'Sales', icon: '💰' },
  { key: 'inventory', label: 'Inventory', icon: '📦' },
  { key: 'customers', label: 'Customers', icon: '👥' },
  { key: 'suppliers', label: 'Suppliers', icon: '🚚' },
  { key: 'expenses', label: 'Expenses', icon: '💸' },
  { key: 'payroll', label: 'Payroll', icon: '📋' },
  { key: 'profits', label: 'Profits', icon: '📈' },
  { key: 'help', label: 'Help', icon: '❓' },
  { key: 'admin', label: 'Admin', icon: '⚙️' },
  { key: 'backup', label: 'Backup', icon: '💾' },
];
