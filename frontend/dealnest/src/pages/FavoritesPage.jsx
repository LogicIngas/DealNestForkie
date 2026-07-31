import React, { useState, useEffect } from 'react';
import { favoriteService, savedPromotionService } from '../services/api';
import { MapPin, Trash2, Tag, Clock, HeartCrack, Bookmark, Store as StoreIcon } from 'lucide-react';
import { CATEGORY_ICON, CATEGORY_BG, CATEGORY_COLOR } from '../constants/categories';

function daysLeft(endDate) {
  if (!endDate) return null;
  const diffMs = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export default function FavoritesPage({ user }) {
  const [tab, setTab] = useState('stores');
  const [favorites, setFavorites] = useState([]);
  const [savedPromotions, setSavedPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [storesData, promosData] = await Promise.all([
        favoriteService.getByUser(user.userID),
        savedPromotionService.getByUser(user.userID),
      ]);
      setFavorites(storesData);
      setSavedPromotions(promosData);
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

  return (
    <div className="p-6 pb-24">
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
          <div className="grid grid-cols-1 gap-4">
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
      ) : savedPromotions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Bookmark className="mx-auto text-gray-300" size={48} />
          <h3 className="text-xl font-bold text-gray-800 mt-4">No saved deals yet</h3>
          <p className="text-gray-500 text-sm mt-2">Tap the bookmark on any deal to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {savedPromotions.map(sp => {
            const promo = sp.promotion;
            const remaining = daysLeft(promo?.endDate);
            const CatIcon = CATEGORY_ICON[promo?.store?.category] || StoreIcon;
            return (
              <div key={sp.savedPromotionID} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-start gap-4 hover:shadow-md transition">
                <div className={`w-16 h-16 ${CATEGORY_BG[promo?.store?.category] || 'bg-gray-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <CatIcon size={26} className={CATEGORY_COLOR[promo?.store?.category] || 'text-gray-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-800 line-clamp-1">{promo?.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{promo?.store?.storeName || 'DealNest Store'}</p>
                    </div>
                    <button
                      onClick={() => handleRemovePromotion(sp.savedPromotionID)}
                      className="p-2 hover:bg-red-50 rounded-full transition text-gray-500 hover:text-red-500 flex-shrink-0"
                    >
                      <Trash2 size={20} />
                    </button>
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
      )}
    </div>
  );
}
