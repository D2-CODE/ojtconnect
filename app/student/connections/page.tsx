'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { Users, Building2, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Connection {
  _id: string;
  fromUserId: string;
  toUserId: string;
  fromProfileId: string;
  fromType: string;
  fromName: string;
  toProfileId: string;
  toType: string;
  toName: string;
  status: string;
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

export default function StudentConnectionsPage() {
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

  const respond = async (id: string, status: 'accepted' | 'rejected') => {
    const res = await fetch(`/api/connections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const d = await res.json();
    if (d.success) { showToast(`Connection ${status}`, 'success'); load(); }
    else showToast(d.error || 'Failed', 'error');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

  // Requests sent TO me (I need to respond)
  const incoming = connections.filter((c) => c.toUserId === session?.user?.userId && c.status === 'pending');
  // Requests I sent
  const outgoing = connections.filter((c) => c.fromUserId === session?.user?.userId);
  // Responded requests from companies
  const history = connections.filter((c) => c.toUserId === session?.user?.userId && c.status !== 'pending');

  const statusVariant = (s: string) =>
    s === 'accepted' ? 'success' : s === 'rejected' ? 'error' : 'warning';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
        <p className="text-gray-500 text-sm mt-1">Manage connection requests from companies.</p>
      </div>

      {connections.length === 0 ? (
        <EmptyState icon={Users} title="No connections yet" description="When companies connect with you, they'll appear here." />
      ) : (
        <div className="flex flex-col gap-8">
          {/* Incoming pending */}
          {incoming.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Pending Requests ({incoming.length})
              </h2>
              <div className="flex flex-col gap-3">
                {incoming.map((c) => (
                  <div key={c._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#E8F5F1] flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-[#0F6E56]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">{c.fromName}</span>
                        <Badge label="Pending" variant="warning" />
                      </div>
                      {c.message && <p className="text-sm text-gray-500 mb-2">&ldquo;{c.message}&rdquo;</p>}
                      <p className="text-xs text-gray-400">{formatDate(c.createdAt)}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="primary" className="text-xs px-3 py-1.5 h-auto" onClick={() => respond(c._id, 'accepted')}>Accept</Button>
                      <Button variant="outline" className="text-xs px-3 py-1.5 h-auto" onClick={() => respond(c._id, 'rejected')}>Decline</Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Outgoing */}
          {outgoing.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-700 text-sm mb-3">Sent Requests</h2>
              <div className="flex flex-col gap-3">
                {outgoing.map((c) => (
                  <div key={c._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-gray-900 text-sm">To: {c.toName}</span>
                        <Badge label={c.status} variant={statusVariant(c.status)} />
                      </div>
                      {c.message && <p className="text-xs text-gray-500">&ldquo;{c.message}&rdquo;</p>}
                      <p className="text-xs text-gray-400 mt-1">{formatDate(c.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* History */}
          {history.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-700 text-sm mb-3">History</h2>
              <div className="flex flex-col gap-3">
                {history.map((c) => (
                  <div key={c._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">{c.fromName}</span>
                        <Badge label={c.status} variant={statusVariant(c.status)} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(c.createdAt)}{c.respondedAt ? ` · Responded ${formatDate(c.respondedAt)}` : ''}
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
