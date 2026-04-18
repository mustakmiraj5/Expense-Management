'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/Button';
import { Pagination } from '@/app/components/ui/Pagination';
import { PageSpinner } from '@/app/components/ui/Spinner';
import { ExpenseFilters } from '@/app/components/expenses/ExpenseFilters';
import { ExpenseTable } from '@/app/components/expenses/ExpenseTable';
import { ExpenseFormModal } from '@/app/components/expenses/ExpenseFormModal';
import { apiClient } from '@/app/lib/api-client';
import { useToast } from '@/app/components/ui/Toast';
import { formatCurrency } from '@/app/lib/utils';
import type { Expense, Category, PaginatedResponse } from '@/app/lib/types';

const DEFAULT_FILTERS = {
  search: '',
  categoryId: '',
  startDate: '',
  endDate: '',
  sortBy: 'date',
  sortOrder: 'desc',
};

export default function ExpensesPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiClient.get<{ data: Category[] }>('/api/categories');
      setCategories(data.data);
    } catch {}
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filters.search) params.set('search', filters.search);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      params.set('sortBy', filters.sortBy);
      params.set('sortOrder', filters.sortOrder);

      const data = await apiClient.get<PaginatedResponse<Expense>>(`/api/expenses?${params}`);
      setExpenses(data.data);
      setMeta(data.meta);
    } catch {
      toast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filters, toast]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  function handleEdit(expense: Expense) {
    setEditingExpense(expense);
    setModalOpen(true);
  }

  async function handleDelete(expense: Expense) {
    if (!confirm(`Delete "${expense.title}"?`)) return;
    try {
      await apiClient.delete(`/api/expenses/${expense.id}`);
      toast('Expense deleted', 'success');
      fetchExpenses();
    } catch {
      toast('Failed to delete', 'error');
    }
  }

  const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          {!loading && (
            <p className="text-sm text-muted mt-1">
              {meta.total} records · {formatCurrency(totalAmount)} shown
            </p>
          )}
        </div>
        <Button onClick={() => { setEditingExpense(null); setModalOpen(true); }}>
          + Add Expense
        </Button>
      </div>

      <ExpenseFilters
        filters={filters}
        onChange={(f) => { setFilters(f); setPage(1); }}
        onReset={() => { setFilters(DEFAULT_FILTERS); setPage(1); }}
        categories={categories}
      />

      {loading ? (
        <PageSpinner />
      ) : (
        <>
          <ExpenseTable expenses={expenses} onEdit={handleEdit} onDelete={handleDelete} />
          <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </>
      )}

      <ExpenseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchExpenses}
        expense={editingExpense}
        categories={categories}
      />
    </div>
  );
}
