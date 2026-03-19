'use client';
import { X } from 'lucide-react';

interface SkillTagProps {
  skill: string;
  onRemove?: () => void;
}

export function SkillTag({ skill, onRemove }: SkillTagProps) {
  return (
    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 rounded-[8px] px-[10px] py-1 text-xs font-medium">
      {skill}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-gray-900 transition-colors ml-0.5">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
