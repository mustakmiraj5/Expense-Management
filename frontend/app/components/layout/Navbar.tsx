'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/app/lib/types';

interface NavbarProps {
  user: User | null;
  onMenuClick?: () => void;
}

export function Navbar({ user, onMenuClick }: NavbarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1" />

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-medium text-xs">
            {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
          </div>
          <span className="hidden md:block">{user ? `${user.firstName} ${user.lastName}` : ''}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border z-20 py-1">
              <a
                href="/settings/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Profile Settings
              </a>
              <hr className="my-1 border-border" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
