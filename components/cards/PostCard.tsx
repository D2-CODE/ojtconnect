'use client';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { SkillTag } from '@/components/ui/SkillTag';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, MapPin, Users, Banknote, Monitor, CheckCircle2, Clock } from 'lucide-react';

interface FbLead {
  name?: string;
  fb_id?: string;
  profile_pic?: string;
  post_text?: string;
  emails?: string;
  skills?: string;
  lead_type?: 'intern' | 'internship';
  scraped_at?: string;
}

interface IOjtWallPost {
  _id: string;
  source?: string;
  postedByName?: string;
  title?: string;
  description?: string;
  skills?: string[];
  setup?: string;
  location?: string;
  allowance?: string;
  slots?: number;
  hoursRequired?: number;
  deadline?: string;
  SectionData?: { fbleads?: FbLead };
  status?: string;
  claimedBy?: string;
  createdAt?: string | { $date: string };
}

interface PostCardProps {
  post: IOjtWallPost;
}

function formatDate(d?: string | { $date: string } | null): string {
  if (!d) return '';
  const dateStr = typeof d === 'object' && '$date' in d ? d.$date : d;
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(text: string, max = 180): string {
  return text.length > max ? text.slice(0, max) + '...' : text;
}

export function PostCard({ post }: PostCardProps) {
  const fb = post.SectionData?.fbleads;
  // Native = posted directly from dashboard (source is company/student with no scraped fb_id)
  const isNativePost = (post.source === 'company' || post.source === 'student') && !fb?.fb_id;

  if (isNativePost) {
    const skills = post.skills || [];
    const isIntern = post.source === 'student';
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md hover:border-gray-300 transition-all w-full">
        <div className="flex items-start gap-3">
          <Avatar name={post.postedByName} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{post.postedByName || 'Anonymous'}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
            </div>
          </div>
          <Badge label={isIntern ? 'Seeking OJT' : 'Offering Internship'} variant={isIntern ? 'primary' : 'success'} />
        </div>
        {post.title && <p className="font-semibold text-gray-800 text-sm">{post.title}</p>}
        <p className="text-gray-500 text-xs leading-relaxed">{truncate(post.description || '', 200)}</p>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 4).map((skill) => <SkillTag key={skill} skill={skill} />)}
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
          {post.setup && <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{post.setup}</span>}
          {post.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{post.location}</span>}
          {post.slots && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{post.slots} slot{post.slots !== 1 ? 's' : ''}</span>}
          {post.allowance && <span className="flex items-center gap-1"><Banknote className="w-3 h-3" />{post.allowance}</span>}
        </div>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1 text-xs font-medium text-[#0F6E56]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Direct Post
          </span>
          <div className="flex items-center gap-2">
            {post.status === 'claimed' && (
              <span className="flex items-center gap-1 text-xs font-medium text-[#0F6E56]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
              </span>
            )}
            <Link href={`/wall/${post._id}`}><Button variant="outline" size="sm">View Post</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  if (!fb) return null;
  const skills = fb.skills ? fb.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4) : [];
  const isIntern = fb.lead_type === 'intern';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md hover:border-gray-300 transition-all w-full">
      <div className="flex items-start gap-3">
        <Avatar name={fb.name} src={fb.profile_pic} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{fb.name || 'Anonymous'}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
          </div>
        </div>
        <Badge label={isIntern ? 'Seeking OJT' : 'Offering Internship'} variant={isIntern ? 'primary' : 'success'} />
      </div>
      <p className="text-gray-500 text-xs leading-relaxed">{truncate(fb.post_text || '', 200)}</p>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => <SkillTag key={skill} skill={skill} />)}
        </div>
      )}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <span className={`flex items-center gap-1 text-xs font-medium ${post.status === 'claimed' ? 'text-[#0F6E56]' : 'text-gray-400'}`}>
          {post.status === 'claimed'
            ? <><CheckCircle2 className="w-3.5 h-3.5" /> Claimed</>
            : <><Clock className="w-3.5 h-3.5" /> Unclaimed</>}
        </span>
        <Link href={`/wall/${post._id}`}><Button variant="outline" size="sm">View Post</Button></Link>
      </div>
    </div>
  );
}
