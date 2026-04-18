import { cookies } from 'next/headers';

const BASE = process.env.BACKEND_URL ?? 'http://localhost:3001/api/v1';

export async function serverFetch(path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}
