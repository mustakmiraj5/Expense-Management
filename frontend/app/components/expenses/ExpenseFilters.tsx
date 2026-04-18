'use client';

import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Button } from '@/app/components/ui/Button';
import type { Category } from '@/app/lib/types';

interface Filters {
  search: string;
  categoryId: string;
  startDate: string;
  endDate: string;
  sortBy: string;
  sortOrder: string;
}

interface ExpenseFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
  categories: Category[];
}

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'title', label: 'Title' },
];

const ORDER_OPTIONS = [
  { value: 'desc', label: 'Newest first' },
  { value: 'asc', label: 'Oldest first' },
];

export function ExpenseFilters({ filters, onChange, onReset, categories }: ExpenseFiltersProps) {
  const categoryOptions = [
    ...categories.map((c) => ({ value: String(c.id), label: `${c.icon ?? ''} ${c.name}`.trim() })),
  ];

  return (
    <div className="bg-white border border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          placeholder="Search expenses..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
        <Select
          options={categoryOptions}
          placeholder="All categories"
          value={filters.categoryId}
          onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
        />
        <Input
          type="date"
          value={filters.startDate}
          onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
        />
        <Input
          type="date"
          value={filters.endDate}
          onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
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
        <Button variant="ghost" size="sm" onClick={onReset}>Reset filters</Button>
      </div>
    </div>
  );
}
