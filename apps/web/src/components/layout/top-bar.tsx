'use client';

import { useAuthContext } from '@/providers/auth-provider';
import { useSidebar } from '@/providers/sidebar-provider';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';
import { LogOut, Menu } from 'lucide-react';

export function TopBar() {
  const { user, logout } = useAuthContext();
  const { toggle } = useSidebar();
  const isOnline = useOnlineStatus();

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
        <button
          onClick={toggle}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-4 ml-auto">
          <span className="text-sm text-gray-600 hidden sm:inline">{user?.name}</span>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
      {!isOnline && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center text-sm text-yellow-800">
          You are offline. Some features may be unavailable.
        </div>
      )}
    </>
  );
}
