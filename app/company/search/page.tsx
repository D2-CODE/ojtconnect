'use client';
import { useEffect, useState, useCallback } from 'react';
import { StudentCard } from '@/components/cards/StudentCard';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Search, Users } from 'lucide-react';

export default function CompanySearchPage() {
  const [students, setStudents] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectId, setConnectId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState<string[]>([]);
  const limit = 12;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), verificationStatus: 'verified' });
    if (search) params.set('search', search);
    fetch(`/api/students?${params}`).then((r) => r.json()).then((d) => {
      if (d.success) { setStudents(d.data); setTotal(d.meta?.total || 0); }
    }).finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const sendConnect = async () => {
    if (!connectId) return;
    setSending(true);
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toId: connectId, toType: 'student', message }),
      });
      const d = await res.json();
      if (d.success) { setSentIds((prev) => [...prev, connectId]); setConnectId(null); setMessage(''); }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Students</h1>
        <p className="text-gray-500 text-sm mt-1">Discover verified OJT candidates.</p>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56] max-w-md"
          placeholder="Search by name, course, or skill..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]"><LoadingSpinner /></div>
      ) : students.length === 0 ? (
        <EmptyState icon={Users} title="No students found" description="Try adjusting your search." />
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{total} student{total !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
            {students.map((s) => {
              const student = s as { _id: string };
              return (
                <StudentCard
                  key={student._id}
                  student={s as never}
                  onConnect={sentIds.includes(student._id) ? undefined : (id) => setConnectId(id)}
                />
              );
            })}
          </div>
          <Pagination total={total} page={page} limit={limit} onPageChange={setPage} />
        </>
      )}

      {connectId && (
        <Modal isOpen={true} title="Send Connection Request" onClose={() => setConnectId(null)}>
          <p className="text-sm text-gray-500 mb-3">Include a short message to introduce yourself.</p>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56] resize-none mb-4"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi, we have an internship opportunity that might be a great fit..."
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setConnectId(null)}>Cancel</Button>
            <Button onClick={sendConnect} loading={sending}>Send Request</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
