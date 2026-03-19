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

      {/* Post text */}
      <p className="text-gray-600 text-xs leading-relaxed">
        {truncate(fb.post_text || '', 200)}
      </p>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => <SkillTag key={skill} skill={skill} />)}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <span className={`text-xs font-medium ${post.status === 'claimed' ? 'text-[#0F6E56]' : 'text-gray-400'}`}>
          {post.status === 'claimed' ? '✓ Claimed' : 'Unclaimed'}
        </span>
        <Link href={`/wall/${post._id}`}>
          <Button variant="outline" size="sm">View Post</Button>
        </Link>
      </div>
    </div>
  );
}
