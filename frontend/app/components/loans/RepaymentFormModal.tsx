'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/app/components/ui/Modal';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/Textarea';
import { Button } from '@/app/components/ui/Button';
import { useToast } from '@/app/components/ui/Toast';
import { apiClient } from '@/app/lib/api-client';
import { formatCurrency } from '@/app/lib/utils';
import type { Loan } from '@/app/lib/types';

interface RepaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  loan: Loan | null;
}

export function RepaymentFormModal({ open, onClose, onSaved, loan }: RepaymentFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
    setErrors({});
  }, [loan, open]);

  if (!loan) return null;

  const outstanding = parseFloat(loan.outstanding);

  function validate() {
    const errs: Record<string, string> = {};
    const n = Number(form.amount);
    if (!form.amount || isNaN(n) || n <= 0) errs.amount = 'Valid amount required';
    else if (n > outstanding) errs.amount = `Cannot exceed outstanding ${formatCurrency(outstanding)}`;
    if (!form.date) errs.date = 'Date is required';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/api/loans/${loan!.id}/repayments`, {
        amount: Number(form.amount),
        date: form.date,
        note: form.note || undefined,
      });
      toast('Repayment recorded', 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err?.response?.message ?? err?.message ?? 'Failed to record repayment', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Repayment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Contact</span>
            <span className="font-medium text-gray-900">{loan.contact?.name}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-muted">Outstanding</span>
            <span className="font-semibold text-gray-900">{formatCurrency(outstanding)}</span>
          </div>
        </div>

        <Input
          id="amount"
          type="number"
          label="Repayment amount (৳)"
          placeholder="0.00"
          min="0"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          error={errors.amount}
        />
        <Input
          id="date"
          type="date"
          label="Date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          error={errors.date}
        />
        <Textarea
          id="note"
          label="Note (optional)"
          placeholder="e.g. Cash, bKash, partial..."
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Record Repayment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
