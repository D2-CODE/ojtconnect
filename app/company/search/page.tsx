'use client';
import { useEffect, useState, useCallback } from 'react';
import { StudentCard } from '@/components/cards/StudentCard';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Search, Users, AlertCircle } from 'lucide-react';

export default function CompanySearchPage() {
  const [students, setStudents] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectId, setConnectId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [connectionStatusMap, setConnectionStatusMap] = useState<Map<string, 'pending' | 'accepted' | 'rejected'>>(new Map());
  const [dailyLimit, setDailyLimit] = useState<{ remaining: number; resetAt: string | null }>({ remaining: 3, resetAt: null });
  const { toast: showToast } = useToast();
  const limit = 12;

  useEffect(() => {
    fetch('/api/connections').then((r) => r.json()).then((d) => {
      if (d.success) {
        const map = new Map<string, 'pending' | 'accepted' | 'rejected'>(
          (d.data as Array<{ toProfileId: string; status: string }>)
            .filter((c) => ['pending', 'accepted', 'rejected'].includes(c.status))
            .map((c) => [c.toProfileId, c.status as 'pending' | 'accepted' | 'rejected'])
        );
        setConnectedIds(new Set([...map.entries()].filter(([, s]) => ['pending', 'accepted'].includes(s)).map(([id]) => id)));
        setConnectionStatusMap(map);
      }
    });
    fetch('/api/connections/limit').then((r) => r.json()).then((d) => {
      if (d.success) setDailyLimit({ remaining: d.remaining, resetAt: d.resetAt });
    });
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
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
      if (d.success) {
        setConnectedIds((prev) => new Set([...prev, connectId]));
        setConnectionStatusMap((prev) => new Map([...prev, [connectId, 'pending']]));
        setConnectId(null);
        setMessage('');
        showToast('Connection request sent!', 'success');
        fetch('/api/connections/limit').then((r) => r.json()).then((d) => {
          if (d.success) setDailyLimit({ remaining: d.remaining, resetAt: d.resetAt });
        });
      } else showToast(d.error || 'Failed', 'error');
    } finally { setSending(false); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Students</h1>
        <p className="text-gray-500 text-sm mt-1">Discover OJT candidates.</p>
      </div>

      {dailyLimit.remaining === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 text-sm">Daily connection limit reached</p>
            <p className="text-amber-600 text-xs mt-0.5">
              You can send up to 3 requests per 24 hours.
              {dailyLimit.resetAt && ` Resets at ${new Date(dailyLimit.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`}
            </p>
          </div>
        </div>
      )}

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
                  connectionStatus={connectionStatusMap.get(student._id) ?? null}
                  onConnect={connectedIds.has(student._id) || dailyLimit.remaining === 0 ? undefined : (id) => setConnectId(id)}
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
