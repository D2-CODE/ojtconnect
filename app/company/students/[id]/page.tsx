'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkillTag } from '@/components/ui/SkillTag';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  ArrowLeft, Mail, MapPin, BookOpen, GraduationCap,
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
}

export default function CompanyStudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast: showToast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setStudent(d.data); })
      .finally(() => setLoading(false));

    // Check existing connection status
    fetch('/api/connections')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const conn = (d.data as Array<{ toProfileId: string; status: string }>)
            .find((c) => c.toProfileId === id);
          if (conn) setConnectionStatus(conn.status as typeof connectionStatus);
        }
      });
  }, [id]);

  const sendConnect = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toId: id, toType: 'student', message }),
      });
      const d = await res.json();
      if (d.success) {
        setConnectionStatus('pending');
        setShowModal(false);
        setMessage('');
        showToast('Connection request sent!', 'success');
      } else showToast(d.error || 'Failed', 'error');
    } finally { setSending(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner size="lg" /></div>;
  if (!student) return <div className="p-6 text-center text-gray-500">Student not found.</div>;

  const fullName = student.displayName || `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || 'Unknown';
  const status = student.universityVerificationStatus;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center text-center gap-3">
            <Avatar name={fullName} src={student.profilePic} size="xl" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">{fullName}</h1>
              {student.course && <p className="text-sm text-gray-500 mt-0.5">{student.course}{student.major ? ` — ${student.major}` : ''}</p>}
            </div>
            <Badge
              label={status.charAt(0).toUpperCase() + status.slice(1)}
              variant={status === 'verified' ? 'success' : status === 'pending' ? 'warning' : 'neutral'}
            />

            {/* Connect button */}
            <div className="w-full mt-1">
              {connectionStatus === 'accepted' && (
                <div className="w-full flex items-center justify-center gap-1.5 py-2 rounded-[10px] bg-[#E8F5F1] text-[#0F6E56] text-sm font-semibold">
                  ✓ Connected
                </div>
              )}
              {connectionStatus === 'pending' && (
                <div className="w-full flex items-center justify-center gap-1.5 py-2 rounded-[10px] bg-amber-50 text-amber-600 text-sm font-semibold">
                  ⏳ Request Sent
                </div>
              )}
              {connectionStatus === 'none' && (
                <Button variant="primary" className="w-full" onClick={() => setShowModal(true)}>
                  Connect
                </Button>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="flex flex-col gap-3">
              {connectionStatus === 'accepted' ? (
                <>
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
                </>
              ) : (
                <p className="text-sm text-gray-400">Connect with this student to see their contact details.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Academic Details</h3>
            <div className="grid grid-cols-2 gap-4">
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

          {student.bio && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">About</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{student.bio}</p>
            </div>
          )}

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

      {showModal && (
        <Modal isOpen={true} title="Send Connection Request" onClose={() => setShowModal(false)}>
          <p className="text-sm text-gray-500 mb-3">Include a short message to introduce yourself.</p>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56] resize-none mb-4"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi, we have an internship opportunity that might be a great fit..."
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={sendConnect} loading={sending}>Send Request</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
