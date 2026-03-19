'use client';
import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { University, Search } from 'lucide-react';

interface UniItem {
  _id: string;
  name: string;
  location: string;
  verificationStatus: string;
  programs: string[];
}

const TABS = [{ value: 'all', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'verified', label: 'Verified' }, { value: 'rejected', label: 'Rejected' }];

export default function AdminUniversitiesPage() {
  const { toast: showToast } = useToast();
  const [unis, setUnis] = useState<UniItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 10;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (tab !== 'all') params.set('verificationStatus', tab);
    if (search) params.set('search', search);
    fetch(`/api/universities?${params}`).then((r) => r.json()).then((d) => {
      if (d.success) { setUnis(d.data); setTotal(d.total || 0); }
    }).finally(() => setLoading(false));
  }, [page, tab, search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const verify = async (id: string, status: string) => {
    const res = await fetch(`/api/universities/${id}/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    const d = await res.json();
    if (d.success) { showToast(`University ${status}`, 'success'); load(); }
    else showToast(d.error || 'Failed', 'error');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Universities</h1>
        <p className="text-gray-500 text-sm mt-1">Verify and manage university accounts.</p>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="w-full max-w-sm border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]"
          placeholder="Search universities..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <Tabs tabs={TABS} activeTab={tab} onTabChange={(t) => { setTab(t); setPage(1); }} className="mb-4" />

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]"><LoadingSpinner /></div>
      ) : unis.length === 0 ? (
        <EmptyState icon={University} title="No universities found" description="No results match your filters." />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">University</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Programs</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {unis.map((u, i) => (
                  <tr key={u._id} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.location}</td>
                    <td className="px-4 py-3 text-gray-500">{u.programs?.length || 0}</td>
                    <td className="px-4 py-3">
                      <Badge label={u.verificationStatus} variant={u.verificationStatus === 'verified' ? 'success' : u.verificationStatus === 'pending' ? 'warning' : 'error'} />
                    </td>
                    <td className="px-4 py-3">
                      {u.verificationStatus === 'pending' && (
                        <div className="flex gap-2 justify-end">
                          <Button variant="primary" className="text-xs px-3 py-1 h-auto" onClick={() => verify(u._id, 'verified')}>Verify</Button>
                          <Button variant="outline" className="text-xs px-3 py-1 h-auto" onClick={() => verify(u._id, 'rejected')}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination total={total} page={page} limit={limit} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
