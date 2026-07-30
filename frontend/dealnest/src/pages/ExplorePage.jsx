import React, { useState, useEffect } from 'react';
import { storeService, favoriteService } from '../services/api';
import { Search, Heart, MapPin } from 'lucide-react';

export default function ExplorePage({ user }) {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeService.getAll()
      .then(data => {
        setStores(data);
        setFilteredStores(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = stores.filter(store => 
      store.storeName.toLowerCase().includes(term) || 
      store.city.toLowerCase().includes(term) ||
      store.category.toLowerCase().includes(term)
    );
    setFilteredStores(filtered);
  };

  const handleFavorite = async (storeId) => {
    try {
      await favoriteService.add(user.userID, storeId);
      alert('Store added to favorites!');
    } catch (error) {
      alert('Error adding to favorites. It may already be saved.');
    }
  };

  return (
    <div className="p-6 pb-24">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Explore</h2>
      
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search stores, cities, or categories..." 
          value={searchTerm}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 shadow-sm"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading deals...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredStores.length === 0 && (
            <div className="text-center text-gray-500 py-20">No stores found matching your search.</div>
          )}
          {filteredStores.map(store => (
            <div key={store.storeId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-start gap-4 hover:shadow-md transition">
              <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
                {store.category === 'RESTAURANT' ? '🍔' : '🏪'}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-800">{store.storeName}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} /> {store.city}
                    </p>
                    <span className="inline-block bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded mt-1 uppercase font-bold tracking-wider">
                      {store.category}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleFavorite(store.storeId)}
                    className="p-2 hover:bg-red-50 rounded-full transition text-gray-400 hover:text-red-500"
                  >
                    <Heart size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}