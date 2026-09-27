import React, { useState, useEffect } from 'react';
import {
  LogOut, PlusCircle, X, Store as StoreIcon,
  MapPin, Star, Pencil, Trash2, Tag, Users,
  BadgeCheck, Clock, Phone, Mail, AlertTriangle,
  MessageSquare, ImagePlus, Ticket, Sparkles, Crown,
  BarChart3, TrendingUp, UploadCloud, CalendarClock, Eye, Bookmark, CheckCircle2, Flame, Landmark
} from 'lucide-react';
import { promotionService, storeService, favoriteService, reviewService, redemptionService, analyticsService, subscriptionService, submitPayFastForm } from '../services/api';
import { CATEGORIES } from '../constants/categories';
import { storageService } from '../services/storageService';
import ConfirmModal from '../components/ConfirmModal';
import logo from '../assets/logo.png';

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
  title: '', description: '', originalPrice: '', discountPrice: '', startDate: '', endDate: '', isActive: true, imageUrl: ''
};

// Ordinal ramp: star count changes meaning, so it gets one hue in monotone steps
// (lightest = 1 star, darkest = 5 stars) instead of a flat color per bar.
const STAR_RAMP = {
  1: 'bg-amber-200',
  2: 'bg-amber-300',
  3: 'bg-amber-400',
  4: 'bg-amber-500',
  5: 'bg-amber-600',
};

const PRO_PERKS = ['Feature one deal at the top of Home\'s Hot Deals', 'A Pro badge on your store profile', 'Analytics dashboard with conversion tracking', 'Bulk-upload promotions from a CSV', 'Schedule deals to auto-activate and expire'];

const CSV_HEADERS = ['title', 'description', 'originalPrice', 'discountPrice', 'startDate', 'endDate', 'imageUrl'];

const emptyStoreForm = {
  storeName: '', category: 'OTHER', description: '', email: '', phoneNumber: '', address: '', city: '',
  openingTime: '', closingTime: '', imageUrl: ''
};

export default function StoreDashboard({ user, onLogout }) {
  const [userStore, setUserStore] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true);

  const [promotions, setPromotions] = useState([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [promoData, setPromoData] = useState(emptyPromo);

  const [showEditStore, setShowEditStore] = useState(false);
  const [storeForm, setStoreForm] = useState(emptyStoreForm);
  const [savingStore, setSavingStore] = useState(false);

  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [promoToDelete, setPromoToDelete] = useState(null);

  const [uploadingStoreImage, setUploadingStoreImage] = useState(false);
  const [uploadingPromoImage, setUploadingPromoImage] = useState(false);

  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState(null);

  const [subscribingStore, setSubscribingStore] = useState(false);
  const [subscribingStoreWith, setSubscribingStoreWith] = useState(null);
  const [confirmCancelStorePlan, setConfirmCancelStorePlan] = useState(false);
  const [payfastStatus, setPayfastStatus] = useState(null);
  const [payfastNotice, setPayfastNotice] = useState(null);
  const [storePaymentMethod, setStorePaymentMethod] = useState(null);
  const [featuringId, setFeaturingId] = useState(null);
  const [promotingId, setPromotingId] = useState(null);

  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const isPro = userStore?.planTier === 'PRO';

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
    setLoadingReviews(true);
    reviewService.getByStore(userStore.storeId)
      .then(data => setReviews(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  }, [userStore?.storeId]);

  // Handles a redirect back from PayFast's hosted page. Clean the query param
  // first (so a refresh never re-runs this), then poll the backend until the
  // ITN has activated the Pro plan, and finally refresh the store state.
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const result = search.get('payfast');
    if (!result) return;

    search.delete('payfast');
    const query = search.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);

    if (result === 'cancelled') {
      setPayfastNotice({ tone: 'info', text: "Payment cancelled — your plan hasn't changed." });
      return;
    }
    if (result !== 'success') return;

    setPayfastStatus('activating');
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      try {
        const data = await subscriptionService.status('STORE');
        if (data.planTier === 'PRO' && data.status === 'ACTIVE') {
          setStorePaymentMethod(data.paymentMethod || null);
          setPayfastStatus(null);
          setPayfastNotice({ tone: 'info', text: 'Pro is now active — welcome aboard!' });
          if (data.account) setUserStore(data.account);
          return;
        }
      } catch {
        // Transient errors — keep polling.
      }
      if (attempts < 10) {
        setTimeout(poll, 3000);
      } else {
        setPayfastStatus(null);
        setPayfastNotice({ tone: 'info', text: 'Payment received — your plan will activate momentarily once PayFast confirms it.' });
      }
    };
    setTimeout(poll, 2500);
  }, [userStore?.storeId]);

  useEffect(() => {
    if (!isPro || !userStore?.storeId) return;
    setLoadingAnalytics(true);
    Promise.all([
      analyticsService.getStoreAnalytics(userStore.storeId),
      analyticsService.getCustomerInsights(userStore.storeId),
    ])
      .then(([stats, cities]) => {
        setAnalytics(stats);
        setInsights(cities);
        setAnalyticsError('');
      })
      .catch(error => setAnalyticsError(error.message || 'Failed to load analytics.'))
      .finally(() => setLoadingAnalytics(false));
  }, [isPro, userStore?.storeId]);

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
  const avgReviewRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;
  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  const storeRenewsOn = userStore?.planRenewsAt
    ? new Date(userStore.planRenewsAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const missingProfileFields = userStore ? [
    !userStore.description && 'a description',
    !userStore.phoneNumber && 'a phone number',
    !toTimeInput(userStore.openingTime) && 'opening hours',
  ].filter(Boolean) : [];

  const handlePromoChange = (e) => setPromoData({ ...promoData, [e.target.name]: e.target.value });

  const handlePromoImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPromoImage(true);
    try {
      const url = await storageService.uploadImage(file, 'promotions');
      setPromoData(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      alert(error.message || 'Failed to upload image.');
    } finally {
      setUploadingPromoImage(false);
    }
  };

  const handleRedeemCode = async (e) => {
    e.preventDefault();
    if (!redeemCode.trim() || !userStore) return;
    setRedeeming(true);
    setRedeemResult(null);
    try {
      const redemption = await redemptionService.redeemCode(userStore.storeId, redeemCode.trim());
      setRedeemResult({ ok: true, message: `Redeemed — ${redemption.promotion?.title || 'deal'}` });
      setRedeemCode('');
    } catch (error) {
      setRedeemResult({ ok: false, message: error.message || 'Invalid or already-redeemed code.' });
    } finally {
      setRedeeming(false);
    }
  };

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

  const handleDeletePromo = async () => {
    const promo = promoToDelete;
    if (!promo) return;
    setPromoToDelete(null);
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
      imageUrl: userStore.imageUrl || '',
    });
    setShowEditStore(true);
  };

  const handleStoreFormChange = (e) => setStoreForm({ ...storeForm, [e.target.name]: e.target.value });

  const handleStoreImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingStoreImage(true);
    try {
      const url = await storageService.uploadImage(file, 'stores');
      setStoreForm(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      alert(error.message || 'Failed to upload image.');
    } finally {
      setUploadingStoreImage(false);
    }
  };

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

  const handleUpgradeToPro = async (paymentMethod = 'CARD') => {
    setSubscribingStore(true);
    setSubscribingStoreWith(paymentMethod);
    setPayfastNotice(null);
    try {
      // Backend returns a signed PayFast form; submitting it sends the customer
      // to PayFast's hosted page where they authorise the recurring agreement
      // (card) or enter their bank details (Instant EFT).
      const checkout = await subscriptionService.checkout('STORE', paymentMethod);
      submitPayFastForm(checkout);
    } catch (error) {
      setPayfastNotice({ tone: 'error', text: error.message || 'Failed to start checkout.' });
      setSubscribingStore(false);
      setSubscribingStoreWith(null);
    }
  };

  const handleCancelProPlan = async () => {
    setConfirmCancelStorePlan(false);
    setSubscribingStore(true);
    try {
      const result = await subscriptionService.cancel('STORE');
      setPayfastNotice({
        tone: 'info',
        text: result.activeUntil
          ? `Subscription cancelled — Pro stays active until ${new Date(result.activeUntil).toLocaleDateString()}.`
          : 'Subscription cancelled.',
      });
    } catch (error) {
      setPayfastNotice({ tone: 'error', text: error.message || 'Failed to cancel subscription.' });
    } finally {
      setSubscribingStore(false);
      setSubscribingStoreWith(null);
    }
  };

  const handleToggleFeatured = async (promo) => {
    setFeaturingId(promo.promotionID);
    try {
      const wasFeatured = promo.featured;
      const updated = await promotionService.update(promo.promotionID, { ...promo, featured: !wasFeatured });
      setPromotions(prev => prev.map(p => {
        if (p.promotionID === updated.promotionID) return updated;
        // Featuring a new deal auto-unfeatures the previous one server-side.
        if (!wasFeatured && p.featured) return { ...p, featured: false };
        return p;
      }));
    } catch (error) {
      alert(error.message || 'Failed to update featured status.');
    } finally {
      setFeaturingId(null);
    }
  };

  const handleTogglePromoted = async (promo) => {
    setPromotingId(promo.promotionID);
    try {
      const wasPromoted = !!promo.promoted;
      const updated = await promotionService.update(promo.promotionID, { ...promo, promoted: !wasPromoted });
      setPromotions(prev => prev.map(p => {
        if (p.promotionID === updated.promotionID) return updated;
        if (!wasPromoted && p.promoted) return { ...p, promoted: false };
        return p;
      }));
    } catch (error) {
      alert(error.message || 'Failed to update promoted status.');
    } finally {
      setPromotingId(null);
    }
  };

  const handleToggleSchedule = async (promo) => {
    try {
      const updated = await promotionService.update(promo.promotionID, {
        ...promo,
        scheduleEnabled: !promo.scheduleEnabled,
      });
      setPromotions(prev => prev.map(p => p.promotionID === updated.promotionID ? updated : p));
    } catch (error) {
      alert(error.message || 'Failed to update scheduling.');
    }
  };

  const parsePromoCsv = (text) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one promotion.');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = [];
      let current = '';
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
        current += ch;
      }
      values.push(current.trim());
      const row = {};
      headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
      return {
        title: row.title,
        description: row.description || '',
        originalPrice: parseFloat(row.originalPrice),
        discountPrice: parseFloat(row.discountPrice),
        startDate: `${row.startDate}T00:00:00`,
        endDate: `${row.endDate}T23:59:59`,
        imageUrl: row.imageUrl || '',
        isActive: row.isActive === undefined || row.isActive === '' || row.isActive !== 'false',
      };
    }).filter(p => p.title && !Number.isNaN(p.originalPrice) && !Number.isNaN(p.discountPrice));
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !userStore) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setBulkResult(null);
      try {
        const parsed = parsePromoCsv(reader.result);
        if (!parsed.length) {
          setBulkResult({ ok: false, message: 'No valid rows found. Check your headers and prices.' });
          return;
        }
        setBulkUploading(true);
        const result = await promotionService.bulkCreate(userStore.storeId, parsed);
        setBulkResult({
          ok: !result.message,
          message: result.message || `Created ${result.created} promotion(s)${result.skipped ? `, skipped ${result.skipped} invalid row(s).` : ''}.`,
        });
        if (result.created > 0) loadPromotions();
      } catch (error) {
        setBulkResult({ ok: false, message: error.message || 'Failed to upload CSV.' });
      } finally {
        setBulkUploading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src={logo} alt="DealNest" width={103} height={56} className="h-14 w-auto" />
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded uppercase tracking-wider">Store</span>
        </div>
        <button type="button" onClick={onLogout} aria-label="Log out" className="min-w-11 min-h-11 flex items-center justify-center text-gray-500 hover:text-red-500 transition">
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto space-y-6">
        {loadingStore ? (
          <div className="h-40 bg-white rounded-3xl border border-gray-100 animate-pulse" />
        ) : !userStore ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <StoreIcon className="mx-auto text-gray-300 w-12 h-12" />
            <h3 className="text-xl font-bold text-gray-800 mt-4">No store found</h3>
            <p className="text-gray-500 text-sm mt-2">We couldn't find a store linked to this account.</p>
          </div>
        ) : (
          <>
            {/* Profile completion nudge */}
            {(missingProfileFields.length > 0 || !userStore.verified) && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-800">
                    {!userStore.verified ? 'Your store isn\'t verified yet' : 'Finish setting up your store'}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {missingProfileFields.length > 0
                      ? `Add ${missingProfileFields.join(', ')} to help customers trust your store.`
                      : 'Verification is reviewed by the DealNest team once your profile looks complete.'}
                  </p>
                  {missingProfileFields.length > 0 && (
                    <button type="button" onClick={openEditStore} className="text-xs font-bold text-amber-800 hover:underline mt-1.5">
                      Complete profile
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Store profile card */}
            <div className="card-glass p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-1.5">
                    {userStore.storeName}
                    {userStore.verified && <BadgeCheck className="w-5 h-5 text-teal-500" aria-label="Verified" />}
                    {isPro && (
                      <span className="flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        <Crown size={10} /> Pro
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" aria-hidden="true" /> {userStore.address ? `${userStore.address}, ` : ''}{userStore.city}
                  </p>
                </div>
                <button type="button" onClick={openEditStore} aria-label="Edit store details" className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-teal-50 text-gray-500 hover:text-teal-600 transition flex-shrink-0">
                  <Pencil className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">
                  <Star className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true" /> {userStore.averageRating?.toFixed(1) || 'New'} {userStore.totalReviews > 0 && `(${userStore.totalReviews})`}
                </span>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded uppercase font-bold tracking-wider">
                  {userStore.category}
                </span>
                {toTimeInput(userStore.openingTime) && toTimeInput(userStore.closingTime) && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" /> {toTimeInput(userStore.openingTime)} - {toTimeInput(userStore.closingTime)}
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
                      <Phone className="w-4 h-4" aria-hidden="true" /> {userStore.phoneNumber}
                    </span>
                  )}
                  {userStore.email && (
                    <span className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" aria-hidden="true" /> {userStore.email}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Store plan */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
                  <Crown size={16} className="text-amber-500" aria-hidden="true" /> Store Plan
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isPro ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                  {isPro ? 'Pro' : 'Free plan'}
                </span>
              </div>
              {payfastStatus === 'activating' && (
                <div role="status" className="bg-amber-50 border border-amber-200 text-amber-700 text-xs p-3 rounded-xl mt-3">
                  Confirming your payment…
                </div>
              )}
              {payfastNotice && (
                <div role="status" className={`${payfastNotice.tone === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-teal-50 border-teal-200 text-teal-700'} border text-xs p-3 rounded-xl mt-3`}>
                  {payfastNotice.text}
                </div>
              )}
              {isPro ? (
                <>
                  {storeRenewsOn && (
                    <p className="text-xs text-gray-500 mt-2">
                      {storePaymentMethod === 'EFT'
                        ? `Access until ${storeRenewsOn} — pay again to extend`
                        : `Renews on ${storeRenewsOn}`}
                    </p>
                  )}
                  {storePaymentMethod !== 'EFT' && (
                    <button
                      type="button"
                      onClick={() => setConfirmCancelStorePlan(true)}
                      disabled={subscribingStore}
                      className="text-xs font-semibold text-gray-500 hover:text-red-500 mt-3 disabled:opacity-60"
                    >
                      Cancel subscription
                    </button>
                  )}
                </>
              ) : (
                <>
                  <ul className="text-xs text-gray-500 mt-2 space-y-1 list-disc list-inside">
                    {PRO_PERKS.map(perk => <li key={perk}>{perk}</li>)}
                  </ul>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => handleUpgradeToPro('CARD')}
                      disabled={subscribingStore}
                      className="w-full flex items-center justify-center gap-1.5 bg-amber-500 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-amber-600 transition disabled:opacity-60"
                    >
                      <Sparkles size={14} />
                      {subscribingStore && subscribingStoreWith === 'CARD' ? 'Upgrading…' : 'Card — R199/mo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpgradeToPro('EFT')}
                      disabled={subscribingStore}
                      className="w-full flex items-center justify-center gap-1.5 bg-white border border-amber-200 text-amber-700 font-semibold text-sm py-2.5 rounded-xl hover:bg-amber-50 transition disabled:opacity-60"
                    >
                      <Landmark size={14} />
                      {subscribingStore && subscribingStoreWith === 'EFT' ? 'Upgrading…' : 'Bank — R199/mo'}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">
                    Card renews automatically every month. Bank (Instant EFT) buys 30 days once — PayFast asks
                    for your bank, account type, account number and branch code on the next screen.
                  </p>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <Tag className="w-5 h-5 text-teal-500 mx-auto" aria-hidden="true" />
                <p className="text-xl font-extrabold text-gray-800 mt-1">{promotions.length}</p>
                <p className="text-xs text-gray-500 font-medium">Promotions</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <Tag className="w-5 h-5 text-green-500 mx-auto" aria-hidden="true" />
                <p className="text-xl font-extrabold text-gray-800 mt-1">{activePromoCount}</p>
                <p className="text-xs text-gray-500 font-medium">Active</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <Users className="w-5 h-5 text-pink-500 mx-auto" aria-hidden="true" />
                <p className="text-xl font-extrabold text-gray-800 mt-1">{followerCount}</p>
                <p className="text-xs text-gray-500 font-medium">Followers</p>
              </div>
            </div>

            {/* Analytics (Pro) */}
            {isPro && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
                    <BarChart3 size={16} className="text-teal-500" aria-hidden="true" /> Analytics
                  </h3>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Pro</span>
                </div>

                {loadingAnalytics ? (
                  <div className="h-20 mt-3 animate-pulse rounded-xl bg-gray-50" />
                ) : analyticsError ? (
                  <p className="text-xs text-red-500 mt-3">{analyticsError}</p>
                ) : analytics ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
                      {[
                        { label: 'Views', value: analytics.views, icon: <Eye className="w-4 h-4 text-teal-500" aria-hidden="true" /> },
                        { label: 'Saves', value: analytics.saves, icon: <Bookmark className="w-4 h-4 text-blue-500" aria-hidden="true" /> },
                        { label: 'Claims', value: analytics.claims, icon: <CheckCircle2 className="w-4 h-4 text-green-500" aria-hidden="true" /> },
                        { label: 'Redeems', value: analytics.redeems, icon: <Flame className="w-4 h-4 text-orange-500" aria-hidden="true" /> },
                        { label: 'Shares', value: analytics.shares, icon: <TrendingUp className="w-4 h-4 text-pink-500" aria-hidden="true" /> },
                        { label: 'Followers', value: analytics.followers, icon: <Users className="w-4 h-4 text-purple-500" aria-hidden="true" /> },
                      ].map(metric => (
                        <div key={metric.label} className="bg-gray-50 rounded-xl p-3 text-center">
                          <span className="flex items-center justify-center gap-1 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                            {metric.icon} {metric.label}
                          </span>
                          <p className="text-xl font-extrabold text-gray-800 mt-1">{metric.value ?? 0}</p>
                        </div>
                      ))}
                    </div>

                    {analytics.promotionStats?.length > 0 && (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm min-w-[420px]">
                          <thead>
                            <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                              <th className="py-2 pr-3 font-semibold">Deal</th>
                              <th className="py-2 pr-3 font-semibold text-center">Views</th>
                              <th className="py-2 pr-3 font-semibold text-center">Saves</th>
                              <th className="py-2 pr-3 font-semibold text-center">Redeems</th>
                              <th className="py-2 font-semibold text-center">Conv. rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.promotionStats.map(row => (
                              <tr key={row.promotionID} className="border-t border-gray-50">
                                <td className="py-2 pr-3 text-gray-700 font-medium truncate max-w-[160px]">{row.title}</td>
                                <td className="py-2 pr-3 text-center text-gray-600">{row.views}</td>
                                <td className="py-2 pr-3 text-center text-gray-600">{row.saves}</td>
                                <td className="py-2 pr-3 text-center text-gray-600">{row.redeems}</td>
                                <td className="py-2 text-center">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.conversionRate > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                    {row.conversionRate}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {insights?.topCities && Object.keys(insights.topCities).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Where your customers come from ({insights.totalEngagements} engagements)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(insights.topCities).map(([city, count]) => (
                            <span key={city} className="flex items-center gap-1.5 bg-gray-50 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                              <MapPin className="w-3 h-3 text-teal-500" aria-hidden="true" /> {city}
                              <span className="font-bold text-gray-800">{count}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}

            {/* Add promotion */}
            <button type="button" onClick={() => setShowForm(true)} className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg">
              <PlusCircle className="w-6 h-6" aria-hidden="true" />
              Add New Promotion
            </button>

            {isPro && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-teal-500" aria-hidden="true" /> Bulk upload from CSV
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Header: {CSV_HEADERS.join(', ')}. Dates as YYYY-MM-DD.
                </p>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-teal-600 hover:border-teal-400 hover:bg-teal-50 transition cursor-pointer">
                  {bulkUploading ? 'Uploading…' : 'Choose CSV file'}
                  <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} disabled={bulkUploading} className="sr-only" />
                </label>
                {bulkResult && (
                  <p className={`text-xs font-semibold mt-2 ${bulkResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                    {bulkResult.message}
                  </p>
                )}
              </div>
            )}

            {/* Redeem a code */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-teal-500" aria-hidden="true" /> Redeem a code
              </h3>
              <form onSubmit={handleRedeemCode} className="flex gap-2">
                <label htmlFor="redeem-code" className="sr-only">Voucher code</label>
                <input
                  id="redeem-code"
                  type="text"
                  value={redeemCode}
                  onChange={(e) => { setRedeemCode(e.target.value.toUpperCase()); setRedeemResult(null); }}
                  placeholder="DN-XXXXXXXXXXXX"
                  className="input-field flex-1 font-mono tracking-wide"
                />
                <button type="submit" disabled={redeeming || !redeemCode.trim()} className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-50 flex-shrink-0">
                  {redeeming ? '…' : 'Redeem'}
                </button>
              </form>
              {redeemResult && (
                <p className={`text-xs font-semibold mt-2 ${redeemResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                  {redeemResult.message}
                </p>
              )}
            </div>

            {/* Promotions list */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">Your Promotions</h3>
              {loadingPromotions ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {[1, 2].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
                </div>
              ) : promotions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <Tag className="mx-auto text-gray-300 w-10 h-10" />
                  <h4 className="font-bold text-gray-800 mt-3">No promotions yet</h4>
                  <p className="text-gray-500 text-sm mt-1">Create your first deal to start attracting customers.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {promotions.map(promo => {
                    const remaining = daysLeft(promo.endDate);
                    return (
                      <div key={promo.promotionID} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-gray-800 line-clamp-1 min-w-0 flex items-center gap-1.5">
                            {promo.title}
                            {promo.featured && (
                              <span className="flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                                <Star size={9} fill="currentColor" /> Featured
                              </span>
                            )}
                            {promo.promoted && (
                              <span className="flex items-center gap-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                                <Flame size={9} /> Promoted
                              </span>
                            )}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${promo.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
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
                          <p className="text-xs text-gray-400">
                            {promo.startDate?.slice(0, 10)} - {promo.endDate?.slice(0, 10)}
                          </p>
                          <div className="flex items-center gap-2">
                            {isPro && (
                              <button
                                type="button"
                                onClick={() => handleToggleFeatured(promo)}
                                disabled={featuringId === promo.promotionID}
                                aria-label={promo.featured ? 'Unfeature this deal' : 'Feature this deal'}
                                title={promo.featured ? 'Unfeature this deal' : 'Feature this deal'}
                                className={`min-w-11 min-h-11 flex items-center justify-center rounded-full transition disabled:opacity-50 ${promo.featured ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-amber-50 hover:text-amber-500'}`}
                              >
                                <Star size={16} fill={promo.featured ? 'currentColor' : 'none'} />
                              </button>
                            )}
                            {isPro && (
                              <button
                                type="button"
                                onClick={() => handleTogglePromoted(promo)}
                                disabled={promotingId === promo.promotionID}
                                aria-label={promo.promoted ? 'Remove from promoted' : 'Promote this deal'}
                                title={promo.promoted ? 'Remove from promoted (top of Hot Deals)' : 'Promote to the top of Hot Deals'}
                                className={`min-w-11 min-h-11 flex items-center justify-center rounded-full transition disabled:opacity-50 ${promo.promoted ? 'text-teal-500 hover:bg-teal-50' : 'text-gray-400 hover:bg-teal-50 hover:text-teal-500'}`}
                              >
                                <Flame size={16} fill={promo.promoted ? 'currentColor' : 'none'} />
                              </button>
                            )}
                            {isPro && (
                              <button
                                type="button"
                                onClick={() => handleToggleSchedule(promo)}
                                aria-label={promo.scheduleEnabled ? 'Disable auto-scheduling' : 'Enable auto-scheduling'}
                                title={promo.scheduleEnabled ? 'Auto-schedule on: activates and expires by date' : 'Auto-schedule off: change dates manually only'}
                                className={`min-w-11 min-h-11 flex items-center justify-center rounded-full transition ${promo.scheduleEnabled ? 'text-teal-500 hover:bg-teal-50' : 'text-gray-400 hover:bg-teal-50 hover:text-teal-500'}`}
                              >
                                <CalendarClock size={16} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleActive(promo)}
                              disabled={togglingId === promo.promotionID}
                              className={`text-xs font-semibold px-3 py-1 rounded-full transition disabled:opacity-50 ${promo.isActive ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                            >
                              {togglingId === promo.promotionID ? '…' : promo.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPromoToDelete(promo)}
                              disabled={deletingId === promo.promotionID}
                              aria-label="Delete promotion"
                              className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-5 h-5 text-gray-400" aria-hidden="true" /> Customer Reviews
              </h3>
              {loadingReviews ? (
                <div className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <MessageSquare className="mx-auto text-gray-300 w-10 h-10" />
                  <h4 className="font-bold text-gray-800 mt-3">No reviews yet</h4>
                  <p className="text-gray-500 text-sm mt-1">Customer feedback will show up here once you get your first review.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                    <div className="text-center flex-shrink-0">
                      <p className="text-3xl font-extrabold text-gray-800">{avgReviewRating}</p>
                      <div className="flex items-center gap-0.5 justify-center mt-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(avgReviewRating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {ratingBreakdown.map(({ star, count }) => (
                        <div key={star} className="flex items-center gap-2 text-xs" title={`${star} star: ${count} review${count !== 1 ? 's' : ''}`}>
                          <span className="text-gray-500 w-3">{star}</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${STAR_RAMP[star]}`}
                              style={{ width: reviews.length ? `${Math.max((count / reviews.length) * 100, count > 0 ? 4 : 0)}%` : '0%' }}
                            />
                          </div>
                          <span className="text-gray-400 w-4 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3 pt-4">
                    {reviews.slice(0, 5).map(review => (
                      <div key={review.reviewID} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i <= review.rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" />
                          ))}
                          <span className="text-xs text-gray-400 ml-2">{review.createdAt?.slice(0, 10)}</span>
                        </div>
                        {review.comment && <p className="text-sm text-gray-600 mt-1.5">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button type="button" onClick={() => setShowForm(false)} aria-label="Close" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Promotion</h3>
            <form onSubmit={handleSubmitPromo} className="space-y-4">
              <div className="flex items-center gap-3">
                {promoData.imageUrl ? (
                  <img src={promoData.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <ImagePlus className="w-6 h-6 text-gray-300" aria-hidden="true" />
                  </div>
                )}
                <label className="text-sm font-semibold text-teal-600 hover:text-teal-700 cursor-pointer">
                  {uploadingPromoImage ? 'Uploading…' : promoData.imageUrl ? 'Change photo' : 'Add a photo'}
                  <input type="file" accept="image/*" onChange={handlePromoImageChange} disabled={uploadingPromoImage} className="sr-only" />
                </label>
              </div>
              <div>
                <label htmlFor="promo-title" className="sr-only">Title</label>
                <input id="promo-title" type="text" name="title" placeholder="Title" value={promoData.title} onChange={handlePromoChange} className="input-field" required />
              </div>
              <div>
                <label htmlFor="promo-description" className="sr-only">Description</label>
                <textarea id="promo-description" name="description" placeholder="Description" value={promoData.description} onChange={handlePromoChange} className="input-field" rows="2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="promo-original-price" className="sr-only">Original price</label>
                  <input id="promo-original-price" type="number" step="0.01" name="originalPrice" placeholder="Original Price" value={promoData.originalPrice} onChange={handlePromoChange} className="input-field" required />
                </div>
                <div>
                  <label htmlFor="promo-discount-price" className="sr-only">Discount price</label>
                  <input id="promo-discount-price" type="number" step="0.01" name="discountPrice" placeholder="Discount Price" value={promoData.discountPrice} onChange={handlePromoChange} className="input-field" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="promo-start-date" className="text-xs text-gray-500 mb-1 block">Start date</label>
                  <input id="promo-start-date" type="date" name="startDate" value={promoData.startDate} onChange={handlePromoChange} className="input-field" required />
                </div>
                <div>
                  <label htmlFor="promo-end-date" className="text-xs text-gray-500 mb-1 block">End date</label>
                  <input id="promo-end-date" type="date" name="endDate" value={promoData.endDate} onChange={handlePromoChange} className="input-field" required />
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
            <button type="button" onClick={() => setShowEditStore(false)} aria-label="Close" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Store Details</h3>
            <form onSubmit={handleSubmitStore} className="space-y-4">
              <div className="flex items-center gap-3">
                {storeForm.imageUrl ? (
                  <img src={storeForm.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <ImagePlus className="w-6 h-6 text-gray-300" aria-hidden="true" />
                  </div>
                )}
                <label className="text-sm font-semibold text-teal-600 hover:text-teal-700 cursor-pointer">
                  {uploadingStoreImage ? 'Uploading…' : storeForm.imageUrl ? 'Change photo' : 'Add a photo'}
                  <input type="file" accept="image/*" onChange={handleStoreImageChange} disabled={uploadingStoreImage} className="sr-only" />
                </label>
              </div>
              <div>
                <label htmlFor="store-name" className="sr-only">Store name</label>
                <input id="store-name" type="text" name="storeName" placeholder="Store Name" value={storeForm.storeName} onChange={handleStoreFormChange} className="input-field" required />
              </div>
              <div>
                <label htmlFor="store-category" className="sr-only">Category</label>
                <select id="store-category" name="category" value={storeForm.category} onChange={handleStoreFormChange} className="input-field">
                  {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="store-description" className="sr-only">Description</label>
                <textarea id="store-description" name="description" placeholder="Description" value={storeForm.description} onChange={handleStoreFormChange} className="input-field" rows="2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="store-email" className="sr-only">Email</label>
                  <input id="store-email" type="email" name="email" autoComplete="email" placeholder="Email" value={storeForm.email} onChange={handleStoreFormChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="store-phone" className="sr-only">Phone number</label>
                  <input id="store-phone" type="tel" name="phoneNumber" autoComplete="tel" placeholder="Phone Number" value={storeForm.phoneNumber} onChange={handleStoreFormChange} className="input-field" />
                </div>
              </div>
              <div>
                <label htmlFor="store-address" className="sr-only">Address</label>
                <input id="store-address" type="text" name="address" autoComplete="street-address" placeholder="Address" value={storeForm.address} onChange={handleStoreFormChange} className="input-field" />
              </div>
              <div>
                <label htmlFor="store-city" className="sr-only">City</label>
                <input id="store-city" type="text" name="city" autoComplete="address-level2" placeholder="City" value={storeForm.city} onChange={handleStoreFormChange} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="store-opening-time" className="text-xs text-gray-500 mb-1 block">Opening time</label>
                  <input id="store-opening-time" type="time" name="openingTime" value={storeForm.openingTime} onChange={handleStoreFormChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="store-closing-time" className="text-xs text-gray-500 mb-1 block">Closing time</label>
                  <input id="store-closing-time" type="time" name="closingTime" value={storeForm.closingTime} onChange={handleStoreFormChange} className="input-field" />
                </div>
              </div>
              <button type="submit" disabled={savingStore} className="btn-primary mt-2 disabled:opacity-50">
                {savingStore ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!promoToDelete}
        title={promoToDelete ? `Delete "${promoToDelete.title}"?` : ''}
        message="This can't be undone."
        confirmLabel="Delete"
        onConfirm={handleDeletePromo}
        onCancel={() => setPromoToDelete(null)}
      />

      <ConfirmModal
        open={confirmCancelStorePlan}
        title="Cancel your Pro plan?"
        message="You'll keep Pro perks (featured deals, analytics) until the end of the current month, then your store returns to the free plan."
        confirmLabel="Cancel subscription"
        onConfirm={handleCancelProPlan}
        onCancel={() => setConfirmCancelStorePlan(false)}
      />
    </div>
  );
}
