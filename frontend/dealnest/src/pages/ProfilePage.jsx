import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userService, favoriteService, savedPromotionService, notificationService } from '../services/api';
import {
  Mail, Phone, Pencil, LogOut, Check, X, User as UserIcon, Bell, Heart, Bookmark,
  ChevronRight, Lock, Trash2
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

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

  useEffect(() => {
    if (!user?.userID) return;
    setLoadingExtras(true);
    Promise.all([
      favoriteService.getByUser(user.userID),
      savedPromotionService.getByUser(user.userID),
      notificationService.getByUser(user.userID).catch(() => []),
    ]).then(([favs, deals, notifs]) => {
      setFavorites(favs);
      setSavedDeals(deals);
      setNotifications(notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
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

  return (
    <div className="p-6 pb-24 max-w-lg mx-auto">
      {/* Hero */}
      <div className="mb-6 bg-gradient-to-br from-teal-600 to-teal-500 rounded-3xl p-6 text-white shadow-lg shadow-teal-200/50 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {initials || <UserIcon size={28} />}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold truncate">{user?.firstName} {user?.lastName}</h2>
          {memberSince && <p className="text-teal-50 text-sm opacity-90 mt-0.5">Member since {memberSince}</p>}
        </div>
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
                className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl transition ${n.read ? 'hover:bg-gray-50' : 'bg-teal-50/60 hover:bg-teal-50'}`}
              >
                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" aria-hidden="true" />}
                <div className={`min-w-0 ${n.read ? 'pl-4' : ''}`}>
                  <p className="text-sm font-semibold text-gray-800 truncate">{n.title}</p>
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
    </div>
  );
}
