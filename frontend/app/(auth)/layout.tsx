import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-3xl">
            <span>৳</span>
            <span>ExpenseTracker</span>
          </div>
          <p className="mt-2 text-sm text-muted">Manage your finances with ease</p>
        </div>
        {children}
      </div>
    </div>
  );
}
