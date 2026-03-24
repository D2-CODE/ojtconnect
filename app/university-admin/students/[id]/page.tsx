'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkillTag } from '@/components/ui/SkillTag';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import {
  ArrowLeft, Mail, Phone, MapPin, BookOpen, GraduationCap,
  Clock, Link as LinkIcon, FileText, Calendar,
} from 'lucide-react';

interface Student {
  _id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  course?: string;
  major?: string;
  yearLevel?: number;
  studentNumber?: string;
  bio?: string;
  skills: string[];
  contactEmail?: string;
  preferredSetup?: string;
  preferredLocation?: string;
  ojtHoursRequired?: number;
  availableFrom?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  profilePic?: string;
  universityVerificationStatus: string;
  universityRejectionReason?: string;
  createdAt?: string;
}

export default function UniversityStudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast: showToast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setStudent(d.data); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (action: 'verify' | 'reject') => {
    setActing(true);
    try {
      const res = await fetch(`/api/students/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const d = await res.json();
      if (d.success) {
        showToast(`Student ${action === 'verify' ? 'verified' : 'rejected'}`, 'success');
        setStudent((s) => s ? { ...s, universityVerificationStatus: action === 'verify' ? 'verified' : 'rejected' } : s);
      } else {
        showToast(d.error || 'Failed', 'error');
      }
    } finally {
      setActing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  );

  if (!student) return (
    <div className="p-6 text-center text-gray-500">Student not found.</div>
  );

  const fullName = student.displayName || `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || 'Unknown';
  const status = student.universityVerificationStatus;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — profile */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center text-center gap-3">
            <Avatar name={fullName} src={student.profilePic} size="xl" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">{fullName}</h1>
              {student.course && <p className="text-sm text-gray-500 mt-0.5">{student.course}{student.major ? ` — ${student.major}` : ''}</p>}
            </div>
            <Badge
              label={status.charAt(0).toUpperCase() + status.slice(1)}
              variant={status === 'verified' ? 'success' : status === 'pending' ? 'warning' : status === 'rejected' ? 'error' : 'neutral'}
            />
            {status === 'pending' && (
              <div className="flex gap-2 w-full mt-1">
                <Button variant="primary" className="flex-1 text-sm" onClick={() => handleAction('verify')} loading={acting}>Verify</Button>
                <Button variant="outline" className="flex-1 text-sm" onClick={() => handleAction('reject')} loading={acting}>Reject</Button>
              </div>
            )}
            {status === 'rejected' && student.universityRejectionReason && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 w-full text-left">
                Reason: {student.universityRejectionReason}
              </p>
            )}
          </div>

          {/* Contact info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="flex flex-col gap-3">
              {student.contactEmail && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-[#0F6E56] flex-shrink-0" />
                  <a href={`mailto:${student.contactEmail}`} className="hover:text-[#0F6E56] break-all">{student.contactEmail}</a>
                </div>
              )}
              {student.preferredLocation && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-[#0F6E56] flex-shrink-0" />
                  <span>{student.preferredLocation}</span>
                </div>
              )}
              {student.linkedinUrl && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <LinkIcon className="w-4 h-4 text-[#0F6E56] flex-shrink-0" />
                  <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#0F6E56] break-all">LinkedIn</a>
                </div>
              )}
              {student.portfolioUrl && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <LinkIcon className="w-4 h-4 text-[#0F6E56] flex-shrink-0" />
                  <a href={student.portfolioUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#0F6E56] break-all">Portfolio</a>
                </div>
              )}
              {student.resumeUrl && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4 text-[#0F6E56] flex-shrink-0" />
                  <a href={student.resumeUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#0F6E56]">View Resume</a>
                </div>
              )}
              {!student.contactEmail && !student.preferredLocation && !student.linkedinUrl && (
                <p className="text-sm text-gray-400">No contact info provided.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right — details */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Academic info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Academic Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {student.studentNumber && (
                <div className="flex items-start gap-2">
                  <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Student No.</p>
                    <p className="text-sm font-medium text-gray-900">{student.studentNumber}</p>
                  </div>
                </div>
              )}
              {student.yearLevel && (
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Year Level</p>
                    <p className="text-sm font-medium text-gray-900">Year {student.yearLevel}</p>
                  </div>
                </div>
              )}
              {student.ojtHoursRequired && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">OJT Hours Required</p>
                    <p className="text-sm font-medium text-gray-900">{student.ojtHoursRequired} hrs</p>
                  </div>
                </div>
              )}
              {student.preferredSetup && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Preferred Setup</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{student.preferredSetup}</p>
                  </div>
                </div>
              )}
              {student.availableFrom && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Available From</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(student.availableFrom).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              )}
              {student.course && (
                <div className="flex items-start gap-2">
                  <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Course</p>
                    <p className="text-sm font-medium text-gray-900">{student.course}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {student.bio && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">About</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{student.bio}</p>
            </div>
          )}

          {/* Skills */}
          {student.skills?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill) => <SkillTag key={skill} skill={skill} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
