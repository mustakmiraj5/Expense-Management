'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { useToast } from '@/app/components/ui/Toast';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function MonthlyReportButton() {
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      toast('Pick a valid month', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?month=${month}`);
      if (res.status === 401) {
        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
        if (!refreshRes.ok) {
          window.location.href = '/login';
          return;
        }
        const retry = await fetch(`/api/reports/monthly?month=${month}`);
        if (!retry.ok) throw new Error('Failed to download report');
        await triggerDownload(retry, month);
      } else if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? 'Failed to download report');
      } else {
        await triggerDownload(res, month);
      }
      toast('Report downloaded', 'success');
    } catch (err: any) {
      toast(err?.message ?? 'Failed to download report', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div>
        <label htmlFor="report-month" className="block text-xs font-medium text-muted mb-1">
          Report month
        </label>
        <input
          id="report-month"
          type="month"
          value={month}
          max={currentMonth()}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <Button onClick={handleDownload} loading={loading}>
        ⬇ Download CSV
      </Button>
    </div>
  );
}

async function triggerDownload(res: Response, month: string) {
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const filename =
    parseFilenameFromCD(res.headers.get('content-disposition')) ?? `expense-report-${month}.csv`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function parseFilenameFromCD(header: string | null): string | null {
  if (!header) return null;
  const m = /filename="?([^"]+)"?/i.exec(header);
  return m ? m[1] : null;
}
