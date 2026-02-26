export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      _temp: {
        Row: {
          id: string
        }
        Insert: {
          id?: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          added_date: string
          barcode1: string | null
          barcode2: string | null
          barcode3: string | null
          barcode4: string | null
          category: string | null
          category_id: string | null
          cost_per_unit: number | null
          created_at: string | null
          expire_date: string | null
          id: string
          image: string | null
          is_archived: boolean | null
          name: string
          note: string | null
          reference_id: string | null
          selling_price_per_unit: number
          supplier_id: string | null
          total_amount_bought: number
          total_discounts: number | null
          total_profit: number | null
          total_purchase_price: number
          total_revenue: number | null
          total_sold: number | null
          unit: string
        }
        Insert: {
          added_date?: string
          barcode1?: string | null
          barcode2?: string | null
          barcode3?: string | null
          barcode4?: string | null
          category?: string | null
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          expire_date?: string | null
          id?: string
          image?: string | null
          is_archived?: boolean | null
          name?: string
          note?: string | null
          reference_id?: string | null
          selling_price_per_unit?: number
          supplier_id?: string | null
          total_amount_bought?: number
          total_discounts?: number | null
          total_profit?: number | null
          total_purchase_price?: number
          total_revenue?: number | null
          total_sold?: number | null
          unit?: string
        }
        Update: {
          added_date?: string
          barcode1?: string | null
          barcode2?: string | null
          barcode3?: string | null
          barcode4?: string | null
          category?: string | null
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          expire_date?: string | null
          id?: string
          image?: string | null
          is_archived?: boolean | null
          name?: string
          note?: string | null
          reference_id?: string | null
          selling_price_per_unit?: number
          supplier_id?: string | null
          total_amount_bought?: number
          total_discounts?: number | null
          total_profit?: number | null
          total_purchase_price?: number
          total_revenue?: number | null
          total_sold?: number | null
          unit?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      customer_payments: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string | null
          date: string
          id: string
          items: string | null
          note: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id?: string | null
          date: string
          id?: string
          items?: string | null
          note?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string | null
          date?: string
          id?: string
          items?: string | null
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          id: string
          image: string | null
          location: string | null
          name: string
          phone1: string | null
          phone2: string | null
          total_debt: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image?: string | null
          location?: string | null
          name: string
          phone1?: string | null
          phone2?: string | null
          total_debt?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image?: string | null
          location?: string | null
          name?: string
          phone1?: string | null
          phone2?: string | null
          total_debt?: number | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          image: string | null
          name: string | null
          note: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          date: string
          description: string
          id?: string
          image?: string | null
          name?: string | null
          note?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          image?: string | null
          name?: string | null
          note?: string | null
        }
        Relationships: []
      }
      invoice_settings: {
        Row: {
          auto_logout_minutes: number | null
          created_at: string | null
          current_invoice_number: number | null
          id: string
          qr_code_url: string | null
          shop_address: string | null
          shop_logo: string | null
          shop_name: string
          shop_phone: string | null
          starting_invoice_number: number | null
          thank_you_note: string | null
          updated_at: string | null
        }
        Insert: {
          auto_logout_minutes?: number | null
          created_at?: string | null
          current_invoice_number?: number | null
          id?: string
          qr_code_url?: string | null
          shop_address?: string | null
          shop_logo?: string | null
          shop_name?: string
          shop_phone?: string | null
          starting_invoice_number?: number | null
          thank_you_note?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_logout_minutes?: number | null
          created_at?: string | null
          current_invoice_number?: number | null
          id?: string
          qr_code_url?: string | null
          shop_address?: string | null
          shop_logo?: string | null
          shop_name?: string
          shop_phone?: string | null
          starting_invoice_number?: number | null
          thank_you_note?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          added_date: string
          barcode1: string | null
          barcode2: string | null
          barcode3: string | null
          barcode4: string | null
          category: string | null
          category_id: string | null
          cost_per_unit: number | null
          created_at: string | null
          expire_date: string | null
          id: string
          image: string | null
          is_archived: boolean | null
          name: string
          note: string | null
          reference_id: string | null
          selling_price_per_unit: number
          supplier_id: string | null
          total_amount_bought: number
          total_discounts: number | null
          total_profit: number | null
          total_purchase_price: number
          total_revenue: number | null
          total_sold: number | null
          unit: string
        }
        Insert: {
          added_date: string
          barcode1?: string | null
          barcode2?: string | null
          barcode3?: string | null
          barcode4?: string | null
          category?: string | null
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          expire_date?: string | null
          id?: string
          image?: string | null
          is_archived?: boolean | null
          name: string
          note?: string | null
          reference_id?: string | null
          selling_price_per_unit: number
          supplier_id?: string | null
          total_amount_bought: number
          total_discounts?: number | null
          total_profit?: number | null
          total_purchase_price: number
          total_revenue?: number | null
          total_sold?: number | null
          unit: string
        }
        Update: {
          added_date?: string
          barcode1?: string | null
          barcode2?: string | null
          barcode3?: string | null
          barcode4?: string | null
          category?: string | null
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          expire_date?: string | null
          id?: string
          image?: string | null
          is_archived?: boolean | null
          name?: string
          note?: string | null
          reference_id?: string | null
          selling_price_per_unit?: number
          supplier_id?: string | null
          total_amount_bought?: number
          total_discounts?: number | null
          total_profit?: number | null
          total_purchase_price?: number
          total_revenue?: number | null
          total_sold?: number | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          image: string | null
          is_active: boolean | null
          location: string | null
          name: string | null
          phone: string | null
          role_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          image?: string | null
          is_active?: boolean | null
          location?: string | null
          name?: string | null
          phone?: string | null
          role_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          location?: string | null
          name?: string | null
          phone?: string | null
          role_id?: string | null
        }
        Relationships: []
      }
      purchase_expenses: {
        Row: {
          created_at: string | null
          id: string
          item_name: string
          purchase_date: string
          reference_id: string | null
          total_amount_bought: number
          total_purchase_price: number
          unit: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_name: string
          purchase_date: string
          reference_id?: string | null
          total_amount_bought: number
          total_purchase_price: number
          unit: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_name?: string
          purchase_date?: string
          reference_id?: string | null
          total_amount_bought?: number
          total_purchase_price?: number
          unit?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          category: string | null
          cost_price: number
          created_at: string | null
          date: string | null
          id: string
          item_id: string | null
          item_name: string | null
          price: number
          quantity: number
          sale_id: string | null
          total: number | null
          unit: string
        }
        Insert: {
          category?: string | null
          cost_price: number
          created_at?: string | null
          date?: string | null
          id?: string
          item_id?: string | null
          item_name?: string | null
          price: number
          quantity: number
          sale_id?: string | null
          total?: number | null
          unit: string
        }
        Update: {
          category?: string | null
          cost_price?: number
          created_at?: string | null
          date?: string | null
          id?: string
          item_id?: string | null
          item_name?: string | null
          price?: number
          quantity?: number
          sale_id?: string | null
          total?: number | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string | null
          customer_id: string | null
          date: string | null
          discount: number | null
          discount_amount: number | null
          id: string
          invoice_number: number | null
          items_count: number | null
          notes: string | null
          order_source: string | null
          payment_method: string | null
          sold_by: string | null
          status: string | null
          subtotal: number | null
          total: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          date?: string | null
          discount?: number | null
          discount_amount?: number | null
          id?: string
          invoice_number?: number | null
          items_count?: number | null
          notes?: string | null
          order_source?: string | null
          payment_method?: string | null
          sold_by?: string | null
          status?: string | null
          subtotal?: number | null
          total: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          date?: string | null
          discount?: number | null
          discount_amount?: number | null
          id?: string
          invoice_number?: number | null
          items_count?: number | null
          notes?: string | null
          order_source?: string | null
          payment_method?: string | null
          sold_by?: string | null
          status?: string | null
          subtotal?: number | null
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_settings: {
        Row: {
          address: string | null
          created_at: string | null
          currency: string | null
          icon: string | null
          id: string
          location: string | null
          phone: string | null
          qr_code_url: string | null
          shop_address: string | null
          shop_name: string | null
          shop_phone: string | null
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          currency?: string | null
          icon?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          qr_code_url?: string | null
          shop_address?: string | null
          shop_name?: string | null
          shop_phone?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          currency?: string | null
          icon?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          qr_code_url?: string | null
          shop_address?: string | null
          shop_name?: string | null
          shop_phone?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      supplier_debts: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          id: string
          note: string | null
          reference_id: string | null
          supplier_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          id?: string
          note?: string | null
          reference_id?: string | null
          supplier_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          note?: string | null
          reference_id?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_debts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          id: string
          note: string | null
          supplier_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          id?: string
          note?: string | null
          supplier_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          note?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_purchases: {
        Row: {
          cost_price: number
          created_at: string | null
          date: string
          id: string
          item_name: string
          quantity: number
          supplier_id: string | null
          unit: string
        }
        Insert: {
          cost_price: number
          created_at?: string | null
          date: string
          id?: string
          item_name: string
          quantity: number
          supplier_id?: string | null
          unit: string
        }
        Update: {
          cost_price?: number
          created_at?: string | null
          date?: string
          id?: string
          item_name?: string
          quantity?: number
          supplier_id?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_transactions: {
        Row: {
          amount_paid: number
          created_at: string | null
          date: string
          debt_amount: number
          id: string
          item_name: string
          reference_id: string | null
          supplier_id: string | null
          total_price: number
        }
        Insert: {
          amount_paid?: number
          created_at?: string | null
          date: string
          debt_amount?: number
          id?: string
          item_name: string
          reference_id?: string | null
          supplier_id?: string | null
          total_price: number
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          date?: string
          debt_amount?: number
          id?: string
          item_name?: string
          reference_id?: string | null
          supplier_id?: string | null
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          balance: number | null
          company: string | null
          created_at: string | null
          id: string
          name: string
          phone: string | null
          supplier_image: string | null
          total_debt: number | null
        }
        Insert: {
          address?: string | null
          balance?: number | null
          company?: string | null
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          supplier_image?: string | null
          total_debt?: number | null
        }
        Update: {
          address?: string | null
          balance?: number | null
          company?: string | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          supplier_image?: string | null
          total_debt?: number | null
        }
        Relationships: []
      }
      units: {
        Row: {
          created_at: string | null
          id: number
          name: string
          symbol: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          symbol?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          symbol?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_sale: { Args: { p_sale_id: string }; Returns: undefined }
      assign_missing_invoice_numbers: { Args: never; Returns: undefined }
      delete_product_cascade: {
        Args: { p_reference_id: string }
        Returns: undefined
      }
      exec_sql: {
        Args: { sql: string }
        Returns: Json
      }
      item_has_sales: { Args: { p_item_id: string }; Returns: boolean }
      reset_invoice_sequence: { Args: never; Returns: undefined }
      revert_sale_stock: { Args: { p_sale_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
