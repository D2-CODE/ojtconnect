'use client';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SkillTag } from '@/components/ui/SkillTag';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const INDUSTRY_OPTIONS = ['Information Technology', 'Business Process Outsourcing', 'Manufacturing', 'Finance & Banking', 'Healthcare', 'Education', 'Real Estate', 'Retail', 'Others'].map((i) => ({ value: i, label: i }));
const DURATION_OPTIONS = ['1 month', '2 months', '3 months', '4 months', '5 months', '6 months', '6+ months'].map((d) => ({ value: d, label: d }));

interface CompanyProfile {
  companyName: string;
  industry: string;
  location: string;
  website: string;
  description: string;
  contactEmail: string;
  phone: string;
  preferredSkills: string[];
  internshipDetails: {
    duration: string;
    slots: number;
    allowance: string;
    workSetup: string;
    description: string;
  };
}

export default function CompanyProfilePage() {
  const { toast: showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState<CompanyProfile>({
    companyName: '', industry: '', location: '', website: '', description: '', contactEmail: '', phone: '',
    preferredSkills: [], internshipDetails: { duration: '3 months', slots: 5, allowance: '', workSetup: '', description: '' },
  });

  useEffect(() => {
    fetch('/api/profile').then((r) => r.json()).then((d) => {
      if (d.success && d.data) setForm({ ...form, ...d.data, preferredSkills: d.data.preferredSkills || [], internshipDetails: { ...form.internshipDetails, ...(d.data.internshipDetails || {}) } });
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));
  const setIntern = (field: string, value: unknown) => setForm((f) => ({ ...f, internshipDetails: { ...f.internshipDetails, [field]: value } }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.preferredSkills.includes(s)) { set('preferredSkills', [...form.preferredSkills, s]); setSkillInput(''); }
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
        <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Update your company information to attract the right interns.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
        <Input label="Company Name" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="TechCorp Philippines Inc." />
        <Select label="Industry" value={form.industry} onChange={(e) => set('industry', e.target.value)} options={INDUSTRY_OPTIONS} placeholder="Select industry" />
        <Input label="Location" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Makati City, Metro Manila" />
        <Input label="Website" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://company.com" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">About the Company</label>
          <textarea className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56] resize-none" rows={3}
            value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Brief company description..." />
        </div>
        <Input label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="hr@company.com" />
        <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+63 2 8XXX XXXX" />

        <hr className="border-gray-100" />
        <h3 className="font-semibold text-gray-800">Internship Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Duration" value={form.internshipDetails.duration} onChange={(e) => setIntern('duration', e.target.value)} options={DURATION_OPTIONS} />
          <Input label="Slots Available" type="number" value={String(form.internshipDetails.slots)} onChange={(e) => setIntern('slots', Number(e.target.value))} />
        </div>
        <Input label="Allowance" value={form.internshipDetails.allowance} onChange={(e) => setIntern('allowance', e.target.value)} placeholder="e.g. ₱500/day or None" />
        <Input label="Work Setup" value={form.internshipDetails.workSetup} onChange={(e) => setIntern('workSetup', e.target.value)} placeholder="On-site / Remote / Hybrid" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Internship Description</label>
          <textarea className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56] resize-none" rows={3}
            value={form.internshipDetails.description} onChange={(e) => setIntern('description', e.target.value)} placeholder="What will interns do?" />
        </div>

        <hr className="border-gray-100" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Skills</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.preferredSkills.map((s) => <SkillTag key={s} skill={s} onRemove={() => set('preferredSkills', form.preferredSkills.filter((x) => x !== s))} />)}
          </div>
          <div className="flex gap-2">
            <input className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]"
              value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="Add a preferred skill" />
            <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
          </div>
        </div>

        <Button onClick={handleSave} loading={saving} className="w-full mt-2">Save Profile</Button>
      </div>
    </div>
  );
}
