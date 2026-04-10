import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CompanyCard } from '@/components/cards/CompanyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Building2 } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Company from '@/models/Company';

async function getCompanies() {
  try {
    await connectDB();
    return await Company.find({ isVisible: true, userId: { $exists: true, $ne: '' } })
      .sort({ createdAt: -1 })
      .lean();
  } catch {
    return [];
  }
}

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 max-w-[1440px] mx-auto w-full px-5 lg:px-20 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-500 mt-1">
            Browse companies offering internship opportunities — {companies.length} companies
          </p>
        </div>

        {companies.length === 0 ? (
          <EmptyState title="No companies yet" description="Companies will appear here once they register." icon={Building2} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
            {companies.map((company) => (
              <CompanyCard key={company._id} company={company as never} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
