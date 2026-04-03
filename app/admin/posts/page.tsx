'use client';
import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SkillTag } from '@/components/ui/SkillTag';
import { useToast } from '@/components/ui/Toast';
import { FileText, Search, Eye, Pencil, Trash2, Lock, LockOpen, RefreshCw } from 'lucide-react';
import { truncate, formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Post {
  _id: string;
  source?: string;
  postedByName?: string;
  title?: string;
  description?: string;
  skills?: string[];
  setup?: string;
  location?: string;
  allowance?: string;
  slots?: number;
  hoursRequired?: number;
  deadline?: string;
  SectionData: { fbleads: { name: string; post_text: string; lead_type: string; skills?: string } };
  status: string;
  isActive: boolean;
  createdAt: string;
}

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'intern', label: 'Student Post' },
  { value: 'internship', label: 'Company Post' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'company', label: 'Company Claimed' },
  { value: 'student', label: 'Student Claimed' },
];

const SETUP_OPTIONS = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

const EMPTY_EDIT = {
  title: '', description: '', skills: [] as string[],
  setup: '', location: '', allowance: '', slots: '', hoursRequired: '', deadline: '',
};

export default function AdminPostsPage() {
  const { toast: showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 15;

  // Edit modal
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirm modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), showHidden: 'true' });
    if (tab === 'claimed') params.set('status', 'claimed');
    else if (tab === 'hidden') params.set('status', 'hidden');
    else if (tab === 'company') params.set('source', 'company');
    else if (tab === 'student') params.set('source', 'student');
    else if (tab !== 'all') params.set('type', tab);
    if (search) params.set('search', search);
    fetch(`/api/wall?${params}`).then((r) => r.json()).then((d) => {
      if (d.success) { setPosts(d.data); setTotal(d.meta?.total || 0); }
    }).finally(() => setLoading(false));
  }, [page, tab, search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const openEdit = (p: Post) => {
    const fb = p.SectionData?.fbleads;
    const isNative = p.source === 'company' || p.source === 'student';
    setEditPost(p);
    setEditForm({
      title: p.title || fb?.name || '',
      description: p.description || fb?.post_text || '',
      skills: isNative
        ? (p.skills || [])
        : (fb?.skills ? fb.skills.split(',').map((s) => s.trim()).filter(Boolean) : []),
      setup: p.setup || '',
      location: p.location || '',
      allowance: p.allowance || '',
      slots: String(p.slots || ''),
      hoursRequired: String(p.hoursRequired || ''),
      deadline: p.deadline ? p.deadline.slice(0, 10) : '',
    });
    setSkillInput('');
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !editForm.skills.includes(s)) {
      setEditForm((f) => ({ ...f, skills: [...f.skills, s] }));
      setSkillInput('');
    }
  };

  const handleSave = async () => {
    if (!editPost) return;
    if (!editForm.title.trim() || !editForm.description.trim()) {
      showToast('Title and description are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: editForm.title,
        description: editForm.description,
        skills: editForm.skills,
        setup: editForm.setup,
        location: editForm.location,
        allowance: editForm.allowance,
        slots: editForm.slots ? Number(editForm.slots) : undefined,
        hoursRequired: editForm.hoursRequired ? Number(editForm.hoursRequired) : undefined,
        deadline: editForm.deadline || undefined,
      };
      const res = await fetch(`/api/wall/${editPost._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (d.success) {
        showToast('Post updated!', 'success');
        setEditPost(null);
        load();
      } else {
        showToast(d.error || 'Failed', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleHide = async (id: string) => {
    const res = await fetch(`/api/wall/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle-hide' }),
    });
    const d = await res.json();
    if (d.success) {
      showToast(d.data.isActive ? 'Post unhidden' : 'Post hidden', 'success');
      setPosts((prev) => prev.map((p) => p._id === id ? { ...p, status: d.data.status, isActive: d.data.isActive } : p));
    } else showToast(d.error || 'Failed', 'error');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/wall/${deleteId}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) {
        showToast('Post deleted', 'success');
        setDeleteId(null);
        setPosts((prev) => prev.filter((p) => p._id !== deleteId));
        setTotal((t) => t - 1);
      } else showToast(d.error || 'Failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const changeType = async (id: string, newType: 'intern' | 'internship') => {
    const newSource = newType === 'intern' ? 'student' : 'company';
    const res = await fetch(`/api/wall/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change-type', source: newSource, leadType: newType }),
    });
    const d = await res.json();
    if (d.success) {
      showToast('Type updated', 'success');
      setPosts((prev) => prev.map((p) =>
        p._id === id
          ? {
              ...p,
              source: newSource,
              SectionData: p.SectionData
                ? { ...p.SectionData, fbleads: p.SectionData.fbleads ? { ...p.SectionData.fbleads, lead_type: newType } : p.SectionData.fbleads }
                : p.SectionData,
            }
          : p
      ));
    } else showToast(d.error || 'Failed', 'error');
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reclassifying, setReclassifying] = useState(false);

  const handleReclassify = async () => {
    setReclassifying(true);
    try {
      const res = await fetch('/api/wall', { method: 'PUT' });
      const d = await res.json();
      if (d.success) {
        showToast(`Done! ${d.changed} of ${d.total} posts reclassified.`, 'success');
        load();
      } else showToast(d.error || 'Failed', 'error');
    } finally {
      setReclassifying(false);
    }
  };

  const isCompanyPost = editPost?.source === 'company' || editPost?.SectionData?.fbleads?.lead_type === 'internship';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wall Posts</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all OJT wall posts.</p>
        </div>
        <button
          onClick={handleReclassify}
          disabled={reclassifying}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#0F6E56] text-[#0F6E56] rounded-xl hover:bg-[#E8F5F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${reclassifying ? 'animate-spin' : ''}`} />
          {reclassifying ? 'Reclassifying...' : 'Auto-Reclassify Posts'}
        </button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full max-w-sm border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]"
          placeholder="Search posts..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Tabs tabs={TABS} activeTab={tab} onTabChange={(t) => { setTab(t); setPage(1); }} className="mb-4" />

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]"><LoadingSpinner /></div>
      ) : posts.length === 0 ? (
        <EmptyState icon={FileText} title="No posts found" description="No results match your filters." />
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">{total} post{total !== 1 ? 's' : ''}</p>
<div className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
         <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Post</th>
                  {/* <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Source</th> */}
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p, i) => {
                  const fb = p.SectionData?.fbleads;
                  const isNative = p.source === 'company' || p.source === 'student';
                  const displayName = isNative ? (p.postedByName || fb?.name) : fb?.name;
                  const displayText = p.description || p.title || fb?.post_text || '';
                  const leadType = isNative ? (p.source === 'student' ? 'intern' : 'internship') : fb?.lead_type;
                  const isHidden = p.isActive === false || p.status === 'hidden';
                  return (
                    <tr key={p._id} className={`border-b border-gray-100 ${isHidden ? 'opacity-50 bg-red-50/30' : i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{displayName || 'Anonymous'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">
                        {(() => {
                          const fullText = isNative && (p.title || p.description)
                            ? [p.title, p.description].filter(Boolean).join(' — ')
                            : (fb?.post_text || p.description || p.title || '');
                          const isExpanded = expandedId === p._id;
                          const SHORT = 80;
                          if (fullText.length <= SHORT) return <span>{fullText}</span>;
                          return (
                            <span>
                              {isExpanded ? fullText : fullText.slice(0, SHORT) + '...'}
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : p._id)}
                                className="ml-1 text-[#0F6E56] font-medium hover:underline whitespace-nowrap"
                              >
                                {isExpanded ? 'read less' : 'read more'}
                              </button>
                            </span>
                          );
                        })()}
                      </td>
                      {/* <td className="px-4 py-3"><Badge label={p.source || 'scraped'} variant={isNative ? 'success' : 'neutral'} /></td> */}
                      <td className="px-4 py-3">
                        <select
                          value={leadType === 'intern' ? 'intern' : 'internship'}
                          onChange={(e) => changeType(p._id, e.target.value as 'intern' | 'internship')}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] bg-white cursor-pointer"
                        >
                          <option value="intern">Student Post</option>
                          <option value="internship">Company Post</option>
                        </select>
                      </td>
                      <td className="px-4 py-3"><Badge label={p.status || 'active'} variant={p.status === 'claimed' ? 'success' : p.status === 'hidden' ? 'warning' : 'neutral'} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={isHidden ? '#' : `/wall/${p._id}`} target={isHidden ? undefined : '_blank'} onClick={(e) => isHidden && e.preventDefault()}>
                            <button disabled={isHidden} className="p-1.5 rounded-lg text-gray-400 hover:text-[#0F6E56] hover:bg-[#E8F5F1] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400" title="View post">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            disabled={isHidden}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                            title="Edit post"
                            onClick={() => !isHidden && openEdit(p)}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className={`p-1.5 rounded-lg transition-colors ${isHidden ? 'text-[#0F6E56] hover:text-[#0A5A45] hover:bg-[#E8F5F1]' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
                            title={isHidden ? 'Unhide post' : 'Hide post'}
                            onClick={() => toggleHide(p._id)}
                          >
                            {isHidden ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                          <button
                            disabled={isHidden}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                            title="Delete post"
                            onClick={() => !isHidden && setDeleteId(p._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center"><Pagination total={total} page={page} limit={limit} onPageChange={setPage} /></div>
        </>
      )}

      {/* Edit Modal — same style as student wall */}
      <Modal isOpen={!!editPost} onClose={() => setEditPost(null)} title="Edit Post" size="lg">
        <div className="flex flex-col gap-4">
          <Input
            label="Post Title" required
            value={editForm.title}
            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Looking for IT OJT — BS Computer Science"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-[10px] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] resize-none transition-all"
              rows={4}
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe the post content..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Preferred Setup"
              value={editForm.setup}
              onChange={(e) => setEditForm((f) => ({ ...f, setup: e.target.value }))}
              options={SETUP_OPTIONS}
              placeholder="Any setup"
            />
            <Input
              label="Preferred Location"
              value={editForm.location}
              onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Quezon City"
            />
          </div>
          <Input
            label="OJT Hours Required" type="number"
            value={editForm.hoursRequired}
            onChange={(e) => setEditForm((f) => ({ ...f, hoursRequired: e.target.value }))}
          />
          {isCompanyPost && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Allowance"
                value={editForm.allowance}
                onChange={(e) => setEditForm((f) => ({ ...f, allowance: e.target.value }))}
                placeholder="e.g. ₱500/day or None"
              />
              <Input
                label="Slots Available" type="number"
                value={editForm.slots}
                onChange={(e) => setEditForm((f) => ({ ...f, slots: e.target.value }))}
              />
            </div>
          )}
          {isCompanyPost && (
            <Input
              label="Application Deadline" type="date"
              value={editForm.deadline}
              onChange={(e) => setEditForm((f) => ({ ...f, deadline: e.target.value }))}
            />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {editForm.skills.map((s) => (
                <SkillTag key={s} skill={s} onRemove={() => setEditForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }))} />
              ))}
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
            <Button variant="outline" onClick={() => setEditPost(null)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Post" size="sm">
        <p className="text-sm text-gray-500 mb-5">Are you sure you want to permanently delete this post? This cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
