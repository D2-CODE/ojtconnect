'use client';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'neutral' | 'primary';
}

const variantClasses = {
  success: 'bg-[#E8F5F1] text-[#0F6E56]',
  warning: 'bg-yellow-50 text-yellow-700',
  error: 'bg-red-50 text-red-600',
  neutral: 'bg-gray-100 text-gray-600',
  primary: 'bg-[#E8F5F1] text-[#0F6E56]',
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${variantClasses[variant]}`}>
      {label}
    </span>
  );
}

export function getVerificationBadge(status: string) {
  if (status === 'verified') return <Badge label="Verified" variant="success" />;
  if (status === 'pending') return <Badge label="Pending" variant="warning" />;
  if (status === 'rejected') return <Badge label="Rejected" variant="error" />;
  return <Badge label="Unverified" variant="neutral" />;
}

export function getLeadTypeBadge(type: string) {
  if (type === 'intern') return <Badge label="Looking for OJT" variant="primary" />;
  return <Badge label="Accepting OJT Applicants" variant="success" />;
}
