import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppShell } from '@/app/components/layout/AppShell';
import type { User } from '@/app/lib/types';

async function getUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;

  const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3001/api/v1';
  try {
    const res = await fetch(`${BACKEND}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? null;
  } catch {
    return null;
  }
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/login');

  return <AppShell user={user}>{children}</AppShell>;
}
