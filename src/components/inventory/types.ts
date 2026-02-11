export interface Product {
  id: string
  name: string
  total_amount_bought: number
  unit: string
  cost_per_unit: number
  selling_price_per_unit: number
  category: string
  image: string
  barcode1: string
  barcode2: string
  barcode3: string
  barcode4: string
  added_date: string
  expire_date: string
  note: string
  supplier_id: string
  is_archived?: boolean
  total_sold?: number
  total_revenue?: number
  total_profit?: number
  total_discounts?: number
  created_at?: string
}

export interface Category {
  id: string
  name: string
}

export interface Unit {
  id: string
  name: string
  symbol?: string
}

export interface Supplier {
  id: string
  name: string
  balance?: number
}
