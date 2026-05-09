import { Badge } from '@/app/components/ui/Badge';
import type { Loan } from '@/app/lib/types';

interface LoanStatusBadgeProps {
  loan: Pick<Loan, 'status' | 'isOverdue'>;
}

export function LoanStatusBadge({ loan }: LoanStatusBadgeProps) {
  if (loan.status === 'SETTLED') {
    return (
      <Badge className="bg-green-100 text-green-700">Settled</Badge>
    );
  }
  if (loan.isOverdue) {
    return <Badge className="bg-red-100 text-red-700">Overdue</Badge>;
  }
  return <Badge className="bg-amber-100 text-amber-700">Open</Badge>;
}

interface DirectionBadgeProps {
  direction: Loan['direction'];
}

export function DirectionBadge({ direction }: DirectionBadgeProps) {
  return direction === 'LENT' ? (
    <Badge className="bg-emerald-100 text-emerald-700">↗ Lent</Badge>
  ) : (
    <Badge className="bg-rose-100 text-rose-700">↙ Borrowed</Badge>
  );
}
