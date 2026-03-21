'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StudentCard } from '@/components/cards/StudentCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Users, Briefcase, ArrowRight, Building2, AlertCircle } from 'lucide-react';

export default function CompanyDashboardPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [connections, setConnections] = useState<unknown[]>([]);
  const [recentStudents, setRecentStudents] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectId, setConnectId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast: showToast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/connections').then((r) => r.json()),
      fetch('/api/students?verificationStatus=verified&limit=4').then((r) => r.json()),
    ]).then(([p, c, s]) => {
      if (p.success) setProfile(p.data);
      if (c.success) setConnections(c.data);
      if (s.success) setRecentStudents(s.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

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
        showToast('Connection request sent!', 'success');
        setConnectId(null);
        setMessage('');
        // Refresh connections so button hides immediately
        fetch('/api/connections').then((r) => r.json()).then((d) => { if (d.success) setConnections(d.data); });
      } else showToast(d.error || 'Failed', 'error');
    } finally { setSending(false); }
  };

  const isSetup = profile?.companyName;
  const pendingConnections = (connections as Array<{ status: string }>).filter((c) => c.status === 'pending').length;
  // Map of studentProfileId → connection status
  const connectionStatusMap = new Map<string, 'pending' | 'accepted' | 'rejected'>(
    (connections as Array<{ toProfileId: string; status: string }>)
      .filter((c) => ['pending', 'accepted', 'rejected'].includes(c.status))
      .map((c) => [c.toProfileId, c.status as 'pending' | 'accepted' | 'rejected'])
  );
  const connectedProfileIds = new Set(
    [...connectionStatusMap.entries()]
      .filter(([, s]) => ['pending', 'accepted'].includes(s))
      .map(([id]) => id)
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {(profile?.companyName as string) || session?.user?.name || 'Company'}</h1>
        <p className="text-gray-500 text-sm mt-1">Find and connect with qualified OJT candidates.</p>
      </div>

      {!isSetup && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 text-sm">Complete your company profile</p>
            <p className="text-amber-600 text-xs mt-0.5">Add your company details to attract the best candidates.</p>
          </div>
          <Link href="/company/profile">
            <button className="text-xs font-semibold text-amber-700 border border-amber-300 bg-white px-3 py-1.5 rounded-lg hover:bg-amber-50">Setup</button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Building2, label: 'Profile', value: isSetup ? 'Complete' : 'Incomplete', color: isSetup ? 'text-[#0F6E56]' : 'text-amber-500' },
          { icon: Users, label: 'Total Connections', value: String(connections.length), color: 'text-blue-500' },
          { icon: Briefcase, label: 'Pending', value: String(pendingConnections), color: 'text-amber-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <div className={`font-semibold text-sm ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/company/wall" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#0F6E56] transition-colors flex items-center justify-between group">
          <div>
            <h3 className="font-semibold text-gray-900">My Listings</h3>
            <p className="text-sm text-gray-500 mt-0.5">Post and manage internship opportunities</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#0F6E56]" />
        </Link>
        <Link href="/company/search" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#0F6E56] transition-colors flex items-center justify-between group">
          <div>
            <h3 className="font-semibold text-gray-900">Search Students</h3>
            <p className="text-sm text-gray-500 mt-0.5">Find verified OJT candidates</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#0F6E56]" />
        </Link>
        <Link href="/company/connections" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#0F6E56] transition-colors flex items-center justify-between group">
          <div>
            <h3 className="font-semibold text-gray-900">My Connections</h3>
            <p className="text-sm text-gray-500 mt-0.5">{pendingConnections > 0 ? `${pendingConnections} pending response` : 'View all connections'}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#0F6E56]" />
        </Link>
      </div>

      {/* Recent students */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Students</h2>
          <Link href="/company/search" className="text-sm text-[#0F6E56] hover:underline">View all →</Link>
        </div>
        {recentStudents.length === 0 ? (
          <EmptyState icon={Users} title="No students yet" description="Browse verified students to start connecting." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentStudents.map((s) => {
              const student = s as { _id: string };
              return (
                <StudentCard
                  key={student._id}
                  student={s as never}
                  connectionStatus={connectionStatusMap.get(student._id) ?? null}
                  onConnect={connectedProfileIds.has(student._id) ? undefined : (id) => setConnectId(id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {connectId && (
        <Modal isOpen={true} title="Send Connection Request" onClose={() => { setConnectId(null); setMessage(''); }}>
          <p className="text-sm text-gray-500 mb-3">Include a short message to introduce yourself.</p>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56] resize-none mb-4"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi, we have an internship opportunity that might be a great fit..."
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setConnectId(null); setMessage(''); }}>Cancel</Button>
            <Button onClick={sendConnect} loading={sending}>Send Request</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
