'use client';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircle, Clock, XCircle, GraduationCap, AlertCircle } from 'lucide-react';

interface StudentProfile {
  _id: string;
  universityVerificationStatus: string;
  universityId: string | null;
  verificationNote: string;
}

export default function VerificationPage() {
  const { toast: showToast } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetch('/api/profile').then((r) => r.json()).then((d) => {
      if (d.success) setProfile(d.data);
    }).finally(() => setLoading(false));
  }, []);

  const requestVerification = async () => {
    if (!profile) return;
    setRequesting(true);
    try {
      const res = await fetch(`/api/students/${profile._id}/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'request' }) });
      const d = await res.json();
      if (d.success) { showToast('Verification requested!', 'success'); setProfile((p) => p ? { ...p, universityVerificationStatus: 'pending' } : p); }
      else showToast(d.error || 'Request failed', 'error');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

  const status = profile?.universityVerificationStatus || 'unverified';

  const statusConfig = {
    verified: { icon: CheckCircle, color: 'text-[#0F6E56]', bg: 'bg-[#E8F5F1]', label: 'Verified', desc: 'Your profile is verified by your university. Companies can see your verified badge.' },
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Pending', desc: 'Your verification request is under review by your university admin.' },
    rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Rejected', desc: profile?.verificationNote || 'Your verification was not approved. You may resubmit.' },
    unverified: { icon: GraduationCap, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Not verified', desc: 'Submit a verification request to your university admin.' },
  }[status] || { icon: GraduationCap, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Not verified', desc: 'Submit a verification request.' };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">University Verification</h1>
        <p className="text-gray-500 text-sm mt-1">Get verified by your university to boost your credibility.</p>
      </div>

      <div className={`${statusConfig.bg} rounded-2xl p-6 mb-6 flex items-start gap-4`}>
        <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0`}>
          <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-bold text-gray-900">Status:</h2>
            <Badge label={statusConfig.label} variant={status === 'verified' ? 'success' : status === 'pending' ? 'warning' : status === 'rejected' ? 'error' : 'neutral'} />
          </div>
          <p className="text-sm text-gray-600">{statusConfig.desc}</p>
        </div>
      </div>

      {!profile?.universityId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">You must set your university in your profile before requesting verification.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">How it works</h3>
        <div className="space-y-3">
          {[
            'Complete your student profile with your course and year level',
            'Make sure your university is set in your profile',
            'Submit a verification request',
            'Your university admin will review and approve',
            'Verified badge appears on your public profile',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-gray-600">
              <span className="w-5 h-5 rounded-full bg-[#E8F5F1] text-[#0F6E56] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              {step}
            </div>
          ))}
        </div>

        {(status === 'unverified' || status === 'rejected') && profile?.universityId && (
          <Button onClick={requestVerification} loading={requesting} className="w-full mt-6">
            {status === 'rejected' ? 'Resubmit Request' : 'Request Verification'}
          </Button>
        )}
      </div>
    </div>
  );
}
