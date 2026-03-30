import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { UniversityCard } from '@/components/cards/UniversityCard';
import { GraduationCap, Building2, University, ArrowRight, Search, CheckCircle, Users, Briefcase } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import UniversityModel from '@/models/University';

async function getFeaturedUniversities() {
  try {
    await connectDB();
    return await UniversityModel
      .find({ verificationStatus: 'verified', isActive: true })
      .sort({ studentCount: -1, createdAt: -1 })
      .limit(3)
      .lean();
  } catch {
    return [];
  }
}

const STEPS = [
  { icon: GraduationCap, title: 'Create your account', desc: 'Sign up as a student, company, or university admin for free.' },
  { icon: Search, title: 'Browse opportunities', desc: 'Explore real internship leads scraped from Facebook groups.' },
  { icon: CheckCircle, title: 'Verify your profile', desc: 'Get verified through your university for trusted connections.' },
  { icon: Briefcase, title: 'Connect & apply', desc: 'Reach out directly to companies and land your OJT.' },
];

const STATS = [
  { value: '2,500+', label: 'Active Interns' },
  { value: '850+', label: 'Companies' },
  { value: '120+', label: 'Universities' },
  { value: '100%', label: 'Free' },
];

export default async function HomePage() {
  const featuredUniversities = await getFeaturedUniversities();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#F0FAF6] to-white pt-20 pb-24 px-5">
        <div className="max-w-[1440px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#E8F5F1] text-[#0F6E56] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F6E56]" />
            Free for students and universities
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Find your  Interns.<br />
            <span className="text-[#0F6E56]">Connect with companies.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            OJT Connect PH is the free platform linking Filipino students with verified internship opportunities across the Philippines.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center gap-2 bg-[#0F6E56] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#0A5A45] transition-colors">
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/wall" className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors">
              Browse Internship Wall
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-100 bg-white py-8 px-5">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-extrabold text-[#0F6E56]">{value}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Four simple steps to land your internship through OJT Connect PH.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#E8F5F1] flex items-center justify-center mb-4 relative">
                  <Icon className="w-7 h-7 text-[#0F6E56]" />
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#0F6E56] text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 px-5 bg-gray-50">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Built for everyone in the OJT ecosystem</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Whether you&apos;re a student, company, or university, OJT Connect PH has you covered.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: GraduationCap, title: 'Students', color: 'bg-blue-50 text-blue-600', desc: 'Browse real leads, claim your Facebook post, get university-verified, and connect with companies directly.', cta: 'Sign up as student', href: '/register' },
              { icon: Building2, title: 'Companies', color: 'bg-[#E8F5F1] text-[#0F6E56]', desc: 'Post internship opportunities, discover qualified candidates, and manage applications in one place.', cta: 'Join as company', href: '/register' },
              { icon: University, title: 'Universities', color: 'bg-purple-50 text-purple-600', desc: 'Verify your students, track their OJT placements, and maintain your institution&apos;s reputation.', cta: 'Register university', href: '/register' },
            ].map(({ icon: Icon, title, color, desc, cta, href }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-200 p-8">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-5`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">{desc}</p>
                <Link href={href} className="text-sm font-semibold text-[#0F6E56] hover:underline inline-flex items-center gap-1">
                  {cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Universities */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Partner Universities</h2>
              <p className="text-gray-500">Verified institutions that trust OJT Connect PH.</p>
            </div>
            <Link href="/universities" className="text-sm font-semibold text-[#0F6E56] hover:underline hidden sm:block">View all →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredUniversities.map((uni) => (
              <UniversityCard key={uni._id} university={uni as never} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5" style={{ background: 'linear-gradient(180deg, #0F6E56 0%, #0A5A45 100%)' }}>
        <div className="max-w-[1440px] mx-auto text-center text-white">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Ready to find your Interns?</h2>
          <p className="text-white/70 text-lg max-w-xl mx-auto mb-10">Join thousands of Filipino students already using OJT Connect PH. It&apos;s completely free.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-[#0F6E56] font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors">
              Create free account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/wall" className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors">
              Browse Internship Wall
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
