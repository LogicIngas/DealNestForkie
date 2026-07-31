import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { storeService, favoriteService, promotionService } from '../services/api';
import { Search, Heart, MapPin, List, Map as MapIcon, Store as StoreIcon } from 'lucide-react';
import { CATEGORY_ICON, CATEGORY_BG, CATEGORY_COLOR } from '../constants/categories';
import StoreMap from '../components/StoreMap';

function filterStores(stores, term) {
  if (!term) return stores;
  return stores.filter(store =>
    store.storeName.toLowerCase().includes(term) ||
    store.city.toLowerCase().includes(term) ||
    store.category.toLowerCase().includes(term)
  );
}

export default function ExplorePage({ user }) {
  const [searchParams] = useSearchParams();
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('category')?.toLowerCase() || '');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');

  useEffect(() => {
    storeService.getAll()
      .then(data => {
        setStores(data);
        setFilteredStores(filterStores(data, searchTerm));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    promotionService.getActive()
      .then(setPromotions)
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredStores(filterStores(stores, term));
  };

  const handleFavorite = async (storeId) => {
    try {
      await favoriteService.add(user.userID, storeId);
      alert('Store added to favorites!');
    } catch (error) {
      alert('Error adding to favorites. It may already be saved.');
    }
  };

  return (
    <div className="p-6 pb-24">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Explore</h2>
        <div className="flex bg-gray-100 rounded-xl p-1 flex-shrink-0">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${view === 'list' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
          >
            <List size={14} /> List
          </button>
          <button
            onClick={() => setView('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${view === 'map' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
          >
            <MapIcon size={14} /> Map
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search stores, cities, or categories..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 shadow-sm"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading deals...</div>
      ) : view === 'map' ? (
        filteredStores.length === 0 ? (
          <div className="text-center text-gray-500 py-20">No stores found matching your search.</div>
        ) : (
          <StoreMap stores={filteredStores} promotions={promotions} />
        )
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredStores.length === 0 && (
            <div className="text-center text-gray-500 py-20">No stores found matching your search.</div>
          )}
          {filteredStores.map(store => {
            const CatIcon = CATEGORY_ICON[store.category] || StoreIcon;
            return (
            <div key={store.storeId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-start gap-4 hover:shadow-md transition">
              <div className={`w-16 h-16 ${CATEGORY_BG[store.category] || 'bg-gray-100'} rounded-xl flex items-center justify-center`}>
                <CatIcon size={26} className={CATEGORY_COLOR[store.category] || 'text-gray-600'} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-800">{store.storeName}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} /> {store.city}
                    </p>
                    <span className="inline-block bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded mt-1 uppercase font-bold tracking-wider">
                      {store.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleFavorite(store.storeId)}
                    className="p-2 hover:bg-red-50 rounded-full transition text-gray-500 hover:text-red-500"
                  >
                    <Heart size={20} />
                  </button>
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