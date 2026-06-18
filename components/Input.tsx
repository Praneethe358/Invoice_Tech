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
            className="block text-sm font-medium text-[#111827] mb-1.5"
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
              w-full rounded-xl border bg-white px-4 py-3
              text-sm text-[#111827] placeholder-[#9ca3af]
              transition-all duration-150
              outline-none
              border-[#e5e7eb]
              focus:border-[#0050e8] focus:ring-2 focus:ring-[#0050e8]/20
              disabled:bg-[#f9fafb] disabled:cursor-not-allowed
              ${prefix ? 'pl-10' : ''}
              ${error ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]/20' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-[#dc2626] font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
