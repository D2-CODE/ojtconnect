import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { StudentCard } from '@/components/cards/StudentCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft, MapPin, Globe, Users, BookOpen } from 'lucide-react';

async function getUniversity(slug: string) {
  try {
    const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/universities?slug=${slug}`, { cache: 'no-store' });
    const d = await res.json();
    return d.success && d.data.length > 0 ? d.data[0] : null;
  } catch { return null; }
}

async function getStudents(universityId: string) {
  try {
    const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/students?universityId=${universityId}&verificationStatus=verified`, { cache: 'no-store' });
    const d = await res.json();
    return d.success ? d.data : [];
  } catch { return []; }
}

export default async function UniversityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const university = await getUniversity(slug);

  if (!university) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">University not found</h2>
            <Link href="/wall"><Button variant="primary">Back to Wall</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const students = await getStudents(university._id);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 max-w-[1440px] mx-auto w-full px-5 lg:px-20 py-8">
        <Link href="/wall" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <div className="flex items-start gap-5">
            <Avatar name={university.name} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{university.name}</h1>
                <Badge label={university.verificationStatus === 'verified' ? 'Verified' : 'Pending'} variant={university.verificationStatus === 'verified' ? 'success' : 'warning'} />
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {university.location && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {university.location}</span>
                )}
                {university.website && (
                  <a href={university.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#0F6E56]">
                    <Globe className="w-3.5 h-3.5" /> {university.website}
                  </a>
                )}
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {students.length} students</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {university.programs?.length || 0} programs</span>
              </div>
            </div>
          </div>

          {university.programs?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Programs Offered</h3>
              <div className="flex flex-wrap gap-2">
                {university.programs.map((p: string) => (
                  <span key={p} className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Students */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Verified Students ({students.length})</h2>
          {students.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-gray-400">No verified students yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {students.map((student: Record<string, unknown>) => (
                <StudentCard key={student._id as string} student={student as never} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
