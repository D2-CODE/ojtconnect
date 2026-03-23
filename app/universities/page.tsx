import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { UniversityCard } from '@/components/cards/UniversityCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { University } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import UniversityModel from '@/models/University';

async function getUniversities() {
  try {
    await connectDB();
    return await UniversityModel
      .find({ verificationStatus: 'verified', isActive: true })
      .sort({ studentCount: -1, name: 1 })
      .lean();
  } catch {
    return [];
  }
}

export default async function UniversitiesPage() {
  const universities = await getUniversities();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 max-w-[1440px] mx-auto w-full px-5 lg:px-20 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Partner Universities</h1>
          <p className="text-gray-500 mt-1">
            Verified institutions that trust OJT Connect PH — {universities.length} universities
          </p>
        </div>

        {universities.length === 0 ? (
          <EmptyState title="No universities yet" description="Verified universities will appear here." icon={University} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {universities.map((uni) => (
              <UniversityCard key={uni._id} university={uni as never} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
