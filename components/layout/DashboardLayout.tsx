'use client';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

type Role = 'student' | 'company' | 'university_admin' | 'super_admin';

function detectRole(pathname: string): Role {
  if (pathname.startsWith('/admin')) return 'super_admin';
  if (pathname.startsWith('/university-admin')) return 'university_admin';
  if (pathname.startsWith('/company')) return 'company';
  return 'student';
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const role = detectRole(pathname);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
