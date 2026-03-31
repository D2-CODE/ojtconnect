'use client';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SkillTag } from '@/components/ui/SkillTag';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Building2 } from 'lucide-react';

const YEAR_OPTIONS = [1, 2, 3, 4, 5].map((y) => ({ value: String(y), label: `${y}${y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year` }));
const SETUP_OPTIONS = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

interface University { _id: string; name: string; abbreviation?: string; }

interface Profile {
  firstName: string;
  lastName: string;
  course: string;
  yearLevel: number;
  bio: string;
  skills: string[];
  universityId: string;
  preferredSetup: string;
  preferredLocation: string;
  ojtHoursRequired: number;
  contactEmail: string;
  phone: string;
  linkedinUrl: string;
  portfolioUrl: string;
  isVisible: boolean;
}

export default function StudentProfilePage() {
  const { toast: showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [uniSearch, setUniSearch] = useState('');
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const [selectedUniName, setSelectedUniName] = useState('');
  const [form, setForm] = useState<Profile>({
    firstName: '', lastName: '', course: '', yearLevel: 4, bio: '', skills: [],
    universityId: '', preferredSetup: '', preferredLocation: '', ojtHoursRequired: 300,
    contactEmail: '', phone: '', linkedinUrl: '', portfolioUrl: '', isVisible: true,
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/universities?verificationStatus=verified&limit=100').then((r) => r.json()),
    ]).then(([p, u]) => {
      if (p.success && p.data) {
        setForm((f) => ({ ...f, ...p.data, yearLevel: p.data.yearLevel || 4, skills: p.data.skills || [], universityId: p.data.universityId || '', preferredSetup: p.data.preferredSetup || '', preferredLocation: p.data.preferredLocation || '', ojtHoursRequired: p.data.ojtHoursRequired || 300, contactEmail: p.data.contactEmail || '', phone: p.data.phone || '', linkedinUrl: p.data.linkedinUrl || '', portfolioUrl: p.data.portfolioUrl || '' }));
        if (p.data.universityId && u.success) {
          const uni = u.data?.find((x: University) => x._id === p.data.universityId);
          if (uni) setSelectedUniName(uni.abbreviation ? `${uni.name} (${uni.abbreviation})` : uni.name);
        }
      }
      if (u.success) setUniversities(u.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const set = (field: keyof Profile, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) { set('skills', [...form.skills, s]); setSkillInput(''); }
  };

  const filteredUnis = universities.filter((u) =>
    u.name.toLowerCase().includes(uniSearch.toLowerCase()) ||
    (u.abbreviation || '').toLowerCase().includes(uniSearch.toLowerCase())
  );

  const selectUniversity = (uni: University) => {
    set('universityId', uni._id);
    setSelectedUniName(uni.abbreviation ? `${uni.name} (${uni.abbreviation})` : uni.name);
    setUniSearch('');
    setShowUniDropdown(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (d.success) showToast('Profile saved!', 'success');
      else showToast(d.error || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Keep your profile updated to be discovered by companies.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Juan" />
          <Input label="Last Name" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Dela Cruz" />
        </div>
        <Input label="Course / Program" value={form.course} onChange={(e) => set('course', e.target.value)} placeholder="BS Computer Science" />
        <Select label="Year Level" value={String(form.yearLevel)} onChange={(e) => set('yearLevel', Number(e.target.value))} options={YEAR_OPTIONS} />

        {/* School selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> School <span className="text-red-500">*</span></span>
          </label>
          <div
            className="w-full border border-gray-300 rounded-xl px-3.5 py-3 text-sm cursor-pointer flex items-center justify-between focus-within:ring-2 focus-within:ring-[#0F6E56] focus-within:border-[#0F6E56]"
            onClick={() => setShowUniDropdown((v) => !v)}
          >
            <span className={selectedUniName ? 'text-gray-900' : 'text-gray-400'}>
              {selectedUniName || 'Search and select your school...'}
            </span>
            <span className="text-gray-400 text-xs">▼</span>
          </div>
          {showUniDropdown && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <input
                  autoFocus
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F6E56]"
                  placeholder="Search school..."
                  value={uniSearch}
                  onChange={(e) => setUniSearch(e.target.value)}
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredUnis.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No schools found</p>
                ) : filteredUnis.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#E8F5F1] transition-colors"
                    onClick={() => selectUniversity(u)}
                  >
                    <span className="font-medium text-gray-900">{u.name}</span>
                    {u.abbreviation && <span className="text-gray-400 ml-1.5">({u.abbreviation})</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
          <textarea className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56] focus:border-transparent resize-none" rows={3}
            value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Tell companies about yourself..." />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.skills.map((s) => <SkillTag key={s} skill={s} onRemove={() => set('skills', form.skills.filter((x) => x !== s))} />)}
          </div>
          <div className="flex gap-2">
            <input className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]"
              value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="Add a skill (press Enter)" />
            <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
          </div>
        </div>

        <hr className="border-gray-100" />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Preferred Setup" value={form.preferredSetup} onChange={(e) => set('preferredSetup', e.target.value)} options={SETUP_OPTIONS} placeholder="Any" />
          <Input label="Preferred Location" value={form.preferredLocation} onChange={(e) => set('preferredLocation', e.target.value)} placeholder="Quezon City" />
        </div>
        <Input label="OJT Hours Required" type="number" value={String(form.ojtHoursRequired)} onChange={(e) => set('ojtHoursRequired', Number(e.target.value))} />
        <Input label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="juan@example.com" />
        <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+63 9XX XXX XXXX" />
        <Input label="LinkedIn" value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/..." />
        <Input label="Portfolio / GitHub" value={form.portfolioUrl} onChange={(e) => set('portfolioUrl', e.target.value)} placeholder="https://github.com/..." />

        <hr className="border-gray-100" />
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.isVisible} onChange={(e) => set('isVisible', e.target.checked)} className="w-4 h-4 text-[#0F6E56] rounded" />
          <div>
            <span className="text-sm font-medium text-gray-700">Visible to companies</span>
            <p className="text-xs text-gray-400">Allow companies to discover your profile in search</p>
          </div>
        </label>

        <Button onClick={handleSave} loading={saving} className="w-full mt-2">Save Profile</Button>
      </div>
    </div>
  );
}
