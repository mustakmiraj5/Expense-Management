'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardContent } from '@/app/components/ui/Card';
import { formatCurrency, formatMonth } from '@/app/lib/utils';
import type { DashboardStats } from '@/app/lib/types';

interface MonthlyTrendChartProps {
  data: DashboardStats['monthlyTrend'];
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const chartData = data.map((d) => ({ ...d, name: formatMonth(d.month) }));

  return (
    <Card>
      <CardHeader><h3 className="font-semibold text-gray-900">Monthly Trend (Last 12 Months)</h3></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#10B981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[3, 3, 0, 0]} />
            <Bar dataKey="savings" name="Savings" fill="#4F46E5" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
