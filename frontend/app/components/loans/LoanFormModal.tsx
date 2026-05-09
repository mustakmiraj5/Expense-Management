'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/app/components/ui/Modal';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Textarea } from '@/app/components/ui/Textarea';
import { Button } from '@/app/components/ui/Button';
import { useToast } from '@/app/components/ui/Toast';
import { apiClient } from '@/app/lib/api-client';
import type { Loan, Contact } from '@/app/lib/types';

interface LoanFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  loan?: Loan | null;
  contacts: Contact[];
  onCreateContact?: () => void;
}

export function LoanFormModal({
  open,
  onClose,
  onSaved,
  loan,
  contacts,
  onCreateContact,
}: LoanFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    direction: 'LENT' as 'LENT' | 'BORROWED',
    principal: '',
    contactId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (loan) {
      setForm({
        direction: loan.direction,
        principal: String(parseFloat(loan.principal)),
        contactId: String(loan.contactId),
        date: loan.date.split('T')[0],
        dueDate: loan.dueDate ? loan.dueDate.split('T')[0] : '',
        description: loan.description ?? '',
      });
    } else {
      setForm({
        direction: 'LENT',
        principal: '',
        contactId: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        description: '',
      });
    }
    setErrors({});
  }, [loan, open]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.principal || isNaN(Number(form.principal)) || Number(form.principal) <= 0) {
      errs.principal = 'Valid amount required';
    }
    if (!form.contactId) errs.contactId = 'Contact is required';
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
      const basePayload = {
        principal: Number(form.principal),
        contactId: Number(form.contactId),
        date: form.date,
        dueDate: form.dueDate || undefined,
        description: form.description || undefined,
      };

      if (loan) {
        await apiClient.patch(`/api/loans/${loan.id}`, basePayload);
        toast('Loan updated', 'success');
      } else {
        await apiClient.post('/api/loans', { ...basePayload, direction: form.direction });
        toast('Loan added', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err?.response?.message ?? err?.message ?? 'Failed to save loan', 'error');
    } finally {
      setLoading(false);
    }
  }

  const contactOptions = contacts.map((c) => ({ value: c.id, label: c.name }));

  return (
    <Modal open={open} onClose={onClose} title={loan ? 'Edit Loan' : 'Add Loan'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!loan && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, direction: 'LENT' })}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  form.direction === 'LENT'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-border text-gray-700 hover:bg-gray-50'
                }`}
              >
                ↗ I lent money
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, direction: 'BORROWED' })}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  form.direction === 'BORROWED'
                    ? 'border-rose-500 bg-rose-50 text-rose-700'
                    : 'border-border text-gray-700 hover:bg-gray-50'
                }`}
              >
                ↙ I borrowed money
              </button>
            </div>
          </div>
        )}

        <Input
          id="principal"
          type="number"
          label="Amount (৳)"
          placeholder="0.00"
          min="0"
          step="0.01"
          value={form.principal}
          onChange={(e) => setForm({ ...form, principal: e.target.value })}
          error={errors.principal}
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="contactId" className="block text-sm font-medium text-gray-700">
              Contact
            </label>
            {onCreateContact && (
              <button
                type="button"
                onClick={onCreateContact}
                className="text-xs text-primary hover:underline"
              >
                + New contact
              </button>
            )}
          </div>
          <Select
            id="contactId"
            options={contactOptions}
            placeholder="Select contact"
            value={form.contactId}
            onChange={(e) => setForm({ ...form, contactId: e.target.value })}
            error={errors.contactId}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="date"
            type="date"
            label="Date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            error={errors.date}
          />
          <Input
            id="dueDate"
            type="date"
            label="Due date (optional)"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>

        <Textarea
          id="description"
          label="Description (optional)"
          placeholder="Notes..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {loan ? 'Update' : 'Add Loan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
