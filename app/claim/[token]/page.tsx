'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ClaimData {
  postId: string;
  postName: string;
  email: string;
  postText: string;
}

export default function ClaimPage() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'valid' | 'invalid' | 'success' | 'error'>('loading');
  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    fetch(`/api/claim/${token}${query}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) { setClaimData(d.data); setState('valid'); }
        else setState('invalid');
      })
      .catch(() => setState('invalid'));
  }, [token, email]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const query = email ? `?email=${encodeURIComponent(email)}` : '';
      const res = await fetch(`/api/claim/${token}${query}`, { method: 'POST' });
      const d = await res.json();
      if (d.success) {
        const url = d.data?.autoLoginUrl;
        if (url) {
          window.location.href = url;
        } else {
          router.push('/company/dashboard');
        }
      } else {
        setState('error');
      }
    } finally {
      setClaiming(false);
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

          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-500">Validating your claim link…</p>
            </div>
          )}

          {state === 'invalid' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Link expired or invalid</h2>
              <p className="text-gray-500 text-sm mb-6">This claim link is no longer valid. It may have already been used or has expired.</p>
              <Link href="/wall"><Button variant="primary">Back to Wall</Button></Link>
            </div>
          )}

          {state === 'valid' && claimData && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Claim your post</h1>
              <p className="text-gray-500 text-sm mb-6">
                You&apos;re about to claim the post from <strong>{claimData.postName}</strong>. This will link it to your OJT Connect PH account.
              </p>
              {claimData.email && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-gray-600">
                  <span className="font-medium">Email on post:</span> {claimData.email}
                </div>
              )}
              {claimData.postText && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600 line-clamp-3">
                  {claimData.postText}
                </div>
              )}
              <Button onClick={handleClaim} loading={claiming} className="w-full">Confirm Claim</Button>
            </>
          )}

          {state === 'success' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-[#E8F5F1] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-[#0F6E56]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Post claimed!</h2>
              <p className="text-gray-500 text-sm mb-6">Your post has been successfully linked to your account.</p>
              <Button onClick={() => router.push('/student/dashboard')} className="w-full">Go to Dashboard</Button>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
              <p className="text-gray-500 text-sm mb-6">We couldn&apos;t complete your claim. Please try again later.</p>
              <Link href="/wall"><Button variant="outline">Back to Wall</Button></Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
