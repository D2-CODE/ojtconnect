import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SkillTag } from '@/components/ui/SkillTag';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Calendar } from 'lucide-react';

async function getPost(id: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/wall/${id}`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center"><h2 className="text-xl font-bold text-gray-900 mb-2">Post not found</h2><Link href="/wall"><Button variant="primary">Back to Wall</Button></Link></div>
        </div>
        <Footer />
      </div>
    );
  }

  const fb = post.SectionData?.fbleads;
  const skills = fb?.skills ? fb.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  const isIntern = fb?.lead_type === 'intern';
  const dateStr = post.createdAt?.$date || post.createdAt;
  const date = dateStr ? new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 max-w-[1440px] mx-auto w-full px-5 lg:px-20 py-8">
        <Link href="/wall" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Wall
        </Link>

        <div className="flex gap-8 items-start">
          {/* Main */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-8">
            <div className="flex items-start gap-4 mb-6">
              <Avatar name={fb?.name} src={fb?.profile_pic} size="xl" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{fb?.name || 'Anonymous'}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <Badge label={isIntern ? 'Seeking OJT' : 'Offering Internship'} variant={isIntern ? 'primary' : 'success'} />
                  {post.status === 'claimed' && <Badge label="Claimed" variant="success" />}
                  {date && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" /> {date}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {skills.map((skill: string) => <SkillTag key={skill} skill={skill} />)}
              </div>
            )}

            <div className="prose prose-sm max-w-none text-gray-700">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Post Details</h3>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-600">{fb?.post_text}</pre>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-72 flex-shrink-0 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
              {fb?.emails && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Mail className="w-4 h-4 text-[#0F6E56]" />
                  <a href={`mailto:${fb.emails}`} className="hover:text-[#0F6E56] break-all">{fb.emails}</a>
                </div>
              )}
              {fb?.phones && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-[#0F6E56]" />
                  <span>{fb.phones}</span>
                </div>
              )}
              {!fb?.emails && !fb?.phones && <p className="text-sm text-gray-400">No contact info available.</p>}
            </div>

            {post.status !== 'claimed' && (
              <div className="bg-[#E8F5F1] rounded-2xl p-5">
                <h3 className="font-semibold text-[#0F6E56] mb-2">Is this your post?</h3>
                <p className="text-sm text-gray-600 mb-4">If you posted this on Facebook, you can claim it and manage your listing here.</p>
                <Link href={`/register`}><Button variant="primary" className="w-full">Claim This Post</Button></Link>
              </div>
            )}
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
