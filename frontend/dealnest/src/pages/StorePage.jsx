import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storeService, promotionService, favoriteService, savedPromotionService, reviewService } from '../services/api';
import { ArrowLeft, MapPin, Star, Tag, Clock, Phone, Mail, Heart, Bookmark, Store as StoreIcon, BadgeCheck, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { CATEGORY_ICON, CATEGORY_BG, CATEGORY_COLOR } from '../constants/categories';

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
      .then(data => setPromotions(data.filter(p => p.store?.storeId === storeId)))
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

  const handleDeleteReview = async (review) => {
    if (!window.confirm("Delete your review? This can't be undone.")) return;
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
      // Promotion may already be saved; nothing else to do here.
    }
  };

  if (loading) {
    return (
      <div className="p-6 pb-24">
        <div className="h-40 bg-white rounded-3xl border border-gray-100 animate-pulse mb-6" />
        <div className="h-24 bg-white rounded-3xl border border-gray-100 animate-pulse" />
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="p-6 pb-24">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-teal-600 mb-6">
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
    <div className="p-6 pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-teal-600 mb-6">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Store header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 ${CATEGORY_BG[store.category] || 'bg-gray-100'} rounded-2xl flex items-center justify-center flex-shrink-0`}>
            <CatIcon size={28} className={CATEGORY_COLOR[store.category] || 'text-gray-600'} />
          </div>
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
              <button
                type="button"
                onClick={handleFavorite}
                aria-label="Save store"
                className="p-2 rounded-full hover:bg-red-50 transition text-gray-500 hover:text-red-500 flex-shrink-0"
              >
                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-red-500' : ''} />
              </button>
            </div>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">
                <Star size={12} fill="currentColor" /> {store.averageRating?.toFixed(1) || 'New'} {store.totalReviews > 0 && `(${store.totalReviews})`}
              </div>
              <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded uppercase font-bold tracking-wider">
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
        <div className="grid grid-cols-1 gap-4">
          {promotions.map(promo => {
            const remaining = daysLeft(promo.endDate);
            return (
              <div key={promo.promotionID} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-800 line-clamp-1">{promo.title}</h4>
                    {promo.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{promo.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSavePromotion(promo.promotionID)}
                    aria-label="Save deal"
                    className="p-1.5 rounded-full hover:bg-teal-50 transition text-gray-500 hover:text-teal-600 flex-shrink-0"
                  >
                    <Bookmark size={18} fill={savedPromotionIds.has(promo.promotionID) ? 'currentColor' : 'none'} className={savedPromotionIds.has(promo.promotionID) ? 'text-teal-600' : ''} />
                  </button>
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
            <button onClick={openCreateReview} className="text-xs font-semibold text-teal-600 hover:underline">
              Write a review
            </button>
          )}
        </div>

        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReviewForm({ ...reviewForm, rating: i })}
                  aria-label={`Rate ${i} stars`}
                >
                  <Star size={24} className={i <= reviewForm.rating ? 'text-amber-400' : 'text-gray-200'} fill="currentColor" />
                </button>
              ))}
            </div>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Share your experience with this store..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
            />
            <div className="flex gap-2 mt-3">
              <button type="submit" disabled={submittingReview} className="flex-1 bg-teal-600 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-60">
                {submittingReview ? 'Saving...' : editingReview ? 'Save changes' : 'Post review'}
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
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">{review.createdAt?.slice(0, 10)}</span>
                      {isOwn && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditReview(review)}
                            aria-label="Edit review"
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review)}
                            disabled={deletingReviewId === review.reviewID}
                            aria-label="Delete review"
                            className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition disabled:opacity-50"
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
    </div>
  );
}
