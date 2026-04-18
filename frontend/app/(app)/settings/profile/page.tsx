import { serverFetch } from '@/app/lib/api';
import { ProfileForm } from '@/app/components/profile/ProfileForm';
import { ChangePasswordForm } from '@/app/components/profile/ChangePasswordForm';
import type { User } from '@/app/lib/types';

async function getProfile(): Promise<User | null> {
  try {
    const res = await serverFetch('/users/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? null;
  } catch {
    return null;
  }
}

export default async function ProfilePage() {
  const user = await getProfile();
  if (!user) return <p className="text-muted">Failed to load profile.</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
      <ProfileForm user={user} />
      <ChangePasswordForm />
    </div>
  );
}
