'use client';
import { useEffect, useState } from 'react';
import { Mail, Phone, Globe, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const DAILY_LIMIT = 5;

interface Props {
  postId: string;
  email?: string;
  phone?: string;
  website?: string;
  isCompany: boolean;
  isStudent: boolean;
  isLoggedIn: boolean;
  isAdmin?: boolean;
}

export function ContactUnlockWidget({ postId, email, phone, website, isCompany, isStudent, isLoggedIn, isAdmin }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [resetAt, setResetAt] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState('');

  const hasContact = !!(email || phone || website);

  // Fetch real remaining count from server on mount
  useEffect(() => {
    if (!isCompany || isAdmin || !isLoggedIn) return;
    fetch(`/api/wall/${postId}/unlock`)
      .then((r) => r.json())
      .then((d) => {
        if (d.requiresLogin) return;
        setUnlocked(d.unlocked ?? false);
        setRemaining(d.remaining ?? 0);
        setResetAt(d.resetAt ?? null);
      })
      .catch(() => setRemaining(0));
  }, [postId, isCompany, isAdmin, isLoggedIn]);

  const handleUnlock = async () => {
    setUnlocking(true);
    setError('');
    const res = await fetch(`/api/wall/${postId}/unlock`, { method: 'POST' });
    const d = await res.json();
    if (d.success) {
      setUnlocked(true);
      setRemaining(typeof d.remaining === 'number' ? d.remaining : Math.max(0, (remaining ?? DAILY_LIMIT) - 1));
      window.dispatchEvent(new CustomEvent('contact-unlocked', { detail: { postId } }));
    } else {
      setError(d.error || 'Failed to unlock');
      if (d.resetAt) setResetAt(d.resetAt);
      setRemaining(typeof d.remaining === 'number' ? d.remaining : 0);
    }
    setUnlocking(false);
  };

  if (!hasContact) return <p className="text-sm text-gray-500">No contact details available.</p>;

  // Super admin — show everything immediately
  if (isAdmin) return (
    <div className="flex flex-col gap-2">
      {email && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4 text-[#0F6E56]" />
          <a href={`mailto:${email}`} className="hover:text-[#0F6E56] break-all">{email}</a>
        </div>
      )}
      {phone && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4 text-[#0F6E56]" />
          <span>{phone}</span>
        </div>
      )}
      {website && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Globe className="w-4 h-4 text-[#0F6E56]" />
          <a href={website} target="_blank" rel="noopener noreferrer" className="hover:text-[#0F6E56] break-all">{website}</a>
        </div>
      )}
      <p className="text-xs text-[#0F6E56] mt-1 flex items-center gap-1"><Unlock className="w-3 h-3" /> Admin Access</p>
    </div>
  );

  if (!isLoggedIn) return (
    <div className="text-center py-2">
      <Lock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
      <p className="text-sm text-gray-500 mb-3">Sign in to view contact details.</p>
      <Link href="/login"><Button variant="primary" className="w-full">Sign In</Button></Link>
    </div>
  );

  // Student — show contact freely (no unlock needed)
  if (isStudent) return (
    <div className="flex flex-col gap-2">
      {email && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4 text-[#0F6E56]" />
          <a href={`mailto:${email}`} className="hover:text-[#0F6E56] break-all">{email}</a>
        </div>
      )}
      {phone && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4 text-[#0F6E56]" />
          <span>{phone}</span>
        </div>
      )}
      {website && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Globe className="w-4 h-4 text-[#0F6E56]" />
          <a href={website} target="_blank" rel="noopener noreferrer" className="hover:text-[#0F6E56] break-all">{website}</a>
        </div>
      )}
    </div>
  );

  if (!isCompany) return (
    <div className="text-center py-2">
      <Lock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
      <p className="text-xs text-gray-500">Only companies can unlock contact details.</p>
    </div>
  );

  // Unlocked — show clearly
  if (unlocked) return (
    <div className="flex flex-col gap-2">
      {email && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4 text-[#0F6E56]" />
          <a href={`mailto:${email}`} className="hover:text-[#0F6E56] break-all">{email}</a>
        </div>
      )}
      {phone && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4 text-[#0F6E56]" />
          <span>{phone}</span>
        </div>
      )}
      {website && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Globe className="w-4 h-4 text-[#0F6E56]" />
          <a href={website} target="_blank" rel="noopener noreferrer" className="hover:text-[#0F6E56] break-all">{website}</a>
        </div>
      )}
      <p className="text-xs text-[#0F6E56] mt-1 flex items-center gap-1"><Unlock className="w-3 h-3" /> Unlocked</p>
    </div>
  );

  // Locked — show blurred preview + unlock button
  return (
    <div>
      <div className="flex flex-col gap-2 mb-4 pointer-events-none select-none">
        {email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-[#0F6E56] flex-shrink-0" />
            <span className="blur-sm">{email}</span>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-[#0F6E56] flex-shrink-0" />
            <span className="blur-sm">{phone}</span>
          </div>
        )}
        {website && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Globe className="w-4 h-4 text-[#0F6E56] flex-shrink-0" />
            <span className="blur-sm">{website}</span>
          </div>
        )}
      </div>

      {remaining === null ? (
        <Button variant="primary" className="w-full" disabled>
          <Unlock className="w-4 h-4 mr-1.5" /> Loading...
        </Button>
      ) : remaining > 0 ? (
        <Button variant="primary" className="w-full" onClick={handleUnlock} loading={unlocking}>
          <Unlock className="w-4 h-4 mr-1.5" /> Unlock Contact ({remaining} left today)
        </Button>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <Lock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xs font-medium text-amber-800">Daily limit reached ({DAILY_LIMIT}/{DAILY_LIMIT})</p>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
    </div>
  );
}
