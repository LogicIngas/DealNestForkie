import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { userService, storeService } from '../services/api';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const userData = await userService.login(email, password);
      const linkedStore = await storeService.findByUserId(userData.userID);
      const userRole = linkedStore ? 'store' : 'customer';
      onLogin(userData, userRole);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Incorrect email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md transform transition-all">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="px-8 pt-8 pb-4 text-center">
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">DealNest</h1>
          </div>
          <div className="p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Welcome Back</h2>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-4 text-center">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-12" required />
              </div>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-12 pr-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-500 text-sm">Don't have a customer account? <Link to="/signup" className="text-teal-600 font-bold">Sign Up</Link></p>
              <p className="text-gray-500 text-sm">Own a business? <Link to="/store-signup" className="text-teal-600 font-bold">Register Store</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}