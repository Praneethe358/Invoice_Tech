'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  index?: number;
}

export default function StatCard({
  icon,
  label,
  value,
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        ease: 'easeOut',
        delay: index * 0.05,
      }}
      className="bg-white rounded-2xl border border-[#e5e7eb] p-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1a6b3c]/10 flex items-center justify-center text-lg">
          {icon}
        </div>
        <div>
          <p className="text-xs text-[#6b7280] font-medium">{label}</p>
          <p className="text-xl font-bold text-[#111827] tabular-nums">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
