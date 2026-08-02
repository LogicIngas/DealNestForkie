import React, { useState, useEffect } from 'react';
import {
  ArrowRightOnRectangleIcon, PlusCircleIcon, XMarkIcon, BuildingStorefrontIcon,
  MapPinIcon, StarIcon, PencilSquareIcon, TrashIcon, TagIcon, UsersIcon,
  CheckBadgeIcon, ClockIcon, PhoneIcon, EnvelopeIcon
} from '@heroicons/react/24/outline';
import { promotionService, storeService, favoriteService } from '../services/api';
import { CATEGORIES } from '../constants/categories';

function daysLeft(endDate) {
  if (!endDate) return null;
  const diffMs = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function toTimeInput(time) {
  if (!time) return '';
  return time.slice(0, 5);
}

const emptyPromo = {
  title: '', description: '', originalPrice: '', discountPrice: '', startDate: '', endDate: '', isActive: true
};

const emptyStoreForm = {
  storeName: '', category: 'OTHER', description: '', email: '', phoneNumber: '', address: '', city: '',
  openingTime: '', closingTime: ''
};

export default function StoreDashboard({ user, onLogout }) {
  const [userStore, setUserStore] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true);

  const [promotions, setPromotions] = useState([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [promoData, setPromoData] = useState(emptyPromo);

  const [showEditStore, setShowEditStore] = useState(false);
  const [storeForm, setStoreForm] = useState(emptyStoreForm);
  const [savingStore, setSavingStore] = useState(false);

  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user?.userID) return;
    setLoadingStore(true);
    storeService.findByUserId(user.userID)
      .then(setUserStore)
      .finally(() => setLoadingStore(false));
  }, [user]);

  useEffect(() => {
    if (!userStore?.storeId) return;
    loadPromotions();
    favoriteService.getByStore(userStore.storeId)
      .then(data => setFollowerCount(data.length))
      .catch(() => {});
  }, [userStore?.storeId]);

  const loadPromotions = async () => {
    setLoadingPromotions(true);
    try {
      const data = await promotionService.getByStore(userStore.storeId);
      setPromotions(data);
    } catch (error) {
      // Non-fatal: dashboard still usable without the promotions list.
    } finally {
      setLoadingPromotions(false);
    }
  };

  const activePromoCount = promotions.filter(p => p.isActive).length;

  const handlePromoChange = (e) => setPromoData({ ...promoData, [e.target.name]: e.target.value });

  const handleSubmitPromo = async (e) => {
    e.preventDefault();
    if (!userStore) {
      alert("No store found for this user.");
      return;
    }
    try {
      await promotionService.create({
        ...promoData,
        originalPrice: parseFloat(promoData.originalPrice),
        discountPrice: parseFloat(promoData.discountPrice),
        startDate: `${promoData.startDate}T00:00:00`,
        endDate: `${promoData.endDate}T23:59:59`,
        store: { storeId: userStore.storeId }
      });
      alert("Promotion uploaded successfully!");
      setShowForm(false);
      setPromoData(emptyPromo);
      loadPromotions();
    } catch (error) {
      alert(error.message || "Failed to upload promotion.");
    }
  };

  const handleToggleActive = async (promo) => {
    setTogglingId(promo.promotionID);
    try {
      const updated = await promotionService.update(promo.promotionID, {
        ...promo,
        isActive: !promo.isActive,
      });
      setPromotions(prev => prev.map(p => p.promotionID === updated.promotionID ? updated : p));
    } catch (error) {
      alert(error.message || "Failed to update promotion.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeletePromo = async (promo) => {
    if (!window.confirm(`Delete "${promo.title}"? This can't be undone.`)) return;
    setDeletingId(promo.promotionID);
    try {
      const success = await promotionService.remove(promo.promotionID);
      if (success) {
        setPromotions(prev => prev.filter(p => p.promotionID !== promo.promotionID));
      }
    } catch (error) {
      alert(error.message || "Failed to delete promotion.");
    } finally {
      setDeletingId(null);
    }
  };

  const openEditStore = () => {
    setStoreForm({
      storeName: userStore.storeName || '',
      category: userStore.category || 'OTHER',
      description: userStore.description || '',
      email: userStore.email || '',
      phoneNumber: userStore.phoneNumber || '',
      address: userStore.address || '',
      city: userStore.city || '',
      openingTime: toTimeInput(userStore.openingTime),
      closingTime: toTimeInput(userStore.closingTime),
    });
    setShowEditStore(true);
  };

  const handleStoreFormChange = (e) => setStoreForm({ ...storeForm, [e.target.name]: e.target.value });

  const handleSubmitStore = async (e) => {
    e.preventDefault();
    setSavingStore(true);
    try {
      const updated = await storeService.update(userStore.storeId, {
        ...userStore,
        ...storeForm,
        openingTime: storeForm.openingTime || null,
        closingTime: storeForm.closingTime || null,
      });
      setUserStore(updated);
      setShowEditStore(false);
    } catch (error) {
      alert(error.message || "Failed to update store details.");
    } finally {
      setSavingStore(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BuildingStorefrontIcon className="w-7 h-7 text-teal-600" />
          <h1 className="text-xl font-extrabold text-gray-800">DealNest Store</h1>
        </div>
        <button onClick={onLogout} className="p-2 text-gray-500 hover:text-red-500 transition">
          <ArrowRightOnRectangleIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {loadingStore ? (
          <div className="h-40 bg-white rounded-3xl border border-gray-100 animate-pulse" />
        ) : !userStore ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <BuildingStorefrontIcon className="mx-auto text-gray-300 w-12 h-12" />
            <h3 className="text-xl font-bold text-gray-800 mt-4">No store found</h3>
            <p className="text-gray-500 text-sm mt-2">We couldn't find a store linked to this account.</p>
          </div>
        ) : (
          <>
            {/* Store profile card */}
            <div className="card-glass p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-1.5">
                    {userStore.storeName}
                    {userStore.verified && <CheckBadgeIcon className="w-5 h-5 text-teal-500" />}
                  </h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPinIcon className="w-4 h-4" /> {userStore.address ? `${userStore.address}, ` : ''}{userStore.city}
                  </p>
                </div>
                <button onClick={openEditStore} className="p-2 rounded-full hover:bg-teal-50 text-gray-500 hover:text-teal-600 transition flex-shrink-0">
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">
                  <StarIcon className="w-3.5 h-3.5" fill="currentColor" /> {userStore.averageRating?.toFixed(1) || 'New'} {userStore.totalReviews > 0 && `(${userStore.totalReviews})`}
                </span>
                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded uppercase font-bold tracking-wider">
                  {userStore.category}
                </span>
                {toTimeInput(userStore.openingTime) && toTimeInput(userStore.closingTime) && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <ClockIcon className="w-3.5 h-3.5" /> {toTimeInput(userStore.openingTime)} - {toTimeInput(userStore.closingTime)}
                  </span>
                )}
              </div>

              {userStore.description && (
                <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">{userStore.description}</p>
              )}

              {(userStore.phoneNumber || userStore.email) && (
                <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-gray-100">
                  {userStore.phoneNumber && (
                    <span className="flex items-center gap-2 text-sm text-gray-600">
                      <PhoneIcon className="w-4 h-4" /> {userStore.phoneNumber}
                    </span>
                  )}
                  {userStore.email && (
                    <span className="flex items-center gap-2 text-sm text-gray-600">
                      <EnvelopeIcon className="w-4 h-4" /> {userStore.email}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <TagIcon className="w-5 h-5 text-teal-500 mx-auto" />
                <p className="text-xl font-extrabold text-gray-800 mt-1">{promotions.length}</p>
                <p className="text-[11px] text-gray-500 font-medium">Promotions</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <TagIcon className="w-5 h-5 text-green-500 mx-auto" />
                <p className="text-xl font-extrabold text-gray-800 mt-1">{activePromoCount}</p>
                <p className="text-[11px] text-gray-500 font-medium">Active</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <UsersIcon className="w-5 h-5 text-pink-500 mx-auto" />
                <p className="text-xl font-extrabold text-gray-800 mt-1">{followerCount}</p>
                <p className="text-[11px] text-gray-500 font-medium">Followers</p>
              </div>
            </div>

            {/* Add promotion */}
            <button onClick={() => setShowForm(true)} className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg">
              <PlusCircleIcon className="w-6 h-6" />
              Add New Promotion
            </button>

            {/* Promotions list */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">Your Promotions</h3>
              {loadingPromotions ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
                </div>
              ) : promotions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <TagIcon className="mx-auto text-gray-300 w-10 h-10" />
                  <h4 className="font-bold text-gray-800 mt-3">No promotions yet</h4>
                  <p className="text-gray-500 text-sm mt-1">Create your first deal to start attracting customers.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {promotions.map(promo => {
                    const remaining = daysLeft(promo.endDate);
                    return (
                      <div key={promo.promotionID} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-gray-800">{promo.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${promo.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {promo.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {promo.description && <p className="text-xs text-gray-500 mt-1">{promo.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
                          <span className="text-teal-600 font-bold">R{promo.discountPrice?.toFixed(2)}</span>
                          <span className="text-gray-400 line-through text-xs">R{promo.originalPrice?.toFixed(2)}</span>
                          {remaining !== null && (
                            <span className="text-xs text-gray-400">{remaining === 0 ? 'Ends today' : `${remaining}d left`}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <p className="text-[11px] text-gray-400">
                            {promo.startDate?.slice(0, 10)} - {promo.endDate?.slice(0, 10)}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(promo)}
                              disabled={togglingId === promo.promotionID}
                              className={`text-xs font-semibold px-3 py-1 rounded-full transition disabled:opacity-50 ${promo.isActive ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                            >
                              {togglingId === promo.promotionID ? '...' : promo.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePromo(promo)}
                              disabled={deletingId === promo.promotionID}
                              aria-label="Delete promotion"
                              className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Promotion</h3>
            <form onSubmit={handleSubmitPromo} className="space-y-4">
              <input type="text" name="title" placeholder="Title" value={promoData.title} onChange={handlePromoChange} className="input-field" required />
              <textarea name="description" placeholder="Description" value={promoData.description} onChange={handlePromoChange} className="input-field" rows="2" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.01" name="originalPrice" placeholder="Original Price" value={promoData.originalPrice} onChange={handlePromoChange} className="input-field" required />
                <input type="number" step="0.01" name="discountPrice" placeholder="Discount Price" value={promoData.discountPrice} onChange={handlePromoChange} className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Start date</label>
                  <input type="date" name="startDate" value={promoData.startDate} onChange={handlePromoChange} className="input-field" required />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End date</label>
                  <input type="date" name="endDate" value={promoData.endDate} onChange={handlePromoChange} className="input-field" required />
                </div>
              </div>
              <button type="submit" className="btn-primary mt-2">Publish Promotion</button>
            </form>
          </div>
        </div>
      )}

      {showEditStore && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto">
            <button onClick={() => setShowEditStore(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Store Details</h3>
            <form onSubmit={handleSubmitStore} className="space-y-4">
              <input type="text" name="storeName" placeholder="Store Name" value={storeForm.storeName} onChange={handleStoreFormChange} className="input-field" required />
              <select name="category" value={storeForm.category} onChange={handleStoreFormChange} className="input-field">
                {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
              <textarea name="description" placeholder="Description" value={storeForm.description} onChange={handleStoreFormChange} className="input-field" rows="2" />
              <div className="grid grid-cols-2 gap-4">
                <input type="email" name="email" placeholder="Email" value={storeForm.email} onChange={handleStoreFormChange} className="input-field" />
                <input type="text" name="phoneNumber" placeholder="Phone Number" value={storeForm.phoneNumber} onChange={handleStoreFormChange} className="input-field" />
              </div>
              <input type="text" name="address" placeholder="Address" value={storeForm.address} onChange={handleStoreFormChange} className="input-field" />
              <input type="text" name="city" placeholder="City" value={storeForm.city} onChange={handleStoreFormChange} className="input-field" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Opening time</label>
                  <input type="time" name="openingTime" value={storeForm.openingTime} onChange={handleStoreFormChange} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Closing time</label>
                  <input type="time" name="closingTime" value={storeForm.closingTime} onChange={handleStoreFormChange} className="input-field" />
                </div>
              </div>
              <button type="submit" disabled={savingStore} className="btn-primary mt-2 disabled:opacity-50">
                {savingStore ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
