'use client';

import { Badge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import { formatCurrency, formatDate } from '@/app/lib/utils';
import type { Income } from '@/app/lib/types';

interface IncomeTableProps {
  incomes: Income[];
  onEdit: (income: Income) => void;
  onDelete: (income: Income) => void;
}

export function IncomeTable({ incomes, onEdit, onDelete }: IncomeTableProps) {
  if (!incomes.length) {
    return (
      <div className="bg-white border border-border rounded-xl p-10 text-center text-muted">
        No income records found. Add your first income!
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
              <th className="text-left px-4 py-3 font-medium text-muted">Source</th>
              <th className="text-right px-4 py-3 font-medium text-muted">Amount</th>
              <th className="text-right px-4 py-3 font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {incomes.map((inc) => (
              <tr key={inc.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-muted whitespace-nowrap">{formatDate(inc.date)}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{inc.title}</div>
                  {inc.description && <div className="text-xs text-muted line-clamp-1">{inc.description}</div>}
                </td>
                <td className="px-4 py-3">
                  {inc.source && <Badge className="bg-green-50 text-success">{inc.source}</Badge>}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-success whitespace-nowrap">
                  {formatCurrency(parseFloat(inc.amount))}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(inc)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-danger hover:bg-red-50" onClick={() => onDelete(inc)}>
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
