import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { promotionService, savedPromotionService, redemptionService, dealAlertService, searchHistoryService } from '../services/api';
import {
  Search, Tag, Clock, Ticket, Bookmark, BellPlus, Flame, Star, Store as StoreIcon, Sparkles, Scale, History, X
} from 'lucide-react';
import { CATEGORIES, CATEGORY_ICON, CATEGORY_BG } from '../constants/categories';
import CompareDealsModal from '../components/CompareDealsModal';

function daysLeft(endDate) {
  if (!endDate) return null;
  const diffMs = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function CategoryIcon({ category, size = 20 }) {
  const Icon = CATEGORY_ICON[category] || StoreIcon;
  return <Icon size={size} className="text-gray-600" />;
}

export default function DealsPage({ user }) {
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [budget, setBudget] = useState(searchParams.get('budget') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [applied, setApplied] = useState({
    keyword: searchParams.get('q') || '',
    budget: searchParams.get('budget') || '',
    category: searchParams.get('category') || '',
  });
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [savedPromotionIds, setSavedPromotionIds] = useState(new Set());
  const [claimingId, setClaimingId] = useState(null);
  const [claimedCode, setClaimedCode] = useState(null);

  const [watchError, setWatchError] = useState('');
  const [watchGated, setWatchGated] = useState(false);
  const [watchCreated, setWatchCreated] = useState(false);
  const [savingWatch, setSavingWatch] = useState(false);

  const [showCompare, setShowCompare] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const isPlus = user?.planTier === 'PLUS';

  const recordSearch = (q) => {
    if (!user?.userID || !q.trim()) return;
    searchHistoryService.create(user.userID, q.trim())
      .then(created => {
        setRecentSearches(prev =>
          [created, ...prev.filter(i => i.searchID !== created.searchID)].slice(0, 8));
      })
      .catch(() => {});
  };

  const runSearch = (filters) => {
    setLoading(true);
    promotionService.search({
      keyword: filters.keyword,
      maxPrice: filters.budget ? parseFloat(filters.budget) : null,
      category: filters.category || null,
    })
      .then(data => {
        setPromotions(data);
        setHasSearched(true);
      })
      .catch(() => setPromotions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    runSearch(applied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.userID) {
      savedPromotionService.getByUser(user.userID)
        .then(data => setSavedPromotionIds(new Set(data.map(sp => sp.promotion?.promotionID))))
        .catch(() => {});
      searchHistoryService.getByUser(user.userID)
        .then(items => setRecentSearches(
          items.slice().sort((a, b) => new Date(b.searchDate) - new Date(a.searchDate)).slice(0, 8)))
        .catch(() => {});
    }
  }, [user?.userID]);

  const handleSearch = (e) => {
    e.preventDefault();
    const next = { keyword: keyword.trim(), budget: budget.trim(), category };
    setApplied(next);
    setWatchCreated(false);
    setWatchGated(false);
    setWatchError('');
    runSearch(next);
    recordSearch(next.keyword);
  };

  const applyRecentSearch = (item) => {
    setKeyword(item.searchQuery);
    setWatchCreated(false);
    setWatchGated(false);
    setWatchError('');
    const next = { keyword: item.searchQuery, budget: budget.trim(), category };
    setApplied(next);
    runSearch(next);
    recordSearch(item.searchQuery);
  };

  const removeRecentSearch = async (item) => {
    const ok = await searchHistoryService.remove(item.searchID);
    if (ok) setRecentSearches(prev => prev.filter(i => i.searchID !== item.searchID));
  };

  const clearSearch = () => {
    setKeyword('');
    setBudget('');
    setCategory('');
    const next = { keyword: '', budget: '', category: '' };
    setApplied(next);
    setPromotions([]);
    setHasSearched(false);
    setWatchCreated(false);
    setWatchGated(false);
    setWatchError('');
    runSearch(next);
  };

  const handleWatch = async () => {
    setWatchError('');
    setWatchGated(false);
    setWatchCreated(false);
    if (!user?.userID) {
      setWatchError('Sign in to watch a deal.');
      return;
    }
    if (!keyword.trim()) {
      setWatchError('Type a product or store name to watch.');
      return;
    }
    setSavingWatch(true);
    try {
      await dealAlertService.create({
        user: { userID: user.userID },
        keyword: keyword.trim(),
        maxPrice: budget ? parseFloat(budget) : null,
        category: category || null,
      });
      setWatchCreated(true);
    } catch (err) {
      if (err.message === 'UPGRADE_REQUIRED') setWatchGated(true);
      else setWatchError(err.message || 'Failed to start watching.');
    } finally {
      setSavingWatch(false);
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
      if (error.message?.includes('Upgrade to DealNest Plus')) alert(error.message);
    }
  };

  const handleClaimPromo = async (promotionId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.userID || claimingId) return;
    setClaimingId(promotionId);
    try {
      const redemption = await redemptionService.claim(user.userID, promotionId);
      setClaimedCode(redemption.code);
    } catch (error) {
      alert(error.message || 'Failed to claim this deal.');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="p-6 pb-24 max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-bold text-gray-800">Deals</h2>
        {hasSearched && !loading && (
          <button type="button" onClick={clearSearch} className="text-xs font-semibold text-gray-500 hover:text-red-500 transition">
            Clear search
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">Find a product, set your budget, and let DealNest do the hunting.</p>

      {/* Search form */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <label htmlFor="deals-keyword" className="sr-only">Product or store</label>
            <Search className="absolute left-3 top-3 text-gray-400" size={18} aria-hidden="true" />
            <input
              id="deals-keyword"
              type="text"
              autoComplete="off"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Product or store, e.g. air fryer"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 shadow-sm"
            />
          </div>
          <div className="relative sm:w-44">
            <label htmlFor="deals-budget" className="sr-only">Max price</label>
            <span className="absolute left-3 top-3 text-gray-400 font-semibold" aria-hidden="true">R</span>
            <input
              id="deals-budget"
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Max price"
              className="w-full pl-7 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 shadow-sm"
            />
          </div>
          <button type="submit" className="px-6 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition flex-shrink-0">
            Search
          </button>
        </div>

        {recentSearches.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
              <History size={12} /> Recent
            </span>
            {recentSearches.map(item => (
              <div key={item.searchID} className="flex items-center gap-0.5 bg-gray-50 border border-gray-100 rounded-full pl-2.5 pr-1 py-0.5">
                <button
                  type="button"
                  onClick={() => applyRecentSearch(item)}
                  className="text-xs font-semibold text-gray-600 py-0.5 hover:text-teal-600 transition"
                >
                  {item.searchQuery}
                </button>
                <button
                  type="button"
                  onClick={() => removeRecentSearch(item)}
                  aria-label={`Remove ${item.searchQuery} from recent searches`}
                  className="flex items-center p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(prev => prev === cat.value ? '' : cat.value)}
              aria-pressed={category === cat.value}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${category === cat.value ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Watch (Plus) */}
        <div className="border-t border-gray-100 pt-3">
          {watchCreated ? (
            <div className="flex items-center justify-between gap-3 bg-teal-50 border border-teal-200 text-teal-700 text-sm p-3 rounded-xl">
              <span>Watching “{keyword}”{budget ? ` under R${budget}` : ''} — we'll ping you when a matching deal goes live.</span>
              <Link to="/profile" className="font-semibold hover:underline flex-shrink-0">Manage</Link>
            </div>
          ) : watchGated ? (
            <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm p-3 rounded-xl">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="flex-shrink-0" /> Watching deals is a DealNest Plus perk.
              </span>
              <Link to="/profile" className="font-semibold hover:underline flex-shrink-0">Upgrade</Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-400">
                Watch this search and get pinged the moment a deal within budget drops.{' '}
                {!isPlus && <span className="text-amber-600 font-semibold">Plus perk.</span>}
              </p>
              <button
                type="button"
                onClick={handleWatch}
                disabled={savingWatch || !keyword.trim()}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${isPlus ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
              >
                <BellPlus size={14} /> {savingWatch ? 'Saving…' : 'Watch this search'}
              </button>
            </div>
          )}
          {watchError && (
            <p role="alert" className="text-xs text-red-600 mt-2">{watchError}</p>
          )}
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="text-center text-gray-500 py-20">Searching deals...</div>
      ) : !hasSearched && promotions.length === 0 ? (
        <div className="text-center text-gray-500 py-20">Search for a product to see live deals.</div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <StoreIcon className="mx-auto text-gray-300" size={40} />
          <h4 className="font-bold text-gray-800 mt-3">No deals match right now</h4>
          <p className="text-gray-500 text-sm mt-1">Try a different product or budget — or watch this search and we'll let you know.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400">
              {promotions.length} matching deal{promotions.length === 1 ? '' : 's'}
            </p>
            <button
              type="button"
              onClick={() => setShowCompare(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-teal-300 hover:text-teal-600 transition"
            >
              <Scale size={13} /> Compare deals
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {promotions.map(promo => {
            const remaining = daysLeft(promo.endDate);
            const categoryName = promo.store?.category;
            return (
              <Link
                key={promo.promotionID}
                to={promo.store ? `/store/${promo.store.storeId}` : '#'}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-lg hover:-translate-y-0.5 transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  {promo.imageUrl ? (
                    <img src={promo.imageUrl} alt="" className="w-11 h-11 rounded-xl object-cover" />
                  ) : (
                    <div className={`w-11 h-11 ${CATEGORY_BG[categoryName] || 'bg-gray-100'} rounded-xl flex items-center justify-center`}>
                      <CategoryIcon category={categoryName} size={20} />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 bg-teal-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
                      <Tag size={11} />
                      {promo.discountPercentage ? `${promo.discountPercentage}%` : 'DEAL'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleClaimPromo(promo.promotionID, e)}
                      disabled={claimingId === promo.promotionID}
                      aria-label="Claim deal"
                      className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-teal-50 transition text-gray-500 hover:text-teal-600 flex-shrink-0 disabled:opacity-50"
                    >
                      <Ticket size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSavePromotion(promo.promotionID, e)}
                      aria-label="Save deal"
                      className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-teal-50 transition text-gray-500 hover:text-teal-600 flex-shrink-0"
                    >
                      <Bookmark size={16} fill={savedPromotionIds.has(promo.promotionID) ? 'currentColor' : 'none'} className={savedPromotionIds.has(promo.promotionID) ? 'text-teal-600' : ''} />
                    </button>
                  </div>
                </div>
                <h4 className="font-bold text-gray-800 line-clamp-1 flex items-center gap-1.5">
                  {promo.title}
                  {promo.featured && (
                    <span className="flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                      <Star size={9} fill="currentColor" /> Featured
                    </span>
                  )}
                  {promo.promoted && (
                    <span className="flex items-center gap-0.5 bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                      <Flame size={9} /> Promoted
                    </span>
                  )}
                </h4>
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
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                    <Clock size={11} /> {remaining === 0 ? 'Ends today' : `${remaining}d left`}
                  </div>
                )}
              </Link>
            );
          })}
          </div>
        </>
      )}

      <CompareDealsModal
        open={showCompare}
        promotions={promotions}
        onClose={() => setShowCompare(false)}
      />

      {claimedCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setClaimedCode(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <Ticket className="mx-auto text-teal-600 w-10 h-10" aria-hidden="true" />
            <h3 className="text-lg font-bold text-gray-800 mt-3">Deal claimed!</h3>
            <p className="text-sm text-gray-500 mt-1">Show this code in-store to redeem it.</p>
            <p className="font-mono text-2xl font-bold tracking-widest text-teal-600 bg-teal-50 rounded-xl py-4 mt-4">{claimedCode}</p>
            <button type="button" onClick={() => setClaimedCode(null)} className="btn-primary mt-4">Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}