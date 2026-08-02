import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheckIcon, ArrowRightOnRectangleIcon, BuildingStorefrontIcon, UsersIcon,
  TagIcon, CheckBadgeIcon, TrashIcon, MapPinIcon
} from '@heroicons/react/24/outline';
import { storeService, userService, promotionService } from '../services/api';
import { CATEGORY_ICON } from '../constants/categories';
import { Store as StoreIcon } from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'stores', label: 'Stores' },
  { key: 'users', label: 'Users' },
  { key: 'promotions', label: 'Promotions' },
];

export default function AdminDashboard({ admin, onLogout }) {
  const [tab, setTab] = useState('overview');

  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [storeBusyId, setStoreBusyId] = useState(null);
  const [userBusyId, setUserBusyId] = useState(null);
  const [promoBusyId, setPromoBusyId] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [storesData, usersData, promosData] = await Promise.all([
        storeService.getAll(),
        userService.getAll(),
        promotionService.getAll(),
      ]);
      setStores(storesData);
      setUsers(usersData);
      setPromotions(promosData);
    } catch (error) {
      // Non-fatal: individual tabs stay empty and can be retried on refresh.
    } finally {
      setLoading(false);
    }
  };

  const storeOwnerIds = useMemo(() => new Set(stores.map(s => s.user?.userID).filter(Boolean)), [stores]);

  const toggleStoreVerified = async (store) => {
    setStoreBusyId(store.storeId);
    try {
      const updated = await storeService.update(store.storeId, { ...store, verified: !store.verified });
      setStores(prev => prev.map(s => s.storeId === updated.storeId ? updated : s));
    } catch (error) {
      alert(error.message || 'Failed to update store.');
    } finally {
      setStoreBusyId(null);
    }
  };

  const toggleStoreActive = async (store) => {
    setStoreBusyId(store.storeId);
    try {
      const updated = await storeService.update(store.storeId, { ...store, active: !store.active });
      setStores(prev => prev.map(s => s.storeId === updated.storeId ? updated : s));
    } catch (error) {
      alert(error.message || 'Failed to update store.');
    } finally {
      setStoreBusyId(null);
    }
  };

  const toggleUserActive = async (user) => {
    setUserBusyId(user.userID);
    try {
      const updated = await userService.update(user.userID, { ...user, isActive: !user.isActive });
      setUsers(prev => prev.map(u => u.userID === updated.userID ? updated : u));
    } catch (error) {
      alert(error.message || 'Failed to update user.');
    } finally {
      setUserBusyId(null);
    }
  };

  const handleDeletePromo = async (promo) => {
    if (!window.confirm(`Remove "${promo.title}"? This can't be undone.`)) return;
    setPromoBusyId(promo.promotionID);
    try {
      const success = await promotionService.remove(promo.promotionID);
      if (success) setPromotions(prev => prev.filter(p => p.promotionID !== promo.promotionID));
    } catch (error) {
      alert(error.message || 'Failed to remove promotion.');
    } finally {
      setPromoBusyId(null);
    }
  };

  const activeStoreCount = stores.filter(s => s.active).length;
  const unverifiedCount = stores.filter(s => !s.verified).length;
  const activePromoCount = promotions.filter(p => p.isActive).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="w-7 h-7 text-teal-400" />
          <div>
            <h1 className="text-lg font-extrabold text-white leading-tight">DealNest Admin</h1>
            <p className="text-xs text-gray-400">{admin?.email}</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-2 text-gray-300 hover:text-red-400 transition">
          <ArrowRightOnRectangleIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex bg-white border-b border-gray-200 px-4 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${tab === t.key ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
          </div>
        ) : tab === 'overview' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard icon={BuildingStorefrontIcon} label="Total Stores" value={stores.length} color="text-teal-500" />
            <StatCard icon={CheckBadgeIcon} label="Active Stores" value={activeStoreCount} color="text-green-500" />
            <StatCard icon={ShieldCheckIcon} label="Unverified Stores" value={unverifiedCount} color="text-amber-500" />
            <StatCard icon={UsersIcon} label="Total Users" value={users.length} color="text-pink-500" />
            <StatCard icon={TagIcon} label="Total Promotions" value={promotions.length} color="text-purple-500" />
            <StatCard icon={TagIcon} label="Active Promotions" value={activePromoCount} color="text-teal-500" />
          </div>
        ) : tab === 'stores' ? (
          stores.length === 0 ? (
            <EmptyState icon={BuildingStorefrontIcon} text="No stores yet." />
          ) : (
            <div className="space-y-3">
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
                          {store.verified && <CheckBadgeIcon className="w-4 h-4 text-teal-500 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPinIcon className="w-3.5 h-3.5" /> {store.city}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${store.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
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
          )
        ) : tab === 'users' ? (
          users.length === 0 ? (
            <EmptyState icon={UsersIcon} text="No users yet." />
          ) : (
            <div className="space-y-3">
              {users.map(user => {
                const busy = userBusyId === user.userID;
                return (
                  <div key={user.userID} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-gray-800 truncate">{user.firstName} {user.lastName}</h4>
                        {storeOwnerIds.has(user.userID) && (
                          <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex-shrink-0">Store</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${user.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
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
          )
        ) : (
          promotions.length === 0 ? (
            <EmptyState icon={TagIcon} text="No promotions yet." />
          ) : (
            <div className="space-y-3">
              {promotions.map(promo => {
                const busy = promoBusyId === promo.promotionID;
                return (
                  <div key={promo.promotionID} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-800 truncate">{promo.title}</h4>
                      <p className="text-xs text-gray-500 truncate">{promo.store?.storeName || 'Unknown store'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${promo.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {promo.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDeletePromo(promo)}
                      aria-label="Remove promotion"
                      className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition disabled:opacity-50 flex-shrink-0"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
      <Icon className={`w-5 h-5 mx-auto ${color}`} />
      <p className="text-xl font-extrabold text-gray-800 mt-1">{value}</p>
      <p className="text-[11px] text-gray-500 font-medium">{label}</p>
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
