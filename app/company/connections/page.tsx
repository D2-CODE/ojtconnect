'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { Users, GraduationCap } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Connection {
  _id: string;
  fromUserId: string;
  fromProfileId: string;
  fromName: string;
  toProfileId: string;
  toName: string;
  status: string;
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

export default function CompanyConnectionsPage() {
  const { data: session } = useSession();
  const { toast: showToast } = useToast();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch('/api/connections').then((r) => r.json()).then((d) => {
      if (d.success) setConnections(d.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const withdraw = async (id: string) => {
    const res = await fetch(`/api/connections/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { showToast('Request withdrawn', 'success'); load(); }
    else showToast(d.error || 'Failed', 'error');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

  const sent = connections.filter((c) => c.fromUserId === session?.user?.userId);
  const pending = sent.filter((c) => c.status === 'pending');
  const accepted = sent.filter((c) => c.status === 'accepted');
  const others = sent.filter((c) => c.status !== 'pending' && c.status !== 'accepted');

  const statusVariant = (s: string) =>
    s === 'accepted' ? 'success' : s === 'rejected' ? 'error' : 'warning';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Connections</h1>
        <p className="text-gray-500 text-sm mt-1">Track your outreach to OJT candidates.</p>
      </div>

      {connections.length === 0 ? (
        <EmptyState icon={Users} title="No connections yet" description="Go to Find Students to connect with candidates." />
      ) : (
        <div className="flex flex-col gap-8">
          {/* Accepted */}
          {accepted.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F6E56] inline-block" /> Accepted ({accepted.length})
              </h2>
              <div className="flex flex-col gap-3">
                {accepted.map((c) => (
                  <div key={c._id} className="bg-white rounded-xl border border-[#0F6E56]/20 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#E8F5F1] flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-[#0F6E56]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-gray-900 text-sm">{c.toName}</span>
                        <Badge label="Accepted" variant="success" />
                      </div>
                      {c.message && <p className="text-xs text-gray-500">&ldquo;{c.message}&rdquo;</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Sent {formatDate(c.createdAt)}{c.respondedAt ? ` · Accepted ${formatDate(c.respondedAt)}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Pending ({pending.length})
              </h2>
              <div className="flex flex-col gap-3">
                {pending.map((c) => (
                  <div key={c._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-gray-900 text-sm">{c.toName}</span>
                        <Badge label="Pending" variant="warning" />
                      </div>
                      {c.message && <p className="text-xs text-gray-500">&ldquo;{c.message}&rdquo;</p>}
                      <p className="text-xs text-gray-400 mt-1">Sent {formatDate(c.createdAt)}</p>
                    </div>
                    <Button variant="ghost" className="text-xs px-3 py-1.5 h-auto text-red-500 hover:bg-red-50 flex-shrink-0" onClick={() => withdraw(c._id)}>
                      Withdraw
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Rejected / other history */}
          {others.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-700 text-sm mb-3">History</h2>
              <div className="flex flex-col gap-3">
                {others.map((c) => (
                  <div key={c._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-gray-900 text-sm">{c.toName}</span>
                        <Badge label={c.status} variant={statusVariant(c.status)} />
                      </div>
                      {c.message && <p className="text-xs text-gray-500">&ldquo;{c.message}&rdquo;</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Sent {formatDate(c.createdAt)}{c.respondedAt ? ` · Responded ${formatDate(c.respondedAt)}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
