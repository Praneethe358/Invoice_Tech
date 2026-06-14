'use client';

import { motion } from 'framer-motion';

interface QtyStepperProps {
  quantity: number;
  onChange: (qty: number) => void;
}

export default function QtyStepper({
  quantity,
  onChange,
}: QtyStepperProps) {
  return (
    <div className="flex items-center gap-1">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onChange(quantity - 1)}
        className="w-8 h-8 rounded-lg bg-[#f3f4f6] text-[#111827] font-bold text-sm flex items-center justify-center hover:bg-[#e5e7eb] transition-colors"
        aria-label="Decrease quantity"
      >
        −
      </motion.button>
      <span className="w-8 text-center text-sm font-semibold text-[#111827] tabular-nums">
        {quantity}
      </span>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onChange(quantity + 1)}
        className="w-8 h-8 rounded-lg bg-[#1a6b3c] text-white font-bold text-sm flex items-center justify-center hover:bg-[#155d33] transition-colors"
        aria-label="Increase quantity"
      >
        +
      </motion.button>
    </div>
  );
}
