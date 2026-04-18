import { NextResponse } from 'next/server';
import { serverFetch } from '@/app/lib/api';

export async function GET() {
  const res = await serverFetch('/dashboard/stats');
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
