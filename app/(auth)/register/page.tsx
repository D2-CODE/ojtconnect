'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { GraduationCap, Building2, University, ArrowLeft } from 'lucide-react';

type ProfileType = 'student' | 'company' | 'university';

const ACCOUNT_TYPES = [
  { type: 'student' as ProfileType, icon: GraduationCap, title: 'Student', desc: 'Seeking OJT or internship' },
  { type: 'company' as ProfileType, icon: Building2, title: 'Company', desc: 'Offering internship positions' },
  { type: 'university' as ProfileType, icon: University, title: 'University', desc: 'Verify and manage students' },
];

const YEAR_OPTIONS = [1, 2, 3, 4, 5].map((y) => ({ value: String(y), label: `${y}${y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year` }));
const INDUSTRY_OPTIONS = ['Information Technology', 'Business Process Outsourcing', 'Manufacturing', 'Finance & Banking', 'Healthcare', 'Education', 'Real Estate', 'Retail', 'Others'].map((i) => ({ value: i, label: i }));

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [profileType, setProfileType] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', course: '', yearLevel: '4', companyName: '', universityName: '', industry: '', location: '', website: '', universityId: '' });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, profileType }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Registration failed.'); return; }
      const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (result?.error) { router.push('/login'); return; }
      router.push(profileType === 'student' ? '/student/dashboard' : profileType === 'company' ? '/company/dashboard' : '/university-admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left */}
      <div className="hidden lg:flex flex-col justify-center px-16 w-1/2 text-white" style={{ background: 'linear-gradient(180deg, #0F6E56 0%, #0A5A45 100%)' }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-white" /></div>
          <span className="font-bold text-xl">OJT Connect PH</span>
        </div>
        <h2 className="text-4xl font-bold mb-4">Join the community</h2>
        <p className="text-white/70 text-lg mb-8">Create your free account and start connecting with internship opportunities today.</p>
        <div className="space-y-4">
          {['Free for students and universities', 'Verified university credentials', 'Direct email connections', 'Scraped from Facebook groups'].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <span className="text-white/80 text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-20 bg-white overflow-y-auto py-8">
        <div className="w-full max-w-md">
          {step === 1 ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
              <p className="text-gray-500 mb-8">Choose your account type to get started</p>
              <div className="grid grid-cols-1 gap-3">
                {ACCOUNT_TYPES.map(({ type, icon: Icon, title, desc }) => (
                  <button key={type} onClick={() => { setProfileType(type); setStep(2); }}
                    className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#0F6E56] hover:bg-[#F0FAF6] transition-all text-left">
                    <div className="w-10 h-10 rounded-lg bg-[#E8F5F1] flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 text-[#0F6E56]" /></div>
                    <div><p className="font-semibold text-gray-900">{title}</p><p className="text-sm text-gray-500">{desc}</p></div>
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 mt-6">Already have an account? <Link href="/login" className="text-[#0F6E56] font-medium hover:underline">Sign in</Link></p>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"><ArrowLeft className="w-4 h-4" /> Back</button>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {profileType === 'student' ? 'Student Registration' : profileType === 'company' ? 'Company Registration' : 'University Registration'}
              </h1>
              <p className="text-gray-500 mb-6 text-sm">Fill in your details to create your account</p>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <Input label="Full Name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Juan Dela Cruz" required />
                <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" required />
                <Input label="Password" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min. 8 characters" required />
                <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} placeholder="Repeat password" required />

                {profileType === 'student' && (
                  <>
                    <Input label="Course / Program" value={form.course} onChange={(e) => set('course', e.target.value)} placeholder="BS Computer Science" required />
                    <Select label="Year Level" value={form.yearLevel} onChange={(e) => set('yearLevel', e.target.value)} options={YEAR_OPTIONS} required />
                  </>
                )}
                {profileType === 'company' && (
                  <>
                    <Input label="Company Name" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="TechCorp Philippines Inc." required />
                    <Select label="Industry" value={form.industry} onChange={(e) => set('industry', e.target.value)} options={INDUSTRY_OPTIONS} placeholder="Select industry" required />
                    <Input label="Location" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Makati City, Metro Manila" />
                  </>
                )}
                {profileType === 'university' && (
                  <>
                    <Input label="University Name" value={form.universityName} onChange={(e) => set('universityName', e.target.value)} placeholder="University of the Philippines" required />
                    <Input label="Location" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Quezon City, Metro Manila" />
                    <Input label="Website" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://university.edu.ph" />
                  </>
                )}

                <Button type="submit" loading={loading} className="w-full mt-2">Create Account</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
