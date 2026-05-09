'use client';

import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { formatCurrency, formatDate } from '@/app/lib/utils';
import { DirectionBadge, LoanStatusBadge } from './LoanStatusBadge';
import type { Loan } from '@/app/lib/types';

interface LoanTableProps {
  loans: Loan[];
  onEdit: (loan: Loan) => void;
  onDelete: (loan: Loan) => void;
  onAddRepayment: (loan: Loan) => void;
}

export function LoanTable({ loans, onEdit, onDelete, onAddRepayment }: LoanTableProps) {
  if (!loans.length) {
    return (
      <div className="bg-white border border-border rounded-xl p-10 text-center text-muted">
        No loans yet. Track money you lent or borrowed by adding one.
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
              <th className="text-left px-4 py-3 font-medium text-muted">Direction</th>
              <th className="text-left px-4 py-3 font-medium text-muted">Contact</th>
              <th className="text-right px-4 py-3 font-medium text-muted">Principal</th>
              <th className="text-right px-4 py-3 font-medium text-muted">Outstanding</th>
              <th className="text-left px-4 py-3 font-medium text-muted">Due</th>
              <th className="text-left px-4 py-3 font-medium text-muted">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loans.map((loan) => (
              <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-muted whitespace-nowrap">{formatDate(loan.date)}</td>
                <td className="px-4 py-3">
                  <DirectionBadge direction={loan.direction} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/loans/${loan.id}`} className="font-medium text-gray-900 hover:text-primary">
                    {loan.contact?.name}
                  </Link>
                  {loan.description && (
                    <div className="text-xs text-muted line-clamp-1">{loan.description}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                  {formatCurrency(parseFloat(loan.principal))}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                  {formatCurrency(parseFloat(loan.outstanding))}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">
                  {loan.dueDate ? formatDate(loan.dueDate) : '—'}
                </td>
                <td className="px-4 py-3">
                  <LoanStatusBadge loan={loan} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {loan.status === 'OPEN' && (
                      <Button variant="ghost" size="sm" onClick={() => onAddRepayment(loan)}>
                        + Repay
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onEdit(loan)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-red-50"
                      onClick={() => onDelete(loan)}
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
    </div>
  );
}
