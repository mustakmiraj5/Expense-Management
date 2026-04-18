import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/app/lib/api';

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.toString();
  const path = search ? `/incomes?${search}` : '/incomes';
  const res = await serverFetch(path);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await serverFetch('/incomes', { method: 'POST', body: JSON.stringify(body) });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
