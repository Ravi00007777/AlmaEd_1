'use client';

import { useState, type ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui/cn';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SignOutButton } from '@/components/sign-out-button';
import {
  HomeIcon,
  UsersIcon,
  GraduationCapIcon,
  BookOpenIcon,
  CreditCardIcon,
  MenuIcon,
  XIcon,
  type IconComponent,
} from '@/components/ui/icons';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

type NavItem = { href: string; label: string; icon: IconComponent };

const navByRole: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: '/admin', label: 'Overview', icon: HomeIcon },
    { href: '/admin/teachers', label: 'Teachers', icon: UsersIcon },
    { href: '/admin/students', label: 'Students', icon: GraduationCapIcon },
    { href: '/admin/batches', label: 'Batches', icon: BookOpenIcon },
    { href: '/admin/payments', label: 'Payments', icon: CreditCardIcon },
  ],
  TEACHER: [{ href: '/teacher', label: 'My batches', icon: BookOpenIcon }],
  STUDENT: [{ href: '/student', label: 'My classes', icon: BookOpenIcon }],
};

function NavLinks({ items, pathname, onNavigate }: { items: NavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            <Icon className="h-5 w-5 flex-none" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  name,
  role,
  children,
}: {
  name: string;
  role: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = navByRole[role];

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <Link href="/" className="mb-8 px-2 text-lg font-bold text-slate-900">
          Alma<span className="text-indigo-600">Ed</span>
        </Link>
        <NavLinks items={items} pathname={pathname} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white px-4 py-6 shadow-xl">
            <div className="mb-8 flex items-center justify-between px-2">
              <span className="text-lg font-bold text-slate-900">
                Alma<span className="text-indigo-600">Ed</span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <NavLinks items={items} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col md:pl-64">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-slate-900 md:hidden">AlmaEd</span>
          <div className="flex items-center gap-3">
            <Avatar name={name} />
            <div className="hidden text-sm sm:block">
              <p className="font-medium text-slate-900">{name}</p>
            </div>
            <Badge variant="info">{role}</Badge>
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
