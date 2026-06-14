'use client';

import { motion } from 'framer-motion';
import { Product } from '@/lib/types';

interface CatalogCardProps {
  product: Product;
  quantity: number;
  onTap: () => void;
}

export default function CatalogCard({
  product,
  quantity,
  onTap,
}: CatalogCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onTap}
      className={`
        relative w-full p-4 rounded-2xl border text-left
        transition-colors duration-150
        min-h-[44px]
        ${
          quantity > 0
            ? 'border-[#1a6b3c] bg-[#1a6b3c]/5'
            : 'border-[#e5e7eb] bg-white hover:bg-[#f9fafb]'
        }
      `}
    >
      <p className="text-sm font-semibold text-[#111827] truncate pr-6">
        {product.name}
      </p>
      <p className="text-xs text-[#6b7280] mt-1 tabular-nums">
        ₹{Number(product.price).toLocaleString('en-IN')}
      </p>

      {quantity > 0 && (
        <motion.span
          key={quantity}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#1a6b3c] text-white text-xs font-bold flex items-center justify-center"
        >
          {quantity}
        </motion.span>
      )}
    </motion.button>
  );
}
