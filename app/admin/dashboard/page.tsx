'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Users, Building2, University, FileText, Mail, ArrowRight } from 'lucide-react';

interface Stats {
  users: number;
  students: number;
  companies: number;
  universities: number;
  wallPosts: number;
  pendingUniversities: number;
  pendingStudents: number;
  emailLogs: number;
  connections: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then((d) => {
      if (d.success) setStats(d.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

  const cards = [
    { icon: Users, label: 'Total Users', value: stats?.users || 0, sub: null, href: '/admin/users', color: 'text-blue-500 bg-blue-50' },
    { icon: University, label: 'Schools', value: stats?.universities || 0, sub: stats?.pendingUniversities ? `${stats.pendingUniversities} pending` : null, href: '/admin/universities', color: 'text-purple-500 bg-purple-50' },
    { icon: Building2, label: 'Companies', value: stats?.companies || 0, sub: null, href: '/admin/users', color: 'text-[#0F6E56] bg-[#E8F5F1]' },
    { icon: Users, label: 'Students', value: stats?.students || 0, sub: stats?.pendingStudents ? `${stats.pendingStudents} pending` : null, href: '/admin/users', color: 'text-indigo-500 bg-indigo-50' },
    { icon: FileText, label: 'Wall Posts', value: stats?.wallPosts || 0, sub: null, href: '/admin/posts', color: 'text-orange-500 bg-orange-50' },
    { icon: Mail, label: 'Email Logs', value: stats?.emailLogs || 0, sub: null, href: '/admin/email-logs', color: 'text-pink-500 bg-pink-50' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview and management.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map(({ icon: Icon, label, value, sub, href, color }) => (
          <Link key={label} href={href} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors flex items-start gap-4 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{label}</div>
              {sub && <div className="text-xs text-amber-500 mt-0.5">{sub}</div>}
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 mt-1" />
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Pending Universities', desc: `${stats?.pendingUniversities || 0} awaiting verification`, href: '/admin/universities' },
            { title: 'Manage Wall Posts', desc: `${stats?.wallPosts || 0} total posts`, href: '/admin/posts' },
            { title: 'User Management', desc: `${stats?.users || 0} registered users`, href: '/admin/users' },
            { title: 'Email Logs', desc: `${stats?.emailLogs || 0} emails sent`, href: '/admin/email-logs' },
          ].map(({ title, desc, href }) => (
            <Link key={title} href={href} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#0F6E56] transition-colors flex items-center justify-between group">
              <div>
                <p className="font-medium text-gray-900 text-sm">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0F6E56]" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
