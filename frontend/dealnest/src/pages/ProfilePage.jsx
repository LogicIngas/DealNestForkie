import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userService, favoriteService, savedPromotionService, notificationService, dealAlertService } from '../services/api';
import {
  Mail, Phone, Pencil, LogOut, Check, X, User as UserIcon, Bell, Heart, Bookmark,
  ChevronRight, Lock, Trash2, Sparkles, BellPlus, Gem, Flame, Target, Award, Crown, CalendarCheck2
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { CATEGORIES } from '../constants/categories';

const PLUS_PERKS = ['Unlimited saved deals (free plan caps at 10)', 'A Plus badge on your reviews', 'Deal alerts that ping you when a deal matches your budget'];

function badgeFor(points) {
  if (points >= 300) return { name: 'Deal Legend', Icon: Crown, color: 'text-amber-700 bg-amber-50' };
  if (points >= 150) return { name: 'Bargain Master', Icon: Award, color: 'text-purple-700 bg-purple-50' };
  if (points >= 50) return { name: 'Deal Hunter', Icon: Target, color: 'text-blue-700 bg-blue-50' };
  return { name: 'Deal Starter', Icon: Flame, color: 'text-teal-700 bg-teal-50' };
}

function streakBadge(days) {
  if (days >= 30) return { name: 'Monthly streak', color: 'text-indigo-700 bg-indigo-50' };
  if (days >= 7) return { name: 'Weekly streak', color: 'text-orange-700 bg-orange-50' };
  return null;
}

const emptyAlert = { category: '', maxPrice: '', minDiscountPercentage: '' };

export default function ProfilePage({ user, onLogout, onUpdateUser }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [favorites, setFavorites] = useState([]);
  const [savedDeals, setSavedDeals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  const [subscribing, setSubscribing] = useState(false);
  const [confirmCancelPlan, setConfirmCancelPlan] = useState(false);

  const [alerts, setAlerts] = useState([]);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertForm, setAlertForm] = useState(emptyAlert);
  const [savingAlert, setSavingAlert] = useState(false);
  const [alertError, setAlertError] = useState('');
  const [alertGated, setAlertGated] = useState(false);

  useEffect(() => {
    if (!user?.userID) return;
    setLoadingExtras(true);
    Promise.all([
      favoriteService.getByUser(user.userID),
      savedPromotionService.getByUser(user.userID),
      notificationService.getByUser(user.userID).catch(() => []),
      dealAlertService.getByUser(user.userID).catch(() => []),
    ]).then(([favs, deals, notifs, dealAlerts]) => {
      setFavorites(favs);
      setSavedDeals(deals);
      setNotifications(notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setAlerts(dealAlerts);
    }).finally(() => setLoadingExtras(false));
  }, [user?.userID]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const startEditing = () => {
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
    });
    setError('');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Send the full user object so unrelated fields (password, etc.) aren't wiped out.
      const updated = await userService.update(user.userID, { ...user, ...form });
      onUpdateUser(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await userService.update(user.userID, { ...user, password: passwordForm.newPassword });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setChangingPassword(false);
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleMarkRead = async (notification) => {
    if (notification.read) return;
    setNotifications(prev => prev.map(n => n.notificationID === notification.notificationID ? { ...n, read: true } : n));
    try {
      await notificationService.markRead(notification);
    } catch (err) {
      // Non-fatal: local read-state already flipped, worst case it reverts on next load.
    }
  };

  const handleUpgradeToPlus = async () => {
    setSubscribing(true);
    try {
      const renewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const updated = await userService.update(user.userID, { ...user, planTier: 'PLUS', planRenewsAt: renewsAt });
      onUpdateUser(updated);
    } catch (err) {
      alert(err.message || 'Failed to upgrade to Plus.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelPlus = async () => {
    setConfirmCancelPlan(false);
    setSubscribing(true);
    try {
      const updated = await userService.update(user.userID, { ...user, planTier: 'FREE', planRenewsAt: null });
      onUpdateUser(updated);
    } catch (err) {
      alert(err.message || 'Failed to cancel subscription.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleAlertChange = (e) => setAlertForm({ ...alertForm, [e.target.name]: e.target.value });

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    setAlertError('');
    setAlertGated(false);
    setSavingAlert(true);
    try {
      const created = await dealAlertService.create({
        user: { userID: user.userID },
        category: alertForm.category,
        maxPrice: alertForm.maxPrice ? parseFloat(alertForm.maxPrice) : null,
        minDiscountPercentage: alertForm.minDiscountPercentage ? parseFloat(alertForm.minDiscountPercentage) : null,
      });
      setAlerts(prev => [created, ...prev]);
      setShowAlertForm(false);
      setAlertForm(emptyAlert);
    } catch (err) {
      if (err.message === 'UPGRADE_REQUIRED') {
        setAlertGated(true);
      } else {
        setAlertError(err.message || 'Failed to create alert.');
      }
    } finally {
      setSavingAlert(false);
    }
  };

  const handleToggleAlert = async (alert) => {
    try {
      const updated = await dealAlertService.update({ ...alert, active: !alert.active });
      setAlerts(prev => prev.map(a => a.alertID === updated.alertID ? updated : a));
    } catch (err) {
      alert(err.message || 'Failed to update alert.');
    }
  };

  const handleDeleteAlert = async (alert) => {
    try {
      const ok = await dealAlertService.remove(alert.alertID);
      if (ok) setAlerts(prev => prev.filter(a => a.alertID !== alert.alertID));
    } catch (err) {
      alert(err.message || 'Failed to delete alert.');
    }
  };

  const handleDeleteAccount = async () => {
    setConfirmDeleteAccount(false);
    setDeleting(true);
    try {
      const success = await userService.remove(user.userID);
      if (success) onLogout();
    } catch (err) {
      alert(err.message || 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;
  const unreadCount = notifications.filter(n => !n.read).length;
  const isPlus = user?.planTier === 'PLUS';
  const renewsOn = user?.planRenewsAt
    ? new Date(user.planRenewsAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const points = user?.points ?? 0;
  const currentStreak = user?.currentStreak ?? 0;
  const longestStreak = user?.longestStreak ?? 0;
  const activeBadge = badgeFor(points);
  const sBadge = streakBadge(currentStreak);
  const categoryLabel = (c) => CATEGORIES.find(cat => cat.value === c)?.label || c || 'Any category';

  return (
    <div className="p-6 pb-24 max-w-lg lg:max-w-xl mx-auto">
      {/* Hero */}
      <div className="mb-6 bg-gradient-to-br from-teal-600 to-teal-500 rounded-3xl p-6 text-white shadow-lg shadow-teal-200/50 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {initials || <UserIcon size={28} />}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold truncate flex items-center gap-1.5">
            {user?.firstName} {user?.lastName}
            {isPlus && (
              <span className="flex items-center gap-0.5 bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                <Sparkles size={10} /> Plus
              </span>
            )}
          </h2>
          {memberSince && <p className="text-teal-50 text-sm opacity-90 mt-0.5">Member since {memberSince}</p>}
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
            <Sparkles size={16} className="text-amber-500" aria-hidden="true" /> DealNest Plus
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isPlus ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
            {isPlus ? 'Active' : 'Free plan'}
          </span>
        </div>
        {isPlus ? (
          <>
            {renewsOn && <p className="text-xs text-gray-500 mt-2">Renews on {renewsOn}</p>}
            <button
              type="button"
              onClick={() => setConfirmCancelPlan(true)}
              disabled={subscribing}
              className="text-xs font-semibold text-gray-500 hover:text-red-500 mt-3 disabled:opacity-60"
            >
              Cancel subscription
            </button>
          </>
        ) : (
          <>
            <ul className="text-xs text-gray-500 mt-2 space-y-1 list-disc list-inside">
              {PLUS_PERKS.map(perk => <li key={perk}>{perk}</li>)}
            </ul>
            <button
              type="button"
              onClick={handleUpgradeToPlus}
              disabled={subscribing}
              className="w-full flex items-center justify-center gap-1.5 bg-amber-500 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-amber-600 transition disabled:opacity-60 mt-3"
            >
              <Sparkles size={14} /> {subscribing ? 'Upgrading…' : 'Upgrade to Plus — R49/month'}
            </button>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Link to="/favorites" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition">
          <div className="text-2xl font-bold text-gray-800">{favorites.length}</div>
          <div className="text-xs text-gray-500 mt-1">Saved Stores</div>
        </Link>
        <Link to="/favorites" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition">
          <div className="text-2xl font-bold text-gray-800">{savedDeals.length}</div>
          <div className="text-xs text-gray-500 mt-1">Saved Deals</div>
        </Link>
      </div>

      {/* Saved stores / deals preview */}
      {!loadingExtras && (favorites.length > 0 || savedDeals.length > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">Your saves</h3>
            <Link to="/favorites" className="flex items-center gap-0.5 text-xs font-semibold text-teal-600 hover:underline">
              See all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {favorites.slice(0, 2).map(fav => (
              <div key={fav.favoriteStoreID} className="flex items-center gap-2.5 text-sm">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Heart size={14} className="text-red-500" />
                </div>
                <span className="flex-1 min-w-0 text-gray-700 truncate">{fav.store?.storeName}</span>
              </div>
            ))}
            {savedDeals.slice(0, 2).map(sd => (
              <div key={sd.savedPromotionID} className="flex items-center gap-2.5 text-sm">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <Bookmark size={14} className="text-teal-600" />
                </div>
                <span className="flex-1 min-w-0 text-gray-700 truncate">{sd.promotion?.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GAMIFICATION */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">Your Deal Streaks</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-teal-50 rounded-xl p-3 text-center">
            <Gem className="w-5 h-5 text-teal-600 mx-auto" aria-hidden="true" />
            <p className="text-xl font-extrabold text-gray-800 mt-1">{points}</p>
            <p className="text-xs text-gray-500 font-medium">Points</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <Flame className="w-5 h-5 text-orange-500 mx-auto" aria-hidden="true" />
            <p className="text-xl font-extrabold text-gray-800 mt-1">{currentStreak}</p>
            <p className="text-xs text-gray-500 font-medium">Day streak</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-3 text-center">
            <CalendarCheck2 className="w-5 h-5 text-indigo-500 mx-auto" aria-hidden="true" />
            <p className="text-xl font-extrabold text-gray-800 mt-1">{longestStreak}</p>
            <p className="text-xs text-gray-500 font-medium">Best streak</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${activeBadge.color}`}>
            <activeBadge.Icon size={12} /> {activeBadge.name}
          </span>
          {sBadge && (
            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${sBadge.color}`}>
              <CalendarCheck2 size={12} /> {sBadge.name}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-3">Log in daily to grow your streak — earn points by saving, claiming and redeeming deals.</p>
      </div>

      {/* DEAL ALERTS (Plus) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
            <BellPlus size={16} className="text-teal-600" aria-hidden="true" /> Deal alerts
            {!isPlus && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Plus</span>
            )}
          </h3>
        </div>

        {isPlus ? (
          <>
            <p className="text-xs text-gray-500 mb-3">
              Get notified the moment a matching deal goes live.
            </p>
            {alertGated && (
              <div role="alert" className="bg-amber-50 border border-amber-200 text-amber-700 text-sm p-3 rounded-xl mb-3">
                You need an active DealNest Plus subscription to create an alert.
              </div>
            )}
            {alertError && (
              <div role="alert" aria-live="polite" className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-3">{alertError}</div>
            )}

            {!showAlertForm && (
              <button
                type="button"
                onClick={() => { setShowAlertForm(true); setAlertError(''); setAlertGated(false); }}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-teal-600 hover:border-teal-400 hover:bg-teal-50 transition"
              >
                <BellPlus size={16} /> New deal alert
              </button>
            )}

            {showAlertForm && (
              <form onSubmit={handleCreateAlert} className="space-y-3">
                <div>
                  <label htmlFor="alert-category" className="text-xs text-gray-500 mb-1 block">Category</label>
                  <select id="alert-category" name="category" value={alertForm.category} onChange={handleAlertChange} className="input-field">
                    <option value="">Any category</option>
                    {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="alert-max-price" className="text-xs text-gray-500 mb-1 block">Max price (R)</label>
                    <input id="alert-max-price" name="maxPrice" type="number" min="0" step="0.01" placeholder="e.g. 150" value={alertForm.maxPrice} onChange={handleAlertChange} className="input-field" />
                  </div>
                  <div>
                    <label htmlFor="alert-min-discount" className="text-xs text-gray-500 mb-1 block">Min discount (%)</label>
                    <input id="alert-min-discount" name="minDiscountPercentage" type="number" min="0" max="100" placeholder="e.g. 30" value={alertForm.minDiscountPercentage} onChange={handleAlertChange} className="input-field" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={savingAlert} className="flex-1 bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-60">
                    {savingAlert ? 'Saving…' : 'Save alert'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAlertForm(false); setAlertForm(emptyAlert); }}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {loadingExtras ? (
              <p className="text-sm text-gray-400 mt-3">Loading…</p>
            ) : alerts.length === 0 ? (
              <p className="text-xs text-gray-400 mt-3">No alerts yet — create one above.</p>
            ) : (
              <div className="space-y-2 mt-3">
                {alerts.map(alert => {
                  const [icon] = CATEGORIES.filter(c => c.value === alert.category).map(c => c.icon);
                  const CatIcon = icon || BellPlus;
                  const catStyles = CATEGORIES.find(c => c.value === alert.category);
                  return (
                    <div key={alert.alertID} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${catStyles?.bg || 'bg-gray-50'}`}>
                        <CatIcon size={14} className={catStyles?.color || 'text-gray-500'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{categoryLabel(alert.category)}</p>
                        <p className="text-xs text-gray-500">
                          {alert.maxPrice ? `Under R${alert.maxPrice}` : 'Any price'}
                          {alert.minDiscountPercentage ? ` · ${alert.minDiscountPercentage}%+ off` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleAlert(alert)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full transition flex-shrink-0 ${alert.active ? 'bg-teal-50 text-teal-700 hover:bg-teal-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {alert.active ? 'On' : 'Off'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAlert(alert)}
                        aria-label="Delete alert"
                        className="min-w-9 min-h-9 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-500">
            Create alerts for your favourite categories and budget, and get pinged the moment a matching deal goes live.{' '}
            <button type="button" onClick={() => setConfirmCancelPlan(false)} className="text-teal-600 font-semibold hover:underline">
              Upgrade to Plus
            </button>{' '}
            to unlock alerts. (Upgrade above.)
          </p>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
            <Bell size={16} className="text-gray-400" aria-hidden="true" /> Notifications
            {unreadCount > 0 && (
              <span className="bg-teal-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h3>
        </div>
        {loadingExtras ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing yet — deal alerts will show up here.</p>
        ) : (
          <div className="space-y-1">
            {notifications.slice(0, 5).map(n => (
              <button
                key={n.notificationID}
                type="button"
                onClick={() => handleMarkRead(n)}
                className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl transition ${n.priority ? 'bg-amber-50/70 hover:bg-amber-50' : n.read ? 'hover:bg-gray-50' : 'bg-teal-50/60 hover:bg-teal-50'}`}
              >
                {!n.read && <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.priority ? 'bg-amber-500' : 'bg-teal-600'}`} aria-hidden="true" />}
                <div className={`min-w-0 ${n.read ? 'pl-4' : ''}`}>
                  <p className="text-sm font-semibold text-gray-800 truncate flex items-center gap-1.5">
                    {n.title}
                    {n.priority && (
                      <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">Priority</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-1">{n.message}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Account details</h3>
          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>

        {error && (
          <div role="alert" aria-live="polite" className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-4">{error}</div>
        )}

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="profile-first-name" className="text-xs text-gray-500 mb-1 block">First name</label>
                <input
                  id="profile-first-name"
                  name="firstName"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
                />
              </div>
              <div>
                <label htmlFor="profile-last-name" className="text-xs text-gray-500 mb-1 block">Last name</label>
                <input
                  id="profile-last-name"
                  name="lastName"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="profile-email" className="text-xs text-gray-500 mb-1 block">Email</label>
              <input
                id="profile-email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">This is also what you use to log in.</p>
            </div>
            <div>
              <label htmlFor="profile-phone" className="text-xs text-gray-500 mb-1 block">Phone number</label>
              <input
                id="profile-phone"
                name="phoneNumber"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phoneNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-60"
              >
                <Check size={16} /> {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Mail size={15} className="text-gray-400" aria-hidden="true" /> {user?.email}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone size={15} className="text-gray-400" aria-hidden="true" /> {user?.phoneNumber || 'Not set'}
            </div>
          </div>
        )}
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
            <Lock size={16} className="text-gray-400" aria-hidden="true" /> Password
          </h3>
          {!changingPassword && (
            <button
              type="button"
              onClick={() => { setChangingPassword(true); setPasswordError(''); }}
              className="text-xs font-semibold text-teal-600 hover:underline"
            >
              Change
            </button>
          )}
        </div>

        {passwordSaved && !changingPassword && (
          <p className="text-xs text-green-600 mt-3 flex items-center gap-1"><Check size={12} /> Password updated</p>
        )}

        {changingPassword && (
          <form onSubmit={handleSavePassword} className="space-y-3 mt-4">
            {passwordError && (
              <div role="alert" aria-live="polite" className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm">{passwordError}</div>
            )}
            <div>
              <label htmlFor="profile-new-password" className="text-xs text-gray-500 mb-1 block">New password</label>
              <input
                id="profile-new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
                minLength={8}
                required
              />
            </div>
            <div>
              <label htmlFor="profile-confirm-password" className="text-xs text-gray-500 mb-1 block">Confirm new password</label>
              <input
                id="profile-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
                minLength={8}
                required
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={savingPassword}
                className="flex-1 flex items-center justify-center gap-1.5 bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-60"
              >
                <Check size={16} /> {savingPassword ? 'Saving…' : 'Update password'}
              </button>
              <button
                type="button"
                onClick={() => { setChangingPassword(false); setPasswordForm({ newPassword: '', confirmPassword: '' }); }}
                disabled={savingPassword}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl hover:bg-gray-50 transition mb-6"
      >
        <LogOut size={16} /> Log out
      </button>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
        <h3 className="font-bold text-red-600 text-sm mb-1">Danger zone</h3>
        <p className="text-xs text-gray-500 mb-3">Deleting your account removes your profile permanently. This can't be undone.</p>
        <button
          type="button"
          onClick={() => setConfirmDeleteAccount(true)}
          disabled={deleting}
          className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 font-semibold py-2.5 rounded-xl hover:bg-red-50 transition disabled:opacity-60"
        >
          <Trash2 size={15} /> {deleting ? 'Deleting…' : 'Delete account'}
        </button>
      </div>

      <ConfirmModal
        open={confirmDeleteAccount}
        title="Delete your account?"
        message="This removes your profile permanently and can't be undone."
        confirmLabel="Delete account"
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDeleteAccount(false)}
      />

      <ConfirmModal
        open={confirmCancelPlan}
        title="Cancel DealNest Plus?"
        message="You'll immediately lose unlimited saved deals and the Plus badge."
        confirmLabel="Cancel subscription"
        onConfirm={handleCancelPlus}
        onCancel={() => setConfirmCancelPlan(false)}
      />
    </div>
  );
}
