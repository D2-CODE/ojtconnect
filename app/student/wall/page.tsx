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
import {
  GraduationCap, Plus, Pencil, Trash2, Eye, CheckCircle,
  Clock, AlertCircle, MapPin, Timer, Monitor,
} from 'lucide-react';
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
  const verificationStatus = profile?.universityVerificationStatus || 'unverified';

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
        if (editPost) {
          setPosts((prev) => prev.map((p) => p._id === editPost._id ? d.data : p));
        } else {
          setPosts((prev) => [d.data, ...prev]);
        }
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

      {/* Verification status banner — informational only, not a blocker */}
      {isVerified ? (
        <div className="bg-[#E8F5F1] border border-[#0F6E56]/20 rounded-xl p-3 mb-6 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#0F6E56]" />
          <span className="text-sm text-[#0F6E56] font-medium">School verified — your posts show a verified badge</span>
        </div>
      ) : verificationStatus === 'pending' ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-amber-700">Verification pending — get verified to show a School badge on your posts. <Link href="/student/verification" className="font-medium underline">Check status</Link></span>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">Get School verified to show a verified badge on your posts. <Link href="/student/verification" className="font-medium text-[#0F6E56] hover:underline">Request verification</Link></span>
        </div>
      )}

      {posts.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No posts yet" description="Create a post to let companies know you're looking for an OJT." action={{ label: 'Create Post', onClick: openCreate }} />
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((p) => {
            const { title, description, skills, setup, location, hoursRequired } = resolvePost(p);
            return (
              <div key={p._id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900">{title}</h3>
                      <Badge label="Active" variant="success" />
                      {setup && <Badge label={setup} variant="neutral" />}
                      {isVerified && <Badge label="Uni Verified" variant="primary" />}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {skills.slice(0, 5).map((s) => <SkillTag key={s} skill={s} />)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{location}</span>}
                      {hoursRequired > 0 && <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{hoursRequired} hrs</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Posted {formatDate(p.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
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

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editPost ? 'Edit Post' : 'Post OJT Availability'} size="lg">
        <div className="flex flex-col gap-4">
          <Input label="Post Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Looking for IT OJT — BS Computer Science" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">About You / What You&apos;re Looking For <span className="text-red-500">*</span></label>
            <textarea
              className="w-full border border-gray-300 rounded-[10px] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] resize-none transition-all"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe yourself, your skills, and what kind of internship you're looking for..."
            />
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
              <input
                className="flex-1 border border-gray-300 rounded-[10px] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] transition-all"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill (press Enter)"
              />
              <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editPost ? 'Save Changes' : 'Post Now'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Post" size="sm">
        <p className="text-sm text-gray-500 mb-5">Are you sure you want to remove this post? This cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Remove</Button>
        </div>
      </Modal>
    </div>
  );
}
