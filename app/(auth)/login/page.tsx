'use client';
import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doSignIn = async (email: string, password: string) => {
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) { setError('Invalid email or password.'); return; }
      router.push('/student/dashboard');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const email = searchParams.get('email');
    const password = searchParams.get('password');
    if (email && password) {
      setForm({ email, password });
      doSignIn(email, password);
    } else if (email) {
      setForm((f) => ({ ...f, email }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    doSignIn(form.email, form.password);
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-500">Sign in to your OJT Connect PH account</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
        <div className="relative">
          <Input label="Password" type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-[#0F6E56] hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" loading={loading} className="w-full mt-2">Sign In</Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[#0F6E56] font-medium hover:underline">Create one free</Link>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-xs text-center text-gray-400 mb-3">Demo credentials</p>
        <div className="flex gap-2 text-xs">
          {[['Student', 'juan@student.ph', 'Test@123'], ['Company', 'hr@techcorp.ph', 'Test@123'], ['University', 'upd@ojtconnect.ph', 'Test@123']].map(([role, email, pass]) => (
            <button key={role} type="button" onClick={() => setForm({ email, password: pass })}
              className="flex-1 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors">
              <span className="font-medium text-gray-700">{role}</span><br />
              <span className="text-gray-400 text-[10px]">{email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center px-16 w-1/2 text-white" style={{ background: 'linear-gradient(180deg, #0F6E56 0%, #0A5A45 100%)' }}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl">OJT Connect PH</span>
        </div>
        <h2 className="text-4xl font-bold mb-4 leading-tight">Connect. Learn.<br />Grow.</h2>
        <p className="text-white/70 text-lg leading-relaxed mb-10">The free platform connecting Filipino students with internship opportunities across the Philippines.</p>
        <div className="grid grid-cols-2 gap-4">
          {[['2,500+', 'Active Interns'], ['850+', 'Companies'], ['120+', 'Universities'], ['100%', 'Free']].map(([v, l]) => (
            <div key={l} className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold">{v}</div>
              <div className="text-white/70 text-sm">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-20 bg-white">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
