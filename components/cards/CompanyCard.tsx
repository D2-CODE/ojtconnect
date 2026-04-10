import Link from 'next/link';
import { MapPin, Briefcase, Globe, CheckCircle2 } from 'lucide-react';

interface CompanyCardProps {
  company: {
    _id: string;
    companyName: string;
    slug: string;
    industry?: string;
    location?: string;
    logo?: string;
    description?: string;
    website?: string;
    isVerified: boolean;
  };
}

export function CompanyCard({ company }: CompanyCardProps) {
  const initials = company.companyName.slice(0, 2).toUpperCase();

  return (
    <Link href={`/companies/${company.slug}`} className="block h-full">
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col items-center text-center gap-3 hover:shadow-md hover:border-gray-300 transition-all h-full">

        {/* Logo */}
        <div className="w-16 h-16 rounded-xl bg-[#E8F5F1] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {company.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logo} alt={company.companyName} className="w-full h-full object-contain " />
          ) : (
            <span className="text-[#0F6E56] font-bold text-base">{initials}</span>
          )}
        </div>

        {/* Name */}
        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 w-full">
          {company.companyName}
        </p>

        {/* Meta — always takes same space */}
        <div className="flex flex-col items-center gap-1 w-full flex-1">
          {company.industry && (
            <div className="flex items-center justify-center gap-1">
              <Briefcase className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400 truncate max-w-[160px]">{company.industry}</span>
            </div>
          )}
          {company.location && (
            <div className="flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400 truncate max-w-[160px]">{company.location}</span>
            </div>
          )}
          {company.website && (
            <div className="flex items-center justify-center gap-1">
              <Globe className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400 truncate max-w-[160px]">{company.website.replace(/^https?:\/\//, '')}</span>
            </div>
          )}
        </div>

        {/* Footer — always at bottom */}
        {/* <div className="mt-auto pt-3 border-t border-gray-100 w-full flex items-center justify-center">
          {company.isVerified ? (
            <span className="flex items-center gap-1 text-xs font-medium text-[#0F6E56]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          ) : (
            <span className="text-xs text-gray-300">Not verified</span>
          )}
        </div> */}
      </div>
    </Link>
  );
}
