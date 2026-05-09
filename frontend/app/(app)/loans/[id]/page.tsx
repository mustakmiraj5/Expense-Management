'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { PageSpinner } from '@/app/components/ui/Spinner';
import { Card, CardContent } from '@/app/components/ui/Card';
import { useToast } from '@/app/components/ui/Toast';
import { apiClient } from '@/app/lib/api-client';
import { formatCurrency, formatDate } from '@/app/lib/utils';
import { DirectionBadge, LoanStatusBadge } from '@/app/components/loans/LoanStatusBadge';
import { RepaymentFormModal } from '@/app/components/loans/RepaymentFormModal';
import type { Loan } from '@/app/lib/types';

export default function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [repaymentOpen, setRepaymentOpen] = useState(false);

  const fetchLoan = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ data: Loan }>(`/api/loans/${id}`);
      setLoan(data.data);
    } catch {
      toast('Failed to load loan', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchLoan();
  }, [fetchLoan]);

  async function handleDeleteRepayment(repaymentId: number) {
    if (!confirm('Delete this repayment?')) return;
    try {
      await apiClient.delete(`/api/loans/${id}/repayments/${repaymentId}`);
      toast('Repayment removed', 'success');
      fetchLoan();
    } catch {
      toast('Failed to delete repayment', 'error');
    }
  }

  if (loading) return <PageSpinner />;
  if (!loan) {
    return (
      <div className="text-center py-20 text-muted">
        Loan not found.
        <div className="mt-4">
          <Link href="/loans" className="text-primary hover:underline">
            ← Back to loans
          </Link>
        </div>
      </div>
    );
  }

  const principal = parseFloat(loan.principal);
  const outstanding = parseFloat(loan.outstanding);
  const repaid = parseFloat(loan.repaid);
  const progress = principal > 0 ? Math.min(100, (repaid / principal) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link href="/loans" className="hover:text-primary">
          ← Back to loans
        </Link>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <DirectionBadge direction={loan.direction} />
            <LoanStatusBadge loan={loan} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{loan.contact?.name}</h1>
          {loan.description && <p className="text-muted mt-1">{loan.description}</p>}
        </div>
        {loan.status === 'OPEN' && (
          <Button onClick={() => setRepaymentOpen(true)}>+ Add Repayment</Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm text-muted">Principal</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(principal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted">Repaid</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(repaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted">Outstanding</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(outstanding)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border border-border rounded-xl p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted">Repayment progress</span>
          <span className="font-medium text-gray-900">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <p className="text-muted">Loan date</p>
            <p className="font-medium text-gray-900">{formatDate(loan.date)}</p>
          </div>
          <div>
            <p className="text-muted">Due date</p>
            <p className="font-medium text-gray-900">
              {loan.dueDate ? formatDate(loan.dueDate) : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-gray-900">Repayments</h2>
        </div>
        {!loan.repayments?.length ? (
          <div className="p-10 text-center text-muted">No repayments recorded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-muted">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Note</th>
                <th className="text-right px-4 py-3 font-medium text-muted">Amount</th>
                <th className="text-right px-4 py-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loan.repayments.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 text-gray-700">{r.note || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                    {formatCurrency(parseFloat(r.amount))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-red-50"
                      onClick={() => handleDeleteRepayment(r.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RepaymentFormModal
        open={repaymentOpen}
        onClose={() => setRepaymentOpen(false)}
        onSaved={fetchLoan}
        loan={loan}
      />
    </div>
  );
}
