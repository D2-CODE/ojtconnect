'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { SkillTag } from '@/components/ui/SkillTag';
import { Briefcase, Plus, Pencil, Trash2, Eye, MapPin, Banknote, Users, Clock, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const SETUP_OPTIONS = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

interface Post {
  _id: string;
  title?: string;
  description?: string;
  skills?: string[];
  setup?: string;
  location?: string;
  allowance?: string;
  slots?: number;
  hoursRequired?: number;
  deadline?: string;
  status: string;
  source?: string;
  createdAt: string;
  SectionData?: {
    fbleads?: {
      name?: string;
      post_text?: string;
      skills?: string;
      lead_type?: string;
    };
  };
}

const EMPTY_FORM = {
  title: '', description: '', skills: [] as string[], setup: '', location: '',
  allowance: '', slots: 1, hoursRequired: 300, deadline: '',
};

export default function CompanyWallPage() {
  const { toast: showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/wall?mine=true&source=company&limit=50')
      .then((r) => r.json())
      .then((d) => { if (d.success) setPosts(d.data); })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const reload = () => setRefreshKey((k) => k + 1);

  // Normalize scraped post fields for display and editing
  const normalize = (p: Post) => {
    const fb = p.SectionData?.fbleads;
    const isScraped = !!fb?.name;
    return {
      title: p.title || fb?.name || '',
      description: p.description || fb?.post_text || '',
      skills: p.skills?.length ? p.skills : (fb?.skills ? fb.skills.split(',').map((s) => s.trim()).filter(Boolean) : []),
      setup: p.setup || '',
      location: p.location || '',
      allowance: p.allowance || '',
      slots: p.slots || 1,
      hoursRequired: p.hoursRequired || 300,
      deadline: p.deadline ? p.deadline.slice(0, 10) : '',
      isScraped,
    };
  };

  const openCreate = () => { setEditPost(null); setForm(EMPTY_FORM); setSkillInput(''); setModalOpen(true); };
  const openEdit = (p: Post) => {
    const n = normalize(p);
    setEditPost(p);
    setForm({ title: n.title, description: n.description, skills: n.skills, setup: n.setup, location: n.location, allowance: n.allowance, slots: n.slots, hoursRequired: n.hoursRequired, deadline: n.deadline });
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
      const payload = { ...form, slots: Number(form.slots), hoursRequired: Number(form.hoursRequired) };
      let res;
      if (editPost) {
        res = await fetch(`/api/wall/${editPost._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        res = await fetch('/api/wall', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      const d = await res.json();
      if (d.success) { showToast(editPost ? 'Post updated!' : 'Post created!', 'success'); setModalOpen(false); reload(); }
      else showToast(d.error || 'Failed', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/wall/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { showToast('Post removed', 'success'); setDeleteId(null); reload(); }
    else showToast(d.error || 'Failed', 'error');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My OJT Listings</h1>
          <p className="text-gray-500 text-sm mt-1">Post internship opportunities for students.</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Listing
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]"><LoadingSpinner /></div>
      ) : posts.length === 0 ? (
        <EmptyState icon={Briefcase} title="No listings yet" description="Create your first internship listing to attract OJT students." action={{ label: 'Create Listing', onClick: openCreate }} />
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((p) => {
            const n = normalize(p);
            return (
            <div key={p._id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900">{n.title || 'Untitled'}</h3>
                    <Badge label={p.status === 'hidden' ? 'Hidden' : p.status === 'claimed' ? 'Claimed' : 'Active'} variant={p.status === 'hidden' ? 'neutral' : 'success'} />
                    {n.setup && <Badge label={n.setup} variant="neutral" />}
                    {n.isScraped && <Badge label="From Scraper" variant="warning" />}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{n.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {n.skills.slice(0, 5).map((s) => <SkillTag key={s} skill={s} />)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                    {n.slots > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{n.slots} slot{n.slots !== 1 ? 's' : ''}</span>}
                    {n.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{n.location}</span>}
                    {n.allowance && <span className="flex items-center gap-1"><Banknote className="w-3 h-3" />{n.allowance}</span>}
                    {n.deadline && <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />Deadline: {formatDate(n.deadline)}</span>}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Posted {formatDate(p.createdAt)}</span>
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

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editPost ? 'Edit Listing' : 'New Internship Listing'} size="lg">
        <div className="flex flex-col gap-4">
          <Input label="Job Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Web Development Intern" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
            <textarea className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56] resize-none" rows={4}
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the internship role, responsibilities, and what interns will learn..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Work Setup" value={form.setup} onChange={(e) => setForm((f) => ({ ...f, setup: e.target.value }))} options={SETUP_OPTIONS} placeholder="Select setup" />
            <Input label="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Makati City" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Slots Available" type="number" value={String(form.slots)} onChange={(e) => setForm((f) => ({ ...f, slots: Number(e.target.value) }))} />
            <Input label="OJT Hours Required" type="number" value={String(form.hoursRequired)} onChange={(e) => setForm((f) => ({ ...f, hoursRequired: Number(e.target.value) }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Allowance" value={form.allowance} onChange={(e) => setForm((f) => ({ ...f, allowance: e.target.value }))} placeholder="e.g. ₱500/day or None" />
            <Input label="Application Deadline" type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Required Skills</label>
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
          <Button onClick={handleSave} loading={saving}>{editPost ? 'Save Changes' : 'Post Listing'}</Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Listing" size="sm">
        <p className="text-sm text-gray-500 mb-5">Are you sure you want to remove this listing? This cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Remove</Button>
        </div>
      </Modal>
    </div>
  );
}
