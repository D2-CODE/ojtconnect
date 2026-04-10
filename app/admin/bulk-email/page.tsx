'use client';
import { useEffect, useState, useCallback } from 'react';
import { Send, CheckSquare, Square, Mail, Phone, RefreshCw, FileText, Users, Building2, GraduationCap, University, CheckCircle2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/ui/Pagination';

interface PostContact { postId: string; name: string; email: string; phone: string; leadType: string; }
interface UserRow { _id: string; name: string; email: string; profileType: string; isEmailVerified: boolean; createdAt: string; }
interface Meta { totalPostsWithContact: number; totalClaimed: number; totalUnclaimed: number; }
type TabKey = 'unclaimed' | 'claimed' | 'student' | 'company' | 'university_admin';
type SortDir = 'asc' | 'desc' | null;

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'unclaimed',        label: 'Unclaimed Posts', icon: FileText      },
  { key: 'claimed',          label: 'Claimed Posts',   icon: CheckCircle2  },
  { key: 'student',          label: 'Students',        icon: GraduationCap },
  { key: 'company',          label: 'Companies',       icon: Building2     },
  { key: 'university_admin', label: 'Universities',    icon: University    },
];

const TEMPLATES = [
  { value: 'claim_invite', label: 'Claim Invite — invite to claim their listing' },
  { value: 'welcome',      label: 'Welcome — welcome to the platform' },
  { value: 'custom',       label: 'Custom — write your own message' },
];

const LIMIT = 20;

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (active && dir === 'asc')  return <ChevronUp   className="w-3 h-3 text-[#0F6E56]" />;
  if (active && dir === 'desc') return <ChevronDown  className="w-3 h-3 text-[#0F6E56]" />;
  return <ChevronsUpDown className="w-3 h-3 text-gray-300" />;
}

export default function BulkEmailPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('unclaimed');

  const [posts, setPosts]               = useState<PostContact[]>([]);
  const [claimedPosts, setClaimedPosts] = useState<PostContact[]>([]);
  const [meta, setMeta]                 = useState<Meta | null>(null);
  const [postsLoading, setPostsLoading] = useState(true);
  const [users, setUsers]               = useState<UserRow[]>([]);
  const [usersTotal, setUsersTotal]     = useState(0);
  const [usersPage, setUsersPage]       = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);
  const [page, setPage]                 = useState(1);

  const [sortKey, setSortKey] = useState<string>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [selections, setSelections] = useState<Record<TabKey, Set<string>>>({
    unclaimed: new Set(), claimed: new Set(),
    student: new Set(), company: new Set(), university_admin: new Set(),
  });

  const [template, setTemplate]           = useState('claim_invite');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody]       = useState('');
  const [sending, setSending]             = useState(false);
  const [result, setResult]               = useState<{ sent: number; failed: number } | null>(null);

  const selected      = selections[activeTab];
  const totalSelected = Object.values(selections).reduce((sum, s) => sum + s.size, 0);

  const setTabSelected = (tab: TabKey, updater: (prev: Set<string>) => Set<string>) =>
    setSelections((prev) => ({ ...prev, [tab]: updater(prev[tab]) }));

  const loadPosts = useCallback(() => {
    setPostsLoading(true);
    fetch('/api/admin/bulk-email')
      .then((r) => r.json())
      .then((d) => { if (d.success) { setPosts(d.data); setClaimedPosts(d.claimedData ?? []); setMeta(d.meta); } })
      .finally(() => setPostsLoading(false));
  }, []);

  const loadUsers = useCallback((profileType: string, pg: number) => {
    setUsersLoading(true);
    fetch(`/api/admin/users?profileType=${profileType}&page=${pg}&limit=${LIMIT}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) { setUsers(d.data); setUsersTotal(d.meta?.total ?? 0); } })
      .finally(() => setUsersLoading(false));
  }, []);

  useEffect(() => {
    setPage(1); setUsersPage(1); setSortKey('name'); setSortDir('asc');
    if (activeTab === 'unclaimed' || activeTab === 'claimed') loadPosts();
    else loadUsers(activeTab, 1);
  }, [activeTab, loadPosts, loadUsers]);

  useEffect(() => {
    if (activeTab !== 'unclaimed' && activeTab !== 'claimed') loadUsers(activeTab, usersPage);
  }, [usersPage, activeTab, loadUsers]);

  const isPostTab      = activeTab === 'unclaimed' || activeTab === 'claimed';
  const loading        = isPostTab ? postsLoading : usersLoading;
  const activePostData = activeTab === 'unclaimed' ? posts : claimedPosts;

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1); setUsersPage(1);
  };

  const sortData = <T extends Record<string, unknown>>(data: T[]): T[] => {
    if (!sortDir) return data;
    return [...data].sort((a, b) => {
      const av = String(a[sortKey] ?? '').toLowerCase();
      const bv = String(b[sortKey] ?? '').toLowerCase();
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  };

  const sortedPostData = sortData(activePostData as unknown as Record<string, unknown>[]) as unknown as PostContact[];
  const sortedUsers    = sortData(users as unknown as Record<string, unknown>[]) as unknown as UserRow[];

  const pageItems  = isPostTab ? sortedPostData.slice((page - 1) * LIMIT, page * LIMIT) : sortedUsers;
  const totalItems = isPostTab ? activePostData.length : usersTotal;

  const allPageSelected = pageItems.length > 0 && pageItems.every((i) => selected.has(i.email));

  const togglePageAll = () =>
    setTabSelected(activeTab, (prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageItems.forEach((i) => next.delete(i.email));
      else pageItems.forEach((i) => next.add(i.email));
      return next;
    });

  const toggleOne = (email: string) =>
    setTabSelected(activeTab, (prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });

  const selectAllCurrent = () =>
    setTabSelected(activeTab, () => new Set(isPostTab ? activePostData.map((p) => p.email) : users.map((u) => u.email)));

  const clearCurrent = () => setTabSelected(activeTab, () => new Set());
  const clearAll = () => setSelections({ unclaimed: new Set(), claimed: new Set(), student: new Set(), company: new Set(), university_admin: new Set() });

  const buildAllEmailList = () => {
    const list: { email: string; name: string; postId?: string }[] = [];
    const seen = new Set<string>();
    const add = (email: string, name: string, postId?: string) => {
      if (!seen.has(email)) { seen.add(email); list.push({ email, name, postId }); }
    };
    selections.unclaimed.forEach((email) => { const c = posts.find((p) => p.email === email); if (c) add(c.email, c.name, c.postId); });
    selections.claimed.forEach((email) => { const c = claimedPosts.find((p) => p.email === email); if (c) add(c.email, c.name, c.postId); });
    (['student', 'company', 'university_admin'] as TabKey[]).forEach((tab) => {
      selections[tab].forEach((email) => { const u = users.find((u) => u.email === email); if (u) add(u.email, u.name); });
    });
    return list;
  };

  const handleSend = async () => {
    if (!totalSelected) return;
    setSending(true); setResult(null);
    const res = await fetch('/api/admin/bulk-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails: buildAllEmailList(), template, customSubject, customBody }),
    });
    const d = await res.json();
    if (d.success) { setResult({ sent: d.sent, failed: d.failed }); clearAll(); }
    setSending(false);
  };

  const Th = ({ label, field }: { label: string; field?: string }) =>
    field ? (
      <th
        className="text-left px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer select-none hover:text-gray-800 transition-colors"
        onClick={() => handleSort(field)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <SortIcon active={sortKey === field} dir={sortDir} />
        </span>
      </th>
    ) : (
      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{label}</th>
    );

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Email</h1>
          <p className="text-gray-500 text-sm mt-1">Select recipients across tabs, then send.</p>
        </div>
        <button
          onClick={() => isPostTab ? loadPosts() : loadUsers(activeTab, usersPage)}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl px-3 py-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      {meta && isPostTab && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{meta.totalPostsWithContact}</div>
            <div className="text-sm text-gray-500 mt-0.5">Total posts with contact</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-500">{meta.totalClaimed}</div>
            <div className="text-sm text-gray-500 mt-0.5">Claimed posts</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-[#0F6E56]">{meta.totalUnclaimed}</div>
            <div className="text-sm text-gray-500 mt-0.5">Unclaimed posts</div>
          </div>
        </div>
      )}

      {/* Email Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <select
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56] bg-white min-w-[280px]"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          >
            {TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="flex items-center gap-3 sm:ml-auto flex-wrap">
            {totalSelected > 0 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                {totalSelected} recipient{totalSelected !== 1 ? 's' : ''} selected across tabs
              </span>
            )}
            <Button variant="primary" onClick={handleSend} loading={sending}
              disabled={!totalSelected || sending || (template === 'custom' && (!customSubject.trim() || !customBody.trim()))}>
              <Send className="w-4 h-4 mr-1.5" />
              Send Email{totalSelected > 0 ? ` (${totalSelected})` : ''}
            </Button>
            {result && (
              <div className="flex items-center gap-2">
                <Badge label={`${result.sent} sent`} variant="success" />
                {result.failed > 0 && <Badge label={`${result.failed} failed`} variant="error" />}
              </div>
            )}
          </div>
        </div>
        {template === 'custom' && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Subject <span className="text-red-400">*</span></label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]"
                placeholder="e.g. Claim your internship listing on OJT Connect PH"
                value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Body <span className="text-red-400">*</span></label>
              <textarea className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56] resize-none"
                placeholder="Write your message here..." rows={5}
                value={customBody} onChange={(e) => setCustomBody(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Tip: use <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> to insert the recipient&apos;s first name.</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs + List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => {
            const count = selections[key].size;
            return (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  activeTab === key ? 'border-[#0F6E56] text-[#0F6E56] bg-[#f0faf6]' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
                {count > 0 && <span className="bg-[#0F6E56] text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{count}</span>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><LoadingSpinner /></div>
        ) : totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="w-10 h-10 text-gray-300" />
            <p className="font-semibold text-gray-500">No records found</p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-xs text-gray-500">{totalItems} total · {selected.size} selected on this tab</span>
              <div className="flex items-center gap-3 text-xs">
                <button onClick={selectAllCurrent} className="text-[#0F6E56] hover:underline">Select all {totalItems}</button>
                <span className="text-gray-300">|</span>
                <button onClick={clearCurrent} className="text-gray-400 hover:text-gray-600 hover:underline">Clear this tab</button>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 w-10">
                    <button onClick={togglePageAll} className="text-gray-400 hover:text-[#0F6E56] transition-colors">
                      {allPageSelected ? <CheckSquare className="w-4 h-4 text-[#0F6E56]" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <Th label="Name"  field="name" />
                  <Th label="Email" field="email" />
                  {isPostTab  && <Th label="Phone"     field="phone" />}
                  {isPostTab  && <Th label="Post Type" field="leadType" />}
                  {!isPostTab && <Th label="Type"      field="profileType" />}
                  {!isPostTab && <Th label="Verified" />}
                </tr>
              </thead>
              <tbody>
                {isPostTab
                  ? (pageItems as PostContact[]).map((c, i) => (
                    <tr key={c.email} onClick={() => toggleOne(c.email)}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${selected.has(c.email) ? 'bg-[#f0faf6]' : i % 2 === 0 ? '' : 'bg-gray-50/50'} hover:bg-[#f0faf6]`}>
                      <td className="px-4 py-3">{selected.has(c.email) ? <CheckSquare className="w-4 h-4 text-[#0F6E56]" /> : <Square className="w-4 h-4 text-gray-300" />}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{c.name || '—'}</td>
                      <td className="px-4 py-3 text-xs"><span className="flex items-center gap-1.5 text-gray-600"><Mail className="w-3.5 h-3.5 text-[#0F6E56] flex-shrink-0" />{c.email}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.phone ? <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />{c.phone}</span> : '—'}</td>
                      <td className="px-4 py-3">{c.leadType ? <Badge label={c.leadType === 'intern' ? 'Student Post' : 'Company Post'} variant={c.leadType === 'intern' ? 'primary' : 'success'} /> : <span className="text-gray-400 text-xs">—</span>}</td>
                    </tr>
                  ))
                  : (pageItems as UserRow[]).map((u, i) => (
                    <tr key={u._id} onClick={() => toggleOne(u.email)}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${selected.has(u.email) ? 'bg-[#f0faf6]' : i % 2 === 0 ? '' : 'bg-gray-50/50'} hover:bg-[#f0faf6]`}>
                      <td className="px-4 py-3">{selected.has(u.email) ? <CheckSquare className="w-4 h-4 text-[#0F6E56]" /> : <Square className="w-4 h-4 text-gray-300" />}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="px-4 py-3 text-xs"><span className="flex items-center gap-1.5 text-gray-600"><Mail className="w-3.5 h-3.5 text-[#0F6E56] flex-shrink-0" />{u.email}</span></td>
                      <td className="px-4 py-3"><Badge label={u.profileType === 'university_admin' ? 'University' : u.profileType.charAt(0).toUpperCase() + u.profileType.slice(1)} variant={u.profileType === 'company' ? 'success' : u.profileType === 'student' ? 'primary' : 'neutral'} /></td>
                      <td className="px-4 py-3"><Badge label={u.isEmailVerified ? 'Verified' : 'Unverified'} variant={u.isEmailVerified ? 'success' : 'neutral'} /></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">
                Showing {isPostTab ? `${(page-1)*LIMIT+1}–${Math.min(page*LIMIT,totalItems)}` : `${(usersPage-1)*LIMIT+1}–${Math.min(usersPage*LIMIT,usersTotal)}`} of {totalItems}
              </span>
              <Pagination total={totalItems} page={isPostTab ? page : usersPage} limit={LIMIT} onPageChange={isPostTab ? setPage : setUsersPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
