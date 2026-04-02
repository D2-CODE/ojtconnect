'use client';
import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface Option { label: string; value: string; }

interface DropdownSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DropdownSelect({ options, value, onChange, placeholder = 'Select...', className = '' }: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2 w-full min-w-[130px] px-3 py-2.5 text-sm border border-gray-300 rounded-[10px] bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] transition-colors"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 w-full min-w-[130px] bg-white border border-gray-200 rounded-xl shadow-lg py-1 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                opt.value === value
                  ? 'bg-[#E8F5F1] text-[#0F6E56] font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt.label}
              {opt.value === value && <Check className="w-3.5 h-3.5 text-[#0F6E56]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
