'use client';
import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { FileText, Search } from 'lucide-react';
import { truncate, formatDate } from '@/lib/utils';

interface Post {
  _id: string;
  source?: string;
  postedByName?: string;
  title?: string;
  description?: string;
  SectionData: { fbleads: { name: string; post_text: string; lead_type: string } };
  status: string;
  createdAt: string;
}

const TABS = [{ value: 'all', label: 'All' }, { value: 'intern', label: 'Seeking OJT' }, { value: 'internship', label: 'Offering' }, { value: 'claimed', label: 'Claimed' }, { value: 'company', label: 'Company Posts' }, { value: 'student', label: 'Student Posts' }];

export default function AdminPostsPage() {
  const { toast: showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 15;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (tab === 'claimed') params.set('status', 'claimed');
    else if (tab === 'company') params.set('source', 'company');
    else if (tab === 'student') params.set('source', 'student');
    else if (tab !== 'all') params.set('type', tab);
    if (search) params.set('search', search);
    fetch(`/api/wall?${params}`).then((r) => r.json()).then((d) => {
      if (d.success) { setPosts(d.data); setTotal(d.meta?.total || 0); }
    }).finally(() => setLoading(false));
  }, [page, tab, search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const hidePost = async (id: string) => {
    const res = await fetch(`/api/wall/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { showToast('Post hidden', 'success'); load(); }
    else showToast(d.error || 'Failed', 'error');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wall Posts</h1>
        <p className="text-gray-500 text-sm mt-1">Manage all OJT wall posts.</p>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="w-full max-w-sm border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]"
          placeholder="Search posts..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <Tabs tabs={TABS} activeTab={tab} onTabChange={(t) => { setTab(t); setPage(1); }} className="mb-4" />

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]"><LoadingSpinner /></div>
      ) : posts.length === 0 ? (
        <EmptyState icon={FileText} title="No posts found" description="No results match your filters." />
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">{total} post{total !== 1 ? 's' : ''}</p>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Post</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {posts.map((p, i) => {
                  const fb = p.SectionData?.fbleads;
                  const isNative = p.source === 'company' || p.source === 'student';
                  const displayName = isNative ? p.postedByName : fb?.name;
                  const displayText = isNative ? p.description : fb?.post_text;
                  const leadType = isNative ? (p.source === 'student' ? 'intern' : 'internship') : fb?.lead_type;
                  return (
                    <tr key={p._id} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{displayName || 'Anonymous'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">{truncate(isNative ? (p.title || displayText || '') : (displayText || ''), 80)}</td>
                      <td className="px-4 py-3"><Badge label={p.source || 'scraped'} variant={isNative ? 'success' : 'neutral'} /></td>
                      <td className="px-4 py-3"><Badge label={leadType === 'intern' ? 'Seeking OJT' : 'Offering'} variant={leadType === 'intern' ? 'primary' : 'success'} /></td>
                      <td className="px-4 py-3"><Badge label={p.status || 'active'} variant={p.status === 'claimed' ? 'success' : 'neutral'} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" className="text-xs px-3 py-1 h-auto text-red-500 border-red-200 hover:bg-red-50" onClick={() => hidePost(p._id)}>Hide</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination total={total} page={page} limit={limit} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
