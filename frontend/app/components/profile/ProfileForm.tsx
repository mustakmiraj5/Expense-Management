'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { useToast } from '@/app/components/ui/Toast';
import { apiClient } from '@/app/lib/api-client';
import type { User } from '@/app/lib/types';

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.patch('/api/users/me', form);
      toast('Profile updated', 'success');
    } catch {
      toast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><h3 className="font-semibold text-gray-900">Profile Information</h3></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <Input id="email" label="Email" value={user.email} disabled />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="firstName"
              label="First name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <Input
              id="lastName"
              label="Last name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <Button type="submit" loading={loading}>Save Changes</Button>
        </form>
      </CardContent>
    </Card>
  );
}
