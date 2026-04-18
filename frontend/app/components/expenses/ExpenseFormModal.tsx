'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/app/components/ui/Modal';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Textarea } from '@/app/components/ui/Textarea';
import { Button } from '@/app/components/ui/Button';
import { useToast } from '@/app/components/ui/Toast';
import { apiClient } from '@/app/lib/api-client';
import type { Expense, Category } from '@/app/lib/types';

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  expense?: Expense | null;
  categories: Category[];
}

export function ExpenseFormModal({ open, onClose, onSaved, expense, categories }: ExpenseFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title,
        amount: String(parseFloat(expense.amount)),
        categoryId: String(expense.categoryId),
        date: expense.date.split('T')[0],
        description: expense.description ?? '',
      });
    } else {
      setForm({ title: '', amount: '', categoryId: '', date: new Date().toISOString().split('T')[0], description: '' });
    }
    setErrors({});
  }, [expense, open]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) errs.amount = 'Valid amount required';
    if (!form.categoryId) errs.categoryId = 'Category is required';
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
        categoryId: Number(form.categoryId),
        date: form.date,
        description: form.description || undefined,
      };

      if (expense) {
        await apiClient.patch(`/api/expenses/${expense.id}`, payload);
        toast('Expense updated', 'success');
      } else {
        await apiClient.post('/api/expenses', payload);
        toast('Expense added', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err?.response?.message ?? 'Failed to save expense', 'error');
    } finally {
      setLoading(false);
    }
  }

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: `${c.icon ?? ''} ${c.name}`.trim(),
  }));

  return (
    <Modal open={open} onClose={onClose} title={expense ? 'Edit Expense' : 'Add Expense'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="title"
          label="Title"
          placeholder="e.g. Lunch at restaurant"
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
          id="categoryId"
          label="Category"
          options={categoryOptions}
          placeholder="Select category"
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          error={errors.categoryId}
        />
        <Textarea
          id="description"
          label="Description (optional)"
          placeholder="Add any notes..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{expense ? 'Update' : 'Add Expense'}</Button>
        </div>
      </form>
    </Modal>
  );
}
