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

export type LoanDirection = 'LENT' | 'BORROWED';
export type LoanStatus = 'OPEN' | 'SETTLED';

export interface Contact {
  id: number;
  name: string;
  phone?: string | null;
  note?: string | null;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: { loans: number };
}

export interface Repayment {
  id: number;
  loanId: number;
  amount: string;
  date: string;
  note?: string | null;
  userId: number;
  createdAt: string;
}

export interface Loan {
  id: number;
  direction: LoanDirection;
  principal: string;
  date: string;
  dueDate?: string | null;
  description?: string | null;
  status: LoanStatus;
  userId: number;
  contactId: number;
  contact: Pick<Contact, 'id' | 'name' | 'phone'>;
  repayments?: Repayment[];
  outstanding: string;
  repaid: string;
  isOverdue: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoansSummary {
  totalReceivable: string;
  totalPayable: string;
  openCount: number;
  overdueCount: number;
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
