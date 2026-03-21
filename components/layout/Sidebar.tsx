'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { GraduationCap, LayoutDashboard, Search, User, Building2, Users, Mail, FileText, Eye, LogOut, Newspaper } from 'lucide-react';

type Role = 'student' | 'company' | 'university_admin' | 'super_admin';

interface NavItem { label: string; href: string; icon: React.ElementType; }

const navItems: Record<Role, NavItem[]> = {
  student: [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Browse Wall', href: '/wall', icon: Search },
    { label: 'My OJT Posts', href: '/student/wall', icon: Newspaper },
    { label: 'My Profile', href: '/student/profile', icon: User },
    { label: 'University Verification', href: '/student/verification', icon: GraduationCap },
    { label: 'Connections', href: '/student/connections', icon: Users },
  ],
  company: [
    { label: 'Dashboard', href: '/company/dashboard', icon: LayoutDashboard },
    { label: 'My Listings', href: '/company/wall', icon: Newspaper },
    { label: 'Browse Interns', href: '/company/search', icon: Search },
    { label: 'My Profile', href: '/company/profile', icon: Building2 },
    { label: 'Connections', href: '/company/connections', icon: Users },
  ],
  university_admin: [
    { label: 'Dashboard', href: '/university-admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', href: '/university-admin/students', icon: Users },
    { label: 'University Profile', href: '/university-admin/profile', icon: Building2 },
    { label: 'Preview Public Page', href: '/university-admin/preview', icon: Eye },
  ],
  super_admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Universities', href: '/admin/universities', icon: Building2 },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Posts', href: '/admin/posts', icon: FileText },
    { label: 'Email Logs', href: '/admin/email-logs', icon: Mail },
  ],
};

interface SidebarProps { role: Role; }

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = navItems[role];
  const isAdmin = role === 'super_admin';

  return (
    <aside className={`w-[260px] flex-shrink-0 flex flex-col h-full ${isAdmin ? 'bg-gray-900' : 'bg-white border-r border-gray-200'}`}>
      {/* Logo */}
      <div className={`px-4 py-6 border-b ${isAdmin ? 'border-gray-700' : 'border-gray-100'}`}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0F6E56] flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className={`font-bold text-sm ${isAdmin ? 'text-white' : 'text-gray-900'}`}>OJT Connect PH</span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-[8px] text-sm font-medium transition-all
                ${isActive
                  ? isAdmin
                    ? 'bg-[#0F6E56] text-white'
                    : 'bg-[#E8F5F1] text-[#0F6E56]'
                  : isAdmin
                    ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className={`px-2 pb-4 border-t ${isAdmin ? 'border-gray-700 pt-4' : 'border-gray-100 pt-4'}`}>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[8px] text-sm font-medium transition-all
            ${isAdmin ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
        >
          <LogOut className="w-[18px] h-[18px]" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
