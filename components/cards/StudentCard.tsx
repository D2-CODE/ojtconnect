'use client';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { SkillTag } from '@/components/ui/SkillTag';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MapPin } from 'lucide-react';

interface StudentCardStudent {
  _id: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  course?: string;
  universityId?: string;
  universityName?: string;
  skills?: string[];
  profilePic?: string;
  preferredSetup?: string;
  preferredLocation?: string;
  universityVerificationStatus?: string;
}

interface StudentCardProps {
  student: StudentCardStudent;
  onConnect?: (id: string) => void;
  connectionStatus?: 'pending' | 'accepted' | 'rejected' | null;
  profileBasePath?: string;
}

export function StudentCard({ student, onConnect, connectionStatus, profileBasePath = '/company/students' }: StudentCardProps) {
  const name = student.displayName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
  const skills = (student.skills || []).slice(0, 4);
  const isVerified = student.universityVerificationStatus === 'verified';

  return (
    <div className="bg-white rounded-[16px] border border-gray-200 p-5 flex flex-col items-center gap-3 hover:shadow-md transition-shadow w-full">
      <Avatar name={name} src={student.profilePic} size="xl" />

      <div className="text-center">
        <p className="font-semibold text-gray-900 text-sm">{name}</p>
        {student.course && <p className="text-xs text-gray-500 mt-0.5">{student.course}</p>}
        {student.universityName && <p className="text-xs text-gray-400 mt-0.5">{student.universityName}</p>}
        {student.preferredLocation && (
          <div className="flex items-center justify-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">{student.preferredLocation}</span>
          </div>
        )}
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {skills.map((skill) => <SkillTag key={skill} skill={skill} />)}
        </div>
      )}

      {isVerified && <Badge label="Verified" variant="success" />}

      <div className="w-full mt-1">
        {connectionStatus === 'accepted' && (
          <div className="w-full flex items-center justify-center gap-1.5 py-2 rounded-[10px] bg-[#E8F5F1] text-[#0F6E56] text-sm font-semibold">
            <span>✓</span> Connected
          </div>
        )}
        {connectionStatus === 'pending' && (
          <div className="w-full flex items-center justify-center gap-1.5 py-2 rounded-[10px] bg-amber-50 text-amber-600 text-sm font-semibold">
            <span>⏳</span> Request Sent
          </div>
        )}
          {!connectionStatus && onConnect && (
          <Button variant="outline" className="w-full" onClick={() => onConnect(student._id)}>
            Connect
          </Button>
        )}
      </div>
      <Link href={`${profileBasePath}/${student._id}`} className="w-full block text-center text-xs text-[#0F6E56] hover:underline mt-1">
        View Profile
      </Link>
    </div>
  );
}
