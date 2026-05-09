'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { PageSpinner } from '@/app/components/ui/Spinner';
import { ContactFormModal } from '@/app/components/contacts/ContactFormModal';
import { apiClient } from '@/app/lib/api-client';
import { useToast } from '@/app/components/ui/Toast';
import type { Contact, PaginatedResponse } from '@/app/lib/types';

export default function ContactsPage() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (search) params.set('search', search);
      const data = await apiClient.get<PaginatedResponse<Contact>>(`/api/contacts?${params}`);
      setContacts(data.data);
    } catch {
      toast('Failed to load contacts', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  function handleEdit(c: Contact) {
    setEditing(c);
    setModalOpen(true);
  }

  async function handleDelete(c: Contact) {
    if (!confirm(`Delete contact "${c.name}"?`)) return;
    try {
      await apiClient.delete(`/api/contacts/${c.id}`);
      toast('Contact deleted', 'success');
      fetchContacts();
    } catch (err: any) {
      toast(err?.response?.message ?? 'Cannot delete: contact may be in use by loans', 'error');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-muted mt-1">People you've lent to or borrowed from.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          + Add Contact
        </Button>
      </div>

      <div className="bg-white border border-border rounded-xl p-4">
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <PageSpinner />
      ) : !contacts.length ? (
        <div className="bg-white border border-border rounded-xl p-10 text-center text-muted">
          No contacts yet. Add one to start tracking loans.
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-muted">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Note</th>
                <th className="text-right px-4 py-3 font-medium text-muted">Loans</th>
                <th className="text-right px-4 py-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-muted line-clamp-1 max-w-md">{c.note || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{c._count?.loans ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-red-50"
                        onClick={() => handleDelete(c)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ContactFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchContacts}
        contact={editing}
      />
    </div>
  );
}
