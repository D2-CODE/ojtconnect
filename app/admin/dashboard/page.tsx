'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Users, Building2, University, FileText, Mail, ArrowRight, ChevronDown } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

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

interface ChartPoint {
  label: string;
  users: number;
  posts: number;
  emails: number;
}

type Period = 'day' | 'week' | 'month';
const PERIODS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [period, setPeriod] = useState<Period>('week');
  const [chartLoading, setChartLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then((d) => {
      if (d.success) setStats(d.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setChartLoading(true);
    fetch(`/api/admin/chart-data?period=${period}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setChartData(d.data); })
      .finally(() => setChartLoading(false));
  }, [period]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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

  const selectedLabel = PERIODS.find((p) => p.value === period)?.label;

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

      {/* Chart Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900">Growth Overview</h2>
          {/* Period filter dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors"
            >
              {selectedLabel}
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {PERIODS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => { setPeriod(value); setDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${period === value ? 'text-[#0F6E56] font-semibold' : 'text-gray-700'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {chartLoading ? (
          <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 13 }}
                labelStyle={{ fontWeight: 600, color: '#111827' }}
              />
              <Legend wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
              <Line type="monotone" dataKey="users" name="Total Users" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="posts" name="Wall Posts" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="emails" name="Email Logs" stroke="#ec4899" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
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
