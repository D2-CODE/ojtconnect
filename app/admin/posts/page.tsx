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
import { FileText, Search, Eye, Pencil, Trash2, Lock, LockOpen, ChevronDown, Plus, X, ArrowUpDown, ArrowUp, ArrowDown, Building2, GraduationCap, EyeOff, RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/utils';
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

  // Multi-select
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkTypeTarget, setBulkTypeTarget] = useState<'intern' | 'internship' | null>(null);
  const [bulkTyping, setBulkTyping] = useState(false);
  const [bulkHiding, setBulkHiding] = useState(false);
  const [bulkHideTarget, setBulkHideTarget] = useState<'hide' | 'unhide' | null>(null);

  const handleBulkHide = async () => {
    if (!bulkHideTarget) return;
    setBulkHiding(true);
    const isHiding = bulkHideTarget === 'hide';
    try {
      await Promise.all([...selected].map(id =>
        fetch(`/api/wall/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'toggle-hide' }),
        })
      ));
      showToast(`${selected.size} post${selected.size > 1 ? 's' : ''} ${isHiding ? 'hidden' : 'unhidden'}`, 'success');
      setSelected(new Set());
      setBulkHideTarget(null);
      load();
    } finally { setBulkHiding(false); }
  };

  const allIds = posts.map(p => p._id);
  const allCurrentSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      // Deselect only current page posts
      setSelected(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      // Add all current page posts to selection
      setSelected(prev => new Set([...prev, ...allIds]));
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all([...selected].map(id => fetch(`/api/wall/${id}`, { method: 'DELETE' })));
      showToast(`${selected.size} post${selected.size > 1 ? 's' : ''} deleted`, 'success');
      setSelected(new Set());
      setShowBulkConfirm(false);
      load();
    } finally { setBulkDeleting(false); }
  };

  const handleBulkChangeType = async () => {
    if (!bulkTypeTarget) return;
    setBulkTyping(true);
    const newSource = bulkTypeTarget === 'intern' ? 'student' : 'company';
    try {
      await Promise.all([...selected].map(id =>
        fetch(`/api/wall/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'change-type', source: newSource, leadType: bulkTypeTarget }),
        })
      ));
      showToast(`${selected.size} post${selected.size > 1 ? 's' : ''} changed to ${bulkTypeTarget === 'intern' ? 'Student Post' : 'Company Post'}`, 'success');
      setSelected(new Set());
      setBulkTypeTarget(null);
      load();
    } finally { setBulkTyping(false); }
  };

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

  // Sorting
  type SortField = 'name' | 'type' | 'status' | 'date';
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    const fb_a = a.SectionData?.fbleads;
    const fb_b = b.SectionData?.fbleads;
    const isNative_a = a.source === 'company' || a.source === 'student';
    const isNative_b = b.source === 'company' || b.source === 'student';
    let valA = '';
    let valB = '';
    if (sortField === 'name') {
      valA = (isNative_a ? (a.postedByName || fb_a?.name) : fb_a?.name) || '';
      valB = (isNative_b ? (b.postedByName || fb_b?.name) : fb_b?.name) || '';
    } else if (sortField === 'type') {
      valA = isNative_a ? (a.source === 'student' ? 'intern' : 'internship') : (fb_a?.lead_type || '');
      valB = isNative_b ? (b.source === 'student' ? 'intern' : 'internship') : (fb_b?.lead_type || '');
    } else if (sortField === 'status') {
      valA = a.status || '';
      valB = b.status || '';
    } else if (sortField === 'date') {
      valA = a.createdAt || '';
      valB = b.createdAt || '';
    }
    const cmp = valA.localeCompare(valB);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-300" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-[#0F6E56]" /> : <ArrowDown className="w-3 h-3 ml-1 text-[#0F6E56]" />;
  };

  // Keywords state
  const [companyKws, setCompanyKws] = useState<string[]>([]);
  const [studentKws, setStudentKws] = useState<string[]>([]);
  const [kwOpen, setKwOpen] = useState(false);
  const [kwInput, setKwInput] = useState('');
  const [kwType, setKwType] = useState<'company' | 'student'>('company');
  const [kwSaving, setKwSaving] = useState(false);
  const [applying, setApplying] = useState(false);

  const applyKeywords = async () => {
    setApplying(true);
    try {
      const res = await fetch('/api/wall', { method: 'PUT' });
      const d = await res.json();
      if (d.success) {
        showToast(`Done! ${d.changed} of ${d.total} posts reclassified.`, 'success');
        load();
      } else showToast(d.error || 'Failed', 'error');
    } finally { setApplying(false); }
  };

  const loadKeywords = useCallback(() => {
    fetch('/api/admin/keywords').then(r => r.json()).then(d => {
      if (d.success && d.data) {
        setCompanyKws(Array.isArray(d.data.companyKeywords) ? d.data.companyKeywords : []);
        setStudentKws(Array.isArray(d.data.studentKeywords) ? d.data.studentKeywords : []);
      }
    });
  }, []);

  useEffect(() => { loadKeywords(); }, [loadKeywords]);

  const addKeyword = async () => {
    const kw = kwInput.trim();
    if (!kw) return;
    setKwSaving(true);
    try {
      const res = await fetch('/api/admin/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw, type: kwType }),
      });
      const d = await res.json();
      if (d.success) {
        setKwInput('');
        if (kwType === 'company') setCompanyKws((prev: string[]) => [...prev, kw.toLowerCase()]);
        else setStudentKws((prev: string[]) => [...prev, kw.toLowerCase()]);
        loadKeywords();
        showToast(d.message || 'Keyword added', 'success');
      } else showToast(d.message || 'Failed', 'error');
    } finally { setKwSaving(false); }
  };

  const removeKeyword = async (keyword: string, type: 'company' | 'student') => {
    const res = await fetch('/api/admin/keywords', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, type }),
    });
    const d = await res.json();
    if (d.success) {
      if (type === 'company') setCompanyKws(prev => prev.filter(k => k !== keyword));
      else setStudentKws(prev => prev.filter(k => k !== keyword));
      showToast(d.message || 'Keyword removed', 'success');
    } else showToast(d.message || 'Failed', 'error');
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
          onClick={applyKeywords}
          disabled={applying}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#0F6E56] text-[#0F6E56] rounded-xl hover:bg-[#E8F5F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${applying ? 'animate-spin' : ''}`} />
          {applying ? 'Reclassifying...' : 'Reclassify Posts'}
        </button>
      </div>

      {/* Keywords Manager */}
      <div className="mb-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setKwOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-800">Detection Keywords</span>
            <span className="px-2 py-0.5 bg-[#E8F5F1] text-[#0F6E56] text-xs font-medium rounded-full">
              {companyKws.length} company · {studentKws.length} student
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${kwOpen ? 'rotate-180' : ''}`} />
        </button>

        {kwOpen && (
          <div className="border-t border-gray-100">
            {/* Add keyword row */}
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] bg-white"
                  placeholder="Add new keyword..."
                  value={kwInput}
                  onChange={e => setKwInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addKeyword()}
                />
                <select
                  value={kwType}
                  onChange={e => setKwType(e.target.value as 'company' | 'student')}
                  className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] bg-white"
                >
                  <option value="company">Company</option>
                  <option value="student">Student</option>
                </select>
                <button
                  onClick={addKeyword}
                  disabled={kwSaving || !kwInput.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0F6E56] text-white text-sm font-medium rounded-xl hover:bg-[#0A5A45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              <div className="px-5 py-5">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Company Keywords</p>
                {companyKws.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No company keywords.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                    {companyKws.map(kw => (
                      <span key={kw} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                        {kw}
                        <button onClick={() => removeKeyword(kw, 'company')} className="flex-shrink-0 hover:text-red-500 transition-colors" title="Remove">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-5 py-5">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-3">Student Keywords</p>
                {studentKws.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No student keywords.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                    {studentKws.map(kw => (
                      <span key={kw} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-100">
                        {kw}
                        <button onClick={() => removeKeyword(kw, 'student')} className="flex-shrink-0 hover:text-red-500 transition-colors" title="Remove">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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

          {/* Bulk action bar */}
          {someSelected && (
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 mb-3 flex-wrap shadow-sm">
              <span className="text-sm font-semibold text-gray-700">
                <span className="bg-[#0F6E56] text-white text-xs font-bold px-2 py-0.5 rounded-full mr-1.5">{selected.size}</span>
                selected
                {selected.size > allIds.length && <span className="text-gray-400 text-xs font-normal ml-1">(across pages)</span>}
              </span>

              <div className="w-px h-5 bg-gray-200" />

              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setBulkTypeTarget('internship')} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                  <Building2 className="w-3.5 h-3.5" /> Company
                </button>
                <button onClick={() => setBulkTypeTarget('intern')} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                  <GraduationCap className="w-3.5 h-3.5" /> Student
                </button>
                <button onClick={() => setBulkHideTarget('hide')} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                  <EyeOff className="w-3.5 h-3.5" /> Hide
                </button>
                <button onClick={() => setBulkHideTarget('unhide')} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                  <Eye className="w-3.5 h-3.5" /> Unhide
                </button>
                <button onClick={() => setShowBulkConfirm(true)} className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>

              <button onClick={() => setSelected(new Set())} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors ml-auto">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          )}

<div className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
         <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allCurrentSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#0F6E56] cursor-pointer accent-[#0F6E56]"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                    <button onClick={() => handleSort('name')} className="inline-flex items-center hover:text-gray-800 transition-colors">
                      Name <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Post</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                    <button onClick={() => handleSort('type')} className="inline-flex items-center hover:text-gray-800 transition-colors">
                      Type <SortIcon field="type" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                    <button onClick={() => handleSort('status')} className="inline-flex items-center hover:text-gray-800 transition-colors">
                      Status <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                    <button onClick={() => handleSort('date')} className="inline-flex items-center hover:text-gray-800 transition-colors">
                      Date <SortIcon field="date" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPosts.map((p, i) => {
                  const fb = p.SectionData?.fbleads;
                  const isNative = p.source === 'company' || p.source === 'student';
                  const displayName = isNative ? (p.postedByName || fb?.name) : fb?.name;
                  const displayText = p.description || p.title || fb?.post_text || '';
                  const leadType = isNative ? (p.source === 'student' ? 'intern' : 'internship') : fb?.lead_type;
                  const isHidden = p.isActive === false || p.status === 'hidden';
                  return (
                    <tr key={p._id} className={`border-b border-gray-100 ${selected.has(p._id) ? 'bg-red-50/40' : isHidden ? 'opacity-50 bg-red-50/30' : i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(p._id)}
                          onChange={() => toggleSelect(p._id)}
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-[#0F6E56]"
                        />
                      </td>
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

      {/* Bulk Delete Confirm Modal */}
      <Modal isOpen={showBulkConfirm} onClose={() => setShowBulkConfirm(false)} title="Delete Selected Posts" size="sm">
        <p className="text-sm text-gray-500 mb-5">Are you sure you want to permanently delete <strong>{selected.size} post{selected.size > 1 ? 's' : ''}</strong>? This cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setShowBulkConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleBulkDelete} loading={bulkDeleting}>Delete {selected.size} Post{selected.size > 1 ? 's' : ''}</Button>
        </div>
      </Modal>

      {/* Bulk Change Type Confirm Modal */}
      <Modal isOpen={!!bulkTypeTarget} onClose={() => setBulkTypeTarget(null)} title="Change Post Type" size="sm">
        <p className="text-sm text-gray-500 mb-5">
          Change <strong>{selected.size} post{selected.size > 1 ? 's' : ''}</strong> to{' '}
          <strong>{bulkTypeTarget === 'intern' ? 'Student Post' : 'Company Post'}</strong>?
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setBulkTypeTarget(null)}>Cancel</Button>
          <Button onClick={handleBulkChangeType} loading={bulkTyping}>
            Change to {bulkTypeTarget === 'intern' ? 'Student Post' : 'Company Post'}
          </Button>
        </div>
      </Modal>

      {/* Bulk Hide/Unhide Confirm Modal */}
      <Modal isOpen={!!bulkHideTarget} onClose={() => setBulkHideTarget(null)} title={bulkHideTarget === 'hide' ? 'Hide Posts' : 'Unhide Posts'} size="sm">
        <p className="text-sm text-gray-500 mb-5">
          {bulkHideTarget === 'hide' ? 'Hide' : 'Unhide'} <strong>{selected.size} post{selected.size > 1 ? 's' : ''}</strong>?
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setBulkHideTarget(null)}>Cancel</Button>
          <Button onClick={handleBulkHide} loading={bulkHiding}>
            {bulkHideTarget === 'hide' ? 'Hide' : 'Unhide'} {selected.size} Post{selected.size > 1 ? 's' : ''}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
