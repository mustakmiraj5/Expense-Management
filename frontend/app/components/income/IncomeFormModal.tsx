'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/app/components/ui/Modal';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Textarea } from '@/app/components/ui/Textarea';
import { Button } from '@/app/components/ui/Button';
import { useToast } from '@/app/components/ui/Toast';
import { apiClient } from '@/app/lib/api-client';
import type { Income } from '@/app/lib/types';

interface IncomeFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  income?: Income | null;
}

const SOURCE_OPTIONS = [
  { value: 'Salary', label: 'Salary' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Business', label: 'Business' },
  { value: 'Investment', label: 'Investment' },
  { value: 'Gift', label: 'Gift' },
  { value: 'Other', label: 'Other' },
];

export function IncomeFormModal({ open, onClose, onSaved, income }: IncomeFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    source: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (income) {
      setForm({
        title: income.title,
        amount: String(parseFloat(income.amount)),
        source: income.source ?? '',
        date: income.date.split('T')[0],
        description: income.description ?? '',
      });
    } else {
      setForm({ title: '', amount: '', source: '', date: new Date().toISOString().split('T')[0], description: '' });
    }
    setErrors({});
  }, [income, open]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) errs.amount = 'Valid amount required';
    if (!form.date) errs.date = 'Date is required';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        amount: Number(form.amount),
        source: form.source || undefined,
        date: form.date,
        description: form.description || undefined,
      };
      if (income) {
        await apiClient.patch(`/api/incomes/${income.id}`, payload);
        toast('Income updated', 'success');
      } else {
        await apiClient.post('/api/incomes', payload);
        toast('Income added', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err?.response?.message ?? 'Failed to save', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={income ? 'Edit Income' : 'Add Income'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="title"
          label="Title"
          placeholder="e.g. Monthly salary"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          error={errors.title}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="amount"
            type="number"
            label="Amount (৳)"
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
        </div>
        <Select
          id="source"
          label="Source (optional)"
          options={SOURCE_OPTIONS}
          placeholder="Select source"
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value })}
        />
        <Textarea
          id="description"
          label="Description (optional)"
          placeholder="Add notes..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{income ? 'Update' : 'Add Income'}</Button>
        </div>
      </form>
    </Modal>
  );
}
