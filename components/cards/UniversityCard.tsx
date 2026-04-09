import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Users, BookOpen } from 'lucide-react';

interface UniversityCardUniversity {
  _id: string;
  name: string;
  slug: string;
  abbreviation?: string;
  location?: string;
  logo?: string;
  studentCount?: number;
  programs?: string[];
  verificationStatus?: string;
}

interface UniversityCardProps {
  university: UniversityCardUniversity;
  showStats?: boolean;
}

export function UniversityCard({ university, showStats = true }: UniversityCardProps) {
  const initials = (university.abbreviation || university.name).slice(0, 3).toUpperCase();
  const isVerified = university.verificationStatus === 'verified';

  return (
    <Link href={`/university/home/${university.slug}`}>
      <div className="bg-white rounded-[16px] border border-gray-200 p-5 flex flex-col items-center gap-3 hover:shadow-md transition-shadow cursor-pointer w-full">
        {/* Logo */}
        <div className="w-14 h-14 rounded-[12px] bg-[#E8F5F1] flex items-center justify-center">
          {university.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={university.logo} alt={university.name} className="w-10 h-10 object-contain" />
          ) : (
            <span className="text-[#0F6E56] font-bold text-sm">{initials}</span>
          )}
        </div>

        <div className="text-center">
          <p className="font-semibold text-gray-900 text-sm leading-snug">{university.name}</p>
          {university.location && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">{university.location}</span>
            </div>
          )}
        </div>

        {showStats && (
          <div className="flex items-center justify-center gap-4 w-full">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">{university.studentCount || 0} students</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">{(university.programs || []).length} programs</span>
            </div>
          </div>
        )}

        {isVerified && <Badge label="Verified" variant="success" />}
      </div>
    </Link>
  );
}
