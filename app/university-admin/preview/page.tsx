'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MapPin, Globe, Users, BookOpen } from 'lucide-react';

interface Profile {
  _id: string;
  name: string;
  slug: string;
  location: string;
  website: string;
  description: string;
  programs: string[];
  verificationStatus: string;
  logo?: string;
}

export default function UniversityPreviewPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile').then((r) => r.json()).then((d) => {
      if (d.success && d.data) {
        setProfile(d.data);
        fetch(`/api/students?universityId=${d.data._id}&verificationStatus=verified`).then((r) => r.json()).then((s) => {
          if (s.success) setStudentCount(s.meta?.total || s.data?.length || 0);
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

  if (!profile) return <div className="p-6 text-gray-400">Profile not found.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Public Preview</h1>
        <p className="text-gray-500 text-sm mt-1">This is how your School appears to others.</p>
        {profile.slug && (
          <a
            href={`/university/home/${profile.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-sm text-[#0F6E56] hover:underline font-medium"
          >
            View live public page →
          </a>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
        <div className="flex items-start gap-5">
          {profile.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.logo} alt={profile.name} className="w-20 h-20 rounded-xl object-contain border border-gray-100 bg-gray-50 p-1.5 flex-shrink-0" />
          ) : (
            <Avatar name={profile.name} size="xl" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
              <Badge label={profile.verificationStatus === 'verified' ? 'Verified' : 'Pending'} variant={profile.verificationStatus === 'verified' ? 'success' : 'warning'} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {profile.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {profile.location}</span>}
              {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#0F6E56]"><Globe className="w-3.5 h-3.5" /> {profile.website}</a>}
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {studentCount} students</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {profile.programs?.length || 0} programs</span>
            </div>
          </div>
        </div>

        {profile.description && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed">{profile.description}</p>
          </div>
        )}

        {profile.programs?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Programs Offered</h3>
            <div className="flex flex-wrap gap-2">
              {profile.programs.map((p: string) => (
                <span key={p} className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">{p}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
