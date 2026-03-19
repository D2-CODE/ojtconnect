'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { Users, CheckCircle, Clock, ArrowRight, AlertCircle, University } from 'lucide-react';

interface StudentItem {
  _id: string;
  firstName: string;
  lastName: string;
  course: string;
  universityVerificationStatus: string;
}

interface UniversityProfile {
  _id: string;
  name: string;
  verificationStatus: string;
}

export default function UniversityAdminDashboardPage() {
  const { data: session } = useSession();
  const { toast: showToast } = useToast();
  const [uniProfile, setUniProfile] = useState<UniversityProfile | null>(null);
  const [pendingStudents, setPendingStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      fetch('/api/profile').then((r) => r.json()),
    ]).then(([p]) => {
      if (p.success) {
        setUniProfile(p.data);
        if (p.data?._id) {
          fetch(`/api/students?universityId=${p.data._id}&verificationStatus=pending&limit=5`).then((r) => r.json()).then((d) => {
            if (d.success) setPendingStudents(d.data);
          });
        }
      }
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleVerify = async (studentId: string, action: 'verify' | 'reject') => {
    const res = await fetch(`/api/students/${studentId}/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    const d = await res.json();
    if (d.success) { showToast(`Student ${action === 'verify' ? 'verified' : 'rejected'}`, 'success'); load(); }
    else showToast(d.error || 'Failed', 'error');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">University Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your students and university profile.</p>
      </div>

      {/* University status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#E8F5F1] flex items-center justify-center flex-shrink-0">
          <University className="w-6 h-6 text-[#0F6E56]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">{uniProfile?.name || session?.user?.name}</h2>
            <Badge label={uniProfile?.verificationStatus === 'verified' ? 'Verified' : 'Pending'} variant={uniProfile?.verificationStatus === 'verified' ? 'success' : 'warning'} />
          </div>
          {uniProfile?.verificationStatus !== 'verified' && (
            <p className="text-xs text-gray-400 mt-0.5">Your university is awaiting verification by the platform admin.</p>
          )}
        </div>
        <Link href="/university-admin/profile"><Button variant="outline" className="flex-shrink-0">Edit Profile</Button></Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-amber-500" /><span className="text-xs text-gray-500">Pending Verifications</span></div>
          <div className="font-semibold text-amber-500">{pendingStudents.length}</div>
        </div>
        <Link href="/university-admin/students" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#0F6E56] transition-colors">
          <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Manage Students</span></div>
          <div className="font-semibold text-blue-500 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></div>
        </Link>
      </div>

      {/* Pending verifications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Pending Verifications</h2>
          <Link href="/university-admin/students" className="text-sm text-[#0F6E56] hover:underline">View all →</Link>
        </div>

        {pendingStudents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <CheckCircle className="w-8 h-8 text-[#0F6E56] mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No pending verifications. All caught up!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingStudents.map((s) => (
              <div key={s._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#E8F5F1] flex items-center justify-center flex-shrink-0 font-semibold text-[#0F6E56] text-sm">
                  {s.firstName?.[0]}{s.lastName?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-gray-400">{s.course}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" className="text-xs px-3 py-1.5 h-auto" onClick={() => handleVerify(s._id, 'verify')}>Verify</Button>
                  <Button variant="outline" className="text-xs px-3 py-1.5 h-auto" onClick={() => handleVerify(s._id, 'reject')}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
