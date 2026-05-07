// --- Ürün ---
export interface Product {
  id: string;
  name: string;
  description: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  unit: string;
  purchase_price: number;
  sale_price: number;
  is_active: boolean;
  is_low_stock: boolean;
  profit_margin: number;
  created_at: string;
  updated_at: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  stock_quantity: number;
  sale_price: number;
  is_low_stock: boolean;
  unit: string;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  stock_quantity?: number;
  low_stock_threshold?: number;
  unit?: string;
  purchase_price: number;
  sale_price: number;
}

export interface SellProductPayload {
  quantity: number;
  sale_price: number;
  note?: string;
}

export interface AddStockPayload {
  quantity: number;
  purchase_price?: number;
  note?: string;
}

// --- İşlem ---
export type TransactionType = 'sale' | 'collection' | 'expense' | 'other_income';
export type ExpenseCategory =
  | 'credit_card'
  | 'food'
  | 'rent'
  | 'bills'
  | 'salary'
  | 'material'
  | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  note: string | null;
  category: string | null;
  product_id: string | null;
  quantity: number | null;
  purchase_price_snapshot: number | null;
  sale_price_snapshot: number | null;
  profit: number | null;
  related_person: string | null;
  transaction_date: string;
  created_at: string;
  is_income: boolean;
}

export interface CreateSalePayload {
  product_id: string;
  quantity: number;
  sale_price: number;
  note?: string;
  transaction_date?: string;
}

export interface CreateCollectionPayload {
  amount: number;
  related_person: string;
  related_debt_id?: string;
  note?: string;
}

export interface CreateExpensePayload {
  amount: number;
  category: ExpenseCategory;
  note?: string;
}

// --- Borç / Alacak ---
export type DebtDirection = 'i_owe' | 'they_owe';
export type DebtType = 'person' | 'credit_card' | 'supplier' | 'other';

export interface Debt {
  id: string;
  direction: DebtDirection;
  debt_type: DebtType;
  person_name: string;
  amount: number;
  remaining_amount: number;
  due_date: string | null;
  is_paid: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDebtPayload {
  direction: DebtDirection;
  debt_type?: DebtType;
  person_name: string;
  amount: number;
  due_date?: string;
  note?: string;
}

// --- Hatırlatıcı ---
export interface PaymentReminder {
  id: string;
  title: string;
  amount: number;
  category: string;
  due_date: string;
  recurrence: string;
  is_paid: boolean;
  note: string | null;
  created_at: string;
}

// --- Analiz ---
export interface HomeStats {
  this_month_income: number;
  this_month_expense: number;
  this_month_profit: number;
  total_receivable: number;
  total_debt: number;
  low_stock_count: number;
  upcoming_payments: Array<{
    id: string;
    title: string;
    amount: number;
    due_date: string;
    category: string;
  }>;
  recent_transactions: Array<{
    id: string;
    type: TransactionType;
    amount: number;
    note: string | null;
    date: string;
    is_income: boolean;
  }>;
}

export interface ProductStat {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  total_profit: number;
}

export interface CategoryStat {
  category: string;
  total_amount: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  total_sales: number;
  total_expenses: number;
  total_income: number;
  net_profit: number;
  sale_count: number;
  expense_count: number;
}

export interface AnalyticsDashboard {
  summary: MonthlySummary;
  top_products: ProductStat[];
  expense_by_category: CategoryStat[];
  low_stock_products: Array<{
    id: string;
    name: string;
    stock_quantity: number;
    unit: string;
  }>;
}
