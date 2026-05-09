'use client';

import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Button } from '@/app/components/ui/Button';
import type { Contact } from '@/app/lib/types';

export interface LoanFiltersState {
  search: string;
  direction: string;
  status: string;
  contactId: string;
  overdueOnly: boolean;
  sortBy: string;
  sortOrder: string;
}

interface LoanFiltersProps {
  filters: LoanFiltersState;
  onChange: (filters: LoanFiltersState) => void;
  onReset: () => void;
  contacts: Contact[];
}

const DIRECTION_OPTIONS = [
  { value: '', label: 'All directions' },
  { value: 'LENT', label: '↗ Lent (receivable)' },
  { value: 'BORROWED', label: '↙ Borrowed (payable)' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All status' },
  { value: 'OPEN', label: 'Open' },
  { value: 'SETTLED', label: 'Settled' },
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'principal', label: 'Principal' },
  { value: 'createdAt', label: 'Created' },
];

const ORDER_OPTIONS = [
  { value: 'desc', label: 'Newest first' },
  { value: 'asc', label: 'Oldest first' },
];

export function LoanFilters({ filters, onChange, onReset, contacts }: LoanFiltersProps) {
  const contactOptions = [
    { value: '', label: 'All contacts' },
    ...contacts.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  return (
    <div className="bg-white border border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          placeholder="Search by description or contact..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
        <Select
          options={DIRECTION_OPTIONS}
          value={filters.direction}
          onChange={(e) => onChange({ ...filters, direction: e.target.value })}
        />
        <Select
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
        />
        <Select
          options={contactOptions}
          value={filters.contactId}
          onChange={(e) => onChange({ ...filters, contactId: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          options={SORT_OPTIONS}
          value={filters.sortBy}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}
          className="w-36"
        />
        <Select
          options={ORDER_OPTIONS}
          value={filters.sortOrder}
          onChange={(e) => onChange({ ...filters, sortOrder: e.target.value })}
          className="w-40"
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={filters.overdueOnly}
            onChange={(e) => onChange({ ...filters, overdueOnly: e.target.checked })}
          />
          Overdue only
        </label>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset filters
        </Button>
      </div>
    </div>
  );
}
