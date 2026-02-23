'use client';

import { useAuthContext } from '@/providers/auth-provider';
import { LogOut } from 'lucide-react';

export function TopBar() {
  const { user, logout } = useAuthContext();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.name}</span>
        <button onClick={logout} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" title="Sign out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
