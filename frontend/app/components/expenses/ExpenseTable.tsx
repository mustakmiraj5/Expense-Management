'use client';

import { Badge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import { formatCurrency, formatDate } from '@/app/lib/utils';
import type { Expense } from '@/app/lib/types';

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseTable({ expenses, onEdit, onDelete }: ExpenseTableProps) {
  if (!expenses.length) {
    return (
      <div className="bg-white border border-border rounded-xl p-10 text-center text-muted">
        No expenses found. Add your first expense!
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-muted">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted">Title</th>
              <th className="text-left px-4 py-3 font-medium text-muted">Category</th>
              <th className="text-right px-4 py-3 font-medium text-muted">Amount</th>
              <th className="text-right px-4 py-3 font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-muted whitespace-nowrap">{formatDate(exp.date)}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{exp.title}</div>
                  {exp.description && <div className="text-xs text-muted line-clamp-1">{exp.description}</div>}
                </td>
                <td className="px-4 py-3">
                  <Badge color={exp.category?.color}>
                    {exp.category?.icon} {exp.category?.name}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                  {formatCurrency(parseFloat(exp.amount))}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(exp)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-danger hover:bg-red-50" onClick={() => onDelete(exp)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
