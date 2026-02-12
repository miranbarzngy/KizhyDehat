export interface Expense {
  id: string
  name: string
  unit: string
  amount: number
  image: string
  note: string
  date: string
  category?: string
}

export interface DateFilters {
  fromDate: string
  toDate: string
}

export interface ExpenseFormData {
  name: string
  unit: string
  amount: number
  image: string
  note: string
}

export type ExpenseTab = 'all' | 'filter'
