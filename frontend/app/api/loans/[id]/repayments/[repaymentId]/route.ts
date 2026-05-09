import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/app/lib/api';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; repaymentId: string }> },
) {
  const { id, repaymentId } = await params;
  const res = await serverFetch(`/loans/${id}/repayments/${repaymentId}`, { method: 'DELETE' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
