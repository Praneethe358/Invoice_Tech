'use client';

import { motion } from 'framer-motion';
import QtyStepper from './QtyStepper';
import { InvoiceItem } from '@/lib/types';

interface LineItemProps {
  item: InvoiceItem;
  onQtyChange: (qty: number) => void;
  gstRegistered?: boolean;
}

export default function LineItem({
  item,
  onQtyChange,
  gstRegistered = false,
}: LineItemProps) {
  const baseTotal = item.price * item.quantity;
  const gstAmount = gstRegistered ? baseTotal * ((item.gst_rate || 0) / 100) : 0;
  const lineTotal = item.line_total !== undefined ? item.line_total : (baseTotal + gstAmount);

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
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold text-[#111827] truncate uppercase">
            {item.name}
          </p>
          {gstRegistered && item.gst_rate !== undefined && item.gst_rate > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#e6efff] text-[#0050e8] border border-[#cce0ff]">
              {item.gst_rate}% GST
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#6b7280] font-semibold">
              ₹{item.price.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-[#6b7280]">× {item.quantity}</span>
          </div>
          {item.hsn_code && (
            <span className="text-[10px] text-[#9ca3af] font-medium">
              HSN: {item.hsn_code}
            </span>
          )}
        </div>
      </div>
      <QtyStepper quantity={item.quantity} onChange={onQtyChange} />
      <div className="text-right min-w-[70px]">
        <span className="text-sm font-bold text-[#111827] tabular-nums">
          ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </motion.div>
  );
}
