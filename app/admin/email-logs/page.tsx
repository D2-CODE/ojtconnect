'use client';
import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Mail, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface EmailLog {
  _id: string;
  to: string;
  subject: string;
  template: string;
  status: string;
  error?: string;
  createdAt: string;
}

type SortDir = 'asc' | 'desc';

const COLUMNS: { label: string; field: string }[] = [
  { label: 'To',        field: 'to'        },
  { label: 'Subject',   field: 'subject'   },
  { label: 'Template',  field: 'template'  },
  { label: 'Status',    field: 'status'    },
  { label: 'Sent At',   field: 'createdAt' },
];

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (active && dir === 'asc')  return <ChevronUp   className="w-3 h-3 text-[#0F6E56]" />;
  if (active && dir === 'desc') return <ChevronDown  className="w-3 h-3 text-[#0F6E56]" />;
  return <ChevronsUpDown className="w-3 h-3 text-gray-300" />;
}

export default function AdminEmailLogsPage() {
  const [logs, setLogs]     = useState<EmailLog[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy]   = useState('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, sortDir });
    if (search) params.set('search', search);
    fetch(`/api/admin/email-logs?${params}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) { setLogs(d.data); setTotal(d.meta?.total || 0); } })
      .finally(() => setLoading(false));
  }, [page, search, sortBy, sortDir]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
    setPage(1);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Logs</h1>
        <p className="text-gray-500 text-sm mt-1">Track all outgoing emails sent by the platform.</p>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full max-w-sm border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]"
          placeholder="Search by email or subject..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]"><LoadingSpinner /></div>
      ) : logs.length === 0 ? (
        <EmptyState icon={Mail} title="No email logs" description="No emails have been sent yet." />
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">{total} email{total !== 1 ? 's' : ''}</p>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {COLUMNS.map(({ label, field }) => (
                    <th
                      key={field}
                      className="text-left px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer select-none hover:text-gray-800 transition-colors"
                      onClick={() => handleSort(field)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <SortIcon active={sortBy === field} dir={sortDir} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log._id} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 text-gray-700 text-xs">{log.to}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate">{log.subject}</td>
                    <td className="px-4 py-3"><Badge label={log.template} variant="neutral" /></td>
                    <td className="px-4 py-3"><Badge label={log.status} variant={log.status === 'sent' ? 'success' : 'error'} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center">
            <Pagination total={total} page={page} limit={limit} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
