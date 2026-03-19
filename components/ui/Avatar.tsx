'use client';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = { sm: 32, md: 40, lg: 48, xl: 56 };
const textSizeMap = { sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-lg' };

function getInitials(name?: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const px = sizeMap[size];
  return (
    <div
      style={{ width: px, height: px }}
      className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || 'avatar'} className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full flex items-center justify-center bg-[#0F6E56] text-white font-semibold ${textSizeMap[size]}`}>
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
