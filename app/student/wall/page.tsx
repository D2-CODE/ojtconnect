'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { SkillTag } from '@/components/ui/SkillTag';
import { GraduationCap, Plus, Pencil, Trash2, Eye, CheckCircle, Clock, XCircle, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const SETUP_OPTIONS = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

interface StudentProfile {
  _id: string;
  firstName?: string;
  universityId?: string;
  universityVerificationStatus: string;
  skills?: string[];
  preferredSetup?: string;
  preferredLocation?: string;
  ojtHoursRequired?: number;
  bio?: string;
}

interface Post {
  _id: string;
  title?: string;
  description?: string;
  skills?: string[];
  setup?: string;
  location?: string;
  hoursRequired?: number;
  status: string;
  createdAt: string;
  SectionData?: { fbleads?: { name?: string; post_text?: string; skills?: string } };
}

const EMPTY_FORM = { title: '', description: '', skills: [] as string[], setup: '', location: '', hoursRequired: 300 };

function VerificationGate({ status, hasUniversity, hasProfile }: { status: string; hasUniversity: boolean; hasProfile: boolean }) {
  const steps = [
    { done: hasProfile, label: 'Complete your profile', desc: 'Add your name, course, and year level.', link: '/student/profile', linkLabel: 'Go to Profile' },
    { done: hasUniversity, label: 'Set your university', desc: 'Select your university in your profile.', link: '/student/profile', linkLabel: 'Set University' },
    { done: status === 'pending' || status === 'verified', label: 'Request verification', desc: 'Submit a verification request to your university admin.', link: '/student/verification', linkLabel: 'Request Now' },
    { done: status === 'verified', label: 'Get approved by university admin', desc: 'Wait for your university admin to approve your request.', link: null, linkLabel: null },
  ];
  const statusBanner = ({
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', text: 'Your verification request is pending. University admin will review it soon.' },
    rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 border-red-200', text: 'Your verification was rejected. Please resubmit from the verification page.' },
  } as Record<string, { icon: typeof Clock; color: string; bg: string; text: string }>)[status] ?? { icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-50 border-gray-200', text: 'Complete the steps below to unlock wall posting.' };
  const BannerIcon = statusBanner.icon;
  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[#E8F5F1] flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-8 h-8 text-[#0F6E56]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">University Verification Required</h2>
        <p className="text-sm text-gray-500">You need to be verified by your university before you can post on the OJT Wall.</p>
      </div>
      <div className={`border rounded-xl p-4 mb-6 flex items-start gap-3 ${statusBanner.bg}`}>
        <BannerIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${statusBanner.color}`} />
        <p className="text-sm text-gray-700">{statusBanner.text}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Steps to unlock</h3>
        <div className="flex flex-col gap-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${step.done ? 'bg-[#0F6E56]' : 'bg-gray-100'}`}>
                {step.done ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="text-xs font-bold text-gray-400">{i + 1}</span>}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${step.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{step.label}</p>
                {!step.done && <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>}
              </div>
              {!step.done && step.link && (
                <Link href={step.link}>
                  <Button variant="outline" className="text-xs px-3 py-1.5 h-auto flex items-center gap-1">
                    {step.linkLabel} <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function resolvePost(p: Post) {
  const fb = p.SectionData?.fbleads;
  return {
    title: p.title || fb?.name || 'Untitled Post',
    description: p.description || fb?.post_text || '',
    skills: p.skills?.length ? p.skills : (fb?.skills ? String(fb.skills).split(',').map((s) => s.trim()).filter(Boolean) : []),
    setup: p.setup || '',
    location: p.location || '',
    hoursRequired: p.hoursRequired || 0,
  };
}

export default function StudentWallPage() {
  const { status: sessionStatus } = useSession();
  const { toast: showToast } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    setLoading(true);
    Promise.all([
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/wall?mine=true&limit=50').then((r) => r.json()),
    ]).then(([profileRes, postsRes]) => {
      if (profileRes.success) setProfile(profileRes.data);
      if (postsRes.success) setPosts(postsRes.data);
    }).finally(() => setLoading(false));
  }, [sessionStatus]);

  const isVerified = profile?.universityVerificationStatus === 'verified';

  const openCreate = () => {
    setEditPost(null);
    setForm({
      title: '',
      description: profile?.bio || '',
      skills: profile?.skills || [],
      setup: profile?.preferredSetup || '',
      location: profile?.preferredLocation || '',
      hoursRequired: profile?.ojtHoursRequired || 300,
    });
    setSkillInput('');
    setModalOpen(true);
  };

  const openEdit = (p: Post) => {
    const resolved = resolvePost(p);
    setEditPost(p);
    setForm({
      title: resolved.title === 'Untitled Post' ? '' : resolved.title,
      description: resolved.description,
      skills: resolved.skills,
      setup: resolved.setup,
      location: resolved.location,
      hoursRequired: resolved.hoursRequired || 300,
    });
    setSkillInput('');
    setModalOpen(true);
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) { setForm((f) => ({ ...f, skills: [...f.skills, s] })); setSkillInput(''); }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) { showToast('Title and description are required', 'error'); return; }
    setSaving(true);
    try {
      const hoursRequired = Number(form.hoursRequired);
      const payload = { ...form, hoursRequired };

      // Fire wall save + profile sync in parallel
      const [wallRes] = await Promise.all([
        fetch(editPost ? `/api/wall/${editPost._id}` : '/api/wall', {
          method: editPost ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skills: form.skills, preferredSetup: form.setup, preferredLocation: form.location, ojtHoursRequired: hoursRequired, bio: form.description }),
        }),
      ]);

      const d = await wallRes.json();
      if (d.success) {
        showToast(editPost ? 'Post updated!' : 'Post created!', 'success');
        setModalOpen(false);
        // Update state directly from returned doc — no extra fetch needed
        if (editPost) {
          setPosts((prev) => prev.map((p) => p._id === editPost._id ? d.data : p));
        } else {
          setPosts((prev) => [d.data, ...prev]);
        }
        // Sync profile state locally
        setProfile((prev) => prev ? { ...prev, skills: form.skills, preferredSetup: form.setup, preferredLocation: form.location, ojtHoursRequired: hoursRequired, bio: form.description } : prev);
      } else {
        showToast(d.error || 'Failed', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const d = await fetch(`/api/wall/${id}`, { method: 'DELETE' }).then((r) => r.json());
    if (d.success) {
      showToast('Post removed', 'success');
      setDeleteId(null);
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } else {
      showToast(d.error || 'Failed', 'error');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My OJT Posts</h1>
          <p className="text-gray-500 text-sm mt-1">Post your availability to find internship opportunities.</p>
        </div>
        {isVerified && (
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Post
          </Button>
        )}
      </div>

      {!isVerified ? (
        <VerificationGate
          status={profile?.universityVerificationStatus || 'unverified'}
          hasUniversity={!!profile?.universityId}
          hasProfile={!!profile?.firstName}
        />
      ) : (
        <>
          <div className="bg-[#E8F5F1] border border-[#0F6E56]/20 rounded-xl p-3 mb-6 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#0F6E56]" />
            <span className="text-sm text-[#0F6E56] font-medium">University verified — you can post on the OJT Wall</span>
          </div>

          {posts.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No posts yet" description="Create a post to let companies know you're looking for an OJT." action={{ label: 'Create Post', onClick: openCreate }} />
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map((p) => {
                const { title, description, skills, setup, location, hoursRequired } = resolvePost(p);
                return (
                  <div key={p._id} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-gray-900">{title}</h3>
                          <Badge label="Active" variant="success" />
                          {setup && <Badge label={setup} variant="neutral" />}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">{description}</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {skills.slice(0, 5).map((s) => <SkillTag key={s} skill={s} />)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          {location && <span>📍 {location}</span>}
                          {hoursRequired > 0 && <span>⏱ {hoursRequired} hrs</span>}
                          <span>Posted {formatDate(p.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link href={`/wall/${p._id}`} target="_blank">
                          <Button variant="ghost" className="p-2 h-auto"><Eye className="w-4 h-4" /></Button>
                        </Link>
                        <Button variant="ghost" className="p-2 h-auto" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" className="p-2 h-auto text-red-500 hover:bg-red-50" onClick={() => setDeleteId(p._id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editPost ? 'Edit Post' : 'Post OJT Availability'} size="lg">
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
          <Input label="Post Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Looking for IT OJT — BS Computer Science" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">About You / What You&apos;re Looking For <span className="text-red-500">*</span></label>
            <textarea className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56] resize-none" rows={4}
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe yourself, your skills, and what kind of internship you're looking for..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Preferred Setup" value={form.setup} onChange={(e) => setForm((f) => ({ ...f, setup: e.target.value }))} options={SETUP_OPTIONS} placeholder="Any setup" />
            <Input label="Preferred Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Quezon City" />
          </div>
          <Input label="OJT Hours Required" type="number" value={String(form.hoursRequired)} onChange={(e) => setForm((f) => ({ ...f, hoursRequired: Number(e.target.value) }))} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.skills.map((s) => <SkillTag key={s} skill={s} onRemove={() => setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }))} />)}
            </div>
            <div className="flex gap-2">
              <input className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]"
                value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill (press Enter)" />
              <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editPost ? 'Save Changes' : 'Post Now'}</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Post" size="sm">
        <p className="text-sm text-gray-600 mb-5">Are you sure you want to remove this post?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Remove</Button>
        </div>
      </Modal>
    </div>
  );
}
