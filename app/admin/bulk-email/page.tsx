'use client';
import { useEffect, useState } from 'react';
import { Send, CheckSquare, Square, Users, Mail, Phone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';

interface PostContact {
  postId: string;
  name: string;
  email: string;
  phone: string;
  leadType: string;
}

interface Meta {
  totalPostsWithContact: number;
  totalClaimed: number;
  totalUnclaimed: number;
}

const TEMPLATES = [
  { value: 'claim_invite', label: 'Claim Invite — invite to claim their listing' },
  { value: 'welcome', label: 'Welcome — welcome to the platform' },
];

export default function BulkEmailPage() {
  const [contacts, setContacts] = useState<PostContact[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 20;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState('claim_invite');

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  const load = () => {
    setLoading(true);
    setResult(null);
    fetch('/api/admin/bulk-email')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setContacts(d.data);
          setMeta(d.meta);
          setSelected(new Set());
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const pageContacts = contacts.slice((page - 1) * LIMIT, page * LIMIT);
  const allSelected = contacts.length > 0 && contacts.every((c) => selected.has(c.email));

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(contacts.map((c) => c.email)));
  };

  const toggleOne = (email: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const handleSend = async () => {
    if (!selected.size) return;
    setSending(true);
    setResult(null);
    const selectedContacts = contacts.filter((c) => selected.has(c.email)).map((c) => ({ email: c.email, name: c.name, postId: c.postId }));
    const res = await fetch('/api/admin/bulk-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails: selectedContacts, template }),
    });
    const d = await res.json();
    if (d.success) {
      setResult({ sent: d.sent, failed: d.failed });
      setSelected(new Set());
    }
    setSending(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Email</h1>
          <p className="text-gray-500 text-sm mt-1">
            Posts with contact email that have not been claimed yet.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl px-3 py-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {meta && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{meta.totalPostsWithContact}</div>
            <div className="text-sm text-gray-500 mt-0.5">Total posts with contact info</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-500">{meta.totalClaimed}</div>
            <div className="text-sm text-gray-500 mt-0.5">Claimed posts</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-[#0F6E56]">{meta.totalUnclaimed}</div>
            <div className="text-sm text-gray-500 mt-0.5">Unclaimed — shown below</div>
          </div>
        </div>
      )}

      {/* Email settings */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <select
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56] bg-white min-w-[280px]"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          >
            {TEMPLATES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-3 sm:ml-auto flex-wrap">
            <Button variant="primary" onClick={handleSend} loading={sending} disabled={!selected.size || sending}>
              <Send className="w-4 h-4 mr-1.5" />
              Send Email{selected.size > 0 ? ` (${selected.size} selected)` : ''}
            </Button>
            {result && (
              <div className="flex items-center gap-2">
                <Badge label={`${result.sent} sent`} variant="success" />
                {result.failed > 0 && <Badge label={`${result.failed} failed`} variant="error" />}
              </div>
            )}
          </div>
        </div>


      </div>

      {/* Contact list */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]"><LoadingSpinner /></div>
      ) : contacts.length === 0 ? (
        <EmptyState icon={Users} title="No unclaimed contacts" description="All posts with contact info have been claimed." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="text-gray-400 hover:text-[#0F6E56] transition-colors">
                    {allSelected ? <CheckSquare className="w-4 h-4 text-[#0F6E56]" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name (from post)</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Post Type</th>
              </tr>
            </thead>
            <tbody>
              {pageContacts.map((contact, i) => (
                <tr
                  key={contact.email}
                  className={`border-b border-gray-100 cursor-pointer transition-colors ${
                    selected.has(contact.email) ? 'bg-[#f0faf6]' : i % 2 === 0 ? '' : 'bg-gray-50/50'
                  } hover:bg-[#f0faf6]`}
                  onClick={() => toggleOne(contact.email)}
                >
                  <td className="px-4 py-3">
                    {selected.has(contact.email)
                      ? <CheckSquare className="w-4 h-4 text-[#0F6E56]" />
                      : <Square className="w-4 h-4 text-gray-300" />}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{contact.name || '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-[#0F6E56] flex-shrink-0" />
                      {contact.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {contact.phone
                      ? <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />{contact.phone}</span>
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {contact.leadType
                      ? <Badge label={contact.leadType === 'intern' ? 'Student Post' : 'Company Post'} variant={contact.leadType === 'intern' ? 'primary' : 'success'} />
                      : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">{contacts.length} unclaimed · {selected.size} selected</span>
            <Pagination total={contacts.length} page={page} limit={LIMIT} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
