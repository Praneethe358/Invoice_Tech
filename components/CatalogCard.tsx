'use client';

import { motion } from 'framer-motion';
import { Product } from '@/lib/types';

interface CatalogCardProps {
  product: Product;
  quantity: number;
  onTap: () => void;
  gstRegistered?: boolean;
}

export default function CatalogCard({
  product,
  quantity,
  onTap,
  gstRegistered = false,
}: CatalogCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onTap}
      className={`
        relative w-full p-4 rounded-2xl border text-left
        transition-colors duration-150
        min-h-[72px] flex flex-col justify-between
        ${
          quantity > 0
            ? 'border-[#1a6b3c] bg-[#1a6b3c]/5'
            : 'border-[#e5e7eb] bg-white hover:bg-[#f9fafb]'
        }
      `}
    >
      <div className="pr-6">
        <p className="text-sm font-semibold text-[#111827] truncate">
          {product.name}
        </p>
        {product.hsn_code && (
          <p className="text-[10px] text-[#9ca3af] mt-0.5 font-medium">
            HSN: {product.hsn_code}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2 mt-2">
        <p className="text-xs font-bold text-[#111827] tabular-nums">
          ₹{Number(product.price).toLocaleString('en-IN')}
        </p>
        {gstRegistered && product.gst_rate !== undefined && product.gst_rate > 0 && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#e6f4ea] text-[#1a6b3c] border border-[#d1e7dd]">
            {product.gst_rate}% GST
          </span>
        )}
      </div>

      {quantity > 0 && (
        <motion.span
          key={quantity}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#1a6b3c] text-white text-xs font-bold flex items-center justify-center shadow-sm"
        >
          {quantity}
        </motion.span>
      )}
    </motion.button>
  );
}
