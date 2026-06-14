'use client';

import { motion } from 'framer-motion';
import QtyStepper from './QtyStepper';
import { InvoiceItem } from '@/lib/types';

interface LineItemProps {
  item: InvoiceItem;
  onQtyChange: (qty: number) => void;
}

export default function LineItem({ item, onQtyChange }: LineItemProps) {
  const lineTotal = item.price * item.quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex items-center gap-3 py-3 border-b border-[#f3f4f6] last:border-0"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#111827] truncate">
          {item.name}
        </p>
        <p className="text-xs text-[#6b7280] tabular-nums mt-0.5">
          ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
        </p>
      </div>
      <QtyStepper quantity={item.quantity} onChange={onQtyChange} />
      <div className="text-right min-w-[60px]">
        <span className="text-sm font-bold text-[#111827] tabular-nums">
          ₹{lineTotal.toLocaleString('en-IN')}
        </span>
      </div>
    </motion.div>
  );
}
