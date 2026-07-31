import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Phone, User, ShoppingBag } from 'lucide-react';
import { userService } from '../services/api';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    latitude: 0,
    longitude: 0,
    isActive: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await userService.register(formData);
      alert('Account created successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Error creating account. Email may already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-500 to-teal-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-white px-8 pt-8 pb-4 text-center border-b border-gray-100">
            <ShoppingBag className="mx-auto mb-2 text-teal-600" size={40} />
            <h1 className="text-3xl font-bold text-gray-800">DealNest</h1>
            <p className="text-gray-500 text-sm mt-1">Join the community of smart shoppers</p>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Get Started</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-4 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    name="firstName" 
                    placeholder="First Name" 
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200/50 transition-all text-gray-700 placeholder-gray-400"
                    required 
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    name="lastName" 
                    placeholder="Last Name" 
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200/50 transition-all text-gray-700 placeholder-gray-400"
                    required 
                  />
                </div>
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Email Address" 
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200/50 transition-all text-gray-700 placeholder-gray-400"
                  required 
                />
              </div>

              {/* Phone */}
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  type="text" 
                  name="phoneNumber" 
                  placeholder="Phone Number (e.g. 0821234567)" 
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200/50 transition-all text-gray-700 placeholder-gray-400"
                  required 
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  placeholder="Password (min 8 chars)" 
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200/50 transition-all text-gray-700 placeholder-gray-400"
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-200/50 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl hover:scale-[1.02]'}`}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-gray-500 text-sm">Already have an account? </span>
              <Link to="/login" className="text-teal-600 font-semibold hover:underline">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}