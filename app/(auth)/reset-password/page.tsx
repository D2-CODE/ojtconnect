'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const router = useRouter();

  const [state, setState] = useState<'validating' | 'valid' | 'invalid' | 'success'>('validating');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    fetch(`/api/auth/reset-password?token=${token}`)
      .then((r) => r.json())
      .then((d) => setState(d.success ? 'valid' : 'invalid'))
      .catch(() => setState('invalid'));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json();
      if (d.success) setState('success');
      else setError(d.error ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[#0F6E56] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">OJT Connect PH</span>
          </div>

          {state === 'validating' && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 text-[#0F6E56] animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Validating your reset link…</p>
            </div>
          )}

          {state === 'invalid' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Link expired or invalid</h2>
              <p className="text-gray-500 text-sm mb-6">This reset link is no longer valid. Please request a new one.</p>
              <Link href="/forgot-password"><Button variant="primary" className="w-full">Request New Link</Button></Link>
            </div>
          )}

          {state === 'valid' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Set new password</h1>
              <p className="text-gray-500 text-sm mb-6">Choose a strong password for your account.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" loading={loading} className="w-full">Reset Password</Button>
              </form>
            </>
          )}

          {state === 'success' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-[#E8F5F1] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-[#0F6E56]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password reset!</h2>
              <p className="text-gray-500 text-sm mb-6">Your password has been updated. You can now sign in.</p>
              <Button onClick={() => router.push('/login')} className="w-full">Go to Sign In</Button>
            </div>
          )}

          {state !== 'success' && (
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
