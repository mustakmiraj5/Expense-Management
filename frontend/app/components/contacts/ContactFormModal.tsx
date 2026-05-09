'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/app/components/ui/Modal';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/Textarea';
import { Button } from '@/app/components/ui/Button';
import { useToast } from '@/app/components/ui/Toast';
import { apiClient } from '@/app/lib/api-client';
import type { Contact } from '@/app/lib/types';

interface ContactFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  contact: Contact | null;
}

export function ContactFormModal({ open, onClose, onSaved, contact }: ContactFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', note: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contact) {
      setForm({ name: contact.name, phone: contact.phone ?? '', note: contact.note ?? '' });
    } else {
      setForm({ name: '', phone: '', note: '' });
    }
    setErrors({});
  }, [contact, open]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
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
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        note: form.note.trim() || undefined,
      };
      if (contact) {
        await apiClient.patch(`/api/contacts/${contact.id}`, payload);
        toast('Contact updated', 'success');
      } else {
        await apiClient.post('/api/contacts', payload);
        toast('Contact added', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err?.response?.message ?? err?.message ?? 'Failed to save contact', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={contact ? 'Edit Contact' : 'Add Contact'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="name"
          label="Name"
          placeholder="e.g. Rahim"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
        />
        <Input
          id="phone"
          label="Phone (optional)"
          placeholder="e.g. 01700000000"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <Textarea
          id="note"
          label="Note (optional)"
          placeholder="Anything to remember..."
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {contact ? 'Update' : 'Add Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
