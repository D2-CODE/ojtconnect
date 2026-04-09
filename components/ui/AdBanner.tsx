import Image from 'next/image';
import type { IAdvertisement } from '@/models/Advertisement';

interface Props {
  ad: IAdvertisement;
  sizes?: string;
}

export function AdBanner({ ad, sizes = '100vw' }: Props) {
  const inner = (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: '1200/630' }}>
      <Image
        src={ad.imageUrl}
        alt="Advertisement"
        fill
        className="object-cover"
        sizes={sizes}
      />
    </div>
  );

  if (ad.linkUrl) {
    return (
      <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }

  return inner;
}
