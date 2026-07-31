import React, { useState, useEffect } from 'react';
import { storeService, promotionService, favoriteService, savedPromotionService } from '../services/api';
import { MapPin, Star, Tag, Clock, ArrowRight, Store as StoreIcon, Heart, Bookmark, Flame } from 'lucide-react';
import { CATEGORIES, CATEGORY_ICON, CATEGORY_BG, CATEGORY_COLOR } from '../constants/categories';

function daysLeft(endDate) {
  if (!endDate) return null;
  const diffMs = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function CategoryIcon({ category, size = 20 }) {
  const Icon = CATEGORY_ICON[category] || StoreIcon;
  return <Icon size={size} className={CATEGORY_COLOR[category] || 'text-gray-600'} />;
}

function SectionHeader({ title, icon: Icon }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-1.5">
        {Icon && <Icon size={18} className="text-orange-500" />} {title}
      </h3>
      <a href="/explore" className="text-xs font-semibold text-teal-600 flex items-center gap-0.5 hover:underline">
        See all <ArrowRight size={12} />
      </a>
    </div>
  );
}

export default function HomePage({ user }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [favoriteStoreIds, setFavoriteStoreIds] = useState(new Set());
  const [savedPromotionIds, setSavedPromotionIds] = useState(new Set());

  useEffect(() => {
    storeService.getAll()
      .then(data => {
        // Keep only active stores for the home page
        setStores(data.filter(s => s.active === true));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    promotionService.getActive()
      .then(data => {
        setPromotions(data.slice(0, 6));
        setLoadingPromotions(false);
      })
      .catch(() => setLoadingPromotions(false));

    if (user?.userID) {
      favoriteService.getByUser(user.userID)
        .then(data => setFavoriteStoreIds(new Set(data.map(f => f.store?.storeId))))
        .catch(() => {});

      savedPromotionService.getByUser(user.userID)
        .then(data => setSavedPromotionIds(new Set(data.map(sp => sp.promotion?.promotionID))))
        .catch(() => {});
    }
  }, [user?.userID]);

  const handleFavorite = async (storeId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.userID || favoriteStoreIds.has(storeId)) return;
    try {
      await favoriteService.add(user.userID, storeId);
      setFavoriteStoreIds(prev => new Set(prev).add(storeId));
    } catch (error) {
      // Store may already be saved; nothing else to do here.
    }
  };

  const handleSavePromotion = async (promotionId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.userID || savedPromotionIds.has(promotionId)) return;
    try {
      await savedPromotionService.add(user.userID, promotionId);
      setSavedPromotionIds(prev => new Set(prev).add(promotionId));
    } catch (error) {
      // Promotion may already be saved; nothing else to do here.
    }
  };

  return (
    <div className="p-6 pb-24">
      {/* Hero */}
      <div className="mb-8 bg-gradient-to-br from-teal-600 to-teal-500 rounded-3xl p-6 text-white shadow-lg shadow-teal-200/50">
        <h2 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h2>
        <p className="text-teal-50 text-sm mt-1 opacity-90">Discover the best deals near you today.</p>
        {!loading && !loadingPromotions && (
          <div className="flex gap-2 mt-4">
            <span className="bg-white/15 px-3 py-1 rounded-full text-xs font-semibold">{promotions.length} deals live</span>
            <span className="bg-white/15 px-3 py-1 rounded-full text-xs font-semibold">{stores.length} stores nearby</span>
          </div>
        )}
      </div>

      {/* Browse by Category */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Browse by Category</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory">
          {CATEGORIES.map(cat => (
            <a
              key={cat.value}
              href={`/explore?category=${cat.value}`}
              className="flex-shrink-0 w-20 flex flex-col items-center gap-1.5 text-center snap-start group"
            >
              <div className={`w-14 h-14 ${cat.bg} rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition`}>
                <cat.icon size={24} className={cat.color} />
              </div>
              <span className="text-xs text-gray-600 font-medium line-clamp-1">{cat.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Hot Deals */}
      {loadingPromotions ? (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-1.5">
            <Flame size={18} className="text-orange-500" /> Hot Deals
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-shrink-0 w-60 h-40 bg-white rounded-3xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      ) : promotions.length > 0 && (
        <div className="mb-8">
          <SectionHeader title="Hot Deals" icon={Flame} />
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory">
            {promotions.map(promo => {
              const remaining = daysLeft(promo.endDate);
              const category = promo.store?.category;
              return (
                <a
                  key={promo.promotionID}
                  href={promo.store ? `/store/${promo.store.storeId}` : '#'}
                  className="flex-shrink-0 w-60 snap-start bg-white rounded-3xl shadow-sm border border-gray-100 p-4 hover:shadow-lg hover:-translate-y-0.5 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-11 h-11 ${CATEGORY_BG[category] || 'bg-gray-100'} rounded-xl flex items-center justify-center`}>
                      <CategoryIcon category={category} size={20} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 bg-teal-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
                        <Tag size={11} />
                        {promo.discountPercentage ? `${promo.discountPercentage}%` : 'DEAL'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleSavePromotion(promo.promotionID, e)}
                        aria-label="Save deal"
                        className="p-1 rounded-full hover:bg-teal-50 transition text-gray-500 hover:text-teal-600 flex-shrink-0"
                      >
                        <Bookmark size={16} fill={savedPromotionIds.has(promo.promotionID) ? 'currentColor' : 'none'} className={savedPromotionIds.has(promo.promotionID) ? 'text-teal-600' : ''} />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-800 line-clamp-1">{promo.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{promo.store?.storeName || 'DealNest Store'}</p>
                  <div className="flex items-baseline gap-2 mt-3">
                    {promo.discountPrice != null && (
                      <span className="text-teal-600 font-extrabold text-lg">R{promo.discountPrice.toFixed(2)}</span>
                    )}
                    {promo.originalPrice != null && (
                      <span className="text-gray-400 text-xs line-through">R{promo.originalPrice.toFixed(2)}</span>
                    )}
                  </div>
                  {remaining !== null && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-100">
                      <Clock size={11} /> {remaining === 0 ? 'Ends today' : `${remaining}d left`}
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured Stores */}
      <SectionHeader title="Featured Stores" />
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white rounded-3xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <StoreIcon className="mx-auto text-gray-300" size={40} />
          <h4 className="font-bold text-gray-800 mt-3">No stores yet</h4>
          <p className="text-gray-500 text-sm mt-1">Check back soon for local favorites.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {stores.slice(0, 4).map(store => (
            <a key={store.storeId} href={`/store/${store.storeId}`} className="block bg-white rounded-3xl shadow-sm border border-gray-100 p-4 hover:shadow-lg hover:-translate-y-0.5 transition">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 ${CATEGORY_BG[store.category] || 'bg-gray-100'} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <CategoryIcon category={store.category} size={26} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-800 line-clamp-1">{store.storeName}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} /> {store.city}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
                        <Star size={12} fill="currentColor" /> {store.averageRating?.toFixed(1) || 'New'}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleFavorite(store.storeId, e)}
                        aria-label="Save store"
                        className="p-1.5 rounded-full hover:bg-red-50 transition text-gray-500 hover:text-red-500"
                      >
                        <Heart size={16} fill={favoriteStoreIds.has(store.storeId) ? 'currentColor' : 'none'} className={favoriteStoreIds.has(store.storeId) ? 'text-red-500' : ''} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{store.description || 'Local favorite store'}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
