'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Users, GraduationCap } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Connection {
  _id: string;
  status: string;
  message: string;
  createdAt: string;
  respondedAt?: string;
}

export default function CompanyConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/connections').then((r) => r.json()).then((d) => {
      if (d.success) setConnections(d.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Connections</h1>
        <p className="text-gray-500 text-sm mt-1">Track your outreach to students.</p>
      </div>

      {connections.length === 0 ? (
        <EmptyState icon={Users} title="No connections yet" description="Go to Find Students to connect with candidates." />
      ) : (
        <div className="flex flex-col gap-3">
          {connections.map((c) => (
            <div key={c._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#E8F5F1] flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-[#0F6E56]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-gray-900 text-sm">Connection Request</span>
                  <Badge
                    label={c.status === 'accepted' ? 'Accepted' : c.status === 'declined' ? 'Declined' : c.status === 'pending' ? 'Pending' : c.status}
                    variant={c.status === 'accepted' ? 'success' : c.status === 'declined' ? 'error' : 'warning'}
                  />
                </div>
                {c.message && <p className="text-xs text-gray-500">&ldquo;{c.message}&rdquo;</p>}
                <p className="text-xs text-gray-400 mt-1">Sent {formatDate(c.createdAt)}{c.respondedAt ? ` · Responded ${formatDate(c.respondedAt)}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
