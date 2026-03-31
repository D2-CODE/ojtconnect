'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { Users, Search } from 'lucide-react';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  course: string;
  yearLevel: number;
  universityVerificationStatus: string;
}

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
];

export default function UniversityStudentsPage() {
  const { toast: showToast } = useToast();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uniId, setUniId] = useState('');
  const limit = 10;

  useEffect(() => {
    fetch('/api/profile').then((r) => r.json()).then((d) => {
      if (d.success && d.data?._id) setUniId(d.data._id);
    });
  }, []);

  const load = useCallback(() => {
    if (!uniId) return;
    setLoading(true);
    const params = new URLSearchParams({ universityId: uniId, page: String(page), limit: String(limit) });
    if (tab !== 'all') params.set('verificationStatus', tab);
    if (search) params.set('search', search);
    fetch(`/api/students?${params}`).then((r) => r.json()).then((d) => {
      if (d.success) { setStudents(d.data); setTotal(d.meta?.total || 0); }
    }).finally(() => setLoading(false));
  }, [uniId, page, tab, search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const handleAction = async (id: string, action: 'verify' | 'reject') => {
    const res = await fetch(`/api/students/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const d = await res.json();
    if (d.success) { showToast(`Student ${action === 'verify' ? 'verified' : 'rejected'}`, 'success'); load(); }
    else showToast(d.error || 'Failed', 'error');
  };

  const statusVariant = (s: string) =>
    s === 'verified' ? 'success' : s === 'pending' ? 'warning' : s === 'rejected' ? 'error' : 'neutral';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-500 text-sm mt-1">Verify and manage your School students.</p>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full max-w-sm border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]"
          placeholder="Search students..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Tabs tabs={TABS} activeTab={tab} onTabChange={(t) => { setTab(t); setPage(1); }} className="mb-4" />

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]"><LoadingSpinner /></div>
      ) : students.length === 0 ? (
        <EmptyState icon={Users} title="No students found" description="No students match your filters." />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Course</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Year</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr
                    key={s._id}
                    className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}
                    onClick={() => router.push(`/university-admin/students/${s._id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{s.firstName} {s.lastName}</td>
                    <td className="px-4 py-3 text-gray-500">{s.course}</td>
                    <td className="px-4 py-3 text-gray-500">{s.yearLevel ? `${s.yearLevel}yr` : '—'}</td>
                    <td className="px-4 py-3">
                      <Badge label={s.universityVerificationStatus} variant={statusVariant(s.universityVerificationStatus)} />
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" className="text-xs px-3 py-1 h-auto" onClick={() => router.push(`/university-admin/students/${s._id}`)}>View</Button>
                        {s.universityVerificationStatus === 'pending' && (
                          <>
                            <Button variant="primary" className="text-xs px-3 py-1 h-auto" onClick={() => handleAction(s._id, 'verify')}>Verify</Button>
                            <Button variant="outline" className="text-xs px-3 py-1 h-auto" onClick={() => handleAction(s._id, 'reject')}>Reject</Button>
                          </>
                        )}
                      </div>
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
