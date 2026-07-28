import React, { useState, useEffect } from 'react';
import { favoriteService } from '../services/api';
import { MapPin, Trash2 } from 'lucide-react';

export default function FavoritesPage({ user }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const data = await favoriteService.getByUser(user.userID);
      setFavorites(data);
    } catch (error) {
      console.error("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (favoriteId) => {
    if(window.confirm("Remove this store from favorites?")) {
      const success = await favoriteService.remove(favoriteId);
      if(success) {
        loadFavorites(); // Reload the list
      }
    }
  };

  return (
    <div className="p-6 pb-24">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">My Favorites</h2>
      
      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading favorites...</div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-6xl mb-4">💔</div>
          <h3 className="text-xl font-bold text-gray-800">No favorites yet</h3>
          <p className="text-gray-500 text-sm mt-2">Explore stores and tap the heart to save them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {favorites.map(fav => (
            <div key={fav.favoriteStoreID} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-start gap-4 hover:shadow-md transition">
              <div className="w-16 h-16 bg-pink-50 rounded-xl flex items-center justify-center text-2xl">
                {fav.store.category === 'RESTAURANT' ? '🍔' : '🏪'}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-800">{fav.store.storeName}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} /> {fav.store.city}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleRemove(fav.favoriteStoreID)}
                    className="p-2 hover:bg-red-50 rounded-full transition text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={20} />
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