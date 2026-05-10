import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/app/lib/api';

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.toString();
  const path = search ? `/reports/monthly?${search}` : '/reports/monthly';
  const res = await serverFetch(path);

  if (!res.ok) {
    const body = await res.text();
    try {
      return NextResponse.json(JSON.parse(body), { status: res.status });
    } catch {
      return new NextResponse(body, { status: res.status });
    }
  }

  const headers = new Headers();
  const ct = res.headers.get('content-type');
  if (ct) headers.set('Content-Type', ct);
  const cd = res.headers.get('content-disposition');
  if (cd) headers.set('Content-Disposition', cd);

  return new NextResponse(res.body, { status: res.status, headers });
}
