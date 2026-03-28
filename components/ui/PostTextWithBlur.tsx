'use client';
import { useEffect, useState } from 'react';

// Matches emails and phone numbers in text
const SENSITIVE_REGEX = /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}|(\+?63|0)[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{4})/g;

function hasSensitive(text: string) {
  return SENSITIVE_REGEX.test(text);
}

function renderText(text: string, blur: boolean) {
  if (!blur) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(SENSITIVE_REGEX.source, 'g');

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <span key={match.index} className="blur-sm select-none pointer-events-none bg-gray-100 rounded px-0.5">
        {match[0]}
      </span>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

interface Props {
  postId: string;
  text: string;
  isCompany: boolean;
  isLoggedIn: boolean;
}

export function PostTextWithBlur({ postId, text, isCompany, isLoggedIn }: Props) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!isCompany || !hasSensitive(text)) return;
    fetch(`/api/wall/${postId}/unlock`)
      .then((r) => r.json())
      .then((d) => setUnlocked(d.unlocked ?? false));

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.postId === postId) setUnlocked(true);
    };
    window.addEventListener('contact-unlocked', handler);
    return () => window.removeEventListener('contact-unlocked', handler);
  }, [postId, isCompany, text]);

  // Non-company logged in users or not logged in — always blur sensitive
  const shouldBlur = !isCompany ? true : !unlocked;

  return (
    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-600">
      {renderText(text, shouldBlur)}
    </pre>
  );
}
