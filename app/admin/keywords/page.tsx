'use client';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Plus, X, RefreshCw } from 'lucide-react';

export default function AdminKeywordsPage() {
  const { toast: showToast } = useToast();
  const [companyKws, setCompanyKws] = useState<string[]>([]);
  const [studentKws, setStudentKws] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState('');
  const [kwType, setKwType] = useState<'company' | 'student'>('company');
  const [kwSaving, setKwSaving] = useState(false);
  const [applying, setApplying] = useState(false);

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

  const applyKeywords = async () => {
    setApplying(true);
    try {
      const res = await fetch('/api/wall', { method: 'PUT' });
      const d = await res.json();
      if (d.success) showToast(`Done! ${d.changed} of ${d.total} posts reclassified.`, 'success');
      else showToast(d.error || 'Failed', 'error');
    } finally { setApplying(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detection Keywords</h1>
          <p className="text-gray-500 text-sm mt-1">Manage keywords used to classify wall posts.</p>
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

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
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
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
              Company Keywords <span className="text-gray-400 font-normal normal-case">({companyKws.length})</span>
            </p>
            {companyKws.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No company keywords.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
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
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-3">
              Student Keywords <span className="text-gray-400 font-normal normal-case">({studentKws.length})</span>
            </p>
            {studentKws.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No student keywords.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
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
    </div>
  );
}
