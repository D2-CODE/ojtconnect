'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PostCard } from '@/components/cards/PostCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GraduationCap, Users, Briefcase, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

interface StudentProfile {
  _id: string;
  firstName: string;
  lastName: string;
  course: string;
  yearLevel: number;
  universityVerificationStatus: string;
  isVisible: boolean;
  skills: string[];
  bio: string;
}

interface ConnectionItem {
  _id: string;
  status: string;
  createdAt: string;
}

export default function StudentDashboardPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [recentPosts, setRecentPosts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/connections').then((r) => r.json()),
      fetch('/api/wall?limit=3').then((r) => r.json()),
    ]).then(([p, c, w]) => {
      if (p.success) setProfile(p.data);
      if (c.success) setConnections(c.data);
      if (w.success) setRecentPosts(w.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

  const isSetup = profile?.firstName;
  const verificationStatus = profile?.universityVerificationStatus || 'unverified';
  const pendingConnections = connections.filter((c) => c.status === 'pending').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {session?.user?.name?.split(' ')[0] || 'Student'}</h1>
        <p className="text-gray-500 text-sm mt-1">Here&apos;s an overview of your OJT Connect PH activity.</p>
      </div>

      {/* Setup banner */}
      {!isSetup && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 text-sm">Complete your profile</p>
            <p className="text-amber-600 text-xs mt-0.5">Add your details and skills to be discoverable by companies.</p>
          </div>
          <Link href="/student/profile"><Button variant="outline" className="flex-shrink-0 text-xs px-3 py-1.5 h-auto">Setup Profile</Button></Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: GraduationCap, label: 'Profile', value: isSetup ? 'Complete' : 'Incomplete', color: isSetup ? 'text-[#0F6E56]' : 'text-amber-500' },
          { icon: CheckCircle, label: 'Verification', value: verificationStatus === 'verified' ? 'Verified' : verificationStatus === 'pending' ? 'Pending' : 'Not verified', color: verificationStatus === 'verified' ? 'text-[#0F6E56]' : 'text-gray-400' },
          { icon: Users, label: 'Connections', value: String(connections.length), color: 'text-blue-500' },
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

      {/* Verification alert */}
      {isSetup && verificationStatus === 'unverified' && (
        <div className="bg-[#E8F5F1] border border-[#0F6E56]/20 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-[#0F6E56] flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-[#0F6E56] text-sm">Get School verified</p>
            <p className="text-gray-600 text-xs mt-0.5">Verification increases your profile&apos;s credibility with companies.</p>
          </div>
          <Link href="/student/verification"><Button variant="primary" className="flex-shrink-0 text-xs px-3 py-1.5 h-auto">Request</Button></Link>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/wall" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#0F6E56] transition-colors flex items-center justify-between group">
          <div>
            <h3 className="font-semibold text-gray-900">Browse OJT Wall</h3>
            <p className="text-sm text-gray-500 mt-0.5">Find internship opportunities near you</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#0F6E56]" />
        </Link>
        <Link href="/student/wall" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#0F6E56] transition-colors flex items-center justify-between group">
          <div>
            <h3 className="font-semibold text-gray-900">My OJT Posts</h3>
            <p className="text-sm text-gray-500 mt-0.5">{verificationStatus === 'verified' ? 'Post your availability for companies' : 'Requires School verification'}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#0F6E56]" />
        </Link>
        <Link href="/student/connections" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#0F6E56] transition-colors flex items-center justify-between group">
          <div>
            <h3 className="font-semibold text-gray-900">My Connections</h3>
            <p className="text-sm text-gray-500 mt-0.5">{pendingConnections > 0 ? `${pendingConnections} pending` : 'View all connections'}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#0F6E56]" />
        </Link>
      </div>

      {/* Recent posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent OJT Leads</h2>
          <Link href="/wall" className="text-sm text-[#0F6E56] hover:underline">View all →</Link>
        </div>
        {recentPosts.length === 0 ? (
          <EmptyState icon={Briefcase} title="No posts yet" description="Check back soon for internship opportunities." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recentPosts.map((post) => <PostCard key={(post as { _id: string })._id} post={post as never} />)}
          </div>
        )}
      </div>
    </div>
  );
}
