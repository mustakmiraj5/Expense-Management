import Link from 'next/link';
import { Card, CardContent } from '@/app/components/ui/Card';
import { formatCurrency } from '@/app/lib/utils';
import type { LoansSummary } from '@/app/lib/types';

interface LoansOverviewCardProps {
  summary: LoansSummary;
}

export function LoansOverviewCard({ summary }: LoansOverviewCardProps) {
  const receivable = parseFloat(summary.totalReceivable);
  const payable = parseFloat(summary.totalPayable);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Loans</h2>
        <Link href="/loans" className="text-sm text-primary hover:underline">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-emerald-50">
              ↗
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted">Total Receivable</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(receivable)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-rose-50">
              ↙
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted">Total Payable</p>
              <p className="text-xl font-bold text-rose-600">{formatCurrency(payable)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {summary.overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
          ⚠ {summary.overdueCount} loan{summary.overdueCount > 1 ? 's are' : ' is'} overdue.{' '}
          <Link href="/loans?overdueOnly=true" className="font-medium hover:underline">
            Review now →
          </Link>
        </div>
      )}
    </div>
  );
}
