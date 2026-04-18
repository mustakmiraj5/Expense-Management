import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/app/lib/api';

export async function GET() {
  const res = await serverFetch('/users/me');
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const res = await serverFetch('/users/me', { method: 'PATCH', body: JSON.stringify(body) });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
