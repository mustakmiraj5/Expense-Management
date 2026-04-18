import { serverFetch } from '@/app/lib/api';
import { StatCard } from '@/app/components/dashboard/StatCard';
import { SavingsSummary } from '@/app/components/dashboard/SavingsSummary';
import { CategoryPieChart } from '@/app/components/dashboard/CategoryPieChart';
import { MonthlyTrendChart } from '@/app/components/dashboard/MonthlyTrendChart';
import type { DashboardStats } from '@/app/lib/types';

async function getStats(): Promise<DashboardStats | null> {
  try {
    const res = await serverFetch('/dashboard/stats', { next: { revalidate: 60 } } as any);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  if (!stats) {
    return (
      <div className="text-center py-20 text-muted">
        <p>Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today" amount={stats.totals.today} icon="📅" colorClass="bg-blue-50" />
        <StatCard title="This Week" amount={stats.totals.weekly} icon="📆" colorClass="bg-purple-50" />
        <StatCard title="This Month" amount={stats.totals.monthly} icon="🗓️" colorClass="bg-orange-50" />
        <StatCard title="This Year" amount={stats.totals.yearly} icon="📈" colorClass="bg-green-50" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart data={stats.categoryBreakdown} />
        <SavingsSummary income={stats.income} expenses={stats.expenses} savings={stats.savings} />
      </div>

      {/* Monthly trend */}
      <MonthlyTrendChart data={stats.monthlyTrend} />
    </div>
  );
}
