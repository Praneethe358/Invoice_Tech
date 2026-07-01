'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QtyStepper from './QtyStepper';
import { InvoiceItem } from '@/lib/types';

interface LineItemProps {
  item: InvoiceItem;
  onQtyChange: (qty: number) => void;
  onPriceChange?: (price: number) => void;
  onDiscountChange?: (discount: number) => void;
  gstRegistered?: boolean;
}

export default function LineItem({
  item,
  onQtyChange,
  onPriceChange,
  onDiscountChange,
  gstRegistered = false,
}: LineItemProps) {
  const baseTotal = item.price * item.quantity;
  const discountAmount = item.discount || 0;
  const taxableValue = Math.max(0, baseTotal - discountAmount);
  const gstAmount = gstRegistered ? taxableValue * ((item.gst_rate || 0) / 100) : 0;
  const lineTotal = item.line_total !== undefined ? item.line_total : (taxableValue + gstAmount);

  const [localPrice, setLocalPrice] = useState(item.price.toString());
  const [localDiscount, setLocalDiscount] = useState((item.discount || 0).toString());

  useEffect(() => {
    if (parseFloat(localPrice) !== item.price) {
      setLocalPrice(item.price.toString());
    }
  }, [item.price]);

  useEffect(() => {
    if (parseFloat(localDiscount) !== (item.discount || 0)) {
      setLocalDiscount((item.discount || 0).toString());
    }
  }, [item.discount]);

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
            <span className="text-xs text-[#6b7280]">₹</span>
            {onPriceChange ? (
              <input
                type="text"
                inputMode="decimal"
                value={localPrice}
                onChange={(e) => {
                  const valStr = e.target.value;
                  // Allow empty string, digits, and a single decimal point
                  if (valStr === '' || /^\d*\.?\d*$/.test(valStr)) {
                    setLocalPrice(valStr);
                    const parsed = parseFloat(valStr);
                    if (!isNaN(parsed)) {
                      onPriceChange(parsed);
                    } else {
                      onPriceChange(0);
                    }
                  }
                }}
                onBlur={() => {
                  setLocalPrice(item.price.toString());
                }}
                className="w-20 h-6 text-xs font-semibold bg-slate-50 hover:bg-slate-100 focus:bg-white border border-[#e5e7eb] rounded px-1.5 focus:outline-none focus:border-[#0050e8] focus:ring-0 text-slate-800 transition-colors text-right"
              />
            ) : (
              <span className="text-xs text-[#6b7280] tabular-nums font-semibold">
                {item.price.toLocaleString('en-IN')}
              </span>
            )}
            <span className="text-xs text-[#6b7280]">× {item.quantity}</span>
          </div>
          {item.hsn_code && (
            <span className="text-[10px] text-[#9ca3af] font-medium">
              HSN: {item.hsn_code}
            </span>
          )}
        </div>

        {/* Discount Row */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-[11px] text-[#6b7280]">
            <span>Disc: ₹</span>
            {onDiscountChange ? (
              <input
                type="text"
                inputMode="decimal"
                value={localDiscount}
                onChange={(e) => {
                  const valStr = e.target.value;
                  if (valStr === '' || /^\d*\.?\d*$/.test(valStr)) {
                    setLocalDiscount(valStr);
                    const parsed = parseFloat(valStr);
                    if (!isNaN(parsed)) {
                      onDiscountChange(Math.min(parsed, baseTotal));
                    } else {
                      onDiscountChange(0);
                    }
                  }
                }}
                onBlur={() => {
                  setLocalDiscount((item.discount || 0).toString());
                }}
                className="w-16 h-5 text-[10px] font-semibold bg-slate-50 hover:bg-slate-100 focus:bg-white border border-[#e5e7eb] rounded px-1 focus:outline-none focus:border-[#0050e8] focus:ring-0 text-slate-800 transition-colors text-right"
                placeholder="0"
              />
            ) : (
              <span className="font-semibold tabular-nums">
                {(item.discount || 0).toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {discountAmount > 0 && baseTotal > 0 ? (
            <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
              -{((discountAmount / baseTotal) * 100).toFixed(0)}%
            </span>
          ) : null}
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
