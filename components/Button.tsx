'use client';

import { ReactNode, MouseEventHandler } from 'react';
import { motion } from 'framer-motion';
import Spinner from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#1a6b3c] text-white hover:bg-[#155d33] active:bg-[#124a29] disabled:bg-[#1a6b3c]/50',
  secondary:
    'bg-white text-[#111827] border border-[#e5e7eb] hover:bg-[#f9fafb] active:bg-[#f3f4f6] disabled:opacity-50',
  danger:
    'bg-[#dc2626] text-white hover:bg-[#b91c1c] active:bg-[#991b1b] disabled:bg-[#dc2626]/50',
  ghost:
    'bg-transparent text-[#6b7280] hover:bg-[#f3f4f6] active:bg-[#e5e7eb] disabled:opacity-50',
};

export default function Button({
  variant = 'primary',
  loading = false,
  children,
  fullWidth = false,
  disabled,
  className = '',
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ duration: 0.1 }}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl px-5 py-3 text-sm font-semibold
        min-h-[44px] min-w-[44px]
        transition-colors duration-150 cursor-pointer
        disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      aria-label={ariaLabel}
    >
      {loading && <Spinner size={18} />}
      {children}
    </motion.button>
  );
}
