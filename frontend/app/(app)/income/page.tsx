'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Pagination } from '@/app/components/ui/Pagination';
import { PageSpinner } from '@/app/components/ui/Spinner';
import { IncomeTable } from '@/app/components/income/IncomeTable';
import { IncomeFormModal } from '@/app/components/income/IncomeFormModal';
import { apiClient } from '@/app/lib/api-client';
import { useToast } from '@/app/components/ui/Toast';
import { formatCurrency } from '@/app/lib/utils';
import type { Income, PaginatedResponse } from '@/app/lib/types';

export default function IncomePage() {
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const data = await apiClient.get<PaginatedResponse<Income>>(`/api/incomes?${params}`);
      setIncomes(data.data);
      setMeta(data.meta);
    } catch {
      toast('Failed to load income', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, toast]);

  useEffect(() => { fetchIncomes(); }, [fetchIncomes]);

  async function handleDelete(income: Income) {
    if (!confirm(`Delete "${income.title}"?`)) return;
    try {
      await apiClient.delete(`/api/incomes/${income.id}`);
      toast('Income deleted', 'success');
      fetchIncomes();
    } catch {
      toast('Failed to delete', 'error');
    }
  }

  const totalAmount = incomes.reduce((sum, i) => sum + parseFloat(i.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Income</h1>
          {!loading && (
            <p className="text-sm text-muted mt-1">
              {meta.total} records · {formatCurrency(totalAmount)} shown
            </p>
          )}
        </div>
        <Button onClick={() => { setEditingIncome(null); setModalOpen(true); }}>
          + Add Income
        </Button>
      </div>

      <div className="bg-white border border-border rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          <Input
            type="date"
            label="From"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          />
          <Input
            type="date"
            label="To"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {loading ? (
        <PageSpinner />
      ) : (
        <>
          <IncomeTable
            incomes={incomes}
            onEdit={(inc) => { setEditingIncome(inc); setModalOpen(true); }}
            onDelete={handleDelete}
          />
          <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </>
      )}

      <IncomeFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchIncomes}
        income={editingIncome}
      />
    </div>
  );
}
