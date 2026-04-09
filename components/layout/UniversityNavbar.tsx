'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface UniversityNavbarProps {
  name: string;
  logo?: string;
  slug: string;
}

export function UniversityNavbar({ name, logo, slug }: UniversityNavbarProps) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const getDashboardUrl = (roleName?: string) => {
    if (roleName === 'student') return '/student/dashboard';
    if (roleName === 'company') return '/company/dashboard';
    if (roleName === 'university_admin') return '/university-admin/dashboard';
    if (roleName === 'super_admin') return '/admin/dashboard';
    return '/';
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
      <div className="max-w-[1440px] mx-auto px-5 lg:px-20 h-16 flex items-center relative">

        {/* University logo — replaces platform logos */}
        <Link href={`/university/home/${slug}`} className="flex items-center gap-2 flex-shrink-0">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={name} className="h-10 w-auto max-w-[180px] object-contain" />
          ) : (
            <span className="text-lg font-bold text-[#0F6E56] max-w-[200px] truncate">{name}</span>
          )}
        </Link>

        {/* Nav links — absolutely centered */}
        <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          <Link href="/wall" className="text-sm text-gray-600 hover:text-[#0F6E56] font-medium transition-colors">Wall</Link>
          <Link href="/wall?type=internship" className="text-sm text-gray-600 hover:text-[#0F6E56] font-medium transition-colors">Internships</Link>
          <Link href="/wall?type=intern" className="text-sm text-gray-600 hover:text-[#0F6E56] font-medium transition-colors">Find Interns</Link>
        </div>

        {/* Auth — right */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          {session?.user ? (
            <Link href={getDashboardUrl(session.user.roleName)} className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#0F6E56] transition-colors">
              <Avatar name={session.user.name ?? ''} size="sm" />
              <span className="max-w-[120px] truncate">{session.user.name}</span>
              <LayoutDashboard className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link href="/login"><Button variant="outline" size="sm">Log In</Button></Link>
              <Link href="/register"><Button variant="primary" size="sm">Get Started</Button></Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 ml-auto" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-5 py-4 flex flex-col gap-4">
          <Link href="/wall" className="text-sm text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>Wall</Link>
          <Link href="/wall?type=internship" className="text-sm text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>Internships</Link>
          <Link href="/wall?type=intern" className="text-sm text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>Find Interns</Link>
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            {session?.user ? (
              <Link href={getDashboardUrl(session.user.roleName)} onClick={() => setMenuOpen(false)}>
                <Button variant="primary" className="w-full">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}><Button variant="outline" className="w-full">Log In</Button></Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}><Button variant="primary" className="w-full">Get Started</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
