import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storeService, userService } from '../services/api';

export default function StoreSignupPage() {
  const [formData, setFormData] = useState({
    storeName: '',
    ownerFirstName: '',
    ownerLastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: '',
    city: '',
    latitude: 0,
    longitude: 0,
    category: 'OTHER',
    description: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // A store owner needs a real login account first, then the store is linked to it.
      const newUser = await userService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.ownerFirstName,
        lastName: formData.ownerLastName,
        phoneNumber: formData.phoneNumber,
        latitude: formData.latitude,
        longitude: formData.longitude,
        isActive: true,
      });

      await storeService.create({
        storeName: formData.storeName,
        category: formData.category,
        description: formData.description,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.city,
        latitude: formData.latitude,
        longitude: formData.longitude,
        user: { userID: newUser.userID },
      });

      alert('Store registered successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to register store.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">Register Your Store</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-4 text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="storeName" placeholder="Store Name" onChange={handleChange} className="input-field" required />
          <div className="grid grid-cols-2 gap-3">
            <input name="ownerFirstName" placeholder="Your First Name" onChange={handleChange} className="input-field" required />
            <input name="ownerLastName" placeholder="Your Last Name" onChange={handleChange} className="input-field" required />
          </div>
          <input name="email" type="email" placeholder="Business Email" onChange={handleChange} className="input-field" required />
          <input name="password" type="password" placeholder="Password (min 8 chars)" onChange={handleChange} className="input-field" required minLength={8} />
          <input name="phoneNumber" placeholder="Phone Number" onChange={handleChange} className="input-field" required />
          <input name="address" placeholder="Address" onChange={handleChange} className="input-field" required />
          <input name="city" placeholder="City" onChange={handleChange} className="input-field" required />
          <select name="category" onChange={handleChange} className="input-field">
            <option value="OTHER">Other</option>
            <option value="RESTAURANT">Restaurant</option>
            <option value="GROCERY">Grocery</option>
            <option value="ELECTRONICS">Electronics</option>
            <option value="FASHION">Fashion</option>
          </select>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? 'Registering...' : 'Register Store'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-500">Already registered? <Link to="/login" className="text-teal-600 font-bold">Login</Link></p>
      </div>
    </div>
  );
}
