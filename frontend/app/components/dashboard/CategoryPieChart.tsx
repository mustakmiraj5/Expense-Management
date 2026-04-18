'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardContent } from '@/app/components/ui/Card';
import { formatCurrency } from '@/app/lib/utils';
import type { DashboardStats } from '@/app/lib/types';

interface CategoryPieChartProps {
  data: DashboardStats['categoryBreakdown'];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader><h3 className="font-semibold text-gray-900">Expenses by Category</h3></CardHeader>
        <CardContent><p className="text-sm text-muted text-center py-6">No expenses this month</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><h3 className="font-semibold text-gray-900">Expenses by Category (This Month)</h3></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="categoryName" cx="50%" cy="50%" outerRadius={90} label={false}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
