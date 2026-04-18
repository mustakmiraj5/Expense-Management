import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/app/lib/api';

export async function GET() {
  const res = await serverFetch('/categories');
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await serverFetch('/categories', { method: 'POST', body: JSON.stringify(body) });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
