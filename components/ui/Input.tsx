'use client';

interface InputProps {
  label?: string;
  error?: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Input({ label, error, placeholder, type = 'text', value, onChange, name, required, disabled, className = '' }: InputProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full rounded-[10px] border px-3 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all outline-none
          ${error ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/20'}
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
