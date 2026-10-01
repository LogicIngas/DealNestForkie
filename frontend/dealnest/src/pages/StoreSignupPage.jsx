import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { storeService, userService } from '../services/api';
import { CATEGORIES } from '../constants/categories';
import EmailField from '../components/EmailField';
import { validateEmail } from '../lib/validation';

export default function StoreSignupPage({ onLogin }) {
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
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupStatus, setLookupStatus] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLookupAddress = async () => {
    if (!formData.address || !formData.city) {
      setLookupStatus('Enter an address and city first.');
      return;
    }
    setIsLookingUp(true);
    setLookupStatus('');
    try {
      const query = encodeURIComponent(`${formData.address}, ${formData.city}`);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
      const results = await response.json();
      if (results.length === 0) {
        setLookupStatus('Address not found — try being more specific.');
        return;
      }
      setFormData((prev) => ({ ...prev, latitude: parseFloat(results[0].lat), longitude: parseFloat(results[0].lon) }));
      setLookupStatus('Location found ✓');
    } catch {
      setLookupStatus('Lookup failed — you can still register, just fix it later.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // The store's contact address is what shoppers see on the store page and
    // what a verified badge is checked against, so it has to be a real mailbox.
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);
    try {
      // A store owner needs a real login account first, then the store is linked to it.
      await userService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.ownerFirstName,
        lastName: formData.ownerLastName,
        phoneNumber: formData.phoneNumber,
        latitude: formData.latitude,
        longitude: formData.longitude,
        isActive: true,
      });

      // Sign straight in so the store creation below carries a valid session.
      const newUser = await userService.login(formData.email, formData.password);

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

      onLogin(newUser, 'store');
      navigate('/app');
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
          <EmailField
            id="store-signup-email"
            value={formData.email}
            onChange={value => setFormData(prev => ({ ...prev, email: value }))}
            placeholder="Business Email"
          />
          <input name="password" type="password" placeholder="Password (min 8 chars)" onChange={handleChange} className="input-field" required minLength={8} />
          <input name="phoneNumber" placeholder="Phone Number" onChange={handleChange} className="input-field" required />
          <input name="address" placeholder="Address" onChange={handleChange} className="input-field" required />
          <input name="city" placeholder="City" onChange={handleChange} className="input-field" required />
          <div>
            <button
              type="button"
              onClick={handleLookupAddress}
              disabled={isLookingUp}
              className="flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 disabled:opacity-60"
            >
              <MapPin size={15} /> {isLookingUp ? 'Looking up…' : 'Look up address'}
            </button>
            {lookupStatus && <p className="text-xs text-gray-400 mt-1">{lookupStatus}</p>}
          </div>
          <select name="category" onChange={handleChange} className="input-field" value={formData.category}>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
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
