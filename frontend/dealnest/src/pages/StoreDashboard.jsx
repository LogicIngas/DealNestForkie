import React, { useState, useEffect } from 'react';
import { ArrowRightOnRectangleIcon, PlusCircleIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { promotionService, storeService } from '../services/api';

export default function StoreDashboard({ user, onLogout }) {
  const [showForm, setShowForm] = useState(false);
  const [userStore, setUserStore] = useState(null);
  
  // Fetch the store belonging to this user
  useEffect(() => {
    const fetchStore = async () => {
      const stores = await storeService.getAll();
      // Assuming the logged-in user owns a store via email match or ID (simplified for demo)
      const myStore = stores.find(s => s.email === user?.email);
      setUserStore(myStore);
    };
    fetchStore();
  }, [user]);

  const [promoData, setPromoData] = useState({
    title: '', description: '', originalPrice: '', discountPrice: '', startDate: '', endDate: '', isActive: true
  });

  const handleChange = (e) => setPromoData({ ...promoData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
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
        store: { storeId: userStore.storeId }
      });
      alert("Promotion uploaded successfully!");
      setShowForm(false);
    } catch (error) {
      alert("Failed to upload promotion.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🏪</span>
          <h1 className="text-xl font-extrabold text-gray-800">DealNest Store</h1>
        </div>
        <button onClick={onLogout} className="p-2 text-gray-500 hover:text-red-500 transition">
          <ArrowRightOnRectangleIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 max-w-md mx-auto space-y-6">
        <div className="card-glass p-6 text-center">
          <h2 className="text-xl font-bold text-gray-800">Welcome, {user?.firstName || 'Store Owner'}!</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your promotions and store details here.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center justify-center gap-3 py-4 text-lg">
            <PlusCircleIcon className="w-6 h-6" />
            Add New Promotion
          </button>
          <button className="btn-outline flex items-center justify-center gap-3 py-4 text-lg">
            <DocumentTextIcon className="w-6 h-6" />
            View My Promotions
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Promotion</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" name="title" placeholder="Title" onChange={handleChange} className="input-field" required />
              <textarea name="description" placeholder="Description" onChange={handleChange} className="input-field" rows="2" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.01" name="originalPrice" placeholder="Original Price" onChange={handleChange} className="input-field" required />
                <input type="number" step="0.01" name="discountPrice" placeholder="Discount Price" onChange={handleChange} className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="datetime-local" name="startDate" onChange={handleChange} className="input-field" required />
                <input type="datetime-local" name="endDate" onChange={handleChange} className="input-field" required />
              </div>
              <button type="submit" className="btn-primary mt-2">Publish Promotion</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}