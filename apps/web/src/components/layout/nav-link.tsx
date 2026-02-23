import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface NavLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}

export function NavLink({ href, icon: Icon, label, active }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        active ? 'bg-primary-50 text-medical-blue' : 'text-gray-600 hover:bg-gray-100',
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
