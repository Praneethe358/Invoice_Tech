'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-bold text-[#1a1d26] mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6b7280] font-medium select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-xl border bg-white px-4 py-3.5
              text-sm text-[#1a1d26] placeholder-slate-400
              transition-all duration-150
              outline-none
              border-slate-200
              focus:border-[#729bf3] focus:ring-2 focus:ring-[#729bf3]/15
              disabled:bg-[#f9fafb] disabled:cursor-not-allowed
              ${prefix ? 'pl-10' : ''}
              ${error ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]/20' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-[#dc2626] font-semibold">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
