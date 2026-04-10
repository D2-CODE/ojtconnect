import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PostCard } from '@/components/cards/PostCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { MapPin, Globe, Briefcase, Mail, Phone, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Company from '@/models/Company';
import OjtWall from '@/models/OjtWall';

async function getCompanyBySlug(slug: string) {
  try {
    await connectDB();
    return await Company.findOne({ slug }).lean();
  } catch {
    return null;
  }
}

async function getCompanyPosts(companyId: string) {
  try {
    await connectDB();
    return await OjtWall.find({ postedBy: companyId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();
  } catch {
    return [];
  }
}

export default async function CompanyProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Company not found</h2>
            <Link href="/companies"><Button variant="primary">Back to Companies</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const posts = await getCompanyPosts(company._id);
  const initials = company.companyName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 max-w-[1440px] mx-auto w-full px-5 lg:px-20 py-8">

        {/* Back */}
        <Link href="/companies" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Companies
        </Link>

        {/* Profile header card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Logo */}
            <div className="w-20 h-20 rounded-xl bg-[#E8F5F1] flex items-center justify-center overflow-hidden flex-shrink-0">
              {company.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logo} alt={company.companyName} className="w-full h-full object-contain p-1.5" />
              ) : (
                <span className="text-[#0F6E56] font-bold text-2xl">{initials}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{company.companyName}</h1>
                {company.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0F6E56] bg-[#E8F5F1] px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-2">
                {company.industry && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" /> {company.industry}
                  </span>
                )}
                {company.location && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> {company.location}
                  </span>
                )}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-[#0F6E56] hover:underline">
                    <Globe className="w-3.5 h-3.5" /> {company.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>

              {company.description && (
                <p className="text-sm text-gray-500 leading-relaxed mt-3 max-w-2xl">{company.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start">

          {/* Main — posts */}
          <div className="flex-1 w-full min-w-0">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Internship Posts
              <span className="ml-2 text-sm font-normal text-gray-400">({posts.length})</span>
            </h2>

            {posts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 py-16 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
                <p className="font-semibold text-gray-600">No posts yet</p>
                <p className="text-sm text-gray-400 max-w-xs">This company hasn&apos;t posted any internship listings yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post as never} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar — contact details */}
          <aside className="w-full xl:w-72 xl:flex-shrink-0">
            <div className="hidden xl:block" style={{height: '2.25rem', marginBottom: '1rem'}} />
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Contact Details</h3>
              <div className="flex flex-col gap-3">
                {company.email && (
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-[#0F6E56] flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Email</p>
                      <a href={`mailto:${company.email}`} className="text-sm text-gray-700 hover:text-[#0F6E56] break-all">{company.email}</a>
                    </div>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-[#0F6E56] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                      <span className="text-sm text-gray-700">{company.phone}</span>
                    </div>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-start gap-2.5">
                    <Globe className="w-4 h-4 text-[#0F6E56] flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Website</p>
                      <a href={company.website} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-gray-700 hover:text-[#0F6E56] break-all">
                        {company.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
                {company.location && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#0F6E56] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Location</p>
                      <span className="text-sm text-gray-700">{company.location}</span>
                    </div>
                  </div>
                )}
                {!company.email && !company.phone && !company.website && !company.location && (
                  <p className="text-sm text-gray-400">No contact details available.</p>
                )}
              </div>
            </div>
          </aside>

        </div>
      </div>

      <Footer />
    </div>
  );
}
