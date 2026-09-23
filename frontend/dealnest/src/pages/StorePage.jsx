import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { storeService, promotionService, favoriteService, savedPromotionService, reviewService, redemptionService, dealReportService, priceHistoryService, analyticsService } from '../services/api';
import { ArrowLeft, MapPin, Star, Tag, Clock, Phone, Mail, Heart, Bookmark, Store as StoreIcon, BadgeCheck, MessageSquare, Pencil, Trash2, Ticket, Flag, Share2, Check } from 'lucide-react';
import { CATEGORY_ICON, CATEGORY_BG, CATEGORY_COLOR } from '../constants/categories';
import ConfirmModal from '../components/ConfirmModal';
import ReportDealModal from '../components/ReportDealModal';
import PriceSparkline from '../components/PriceSparkline';

function daysLeft(endDate) {
  if (!endDate) return null;
  const diffMs = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function formatTime(time) {
  if (!time) return null;
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${period}`;
}

export default function StorePage({ user }) {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [store, setStore] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savedPromotionIds, setSavedPromotionIds] = useState(new Set());

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  const [claimingId, setClaimingId] = useState(null);
  const [claimedCode, setClaimedCode] = useState(null);

  const [reportingPromo, setReportingPromo] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportedIds, setReportedIds] = useState(new Set());

  const [priceHistories, setPriceHistories] = useState({});

  const [copiedId, setCopiedId] = useState(null);
  const [highlightedPromoId, setHighlightedPromoId] = useState(null);

  const handleShare = async (shareData, copyKey) => {
    if (user?.userID && copyKey !== 'store') {
      analyticsService.track(null, 'DEAL_SHARED', user.userID, copyKey);
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled the native share sheet; nothing else to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopiedId(copyKey);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      alert(shareData.url);
    }
  };

  const loadReviews = () => {
    setLoadingReviews(true);
    reviewService.getByStore(storeId)
      .then(data => setReviews(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  };

  useEffect(() => {
    setLoading(true);
    setNotFound(false);

    storeService.getById(storeId)
      .then(setStore)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    promotionService.getActive()
      .then(data => {
        const storePromos = data.filter(p => p.store?.storeId === storeId);
        setPromotions(storePromos);
        storePromos.forEach(promo => {
          priceHistoryService.getByPromotion(promo.promotionID)
            .then(points => setPriceHistories(prev => ({ ...prev, [promo.promotionID]: points })))
            .catch(() => {});
        });
      })
      .catch(() => {});

    loadReviews();

    if (user?.userID) {
      favoriteService.getByUser(user.userID)
        .then(data => setIsFavorite(data.some(f => f.store?.storeId === storeId)))
        .catch(() => {});

      savedPromotionService.getByUser(user.userID)
        .then(data => setSavedPromotionIds(new Set(data.map(sp => sp.promotion?.promotionID))))
        .catch(() => {});
    }
  }, [storeId, user?.userID]);

  useEffect(() => {
    if (!location.hash.startsWith('#deal-') || promotions.length === 0) return;
    const promotionId = location.hash.slice('#deal-'.length);
    const el = document.getElementById(`deal-${promotionId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedPromoId(promotionId);
    const timeout = setTimeout(() => setHighlightedPromoId(null), 2500);
    return () => clearTimeout(timeout);
  }, [location.hash, promotions]);

  const handleFavorite = async () => {
    if (!user?.userID || isFavorite) return;
    try {
      await favoriteService.add(user.userID, storeId);
      setIsFavorite(true);
    } catch (error) {
      // Store may already be saved; nothing else to do here.
    }
  };

  const refreshStore = () => {
    // averageRating/totalReviews are recalculated server-side on any review
    // change, so re-fetch the store to reflect that immediately.
    storeService.getById(storeId).then(setStore).catch(() => {});
  };

  const openCreateReview = () => {
    setEditingReview(null);
    setReviewForm({ rating: 5, comment: '' });
    setShowReviewForm(true);
  };

  const openEditReview = (review) => {
    setEditingReview(review);
    setReviewForm({ rating: review.rating, comment: review.comment || '' });
    setShowReviewForm(true);
  };

  const closeReviewForm = () => {
    setShowReviewForm(false);
    setEditingReview(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user?.userID) return;
    setSubmittingReview(true);
    try {
      if (editingReview) {
        await reviewService.update(editingReview.reviewID, {
          ...editingReview,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        });
      } else {
        await reviewService.create({
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          store: { storeId },
          user: { userID: user.userID },
        });
      }
      closeReviewForm();
      setReviewForm({ rating: 5, comment: '' });
      loadReviews();
      refreshStore();
    } catch (error) {
      alert(error.message || 'Failed to save review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    const review = reviewToDelete;
    if (!review) return;
    setReviewToDelete(null);
    setDeletingReviewId(review.reviewID);
    try {
      await reviewService.remove(review.reviewID);
      loadReviews();
      refreshStore();
    } catch (error) {
      alert(error.message || 'Failed to delete review.');
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleSavePromotion = async (promotionId) => {
    if (!user?.userID || savedPromotionIds.has(promotionId)) return;
    try {
      await savedPromotionService.add(user.userID, promotionId);
      setSavedPromotionIds(prev => new Set(prev).add(promotionId));
    } catch (error) {
      // Surface the free-plan save cap distinctly; otherwise the promotion may
      // already be saved, which is fine to ignore.
      if (error.message?.includes('Upgrade to DealNest Plus')) alert(error.message);
    }
  };

  const handleClaimPromo = async (promotionId) => {
    if (!user?.userID || claimingId) return;
    setClaimingId(promotionId);
    analyticsService.track(null, 'PROMOTION_VIEW', user.userID, promotionId);
    try {
      const redemption = await redemptionService.claim(user.userID, promotionId);
      setClaimedCode(redemption.code);
    } catch (error) {
      alert(error.message || 'Failed to claim this deal.');
    } finally {
      setClaimingId(null);
    }
  };

  const handleSubmitReport = async (reason, details) => {
    if (!user?.userID || !reportingPromo) return;
    setSubmittingReport(true);
    try {
      await dealReportService.create(user.userID, reportingPromo.promotionID, reason, details);
      setReportedIds(prev => new Set(prev).add(reportingPromo.promotionID));
      setReportingPromo(null);
    } catch (error) {
      alert(error.message || 'Failed to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 pb-24 max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
        <div className="h-40 bg-white rounded-3xl border border-gray-100 animate-pulse mb-6" />
        <div className="h-24 bg-white rounded-3xl border border-gray-100 animate-pulse" />
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="p-6 pb-24 max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-teal-600 mb-6">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <StoreIcon className="mx-auto text-gray-300" size={48} />
          <h3 className="text-xl font-bold text-gray-800 mt-4">Store not found</h3>
          <p className="text-gray-500 text-sm mt-2">This store may have been removed or is no longer available.</p>
        </div>
      </div>
    );
  }

  const CatIcon = CATEGORY_ICON[store.category] || StoreIcon;
  const openTime = formatTime(store.openingTime);
  const closeTime = formatTime(store.closingTime);

  return (
    <div className="p-6 pb-24 max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-teal-600 mb-6">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Store header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-start gap-4">
          {store.imageUrl ? (
            <img src={store.imageUrl} alt="" className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div className={`w-16 h-16 ${CATEGORY_BG[store.category] || 'bg-gray-100'} rounded-2xl flex items-center justify-center flex-shrink-0`}>
              <CatIcon size={28} className={CATEGORY_COLOR[store.category] || 'text-gray-600'} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-1.5">
                  {store.storeName}
                  {store.verified && <BadgeCheck size={18} className="text-teal-500" />}
                </h2>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin size={13} /> {store.address ? `${store.address}, ` : ''}{store.city}
                </p>
              </div>
              <div className="flex items-center flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleShare({ title: store.storeName, text: `Check out ${store.storeName} on DealNest`, url: `${window.location.origin}/store/${storeId}` }, 'store')}
                  aria-label="Share store"
                  className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-teal-50 transition text-gray-500 hover:text-teal-600"
                >
                  {copiedId === 'store' ? <Check size={20} className="text-teal-600" /> : <Share2 size={20} />}
                </button>
                <button
                  type="button"
                  onClick={handleFavorite}
                  aria-label="Save store"
                  className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-red-50 transition text-gray-500 hover:text-red-500"
                >
                  <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-red-500' : ''} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">
                <Star size={12} fill="currentColor" /> {store.averageRating?.toFixed(1) || 'New'} {store.totalReviews > 0 && `(${store.totalReviews})`}
              </div>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded uppercase font-bold tracking-wider">
                {store.category}
              </span>
              {openTime && closeTime && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={12} /> {openTime} - {closeTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {store.description && (
          <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">{store.description}</p>
        )}

        {(store.phoneNumber || store.email) && (
          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
            {store.phoneNumber && (
              <a href={`tel:${store.phoneNumber}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-teal-600">
                <Phone size={14} /> {store.phoneNumber}
              </a>
            )}
            {store.email && (
              <a href={`mailto:${store.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-teal-600">
                <Mail size={14} /> {store.email}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Deals at this store */}
      <h3 className="text-lg font-bold text-gray-800 mb-4">Deals at this store</h3>
      {promotions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <Tag className="mx-auto text-gray-300" size={40} />
          <h4 className="font-bold text-gray-800 mt-3">No active deals</h4>
          <p className="text-gray-500 text-sm mt-1">Check back soon for offers from this store.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {promotions.map(promo => {
            const remaining = daysLeft(promo.endDate);
            const highlighted = highlightedPromoId === promo.promotionID;
            return (
              <div
                key={promo.promotionID}
                id={`deal-${promo.promotionID}`}
                className={`bg-white rounded-2xl shadow-sm border p-4 transition ${highlighted ? 'border-teal-400 ring-2 ring-teal-200' : 'border-gray-100 hover:shadow-md'}`}
              >
                {promo.imageUrl && (
                  <img src={promo.imageUrl} alt="" className="w-full h-32 rounded-xl object-cover mb-3" />
                )}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-800 line-clamp-1 flex items-center gap-1.5">
                      {promo.title}
                      {promo.featured && (
                        <span className="flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                          <Star size={9} fill="currentColor" /> Featured
                        </span>
                      )}
                    </h4>
                    {promo.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{promo.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleClaimPromo(promo.promotionID)}
                      disabled={claimingId === promo.promotionID}
                      aria-label="Claim deal"
                      className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-teal-50 transition text-gray-500 hover:text-teal-600 disabled:opacity-50"
                    >
                      <Ticket size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSavePromotion(promo.promotionID)}
                      aria-label="Save deal"
                      className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-teal-50 transition text-gray-500 hover:text-teal-600"
                    >
                      <Bookmark size={18} fill={savedPromotionIds.has(promo.promotionID) ? 'currentColor' : 'none'} className={savedPromotionIds.has(promo.promotionID) ? 'text-teal-600' : ''} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShare({ title: promo.title, text: `${promo.title} at ${store.storeName} — on DealNest`, url: `${window.location.origin}/store/${storeId}#deal-${promo.promotionID}` }, promo.promotionID)}
                      aria-label="Share deal"
                      className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-teal-50 transition text-gray-500 hover:text-teal-600"
                    >
                      {copiedId === promo.promotionID ? <Check size={16} className="text-teal-600" /> : <Share2 size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportingPromo(promo)}
                      disabled={reportedIds.has(promo.promotionID)}
                      aria-label={reportedIds.has(promo.promotionID) ? 'Deal reported' : 'Report deal'}
                      title={reportedIds.has(promo.promotionID) ? 'Reported' : 'Report this deal'}
                      className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-red-50 transition text-gray-500 hover:text-red-500 disabled:opacity-40"
                    >
                      <Flag size={16} fill={reportedIds.has(promo.promotionID) ? 'currentColor' : 'none'} className={reportedIds.has(promo.promotionID) ? 'text-red-500' : ''} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {promo.discountPercentage != null && (
                    <span className="flex items-center gap-1 bg-teal-600 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                      <Tag size={11} /> {promo.discountPercentage}% OFF
                    </span>
                  )}
                  {promo.discountPrice != null && (
                    <span className="text-teal-600 font-extrabold text-sm">R{promo.discountPrice.toFixed(2)}</span>
                  )}
                  {promo.originalPrice != null && (
                    <span className="text-gray-400 text-xs line-through">R{promo.originalPrice.toFixed(2)}</span>
                  )}
                  {remaining !== null && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={11} /> {remaining === 0 ? 'Ends today' : `${remaining}d left`}
                    </span>
                  )}
                </div>
                {priceHistories[promo.promotionID]?.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <PriceSparkline points={priceHistories[promo.promotionID]} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reviews */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-1.5">
            <MessageSquare size={18} className="text-gray-400" /> Reviews
          </h3>
          {user?.userID && !showReviewForm && !reviews.some(r => r.user?.userID === user.userID) && (
            <button type="button" onClick={openCreateReview} className="text-xs font-semibold text-teal-600 hover:underline">
              Write a review
            </button>
          )}
        </div>

        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex items-center gap-1 mb-3" role="group" aria-label="Rating">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReviewForm({ ...reviewForm, rating: i })}
                  aria-label={`Rate ${i} stars`}
                  aria-pressed={i === reviewForm.rating}
                  className="min-w-11 min-h-11 flex items-center justify-center"
                >
                  <Star size={24} className={i <= reviewForm.rating ? 'text-amber-400' : 'text-gray-200'} fill="currentColor" />
                </button>
              ))}
            </div>
            <label htmlFor="review-comment" className="sr-only">Your review</label>
            <textarea
              id="review-comment"
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Share your experience with this store…"
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
            />
            <div className="flex gap-2 mt-3">
              <button type="submit" disabled={submittingReview} className="flex-1 bg-teal-600 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-60">
                {submittingReview ? 'Saving…' : editingReview ? 'Save changes' : 'Post review'}
              </button>
              <button type="button" onClick={closeReviewForm} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        )}

        {loadingReviews ? (
          <div className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <MessageSquare className="mx-auto text-gray-300" size={32} />
            <p className="text-gray-500 text-sm mt-2">No reviews yet. Be the first to share your experience.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {reviews.map(review => {
              const isOwn = user?.userID && review.user?.userID === user.userID;
              return (
                <div key={review.reviewID} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} size={13} className={i <= review.rating ? 'text-amber-400' : 'text-gray-200'} fill="currentColor" />
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">{review.createdAt?.slice(0, 10)}</span>
                      {isOwn && (
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => openEditReview(review)}
                            aria-label="Edit review"
                            className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewToDelete(review)}
                            disabled={deletingReviewId === review.reviewID}
                            aria-label="Delete review"
                            className="min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {isOwn ? 'You' : review.user?.firstName ? `${review.user.firstName} ${review.user.lastName?.[0] || ''}.` : 'Anonymous'}
                  </p>
                  {review.comment && <p className="text-sm text-gray-600 mt-1.5">{review.comment}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!reviewToDelete}
        title="Delete your review?"
        message="This can't be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteReview}
        onCancel={() => setReviewToDelete(null)}
      />

      <ReportDealModal
        open={!!reportingPromo}
        dealTitle={reportingPromo?.title}
        submitting={submittingReport}
        onSubmit={handleSubmitReport}
        onClose={() => setReportingPromo(null)}
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
