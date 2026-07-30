import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storeService } from '../services/api';

export default function StoreSignupPage() {
  const [formData, setFormData] = useState({
    storeName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    latitude: 0,
    longitude: 0,
    category: 'OTHER',
    description: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await storeService.create(formData);
      alert('Store created successfully! Please log in.');
      navigate('/login');
    } catch (error) {
      alert('Failed to create store.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">Register Your Store</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="storeName" placeholder="Store Name" onChange={handleChange} className="input-field" required />
          <input name="email" type="email" placeholder="Business Email" onChange={handleChange} className="input-field" required />
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
          <button type="submit" className="btn-primary">Register Store</button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-500">Already registered? <Link to="/login" className="text-teal-600 font-bold">Login</Link></p>
      </div>
    </div>
  );
}