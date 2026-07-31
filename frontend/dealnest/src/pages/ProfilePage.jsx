import React, { useState, useEffect } from 'react';
import { userService, favoriteService, savedPromotionService } from '../services/api';
import { Mail, Phone, Pencil, LogOut, Check, X, User as UserIcon } from 'lucide-react';

export default function ProfilePage({ user, onLogout, onUpdateUser }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [savedDealCount, setSavedDealCount] = useState(0);

  useEffect(() => {
    if (!user?.userID) return;
    favoriteService.getByUser(user.userID).then(data => setFavoriteCount(data.length)).catch(() => {});
    savedPromotionService.getByUser(user.userID).then(data => setSavedDealCount(data.length)).catch(() => {});
  }, [user?.userID]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const startEditing = () => {
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
    });
    setError('');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Send the full user object so unrelated fields (email, password, etc.) aren't wiped out.
      const updated = await userService.update(user.userID, { ...user, ...form });
      onUpdateUser(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{favoriteCount}</div>
          <div className="text-xs text-gray-500 mt-1">Saved Stores</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{savedDealCount}</div>
          <div className="text-xs text-gray-500 mt-1">Saved Deals</div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Account details</h3>
          {!editing && (
            <button
              onClick={startEditing}
              className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-4">{error}</div>
        )}

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">First name</label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Last name</label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Phone number</label>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-60"
              >
                <Check size={16} /> {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
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
              <Mail size={15} className="text-gray-400" /> {user?.email}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone size={15} className="text-gray-400" /> {user?.phoneNumber || 'Not set'}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 bg-white border border-red-100 text-red-500 font-semibold py-3 rounded-2xl hover:bg-red-50 transition"
      >
        <LogOut size={16} /> Log out
      </button>
    </div>
  );
}
