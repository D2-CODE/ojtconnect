'use client';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SkillTag } from '@/components/ui/SkillTag';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const YEAR_OPTIONS = [1, 2, 3, 4, 5].map((y) => ({ value: String(y), label: `${y}${y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year` }));

interface Profile {
  firstName: string;
  lastName: string;
  course: string;
  yearLevel: number;
  bio: string;
  skills: string[];
  location: string;
  contactEmail: string;
  phone: string;
  linkedIn: string;
  portfolio: string;
  isVisible: boolean;
}

export default function StudentProfilePage() {
  const { toast: showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState<Profile>({
    firstName: '', lastName: '', course: '', yearLevel: 4, bio: '', skills: [],
    location: '', contactEmail: '', phone: '', linkedIn: '', portfolio: '', isVisible: true,
  });

  useEffect(() => {
    fetch('/api/profile').then((r) => r.json()).then((d) => {
      if (d.success && d.data) setForm({ ...form, ...d.data, yearLevel: d.data.yearLevel || 4, skills: d.data.skills || [] });
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (field: keyof Profile, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) { set('skills', [...form.skills, s]); setSkillInput(''); }
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
        <Input label="Location" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Quezon City, Metro Manila" />
        <Input label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="juan@example.com" />
        <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+63 9XX XXX XXXX" />
        <Input label="LinkedIn" value={form.linkedIn} onChange={(e) => set('linkedIn', e.target.value)} placeholder="https://linkedin.com/in/..." />
        <Input label="Portfolio / GitHub" value={form.portfolio} onChange={(e) => set('portfolio', e.target.value)} placeholder="https://github.com/..." />

        <hr className="border-gray-100" />
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.isVisible} onChange={(e) => set('isVisible', e.target.checked)} className="w-4 h-4 text-[#0F6E56] rounded" />
          <div>
            <span className="text-sm font-medium text-gray-700">Visible on OJT Wall</span>
            <p className="text-xs text-gray-400">Allow companies to discover your profile</p>
          </div>
        </label>

        <Button onClick={handleSave} loading={saving} className="w-full mt-2">Save Profile</Button>
      </div>
    </div>
  );
}
