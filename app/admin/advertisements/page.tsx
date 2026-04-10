'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Eye, EyeOff, Upload, X, ExternalLink, ImageIcon } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type AdSlot = 'home_small' | 'home_medium' | 'home_large' | 'wall_sidebar';

interface Ad {
  _id: string;
  slot: AdSlot;
  imageUrl: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
}

const SLOTS: { key: AdSlot; label: string; desc: string; max: number }[] = [
  { key: 'home_small',   label: 'Home · Small Banners',  desc: 'Below hero section',         max: 4 },
  { key: 'home_medium',  label: 'Home · Medium Banners', desc: 'After "How it works"',        max: 2 },
  { key: 'home_large',   label: 'Home · Large Banner',   desc: 'After "Who it\'s for"',       max: 1 },
  { key: 'wall_sidebar', label: 'Wall · Sidebar Ads',    desc: 'Right sidebar on wall page',  max: 5 },
];

interface UploadFormProps {
  slot: AdSlot;
  onSaved: (ad: Ad) => void;
  onClose: () => void;
}

function UploadForm({ slot, onSaved, onClose }: UploadFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (f: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setError('Only JPG, PNG or WebP allowed'); return;
    }
    if (f.size > 5 * 1024 * 1024) { setError('Max file size is 5 MB'); return; }
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSave = async () => {
    if (!file) { setError('Please select an image'); return; }
    setUploading(true);
    setError('');
    try {
      // 1. Upload image
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'uploads/ads');
      const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
      const upData = await upRes.json();
      if (!upData.success) { setError(upData.error || 'Upload failed'); setUploading(false); return; }

      // 2. Save ad record
      const adRes = await fetch('/api/admin/advertisements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, imageUrl: upData.url, linkUrl: linkUrl.trim() || undefined, order: 0 }),
      });
      const adData = await adRes.json();
      if (!adData.success) { setError(adData.error || 'Failed to save'); setUploading(false); return; }

      onSaved(adData.data);
    } catch {
      setError('Something went wrong');
    }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Upload Advertisement</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-[#0F6E56] transition-colors group"
            style={{ aspectRatio: '1200/630' }}
          >
            {preview ? (
              <>
                <Image src={preview} alt="Preview" fill className="object-cover" sizes="448px" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-medium flex items-center gap-2"><Upload className="w-4 h-4" /> Change image</span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#E8F5F1] transition-colors">
                  <ImageIcon className="w-6 h-6 group-hover:text-[#0F6E56] transition-colors" />
                </div>
                <p className="text-sm font-medium text-gray-600">Click or drag & drop</p>
                <p className="text-xs text-gray-400">JPG, PNG, WebP · max 5 MB</p>
                <p className="text-xs text-gray-400">Recommended: 1200 × 630 px</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

          {/* Link URL */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Link URL <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="relative">
              <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6E56] focus:border-transparent"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <X className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={uploading || !file}
            className="flex-1 flex items-center justify-center gap-2 bg-[#0F6E56] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#0A5A45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? <><LoadingSpinner size="sm" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Ad</>}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdvertisementsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadSlot, setUploadSlot] = useState<AdSlot | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/advertisements')
      .then((r) => r.json())
      .then((d) => { if (d.success) setAds(d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (ad: Ad) => {
    const res = await fetch(`/api/admin/advertisements/${ad._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !ad.isActive }),
    });
    const d = await res.json();
    if (d.success) setAds((prev) => prev.map((a) => (a._id === ad._id ? d.data : a)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ad?')) return;
    await fetch(`/api/admin/advertisements/${id}`, { method: 'DELETE' });
    setAds((prev) => prev.filter((a) => a._id !== id));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Advertisements</h1>
        <p className="text-gray-500 text-sm mt-1">Upload and manage ad banners shown across the platform.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]"><LoadingSpinner /></div>
      ) : (
        <div className="flex flex-col gap-10">
          {SLOTS.map(({ key, label, desc, max }) => {
            const slotAds = ads.filter((a) => a.slot === key);
            const canAdd = slotAds.length < max;

            return (
              <div key={key}>
                {/* Slot header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">{label}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{desc} · {slotAds.length}/{max} slots used</p>
                  </div>
                  {canAdd && (
                    <button
                      onClick={() => setUploadSlot(key)}
                      className="flex items-center gap-1.5 text-sm font-medium text-[#0F6E56] border border-[#0F6E56] px-3 py-1.5 rounded-xl hover:bg-[#E8F5F1] transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  )}
                </div>

                {/* Ad cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {slotAds.map((ad) => (
                    <div key={ad._id} className={`bg-white border rounded-2xl overflow-hidden transition-opacity ${ad.isActive ? 'border-gray-200' : 'border-gray-100 opacity-50'}`}>
                      <div className="relative w-full" style={{ aspectRatio: '1200/630' }}>
                        <Image src={ad.imageUrl} alt="Ad" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                      </div>
                      <div className="px-3 py-2.5 flex items-center justify-between gap-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${ad.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ad.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {ad.isActive ? 'Active' : 'Hidden'}
                          </span>
                          {ad.linkUrl && (
                            <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0F6E56] transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleToggle(ad)} title={ad.isActive ? 'Hide' : 'Show'} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                            {ad.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDelete(ad._id)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty add slot */}
                  {canAdd && slotAds.length === 0 && (
                    <button
                      onClick={() => setUploadSlot(key)}
                      className="border-2 border-dashed border-gray-200 rounded-2xl hover:border-[#0F6E56] hover:bg-[#f9fffe] transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-[#0F6E56] p-8"
                      style={{ aspectRatio: '1200/630' }}
                    >
                      <Plus className="w-6 h-6" />
                      <span className="text-sm font-medium">Upload first ad</span>
                    </button>
                  )}
                </div>

                {/* Full slot notice */}
                {!canAdd && (
                  <p className="text-xs text-gray-400 mt-2">Slot is full ({max}/{max}). Delete an existing ad to add a new one.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload modal */}
      {uploadSlot && (
        <UploadForm
          slot={uploadSlot}
          onSaved={(ad) => { setAds((prev) => [...prev, ad]); setUploadSlot(null); }}
          onClose={() => setUploadSlot(null)}
        />
      )}
    </div>
  );
}
