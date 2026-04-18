import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/app/lib/api';

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const res = await serverFetch('/users/me/password', { method: 'PATCH', body: JSON.stringify(body) });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
