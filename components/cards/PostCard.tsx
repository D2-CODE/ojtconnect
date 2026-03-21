'use client';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { SkillTag } from '@/components/ui/SkillTag';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar } from 'lucide-react';

interface FbLead {
  name?: string;
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
  const isNativePost = post.source === 'company' || post.source === 'student';
  const fb = post.SectionData?.fbleads;

  if (isNativePost) {
    const skills = post.skills || [];
    const isIntern = post.source === 'student';
    return (
      <div className="bg-white rounded-[16px] border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow w-full">
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
        <p className="text-gray-600 text-xs leading-relaxed">{truncate(post.description || '', 200)}</p>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 4).map((skill) => <SkillTag key={skill} skill={skill} />)}
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
          {post.setup && <span>🏢 {post.setup}</span>}
          {post.location && <span>📍 {post.location}</span>}
          {post.slots && <span>👥 {post.slots} slot{post.slots !== 1 ? 's' : ''}</span>}
          {post.allowance && <span>💰 {post.allowance}</span>}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
          <span className="text-xs font-medium text-[#0F6E56]">✓ Direct Post</span>
          <Link href={`/wall/${post._id}`}><Button variant="outline" size="sm">View Post</Button></Link>
        </div>
      </div>
    );
  }

  if (!fb) return null;
  const skills = fb.skills ? fb.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4) : [];
  const isIntern = fb.lead_type === 'intern';

  return (
    <div className="bg-white rounded-[16px] border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow w-full">
      {/* Header */}
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
      <p className="text-gray-600 text-xs leading-relaxed">{truncate(fb.post_text || '', 200)}</p>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => <SkillTag key={skill} skill={skill} />)}
        </div>
      )}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <span className={`text-xs font-medium ${post.status === 'claimed' ? 'text-[#0F6E56]' : 'text-gray-400'}`}>
          {post.status === 'claimed' ? '✓ Claimed' : 'Unclaimed'}
        </span>
        <Link href={`/wall/${post._id}`}><Button variant="outline" size="sm">View Post</Button></Link>
      </div>
    </div>
  );
}
