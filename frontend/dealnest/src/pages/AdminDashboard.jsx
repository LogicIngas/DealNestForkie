import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShieldCheck, LogOut, Users, Tag, BadgeCheck, Trash2, MapPin, Store as StoreIcon, Flag, Check, X as XIcon, Sparkles, Crown
} from 'lucide-react';
import { storeService, userService, promotionService, dealReportService, adminService, ADMIN_SCOPE } from '../services/api';
import { CATEGORY_ICON } from '../constants/categories';
import ConfirmModal from '../components/ConfirmModal';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'stores', label: 'Stores' },
  { key: 'users', label: 'Users' },
  { key: 'promotions', label: 'Promotions' },
  { key: 'reports', label: 'Reports' },
];

// The overview grid is 3 columns wide, so the loading skeleton draws nine cards to
// match the nine stat cards it stands in for.
const STAT_CARD_PLACEHOLDERS = Array.from({ length: 9 }, (_, i) => i);

// A screenful of cards for a tab that is still fetching. Enough to fill the grid at
// its widest so the layout does not jump when the real rows land.
const CARD_PLACEHOLDERS = Array.from({ length: 6 }, (_, i) => i);

const REPORT_REASON_LABELS = {
  MISLEADING: 'Misleading information',
  EXPIRED: 'Deal has expired',
  INAPPROPRIATE: 'Inappropriate content',
  SCAM: 'Looks like a scam',
  DUPLICATE: 'Duplicate listing',
  OTHER: 'Other',
};

export default function AdminDashboard({ admin, onLogout }) {
  const [tab, setTab] = useState('overview');

  // The overview's numbers, counted by the database. This is the only thing the
  // first paint waits on, and it is one small aggregate response.
  const [stats, setStats] = useState(null);

  // The tab lists. Each is fetched the first time its tab is opened, not on mount:
  // the overview does not read them, so loading all four up front made the console
  // pay for four full tables before showing a page that had already rendered.
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [reports, setReports] = useState([]);

  // The overview's activity table. A short, capped list rather than the whole
  // promotions table it used to slice eight rows out of.
  const [recentPromotions, setRecentPromotions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  // Distinguishes "nothing came back" from "one section failed". The empty state is
  // only honest when every request failed; a partial failure still has real content
  // to show, and hiding it behind an error page would be its own lie.
  const [anyLoaded, setAnyLoaded] = useState(false);

  const [storeBusyId, setStoreBusyId] = useState(null);
  const [userBusyId, setUserBusyId] = useState(null);
  const [promoBusyId, setPromoBusyId] = useState(null);
  const [promoToDelete, setPromoToDelete] = useState(null);
  const [reportBusyId, setReportBusyId] = useState(null);

  // A tab that has already been opened keeps its data, so moving back and forth does
  // not refetch. Only a first visit (or an explicit Retry) fetches.
  const loadedTabs = useRef(new Set());

  // Per-tab paging. Each entry is { page, last, total } — the "is there another page"
  // and "how many rows exist" answers come from the server response rather than from
  // measuring the accumulated array, which is wrong as soon as an admin deletes a row
  // from the page in front of them. One request per page instead of one per tab.
  const [paging, setPaging] = useState({});

  // Whether a tab's first load has settled — succeeded or failed. This is state, not a
  // ref, and that is the whole fix: React runs effects after paint, so a tab switch used
  // to render one frame with an empty array and no loading flag, which painted "No users
  // yet." before the request had even been sent. Keying the skeleton off this instead is
  // correct whatever order things happen in, because it is false from the moment the tab
  // is selected rather than from the moment the response arrives.
  const [tabLoaded, setTabLoaded] = useState({});
  // Per-tab failure, so a tab that could not be fetched says so instead of claiming there
  // is nothing to show. "No users yet" and "the users request failed" are different
  // sentences, and only one of them is true.
  const [tabErrors, setTabErrors] = useState({});

  const [loadingMore, setLoadingMore] = useState({});
  // Ref, not state: setState does not take effect until the next render, so two clicks
  // landing in the same tick would both read loadingMore as false and both request the
  // same page. This flips synchronously.
  const pagingInFlight = useRef(new Set());

  useEffect(() => {
    loadStats();
  }, []);

  // Fetching is started from the tab click rather than from an effect on `tab`. React
  // batches setTab with the loading state this triggers into one render, so the skeleton
  // is the first thing that paints. An effect on `tab` would leave a frame in between,
  // and that frame is what showed "No users yet." while the request was still in flight.
  const handleTabChange = (next) => {
    setTab(next);
    if (next === 'overview') return;
    if (loadedTabs.current.has(next)) return;
    loadedTabs.current.add(next);
    loadTab(next);
  };

  const loadStats = async () => {
    setLoading(true);
    setLoadError(null);
    // Two small requests in place of four whole tables. allSettled so a failure on
    // one still leaves the other on screen — the counts are the point of the page,
    // and losing the whole overview to a refused activity feed would be a bad trade.
    const [statsResult, recentResult] = await Promise.allSettled([
      adminService.getStats(),
      adminService.getRecentPromotions(8),
    ]);

    if (statsResult.status === 'fulfilled') {
      setStats(statsResult.value);
    }
    if (recentResult.status === 'fulfilled') {
      setRecentPromotions(recentResult.value);
    }

    if (statsResult.status === 'rejected' && recentResult.status === 'rejected') {
      setLoadError(statsResult.reason?.message || 'Could not load the admin overview.');
      setAnyLoaded(false);
    } else {
      setAnyLoaded(true);
      if (statsResult.status === 'rejected') {
        setLoadError('Could not load the statistics. The activity list below is up to date.');
      } else if (recentResult.status === 'rejected') {
        setLoadError('Could not load recent promotions. The statistics above are up to date.');
      }
    }
    setLoading(false);
  };

  // The four tab lists, one page at a time. The admin routes under /api/admin/* are
  // used rather than the shared storeService/userService/promotionService/
  // dealReportService ones, which still return whole tables for the shopfront.
  const PAGE_SIZE = 24;

  const loadTab = async (which, { append = false } = {}) => {
    const setters = {
      stores: setStores,
      users: setUsers,
      promotions: setPromotions,
      reports: setReports,
    };
    const loaders = {
      stores: adminService.getStoresPage,
      users: adminService.getUsersPage,
      promotions: adminService.getPromotionsPage,
      reports: adminService.getReportsPage,
    };
    const labels = {
      stores: 'Stores', users: 'Users', promotions: 'Promotions', reports: 'Reports',
    };
    // Each entity names its id differently, so a shared "row.id" would dedupe nothing
    // and let every overlap through.
    const idOf = {
      stores: row => row.storeId,
      users: row => row.userID,
      promotions: row => row.promotionID,
      reports: row => row.reportID,
    };

    if (append) {
      if (pagingInFlight.current.has(which)) return;
      pagingInFlight.current.add(which);
      setLoadingMore(prev => ({ ...prev, [which]: true }));
    } else {
      // Back to unsettled while the request is in flight, so a Retry shows the skeleton
      // rather than the failure text it is there to clear.
      setTabLoaded(prev => ({ ...prev, [which]: false }));
      // A retry starts clean, so a previous failure does not keep saying so once the
      // request is back in flight.
      setTabErrors(prev => ({ ...prev, [which]: null }));
    }

    const nextPage = append ? (paging[which]?.page ?? 0) + 1 : 0;

    try {
      const result = await loaders[which](nextPage, PAGE_SIZE);
      // Append for "load more", replace for a first load or a retry. Dedupe on the
      // entity's own id because a delete between two page requests shifts the window
      // and the same row can arrive twice; without this the admin sees a ghost they
      // just removed.
      setters[which]((prev) => (append
        ? [...prev, ...result.content.filter(row => !prev.some(p => idOf[which](p) === idOf[which](row)))]
        : result.content));
      setPaging(prev => ({ ...prev, [which]: {
        page: result.page,
        last: result.last,
        total: result.totalElements,
        // Kept so the footer can say "showing N of M" without re-deriving the page
        // size from a constant it might disagree with about.
        pageSize: result.size,
      } }));
    } catch (error) {
      const message = `${labels[which]} could not be loaded. ${error.message || ''}`.trim();
      setLoadError(message);
      setTabErrors(prev => ({ ...prev, [which]: message }));
    } finally {
      if (append) {
        pagingInFlight.current.delete(which);
        setLoadingMore(prev => ({ ...prev, [which]: false }));
      } else {
        // Settled, either way. Without this a failed tab would sit on the skeleton
        // forever, and an empty result would keep waiting for rows that are not coming.
        setTabLoaded(prev => ({ ...prev, [which]: true }));
      }
    }
  };

  // A moderation action changes a number the overview shows, so the counts are refetched
  // after one succeeds. Cheap now that they are counts rather than a re-scan of the tables.
  const refreshStats = () => {
    adminService.getStats().then(setStats).catch(() => {});
  };

  // Retry re-runs whatever failed: the stats for the overview, the first page for an
  // open tab. A retry replaces the tab's rows rather than appending, so a half-loaded
  // tab comes back whole.
  const handleRetry = () => {
    if (tab === 'overview') {
      loadStats();
      return;
    }
    loadTab(tab);
  };

  // A tab still waiting on its first response draws the skeleton. Keyed off whether the
  // load has settled, not off whether rows have arrived, so a genuinely empty tab shows
  // its empty state the moment the answer lands, and a tab in flight never claims to be
  // empty. tabHasContent could not do this: an empty array and an unanswered request look
  // identical, and it was reading the wrong one.
  const tabSettling = tab !== 'overview' && !tabLoaded[tab];

  // A tab that failed and a tab with nothing in it are different states, and only one of
  // them is "none found".
  const tabEmptyMessage = (which, emptyText) => (
    tabErrors[which] ? 'These could not be loaded. Use Retry above.' : emptyText
  );

  const handleResolveReport = async (report, status) => {
    setReportBusyId(report.reportID);
    try {
      const updated = await dealReportService.resolve(report.reportID, status, ADMIN_SCOPE);
      setReports(prev => prev.map(r => r.reportID === updated.reportID ? updated : r));
      // Resolving takes a report out of the pending count.
      refreshStats();
    } catch (error) {
      alert(error.message || 'Failed to update report.');
    } finally {
      setReportBusyId(null);
    }
  };

  // The users tab's "Store" badge. Read off the stats response rather than off the store
  // list: the store list is fetched on demand, so deriving this from it made the badge
  // appear only to an admin who had already opened the Stores tab.
  const storeOwnerIds = useMemo(
    () => new Set(stats?.storeOwnerIds || []),
    [stats]
  );

  const toggleStoreVerified = async (store) => {
    setStoreBusyId(store.storeId);
    try {
      const updated = await storeService.update(store.storeId, { ...store, verified: !store.verified }, ADMIN_SCOPE);
      setStores(prev => prev.map(s => s.storeId === updated.storeId ? updated : s));
      // Verifying moves a store out of the unverified count.
      refreshStats();
    } catch (error) {
      alert(error.message || 'Failed to update store.');
    } finally {
      setStoreBusyId(null);
    }
  };

  const toggleStoreActive = async (store) => {
    setStoreBusyId(store.storeId);
    try {
      const updated = await storeService.update(store.storeId, { ...store, active: !store.active }, ADMIN_SCOPE);
      setStores(prev => prev.map(s => s.storeId === updated.storeId ? updated : s));
      // Suspending moves a store out of the active count.
      refreshStats();
    } catch (error) {
      alert(error.message || 'Failed to update store.');
    } finally {
      setStoreBusyId(null);
    }
  };

  const toggleUserActive = async (user) => {
    setUserBusyId(user.userID);
    try {
      const updated = await userService.update(user.userID, { ...user, isActive: !user.isActive }, ADMIN_SCOPE);
      setUsers(prev => prev.map(u => u.userID === updated.userID ? updated : u));
    } catch (error) {
      alert(error.message || 'Failed to update user.');
    } finally {
      setUserBusyId(null);
    }
  };

  const handleDeletePromo = async () => {
    const promo = promoToDelete;
    if (!promo) return;
    setPromoToDelete(null);
    setPromoBusyId(promo.promotionID);
    try {
      await promotionService.remove(promo.promotionID, ADMIN_SCOPE);
      setPromotions(prev => prev.filter(p => p.promotionID !== promo.promotionID));
      // Take the row out of the count the footer shows too, so "showing 24 of 24" does
      // not linger after the admin deleted the 24th. The row count and the page
      // bookkeeping now come from the same place and have to move together.
      setPaging(prev => (prev.promotions
        ? { ...prev, promotions: { ...prev.promotions, total: Math.max(prev.promotions.total - 1, 0) } }
        : prev));
      // The total, and the active count if it was a live deal, both drop by one.
      refreshStats();
    } catch (error) {
      // remove() now throws on a denied delete, so a refusal is reported here
      // instead of leaving the row sitting there looking unresponsive.
      alert(error.message || 'Failed to remove promotion.');
    } finally {
      setPromoBusyId(null);
    }
  };

  // The counts are read off the server aggregate now. They used to be derived here
  // with Array.filter over the four full lists, which is what made the overview cost
  // the whole database to render. The 0 fallbacks are for the window before the
  // response lands, which the skeleton covers.
  const activeStoreCount = stats?.activeStores ?? 0;
  const unverifiedCount = stats?.unverifiedStores ?? 0;
  const activePromoCount = stats?.activePromotions ?? 0;
  const pendingReportCount = stats?.pendingReports ?? 0;
  const plusUserCount = stats?.plusUsers ?? 0;
  const proStoreCount = stats?.proStores ?? 0;
  const totalStoreCount = stats?.totalStores ?? 0;
  const totalUserCount = stats?.totalUsers ?? 0;
  const totalPromoCount = stats?.totalPromotions ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-teal-400" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-extrabold text-white leading-tight">DealNest Admin</h1>
            <p className="text-xs text-gray-400">{admin?.email}</p>
          </div>
        </div>
        <button type="button" onClick={onLogout} aria-label="Log out" className="min-w-11 min-h-11 flex items-center justify-center text-gray-300 hover:text-red-400 transition">
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      <div className="flex bg-white border-b border-gray-200 px-4 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabChange(t.key)}
            aria-pressed={tab === t.key}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${tab === t.key ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
        {loadError && (
          <div role="alert" className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <XIcon className="w-5 h-5 text-red-500 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm font-semibold text-red-800 flex-1 min-w-0">{loadError}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {STAT_CARD_PLACEHOLDERS.map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
          </div>
        ) : loadError && !anyLoaded ? (
          // Every request failed — that is an empty dataset only in the sense that
          // nothing arrived, so say so rather than drawing a convincing row of zeros.
          <EmptyState icon={XIcon} text="The admin data could not be loaded. Use Retry above." />
        ) : tabSettling ? (
          // A tab waiting on its first response. Skeleton rather than the empty state,
          // so "still loading" is never mistaken for "there is nothing here".
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CARD_PLACEHOLDERS.map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
          </div>
        ) : tab === 'overview' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard icon={StoreIcon} label="Total Stores" value={totalStoreCount} color="text-teal-500" />
              <StatCard icon={BadgeCheck} label="Active Stores" value={activeStoreCount} color="text-green-500" />
              <StatCard icon={ShieldCheck} label="Unverified Stores" value={unverifiedCount} color="text-amber-500" />
              <StatCard icon={Users} label="Total Users" value={totalUserCount} color="text-pink-500" />
              <StatCard icon={Tag} label="Total Promotions" value={totalPromoCount} color="text-purple-500" />
              <StatCard icon={Tag} label="Active Promotions" value={activePromoCount} color="text-teal-500" />
              <StatCard icon={Flag} label="Pending Reports" value={pendingReportCount} color="text-red-500" />
              <StatCard icon={Sparkles} label="Plus Users" value={plusUserCount} color="text-amber-500" />
              <StatCard icon={Crown} label="Pro Stores" value={proStoreCount} color="text-amber-500" />
            </div>

            <CategoryBarChart counts={stats?.storesByCategory} />
            <RecentActivityTable promotions={recentPromotions} />
          </div>
        ) : tab === 'stores' ? (
          stores.length === 0 ? (
            <EmptyState icon={StoreIcon} text={tabEmptyMessage('stores', 'No stores yet.')} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stores.map(store => {
                const CatIcon = CATEGORY_ICON[store.category] || StoreIcon;
                const busy = storeBusyId === store.storeId;
                return (
                  <div key={store.storeId} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CatIcon size={20} className="text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-gray-800 truncate">{store.storeName}</h4>
                          {store.verified && <BadgeCheck className="w-4 h-4 text-teal-500 flex-shrink-0" aria-label="Verified" />}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {store.city}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${store.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {store.active ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggleStoreVerified(store)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition disabled:opacity-50 ${store.verified ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                      >
                        {store.verified ? 'Unverify' : 'Verify'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggleStoreActive(store)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition disabled:opacity-50 ${store.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      >
                        {store.active ? 'Suspend' : 'Reactivate'}
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
              <LoadMoreButton paging={paging.stores} loading={loadingMore.stores} onLoadMore={() => loadTab('stores', { append: true })} />
            </>
          )
        ) : tab === 'users' ? (
          users.length === 0 ? (
            <EmptyState icon={Users} text={tabEmptyMessage('users', 'No users yet.')} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {users.map(user => {
                const busy = userBusyId === user.userID;
                return (
                  <div key={user.userID} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-gray-800 truncate">{user.firstName} {user.lastName}</h4>
                        {storeOwnerIds.has(user.userID) && (
                          <span className="text-xs bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex-shrink-0">Store</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${user.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggleUserActive(user)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition disabled:opacity-50 ${user.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      >
                        {user.isActive ? 'Suspend' : 'Reactivate'}
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
              <LoadMoreButton paging={paging.users} loading={loadingMore.users} onLoadMore={() => loadTab('users', { append: true })} />
            </>
          )
        ) : tab === 'promotions' ? (
          promotions.length === 0 ? (
            <EmptyState icon={Tag} text={tabEmptyMessage('promotions', 'No promotions yet.')} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {promotions.map(promo => {
                const busy = promoBusyId === promo.promotionID;
                return (
                  <div key={promo.promotionID} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-800 truncate">{promo.title}</h4>
                      <p className="text-xs text-gray-500 truncate">{promo.store?.storeName || 'Unknown store'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${promo.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {promo.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setPromoToDelete(promo)}
                      aria-label="Remove promotion"
                      className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition disabled:opacity-50 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              </div>
              <LoadMoreButton paging={paging.promotions} loading={loadingMore.promotions} onLoadMore={() => loadTab('promotions', { append: true })} />
            </>
          )
        ) : (
          reports.length === 0 ? (
            <EmptyState icon={Flag} text={tabEmptyMessage('reports', 'No reports yet.')} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Newest first, ordered by the server now. This used to sort by createdAt
                  in the browser, which cannot span pages correctly: sorting what has been
                  loaded would leave page 2 starting at a date the first page had already
                  passed. */}
              {reports.map(report => {
                const busy = reportBusyId === report.reportID;
                return (
                  <div key={report.reportID} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-800 truncate">{report.promotion?.title || 'Unknown deal'}</h4>
                        <p className="text-xs text-gray-500 truncate">{report.promotion?.store?.storeName || 'Unknown store'}</p>
                        <span className="inline-block text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider mt-1.5">
                          {REPORT_REASON_LABELS[report.reason] || report.reason}
                        </span>
                        {report.details && <p className="text-xs text-gray-500 mt-1.5">{report.details}</p>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${
                        report.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                        report.status === 'REVIEWED' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    {report.status === 'PENDING' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleResolveReport(report, 'REVIEWED')}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" /> Mark reviewed
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleResolveReport(report, 'DISMISSED')}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition disabled:opacity-50"
                        >
                          <XIcon className="w-3.5 h-3.5" /> Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
              <LoadMoreButton paging={paging.reports} loading={loadingMore.reports} onLoadMore={() => loadTab('reports', { append: true })} />
            </>
          )
        )}
      </div>

      <ConfirmModal
        open={!!promoToDelete}
        title={promoToDelete ? `Remove "${promoToDelete.title}"?` : ''}
        message="This can't be undone."
        confirmLabel="Remove"
        onConfirm={handleDeletePromo}
        onCancel={() => setPromoToDelete(null)}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
      <Icon className={`w-5 h-5 mx-auto ${color}`} />
      <p className="text-xl font-extrabold text-gray-800 mt-1">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <Icon className="mx-auto text-gray-300 w-10 h-10" />
      <p className="text-gray-500 text-sm mt-3">{text}</p>
    </div>
  );
}

// The "is there another page" decision is the server's, not the client's: the accumulated
// array is not a reliable measure once an admin has deleted a row from the last page.
// totalElements is also what the "showing N of M" line is built from, so the number a
// moderator reads is the row count from the database rather than the length of what
// happens to be on screen.
function LoadMoreButton({ paging, loading, onLoadMore }) {
  if (!paging || paging.last) return null;
  const shown = Math.min((paging.page + 1) * paging.pageSize, paging.total);
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <p className="text-xs text-gray-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
        Showing {shown} of {paging.total}
      </p>
      <button
        type="button"
        onClick={onLoadMore}
        disabled={loading}
        className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
      >
        {loading ? 'Loading…' : 'Load more'}
      </button>
    </div>
  );
}

// Nominal categorical, single series (count) -> one hue per the data-viz palette rule:
// swapping category order doesn't change meaning, so every bar takes the same slot color.
//
// Counts come from the server's GROUP BY rather than from tallying the store list, which
// is the same reason the stat cards do: the overview no longer downloads the stores table.
function CategoryBarChart({ counts }) {
  const rows = useMemo(() => (
    (counts || [])
      .filter(c => c && c.category && c.count > 0)
      .map(c => ({ category: c.category, count: c.count }))
  ), [counts]);

  if (rows.length === 0) return null;
  const max = rows[0].count;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-800 text-sm mb-4">Stores by Category</h3>
      <div className="space-y-2.5">
        {rows.map(({ category, count }) => (
          <div key={category} className="flex items-center gap-3" title={`${category}: ${count} store${count !== 1 ? 's' : ''}`}>
            <span className="w-24 flex-shrink-0 text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
              {category}
            </span>
            <div className="flex-1 h-4 bg-gray-50 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full transition-all"
                style={{ width: `${Math.max((count / max) * 100, 4)}%` }}
              />
            </div>
            <span className="w-6 flex-shrink-0 text-xs font-bold text-gray-700 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// The rows arrive newest-first and already capped, so there is nothing left to sort or
// truncate here. It used to take the whole promotions list, sort it by createdAt in the
// browser, and keep the first eight.
function RecentActivityTable({ promotions }) {
  if (!promotions || promotions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 overflow-x-auto">
      <h3 className="font-bold text-gray-800 text-sm mb-4">Recent Promotions</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
            <th className="font-semibold pb-2 pr-3">Deal</th>
            <th className="font-semibold pb-2 pr-3">Store</th>
            <th className="font-semibold pb-2 pr-3">Status</th>
            <th className="font-semibold pb-2">Posted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {promotions.map(promo => (
            <tr key={promo.promotionID}>
              <td className="py-2.5 pr-3 font-medium text-gray-800 truncate max-w-[160px]">{promo.title}</td>
              <td className="py-2.5 pr-3 text-gray-500 truncate max-w-[140px]">{promo.store?.storeName || 'Unknown'}</td>
              <td className="py-2.5 pr-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${promo.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {promo.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="py-2.5 text-gray-400 text-xs whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {promo.createdAt?.slice(0, 10)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
