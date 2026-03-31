import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SkillTag } from '@/components/ui/SkillTag';
import { Button } from '@/components/ui/Button';
import { ContactUnlockWidget } from '@/components/ui/ContactUnlockWidget';
import { PostTextWithBlur } from '@/components/ui/PostTextWithBlur';
import Link from 'next/link';
import { ArrowLeft, Calendar, Building2, MapPin, Users, Banknote, Clock, AlarmClock } from 'lucide-react';

import connectDB from '@/lib/mongodb';
import OjtWall from '@/models/OjtWall';
import Company from '@/models/Company';
import Student from '@/models/Student';
import { auth } from '@/lib/auth';
import mongoose, { Schema, Model } from 'mongoose';

interface IContactUnlock { _id: string; companyProfileId: string; postId: string; }
const ContactUnlockSchema = new Schema<IContactUnlock>({ _id: { type: String }, companyProfileId: { type: String }, postId: { type: String } }, { _id: false });
const ContactUnlock: Model<IContactUnlock> =
  (mongoose.models.ContactUnlock as Model<IContactUnlock>) ||
  mongoose.model<IContactUnlock>('ContactUnlock', ContactUnlockSchema);

async function getPost(id: string) {
  try {
    await connectDB();
    const post = await OjtWall.findById(id).lean();
    if (!post) return null;

    let contact: { email?: string; phone?: string; website?: string } | null = null;
    if ((post.source === 'company' || post.source === 'student') && post.postedBy) {
      if (post.source === 'company') {
        const company = await Company.findById(post.postedBy).lean<{ email?: string; phone?: string; website?: string }>();
        if (company) contact = { email: company.email, phone: company.phone, website: company.website };
      } else {
        const student = await Student.findById(post.postedBy).lean<{ contactEmail?: string; linkedinUrl?: string; portfolioUrl?: string }>();
        if (student) contact = { email: student.contactEmail, website: student.linkedinUrl || student.portfolioUrl };
      }
    }
    return { ...post, contact };
  } catch { return null; }
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  const session = await auth();

  // Check if current company has unlocked this post's contact
  let isUnlocked = false;
  if (session?.user?.roleName === 'company' && session.user.profileRef) {
    await connectDB();
    const unlock = await ContactUnlock.findOne({
      companyProfileId: session.user.profileRef,
      postId: id,
    }).lean();
    isUnlocked = !!unlock;
  }

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
  const isNativePost = (post.source === 'company' || post.source === 'student') && !fb?.fb_id;
  const skills = isNativePost
    ? (post.skills || [])
    : (fb?.skills ? fb.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
  const isIntern = isNativePost ? post.source === 'student' : fb?.lead_type === 'intern';
  const displayName = isNativePost ? post.postedByName : fb?.name;
  const postText = isNativePost ? post.description : fb?.post_text;
  const dateStr = post.createdAt instanceof Date ? post.createdAt.toISOString() : String(post.createdAt ?? '');
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
              <Avatar name={displayName} src={!isNativePost ? fb?.profile_pic : undefined} size="xl" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {isNativePost
                    ? (post.title || displayName)
                    : (isUnlocked && (fb?.post_link || fb?.fb_id))
                      ? <a href={fb?.post_link || `https://www.facebook.com/${fb?.fb_id}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#0F6E56] hover:underline">{displayName || 'Anonymous'}</a>
                      : (displayName || 'Anonymous')
                  }
                </h1>
                {isNativePost && post.title && <p className="text-gray-500 text-sm mt-0.5">{displayName}</p>}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <Badge label={isIntern ? 'Student Post' : 'Company Post'} variant={isIntern ? 'primary' : 'success'} />
                  {isNativePost && <Badge label="Direct Post" variant="success" />}
                  {isNativePost && isIntern && (post as {isStudentVerified?: boolean}).isStudentVerified && (
                    <Badge label="School Verified" variant="primary" />
                  )}
                  {!isNativePost && post.status === 'claimed' && <Badge label="Claimed" variant="success" />}
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

            {isNativePost && (
              <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
                {post.setup && <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" /><strong>Setup:</strong> {post.setup}</span>}
                {post.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" /><strong>Location:</strong> {post.location}</span>}
                {post.slots && <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-400" /><strong>Slots:</strong> {post.slots}</span>}
                {post.allowance && <span className="flex items-center gap-1.5"><Banknote className="w-4 h-4 text-gray-400" /><strong>Allowance:</strong> {post.allowance}</span>}
                {post.hoursRequired && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" /><strong>Hours:</strong> {post.hoursRequired}</span>}
                {post.deadline && <span className="flex items-center gap-1.5"><AlarmClock className="w-4 h-4 text-gray-400" /><strong>Deadline:</strong> {new Date(post.deadline).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
              </div>
            )}

            <div className="prose prose-sm max-w-none text-gray-700">
              <h3 className="text-base font-semibold text-gray-900 mb-3">{isNativePost ? 'Details' : 'Post Details'}</h3>
              <PostTextWithBlur
                postId={id}
                text={postText as string || ''}
                isCompany={session?.user?.roleName === 'company'}
                isLoggedIn={!!session?.user}
              />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-72 flex-shrink-0 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Contact Information</h3>
              </div>
              <ContactUnlockWidget
                postId={id}
                email={isNativePost ? post.contact?.email : (post.SectionData?.fbleads as {emails?: string})?.emails}
                phone={isNativePost ? post.contact?.phone : (post.SectionData?.fbleads as {phones?: string})?.phones}
                website={isNativePost ? post.contact?.website : undefined}
                isCompany={session?.user?.roleName === 'company'}
                isLoggedIn={!!session?.user}
              />
            </div>

            {!isNativePost && post.status !== 'claimed' && (
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
