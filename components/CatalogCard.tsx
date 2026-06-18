'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Product } from '@/lib/types';

interface CatalogCardProps {
  product: Product;
  quantity: number;
  onTap: () => void;
  gstRegistered?: boolean;
  onFavoriteToggle?: (e: React.MouseEvent) => void;
  onPriceUpdate?: (newPrice: number) => Promise<void>;
  stockUnitShort?: string;
  inventoryEnabled?: boolean;
}

export default function CatalogCard({
  product,
  quantity,
  onTap,
  gstRegistered = false,
  onFavoriteToggle,
  onPriceUpdate,
  stockUnitShort = 'units',
  inventoryEnabled = false,
}: CatalogCardProps) {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState(String(product.price));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startLongPress = () => {
    timerRef.current = setTimeout(() => {
      setIsEditingPrice(true);
      setTempPrice(String(product.price));
    }, 600);
  };

  const endLongPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCardClick = () => {
    if (isEditingPrice) return;
    onTap();
  };

  const isOutOfStock = inventoryEnabled && product.track_inventory && (product.stock_qty || 0) <= 0;
  const isLowStock = inventoryEnabled && product.track_inventory && !isOutOfStock && (product.stock_qty || 0) <= (product.low_stock_threshold || 5);

  return (
    <motion.div
      whileTap={{ scale: isEditingPrice ? 1 : 0.98 }}
      onMouseDown={startLongPress}
      onMouseUp={endLongPress}
      onMouseLeave={endLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={endLongPress}
      onClick={handleCardClick}
      className={`
        relative w-full p-4 rounded-xl border text-left
        transition-all duration-150 cursor-pointer
        flex flex-col justify-between gap-4
        ${
          isEditingPrice 
            ? 'border-blue-500 bg-blue-50/10 shadow-xs' 
            : quantity > 0
            ? 'border-[#0050e8] bg-[#0050e8]/5 shadow-2xs'
            : isOutOfStock
            ? 'border-slate-200 bg-slate-50/50 opacity-70 hover:opacity-100 hover:border-slate-300'
            : 'border-slate-200 bg-white hover:border-[#0050e8]/40 hover:shadow-2xs'
        }
      `}
    >
      <div className="w-full">
        {/* Top Header: Product Name and Right Buttons */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold text-slate-800 leading-snug uppercase tracking-wide flex-1">
            {product.name}
          </p>
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {onFavoriteToggle && (
              <button
                onClick={onFavoriteToggle}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all hover:bg-slate-100 ${
                  product.is_favorite ? 'text-amber-500' : 'text-slate-300 hover:text-slate-400'
                }`}
                title={product.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                {product.is_favorite ? (
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.175 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.883c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                )}
              </button>
            )}
            
            {quantity > 0 && (
              <motion.span
                key={quantity}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-5 h-5 rounded-full bg-[#0050e8] text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs shrink-0"
              >
                {quantity}
              </motion.span>
            )}
          </div>
        </div>
        
        {/* HSN Code */}
        {product.hsn_code && (
          <p className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wider">
            HSN: {product.hsn_code}
          </p>
        )}
      </div>
      
      {/* Bottom Info Section: Price and Badges */}
      <div className="w-full mt-auto">
        {isEditingPrice ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[11px] font-bold text-slate-500">₹</span>
            <input
              type="number"
              value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none"
              autoFocus
            />
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const priceVal = parseFloat(tempPrice);
                if (!isNaN(priceVal) && priceVal > 0 && onPriceUpdate) {
                  await onPriceUpdate(priceVal);
                }
                setIsEditingPrice(false);
              }}
              className="px-2 py-0.5 bg-[#0050e8] text-white rounded text-[10px] font-bold hover:bg-[#0050e8]/90 transition-colors"
            >
              Save
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingPrice(false);
              }}
              className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-extrabold text-slate-900 tabular-nums">
              ₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            
            <div className="flex flex-wrap items-center gap-1.5">
              {gstRegistered && product.gst_rate !== undefined && product.gst_rate > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                  {product.gst_rate}% GST
                </span>
              )}
              {isOutOfStock && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-wider">
                  Out of Stock
                </span>
              )}
              {isLowStock && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
                  Low Stock
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
