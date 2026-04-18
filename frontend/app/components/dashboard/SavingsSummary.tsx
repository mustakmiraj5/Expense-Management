import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { formatCurrency } from '@/app/lib/utils';

interface SavingsSummaryProps {
  income: { thisMonth: number; allTime: number };
  expenses: { thisMonth: number; allTime: number };
  savings: { thisMonth: number; allTime: number };
}

export function SavingsSummary({ income, expenses, savings }: SavingsSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">Monthly Summary</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Row label="Income this month" value={income.thisMonth} color="text-success" />
          <Row label="Expenses this month" value={expenses.thisMonth} color="text-danger" />
          <div className="border-t border-border pt-3">
            <Row
              label="Net savings this month"
              value={savings.thisMonth}
              color={savings.thisMonth >= 0 ? 'text-success' : 'text-danger'}
              bold
            />
          </div>
          <div className="border-t border-border pt-3">
            <Row label="All-time income" value={income.allTime} color="text-success" />
            <Row label="All-time expenses" value={expenses.allTime} color="text-danger" />
            <Row
              label="All-time savings"
              value={savings.allTime}
              color={savings.allTime >= 0 ? 'text-success' : 'text-danger'}
              bold
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-muted'}`}>{label}</span>
      <span className={`text-sm font-medium ${color}`}>{formatCurrency(value)}</span>
    </div>
  );
}
