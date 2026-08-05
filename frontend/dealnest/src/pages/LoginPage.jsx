import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { userService, storeService } from '../services/api';
import logo from '../assets/logo.png';

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
            <img src={logo} alt="DealNest" width={220} height={120} className="h-[120px] w-auto mx-auto" />
          </div>
          <div className="p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Welcome Back</h2>
            {error && (
              <div role="alert" aria-live="polite" className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-4 text-center">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="sr-only">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" aria-hidden="true" />
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-12"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="login-password" className="sr-only">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" aria-hidden="true" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-12 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? 'Signing in…' : 'Sign In'}
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
