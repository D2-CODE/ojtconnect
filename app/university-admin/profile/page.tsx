'use client';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SkillTag } from '@/components/ui/SkillTag';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Camera, X } from 'lucide-react';

interface UniversityProfile {
  name: string;
  location: string;
  website: string;
  description: string;
  contactEmail: string;
  phone: string;
  programs: string[];
  logo: string;
}

export default function UniversityAdminProfilePage() {
  const { toast: showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [programInput, setProgramInput] = useState('');
  const [form, setForm] = useState<UniversityProfile>({
    name: '', location: '', website: '', description: '',
    contactEmail: '', phone: '', programs: [], logo: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/profile').then((r) => r.json()).then((d) => {
      if (d.success && d.data) setForm((f) => ({ ...f, ...d.data, programs: d.data.programs || [], logo: d.data.logo || '' }));
    }).finally(() => setLoading(false));
  }, []);

  const set = (field: keyof UniversityProfile, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (d.success) {
        set('logo', d.url);
        showToast('Logo uploaded — click Save Profile to apply.', 'success');
      } else {
        showToast(d.error || 'Upload failed', 'error');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addProgram = () => {
    const p = programInput.trim();
    if (p && !form.programs.includes(p)) { set('programs', [...form.programs, p]); setProgramInput(''); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
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
        <h1 className="text-2xl font-bold text-gray-900">School Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Keep your School information up to date.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">School Logo</label>
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="relative w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
              {form.logo ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.logo} alt="Logo preview" className="w-full h-full object-contain p-1" />
                  <button
                    onClick={() => set('logo', '')}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </>
              ) : (
                <Camera className="w-6 h-6 text-gray-400" />
              )}
            </div>

            {/* Upload button */}
            <div className="flex flex-col gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                loading={uploading}
              >
                {uploading ? 'Uploading...' : form.logo ? 'Change Logo' : 'Upload Logo'}
              </Button>
              <p className="text-xs text-gray-400">JPG, PNG, WebP or SVG · max 2 MB</p>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        <Input label="School Name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="School of the Philippines" />
        <Input label="Location" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Quezon City, Metro Manila" />
        <Input label="Website" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://up.edu.ph" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">About</label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56] resize-none"
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Brief school description..."
          />
        </div>
        <Input label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="ojtcoordinator@school.edu.ph" />
        <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+63 2 8XXX XXXX" />

        <hr className="border-gray-100" />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Programs Offered</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.programs.map((p) => (
              <SkillTag key={p} skill={p} onRemove={() => set('programs', form.programs.filter((x) => x !== p))} />
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]"
              value={programInput}
              onChange={(e) => setProgramInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProgram())}
              placeholder="Add a program (press Enter)"
            />
            <Button type="button" variant="outline" onClick={addProgram}>Add</Button>
          </div>
        </div>

        <Button onClick={handleSave} loading={saving} className="w-full mt-2">Save Profile</Button>
      </div>
    </div>
  );
}
