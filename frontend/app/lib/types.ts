export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  userId: number;
}

export interface Expense {
  id: number;
  title: string;
  amount: string;
  date: string;
  description?: string;
  userId: number;
  categoryId: number;
  category: Pick<Category, 'id' | 'name' | 'icon' | 'color'>;
  createdAt: string;
}

export interface Income {
  id: number;
  title: string;
  amount: string;
  date: string;
  description?: string;
  source?: string;
  userId: number;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface DashboardStats {
  totals: { today: number; weekly: number; monthly: number; yearly: number };
  categoryBreakdown: {
    categoryId: number;
    categoryName: string;
    color: string;
    total: number;
    percentage: number;
  }[];
  monthlyTrend: { month: string; expenses: number; income: number; savings: number }[];
  income: { thisMonth: number; allTime: number };
  expenses: { thisMonth: number; allTime: number };
  savings: { thisMonth: number; allTime: number };
}
