'use client';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Building2, Camera, X } from 'lucide-react';

const INDUSTRY_OPTIONS = ['Information Technology', 'Business Process Outsourcing', 'Manufacturing', 'Finance & Banking', 'Healthcare', 'Education', 'Real Estate', 'Retail', 'Others'].map((i) => ({ value: i, label: i }));

interface CompanyProfile {
  companyName: string;
  industry: string;
  location: string;
  website: string;
  description: string;
  contactEmail: string;
  phone: string;
  logo: string;
}

export default function CompanyProfilePage() {
  const { toast: showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<CompanyProfile>({
    companyName: '', industry: '', location: '', website: '',
    description: '', contactEmail: '', phone: '', logo: '',
  });

  useEffect(() => {
    fetch('/api/profile').then((r) => r.json()).then((d) => {
      if (d.success && d.data) {
        setForm({
          companyName: d.data.companyName || '',
          industry: d.data.industry || '',
          location: d.data.location || '',
          website: d.data.website || '',
          description: d.data.description || '',
          contactEmail: d.data.contactEmail || d.data.email || '',
          phone: d.data.phone || '',
          logo: d.data.logo || '',
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation before upload
    if (file.size > 200 * 1024) {
      showToast('Image must be under 200 KB', 'error');
      e.target.value = '';
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      showToast('Only JPG, PNG, WebP or SVG allowed', 'error');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (d.success) {
        set('logo', d.url);
        showToast('Logo uploaded', 'success');
      } else {
        showToast(d.error || 'Upload failed', 'error');
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Update your company information to attract the right interns.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">

        {/* Logo upload */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Company Logo</label>
          <div className="flex items-center gap-4">
            {/* Avatar / preview */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                {form.logo ? (
                  <img src={form.logo} alt="Company logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-8 h-8 text-gray-300" />
                )}
              </div>
              {/* Camera overlay button */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#0F6E56] border-2 border-white flex items-center justify-center hover:bg-[#0A5A45] transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            </div>

            {/* Info + actions */}
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-sm font-medium text-[#0F6E56] hover:text-[#0A5A45] disabled:text-gray-400 text-left transition-colors"
              >
                {uploading ? 'Uploading…' : form.logo ? 'Change logo' : 'Upload logo'}
              </button>
              <p className="text-xs text-gray-400">JPG, PNG, WebP or SVG · Max 200 KB</p>
              {form.logo && (
                <button
                  type="button"
                  onClick={() => set('logo', '')}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors w-fit"
                >
                  <X className="w-3 h-3" /> Remove logo
                </button>
              )}
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>

        <hr className="border-gray-100" />

        <Input label="Company Name" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="TechCorp Philippines Inc." />
        <Select label="Industry" value={form.industry} onChange={(e) => set('industry', e.target.value)} options={INDUSTRY_OPTIONS} placeholder="Select industry" />
        <Input label="Location" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Makati City, Metro Manila" />
        <Input label="Website" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://company.com" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">About the Company</label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56] resize-none"
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Brief company description..."
          />
        </div>
        <Input label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="hr@company.com" />
        <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+63 2 8XXX XXXX" />

        <Button onClick={handleSave} loading={saving} className="w-full mt-2">Save Profile</Button>
      </div>
    </div>
  );
}
