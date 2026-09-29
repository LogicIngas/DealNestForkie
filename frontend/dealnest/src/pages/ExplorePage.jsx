import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { storeService, favoriteService, promotionService } from '../services/api';
import { Search, Heart, MapPin, List, Map as MapIcon, Store as StoreIcon, SlidersHorizontal, X, Star, Navigation } from 'lucide-react';
import { CATEGORIES, CATEGORY_ICON, CATEGORY_BG, CATEGORY_COLOR } from '../constants/categories';
import StoreMap from '../components/StoreMap';

const RATING_OPTIONS = [0, 3, 4, 4.5];
const DISTANCE_OPTIONS = [null, 1, 5, 10, 25];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'distance', label: 'Nearest' },
  { value: 'name', label: 'Name A-Z' },
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function matchesSearch(store, term) {
  if (!term) return true;
  return (
    store.storeName.toLowerCase().includes(term) ||
    store.city.toLowerCase().includes(term) ||
    store.category.toLowerCase().includes(term)
  );
}

const defaultFilters = { categories: [], minRating: 0, maxDistanceKm: null, dealsOnly: false, sortBy: 'relevance' };

export default function ExplorePage({ user }) {
  const [searchParams] = useSearchParams();
  const [stores, setStores] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const initialCategory = searchParams.get('category');
  const isKnownCategory = CATEGORIES.some(c => c.value === initialCategory);
  const [searchTerm, setSearchTerm] = useState(isKnownCategory ? '' : (initialCategory?.toLowerCase() || ''));
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(() => ({
    ...defaultFilters,
    categories: isKnownCategory ? [initialCategory] : [],
  }));
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    storeService.getAll()
      .then(data => {
        setStores(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // 0, not a limit: this list is used to work out which stores currently have a live
    // deal, and that question cannot be answered from the first page of them. It is the
    // one caller that really does want the whole feed.
    promotionService.getActive(0)
      .then(setPromotions)
      .catch(() => {});

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const dealStoreIds = useMemo(() => {
    const ids = new Set();
    promotions.forEach(p => { if (p.store?.storeId) ids.add(p.store.storeId); });
    return ids;
  }, [promotions]);

  const filteredStores = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let result = stores.filter(store => {
      if (!matchesSearch(store, term)) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(store.category)) return false;
      if (filters.minRating > 0 && (store.averageRating || 0) < filters.minRating) return false;
      if (filters.dealsOnly && !dealStoreIds.has(store.storeId)) return false;
      if (filters.maxDistanceKm != null) {
        if (!userLocation || !store.latitude || !store.longitude) return false;
        const distance = haversineKm(userLocation.lat, userLocation.lng, store.latitude, store.longitude);
        if (distance > filters.maxDistanceKm) return false;
      }
      return true;
    });

    if (filters.sortBy === 'rating') {
      result = [...result].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (filters.sortBy === 'name') {
      result = [...result].sort((a, b) => a.storeName.localeCompare(b.storeName));
    } else if (filters.sortBy === 'distance' && userLocation) {
      result = [...result].sort((a, b) => {
        const dA = a.latitude && a.longitude ? haversineKm(userLocation.lat, userLocation.lng, a.latitude, a.longitude) : Infinity;
        const dB = b.latitude && b.longitude ? haversineKm(userLocation.lat, userLocation.lng, b.latitude, b.longitude) : Infinity;
        return dA - dB;
      });
    }

    return result;
  }, [stores, searchTerm, filters, userLocation, dealStoreIds]);

  const activeFilterCount =
    filters.categories.length +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.maxDistanceKm != null ? 1 : 0) +
    (filters.dealsOnly ? 1 : 0) +
    (filters.sortBy !== 'relevance' ? 1 : 0);

  const toggleCategory = (value) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(value)
        ? prev.categories.filter(c => c !== value)
        : [...prev.categories, value],
    }));
  };

  const clearFilters = () => setFilters(defaultFilters);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleFavorite = async (storeId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await favoriteService.add(user.userID, storeId);
      alert('Store added to favorites!');
    } catch (error) {
      alert('Error adding to favorites. It may already be saved.');
    }
  };

  return (
    <div className="p-6 pb-24 max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Explore</h2>
        <div className="flex bg-gray-100 rounded-xl p-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${view === 'list' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
          >
            <List size={14} aria-hidden="true" /> List
          </button>
          <button
            type="button"
            onClick={() => setView('map')}
            aria-pressed={view === 'map'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${view === 'map' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
          >
            <MapIcon size={14} aria-hidden="true" /> Map
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <label htmlFor="explore-search" className="sr-only">Search stores, cities, or categories</label>
          <Search className="absolute left-3 top-3 text-gray-400" size={20} aria-hidden="true" />
          <input
            id="explore-search"
            type="text"
            name="search"
            autoComplete="off"
            placeholder="Search stores, cities, or categories…"
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 shadow-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(v => !v)}
          aria-pressed={showFilters}
          aria-expanded={showFilters}
          className={`relative flex items-center justify-center min-w-11 min-h-11 rounded-xl border transition flex-shrink-0 ${showFilters || activeFilterCount > 0 ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-white border-gray-200 text-gray-500'}`}
        >
          <SlidersHorizontal size={18} aria-hidden="true" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-teal-600 text-white text-[10px] font-bold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">Filters</h3>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearFilters} className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-500 transition">
                <X size={12} /> Clear all
              </button>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategory(cat.value)}
                  aria-pressed={filters.categories.includes(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${filters.categories.includes(cat.value) ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Minimum rating</p>
            <div className="flex flex-wrap gap-2">
              {RATING_OPTIONS.map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                  aria-pressed={filters.minRating === rating}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${filters.minRating === rating ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300'}`}
                >
                  {rating === 0 ? 'Any' : <>{rating}<Star size={11} fill="currentColor" /></>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              Distance
              {!userLocation && <span className="normal-case font-medium text-gray-400">(enable location to use)</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {DISTANCE_OPTIONS.map(km => (
                <button
                  key={km ?? 'any'}
                  type="button"
                  disabled={km != null && !userLocation}
                  onClick={() => setFilters(prev => ({ ...prev, maxDistanceKm: km }))}
                  aria-pressed={filters.maxDistanceKm === km}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition disabled:opacity-40 disabled:cursor-not-allowed ${filters.maxDistanceKm === km ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300'}`}
                >
                  {km == null ? 'Any' : `${km} km`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label htmlFor="deals-only" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                id="deals-only"
                type="checkbox"
                checked={filters.dealsOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, dealsOnly: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              Active deals only
            </label>
          </div>

          <div>
            <label htmlFor="sort-by" className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Sort by</label>
            <select
              id="sort-by"
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="input-field"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} disabled={opt.value === 'distance' && !userLocation}>
                  {opt.label}{opt.value === 'distance' && !userLocation ? ' (needs location)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!loading && userLocation && filters.sortBy === 'distance' && (
        <p className="flex items-center gap-1.5 text-xs text-gray-400 mb-4 -mt-2">
          <Navigation size={12} /> Sorted by distance from your current location
        </p>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading deals...</div>
      ) : view === 'map' ? (
        filteredStores.length === 0 ? (
          <div className="text-center text-gray-500 py-20">No stores found matching your search.</div>
        ) : (
          <StoreMap stores={filteredStores} promotions={promotions} />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStores.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-20">No stores found matching your search.</div>
          )}
          {filteredStores.map(store => {
            const CatIcon = CATEGORY_ICON[store.category] || StoreIcon;
            return (
            <Link key={store.storeId} to={`/store/${store.storeId}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition">
              {store.imageUrl ? (
                <img src={store.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className={`w-16 h-16 ${CATEGORY_BG[store.category] || 'bg-gray-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <CatIcon size={26} className={CATEGORY_COLOR[store.category] || 'text-gray-600'} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-800 line-clamp-1">{store.storeName}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} /> {store.city}
                    </p>
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded mt-1 uppercase font-bold tracking-wider">
                      {store.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleFavorite(store.storeId, e)}
                    aria-label="Save store"
                    className="min-w-11 min-h-11 flex items-center justify-center hover:bg-red-50 rounded-full transition text-gray-500 hover:text-red-500 flex-shrink-0"
                  >
                    <Heart size={20} />
                  </button>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}