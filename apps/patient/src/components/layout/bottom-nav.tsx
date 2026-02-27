'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Camera, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePatientThreads } from '@/lib/hooks/use-patient-messages';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/scan', label: 'Scan', icon: Camera },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: threads } = usePatientThreads();

  const totalUnread = threads?.reduce((sum, t) => sum + t.unreadCount, 0) ?? 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          const showBadge = href === '/messages' && totalUnread > 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 relative',
                isActive ? 'text-medical-blue' : 'text-gray-400',
              )}
            >
              <Icon className="w-6 h-6" />
              {showBadge && (
                <span className="absolute -top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
