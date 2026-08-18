import React, { useEffect, useRef } from 'react';
import { X, Tag, Clock, Store as StoreIcon } from 'lucide-react';
import { CATEGORY_ICON, CATEGORY_BG, CATEGORY_COLOR } from '../constants/categories';

function daysLeft(endDate) {
  if (!endDate) return null;
  const diffMs = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export default function CompareDealsModal({ open, promotions, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const cheapestPrice = Math.min(...promotions.map(p => p.discountPrice ?? Infinity));
  const bestDiscount = Math.max(...promotions.map(p => p.discountPercentage ?? -Infinity));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-modal-title"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="compare-modal-title" className="text-lg font-bold text-gray-800">Compare deals</h3>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="min-w-11 min-h-11 flex items-center justify-center text-gray-400 hover:text-gray-600 -mr-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-3" style={{ minWidth: promotions.length * 180 }}>
            {promotions.map(promo => {
              const CatIcon = CATEGORY_ICON[promo.store?.category] || StoreIcon;
              const remaining = daysLeft(promo.endDate);
              return (
                <div key={promo.promotionID} className="flex-1 min-w-[170px] bg-gray-50 rounded-2xl border border-gray-100 p-4">
                  <div className={`w-12 h-12 ${CATEGORY_BG[promo.store?.category] || 'bg-gray-100'} rounded-xl flex items-center justify-center mb-3`}>
                    <CatIcon size={22} className={CATEGORY_COLOR[promo.store?.category] || 'text-gray-600'} />
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm line-clamp-2">{promo.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{promo.store?.storeName || 'DealNest Store'}</p>

                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Price</p>
                      <p className={`font-extrabold ${promo.discountPrice === cheapestPrice ? 'text-green-600' : 'text-gray-800'}`}>
                        {promo.discountPrice != null ? `R${promo.discountPrice.toFixed(2)}` : '—'}
                        {promo.discountPrice === cheapestPrice && <span className="ml-1 text-[10px] font-bold text-green-600">LOWEST</span>}
                      </p>
                      {promo.originalPrice != null && (
                        <p className="text-xs text-gray-400 line-through">R{promo.originalPrice.toFixed(2)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Discount</p>
                      <p className={`flex items-center gap-1 text-sm font-bold ${promo.discountPercentage === bestDiscount ? 'text-green-600' : 'text-gray-700'}`}>
                        <Tag size={12} /> {promo.discountPercentage != null ? `${promo.discountPercentage}%` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Rating</p>
                      <p className="text-sm font-bold text-gray-700">{promo.store?.averageRating?.toFixed(1) || 'New'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Ends</p>
                      <p className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={11} /> {remaining === null ? '—' : remaining === 0 ? 'Today' : `${remaining}d`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
