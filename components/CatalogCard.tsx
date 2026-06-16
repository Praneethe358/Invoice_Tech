'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    }, 500);
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

  // Determine stock styling
  const isOutOfStock = inventoryEnabled && product.track_inventory && (product.stock_qty || 0) <= 0;
  const isLowStock = inventoryEnabled && product.track_inventory && !isOutOfStock && (product.stock_qty || 0) <= (product.low_stock_threshold || 5);

  return (
    <motion.div
      whileTap={{ scale: isEditingPrice ? 1 : 0.97 }}
      onMouseDown={startLongPress}
      onMouseUp={endLongPress}
      onMouseLeave={endLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={endLongPress}
      onClick={handleCardClick}
      className={`
        relative w-full p-4 rounded-2xl border text-left
        transition-all duration-150 cursor-pointer
        min-h-[90px] flex flex-col justify-between
        ${
          isEditingPrice 
            ? 'border-blue-500 bg-blue-50/20' 
            : isOutOfStock 
            ? 'border-red-300 bg-red-50/10'
            : isLowStock 
            ? 'border-amber-300 bg-amber-50/10'
            : quantity > 0
            ? 'border-[#1a6b3c] bg-[#1a6b3c]/5'
            : 'border-[#e5e7eb] bg-white hover:bg-[#f9fafb]'
        }
      `}
    >
      <div className="pr-12 w-full">
        <div className="flex items-center gap-1">
          <p className="text-sm font-semibold text-[#111827] truncate flex-1 uppercase">
            {product.name}
          </p>
        </div>
        {product.hsn_code && (
          <p className="text-[10px] text-[#9ca3af] mt-0.5 font-medium">
            HSN: {product.hsn_code}
          </p>
        )}
      </div>
      
      <div className="flex flex-col gap-1 mt-2 w-full">
        {isEditingPrice ? (
          <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs font-semibold text-gray-500">₹</span>
            <input
              type="number"
              value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              className="w-16 bg-white border border-gray-300 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none"
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
              className="px-1.5 py-0.5 bg-green-600 text-white rounded text-[10px] font-bold"
            >
              Save
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingPrice(false);
              }}
              className="px-1.5 py-0.5 bg-gray-300 text-gray-700 rounded text-[10px] font-bold"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold text-[#111827] tabular-nums">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </p>
            {gstRegistered && product.gst_rate !== undefined && product.gst_rate > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#e6f4ea] text-[#1a6b3c] border border-[#d1e7dd]">
                {product.gst_rate}% GST
              </span>
            )}
            {isOutOfStock && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-red-100 text-red-700 border border-red-200">
                Out of Stock
              </span>
            )}
            {isLowStock && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                Low: {product.stock_qty} {stockUnitShort}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Top right corner indicators (Favorite & Quantity) */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {onFavoriteToggle && (
          <button
            onClick={onFavoriteToggle}
            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-colors hover:bg-gray-100 ${
              product.is_favorite ? 'text-amber-500' : 'text-gray-300'
            }`}
          >
            {product.is_favorite ? '⭐' : '☆'}
          </button>
        )}
        
        {quantity > 0 && (
          <motion.span
            key={quantity}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="w-6 h-6 rounded-full bg-[#1a6b3c] text-white text-xs font-bold flex items-center justify-center shadow-sm shrink-0"
          >
            {quantity}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
