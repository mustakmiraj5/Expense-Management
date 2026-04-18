import { Card, CardContent } from '@/app/components/ui/Card';
import { formatCurrency } from '@/app/lib/utils';

interface StatCardProps {
  title: string;
  amount: number;
  icon: string;
  colorClass: string;
}

export function StatCard({ title, amount, icon, colorClass }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorClass}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(amount)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
