import React, { useState, useEffect } from 'react';
import { storeService } from '../services/api';
import { MapPin, Star } from 'lucide-react';

export default function HomePage({ user }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeService.getAll()
      .then(data => {
        // Filter only active stores for the home page
        setStores(data.filter(s => s.active === true).slice(0, 4));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 pb-24">
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Welcome back, {user?.firstName}!</h2>
        <p className="text-gray-500 text-sm mt-1">Discover the best deals near you today.</p>
      </div>

      {/* Featured Stores */}
      <h3 className="text-lg font-bold text-gray-800 mb-4">Featured Stores</h3>
      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading stores...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {stores.map(store => (
            <a key={store.storeId} href={`/store/${store.storeId}`} className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-teal-100 rounded-xl flex items-center justify-center text-2xl">
                  {store.category === 'RESTAURANT' ? '🍔' : '🏪'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-800">{store.storeName}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} /> {store.city}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
                      <Star size={12} fill="currentColor" /> {store.averageRating?.toFixed(1) || 'New'}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{store.description || 'Local favorite store'}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}