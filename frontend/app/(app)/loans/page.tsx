'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/Button';
import { Pagination } from '@/app/components/ui/Pagination';
import { PageSpinner } from '@/app/components/ui/Spinner';
import { LoanFilters, type LoanFiltersState } from '@/app/components/loans/LoanFilters';
import { LoanTable } from '@/app/components/loans/LoanTable';
import { LoanFormModal } from '@/app/components/loans/LoanFormModal';
import { RepaymentFormModal } from '@/app/components/loans/RepaymentFormModal';
import { ContactFormModal } from '@/app/components/contacts/ContactFormModal';
import { apiClient } from '@/app/lib/api-client';
import { useToast } from '@/app/components/ui/Toast';
import { formatCurrency } from '@/app/lib/utils';
import type { Loan, Contact, PaginatedResponse } from '@/app/lib/types';

const DEFAULT_FILTERS: LoanFiltersState = {
  search: '',
  direction: '',
  status: '',
  contactId: '',
  overdueOnly: false,
  sortBy: 'date',
  sortOrder: 'desc',
};

export default function LoansPage() {
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);
  const [repaymentOpen, setRepaymentOpen] = useState(false);
  const [repaymentLoan, setRepaymentLoan] = useState<Loan | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  const fetchContacts = useCallback(async () => {
    try {
      const data = await apiClient.get<PaginatedResponse<Contact>>('/api/contacts?limit=200');
      setContacts(data.data);
    } catch {}
  }, []);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filters.search) params.set('search', filters.search);
      if (filters.direction) params.set('direction', filters.direction);
      if (filters.status) params.set('status', filters.status);
      if (filters.contactId) params.set('contactId', filters.contactId);
      if (filters.overdueOnly) params.set('overdueOnly', 'true');
      params.set('sortBy', filters.sortBy);
      params.set('sortOrder', filters.sortOrder);

      const data = await apiClient.get<PaginatedResponse<Loan>>(`/api/loans?${params}`);
      setLoans(data.data);
      setMeta(data.meta);
    } catch {
      toast('Failed to load loans', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filters, toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);
  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  function handleEdit(loan: Loan) {
    setEditing(loan);
    setFormOpen(true);
  }

  function handleAddRepayment(loan: Loan) {
    setRepaymentLoan(loan);
    setRepaymentOpen(true);
  }

  async function handleDelete(loan: Loan) {
    if (!confirm(`Delete loan with ${loan.contact?.name}? This removes all its repayments.`)) return;
    try {
      await apiClient.delete(`/api/loans/${loan.id}`);
      toast('Loan deleted', 'success');
      fetchLoans();
    } catch {
      toast('Failed to delete', 'error');
    }
  }

  const totalOutstanding = loans.reduce((sum, l) => sum + parseFloat(l.outstanding), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
          {!loading && (
            <p className="text-sm text-muted mt-1">
              {meta.total} records · {formatCurrency(totalOutstanding)} outstanding shown
            </p>
          )}
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + Add Loan
        </Button>
      </div>

      <LoanFilters
        filters={filters}
        onChange={(f) => {
          setFilters(f);
          setPage(1);
        }}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setPage(1);
        }}
        contacts={contacts}
      />

      {loading ? (
        <PageSpinner />
      ) : (
        <>
          <LoanTable
            loans={loans}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddRepayment={handleAddRepayment}
          />
          <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </>
      )}

      <LoanFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchLoans}
        loan={editing}
        contacts={contacts}
        onCreateContact={() => setContactOpen(true)}
      />

      <RepaymentFormModal
        open={repaymentOpen}
        onClose={() => setRepaymentOpen(false)}
        onSaved={fetchLoans}
        loan={repaymentLoan}
      />

      <ContactFormModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        onSaved={() => {
          fetchContacts();
        }}
        contact={null}
      />
    </div>
  );
}
