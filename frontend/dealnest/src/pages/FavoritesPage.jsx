import React, { useState, useEffect } from 'react';
import { favoriteService, savedPromotionService, redemptionService } from '../services/api';
import { MapPin, Trash2, Tag, Clock, HeartCrack, Bookmark, Store as StoreIcon, Ticket, Scale, X } from 'lucide-react';
import { CATEGORY_ICON, CATEGORY_BG, CATEGORY_COLOR } from '../constants/categories';
import CompareDealsModal from '../components/CompareDealsModal';

const MAX_COMPARE = 3;

function daysLeft(endDate) {
  if (!endDate) return null;
  const diffMs = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export default function FavoritesPage({ user }) {
  const [tab, setTab] = useState('stores');
  const [favorites, setFavorites] = useState([]);
  const [savedPromotions, setSavedPromotions] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState(new Set());
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [storesData, promosData, redemptionsData] = await Promise.all([
        favoriteService.getByUser(user.userID),
        savedPromotionService.getByUser(user.userID),
        redemptionService.getByUser(user.userID),
      ]);
      setFavorites(storesData);
      setSavedPromotions(promosData);
      setRedemptions(redemptionsData.sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt)));
    } catch (error) {
      console.error("Failed to load saved items");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStore = async (favoriteId) => {
    if (window.confirm("Remove this store from favorites?")) {
      const success = await favoriteService.remove(favoriteId);
      if (success) {
        setFavorites(prev => prev.filter(f => f.favoriteStoreID !== favoriteId));
      }
    }
  };

  const handleRemovePromotion = async (savedPromotionId) => {
    if (window.confirm("Remove this deal from your saved list?")) {
      const success = await savedPromotionService.remove(savedPromotionId);
      if (success) {
        setSavedPromotions(prev => prev.filter(sp => sp.savedPromotionID !== savedPromotionId));
      }
    }
  };

  const toggleCompareMode = () => {
    setCompareMode(prev => !prev);
    setCompareIds(new Set());
  };

  const toggleCompareSelection = (promotionId) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(promotionId)) {
        next.delete(promotionId);
      } else if (next.size < MAX_COMPARE) {
        next.add(promotionId);
      }
      return next;
    });
  };

  const compareSelectedPromotions = savedPromotions
    .map(sp => sp.promotion)
    .filter(promo => promo && compareIds.has(promo.promotionID));

  return (
    <div className="p-6 pb-24 max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">My Favorites</h2>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('stores')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${tab === 'stores' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
        >
          Stores {favorites.length > 0 && `(${favorites.length})`}
        </button>
        <button
          onClick={() => setTab('deals')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${tab === 'deals' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
        >
          Deals {savedPromotions.length > 0 && `(${savedPromotions.length})`}
        </button>
        <button
          onClick={() => setTab('codes')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${tab === 'codes' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
        >
          My Codes {redemptions.length > 0 && `(${redemptions.length})`}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading favorites...</div>
      ) : tab === 'stores' ? (
        favorites.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <HeartCrack className="mx-auto text-gray-300" size={48} />
            <h3 className="text-xl font-bold text-gray-800 mt-4">No favorites yet</h3>
            <p className="text-gray-500 text-sm mt-2">Explore stores and tap the heart to save them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favorites.map(fav => {
              const CatIcon = CATEGORY_ICON[fav.store.category] || StoreIcon;
              return (
              <div key={fav.favoriteStoreID} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-start gap-4 hover:shadow-md transition">
                <div className={`w-16 h-16 ${CATEGORY_BG[fav.store.category] || 'bg-gray-100'} rounded-xl flex items-center justify-center`}>
                  <CatIcon size={26} className={CATEGORY_COLOR[fav.store.category] || 'text-gray-600'} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-800">{fav.store.storeName}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} /> {fav.store.city}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveStore(fav.favoriteStoreID)}
                      className="p-2 hover:bg-red-50 rounded-full transition text-gray-500 hover:text-red-500"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )
      ) : tab === 'deals' ? (
        savedPromotions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Bookmark className="mx-auto text-gray-300" size={48} />
          <h3 className="text-xl font-bold text-gray-800 mt-4">No saved deals yet</h3>
          <p className="text-gray-500 text-sm mt-2">Tap the bookmark on any deal to save it here.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-400">{compareMode ? `Select up to ${MAX_COMPARE} deals to compare` : ''}</p>
            <button
              type="button"
              onClick={toggleCompareMode}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${compareMode ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300'}`}
            >
              {compareMode ? <X size={13} /> : <Scale size={13} />}
              {compareMode ? 'Cancel' : 'Compare'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-16">
            {savedPromotions.map(sp => {
              const promo = sp.promotion;
              const remaining = daysLeft(promo?.endDate);
              const CatIcon = CATEGORY_ICON[promo?.store?.category] || StoreIcon;
              const selected = promo && compareIds.has(promo.promotionID);
              return (
                <div
                  key={sp.savedPromotionID}
                  onClick={compareMode && promo ? () => toggleCompareSelection(promo.promotionID) : undefined}
                  className={`bg-white rounded-2xl shadow-sm border p-4 flex items-start gap-4 transition ${compareMode ? 'cursor-pointer' : 'hover:shadow-md'} ${selected ? 'border-teal-500 ring-2 ring-teal-100' : 'border-gray-100'}`}
                >
                  {compareMode && (
                    <div className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'bg-teal-600 border-teal-600' : 'border-gray-300'}`} aria-hidden="true">
                      {selected && <Scale size={11} className="text-white" />}
                    </div>
                  )}
                  <div className={`w-16 h-16 ${CATEGORY_BG[promo?.store?.category] || 'bg-gray-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <CatIcon size={26} className={CATEGORY_COLOR[promo?.store?.category] || 'text-gray-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-800 line-clamp-1">{promo?.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{promo?.store?.storeName || 'DealNest Store'}</p>
                      </div>
                      {!compareMode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemovePromotion(sp.savedPromotionID); }}
                          className="p-2 hover:bg-red-50 rounded-full transition text-gray-500 hover:text-red-500 flex-shrink-0"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {promo?.discountPercentage != null && (
                        <span className="flex items-center gap-1 bg-teal-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                          <Tag size={11} /> {promo.discountPercentage}% OFF
                        </span>
                      )}
                      {promo?.discountPrice != null && (
                        <span className="text-teal-600 font-bold text-sm">R{promo.discountPrice.toFixed(2)}</span>
                      )}
                      {remaining !== null && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={11} /> {remaining === 0 ? 'Ends today' : `${remaining}d left`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {compareMode && compareIds.size >= 2 && (
            <button
              type="button"
              onClick={() => setShowCompare(true)}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-teal-600 text-white font-semibold text-sm px-5 py-3 rounded-full shadow-lg hover:bg-teal-700 transition z-20"
            >
              <Scale size={16} /> Compare {compareIds.size} deals
            </button>
          )}
        </>
        )
      ) : tab === 'codes' ? (
        redemptions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Ticket className="mx-auto text-gray-300" size={48} />
            <h3 className="text-xl font-bold text-gray-800 mt-4">No claimed deals yet</h3>
            <p className="text-gray-500 text-sm mt-2">Tap the ticket icon on a deal to claim a redeemable code.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {redemptions.map(r => (
              <div key={r.redemptionID} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-800 line-clamp-1">{r.promotion?.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{r.promotion?.store?.storeName || 'DealNest Store'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${r.redeemed ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700'}`}>
                    {r.redeemed ? 'Redeemed' : 'Active'}
                  </span>
                </div>
                <p className="font-mono text-lg font-bold tracking-widest text-teal-600 bg-teal-50 rounded-xl text-center py-3 mt-3">{r.code}</p>
              </div>
            ))}
          </div>
        )
      ) : null}

      <CompareDealsModal
        open={showCompare}
        promotions={compareSelectedPromotions}
        onClose={() => setShowCompare(false)}
      />
    </div>
  );
}
