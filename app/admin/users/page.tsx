'use client';
import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { Users, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  profileType: string;
  isActive: boolean;
  createdAt: string;
}

const TABS = [{ value: 'all', label: 'All' }, { value: 'student', label: 'Students' }, { value: 'company', label: 'Companies' }, { value: 'university_admin', label: 'Universities' }];

export default function AdminUsersPage() {
  const { toast: showToast } = useToast();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 15;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (tab !== 'all') params.set('profileType', tab);
    if (search) params.set('search', search);
    fetch(`/api/admin/users?${params}`).then((r) => r.json()).then((d) => {
      if (d.success) { setUsers(d.data); setTotal(d.total || 0); }
    }).finally(() => setLoading(false));
  }, [page, tab, search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const toggle = async (id: string, isActive: boolean) => {
    const res = await fetch(`/api/admin/users`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: id, isActive: !isActive }) });
    const d = await res.json();
    if (d.success) { showToast(`User ${!isActive ? 'activated' : 'deactivated'}`, 'success'); load(); }
    else showToast(d.error || 'Failed', 'error');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 text-sm mt-1">Manage all registered users.</p>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="w-full max-w-sm border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]"
          placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <Tabs tabs={TABS} activeTab={tab} onTabChange={(t) => { setTab(t); setPage(1); }} className="mb-4" />

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]"><LoadingSpinner /></div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="No results match your filters." />
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">{total} user{total !== 1 ? 's' : ''}</p>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u._id} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3"><Badge label={u.profileType} variant="neutral" /></td>
                    <td className="px-4 py-3"><Badge label={u.isActive ? 'Active' : 'Inactive'} variant={u.isActive ? 'success' : 'error'} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant={u.isActive ? 'outline' : 'primary'} className="text-xs px-3 py-1 h-auto" onClick={() => toggle(u._id, u.isActive)}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center"><Pagination total={total} page={page} limit={limit} onPageChange={setPage} /></div>
        </>
      )}
    </div>
  );
}
