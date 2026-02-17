// Shared types for Profits Dashboard

export interface ProfitItem {
  id: string
  invoice_number?: string
  sale_id: string
  item_name: string
  quantity: number
  price: number
  cost_price: number
  discount_amount: number
  item_discount: number
  net_price: number
  profit: number
  date: string
  time?: string
}

export interface SaleItem {
  id: string
  customer_name?: string
  total: number
  payment_method: string
  date: string
  time?: string
  items?: Array<{ item_name: string; price: number; quantity: number }>
  status?: string
}

export interface ExpenseItem {
  id: string
  description: string
  amount: number
  date: string
  category?: string
}

export interface PurchaseExpense {
  id: string
  item_name: string
  total_purchase_price: number
  total_amount_bought: number
  unit: string
  purchase_date: string
  created_at?: string
}

export interface ChartData {
  date: string
  sales: number
  expenses: number
  profit: number
}

export interface OverviewStats {
  totalSales: number
  totalExpenses: number
  totalProfits: number
  totalReturns: number
  cashSales: number
  onlineSales: number
  payLaterSales: number
  inventoryExpenses: number
  generalExpenses: number
}

export interface InvoiceSettings {
  id: string
  shop_name: string
  shop_phone: string
  shop_address: string
  shop_logo: string
  thank_you_note: string
  qr_code_url: string
  starting_invoice_number: number
  current_invoice_number: number
}

export type ActiveTab = 'overview' | 'sales' | 'profits' | 'expenses'
export type SalesTab = 'cash' | 'online' | 'paylater'
export type ExpensesTab = 'inventory' | 'general'
