import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheckIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { adminService } from '../services/api';

export default function AdminLoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const adminData = await adminService.login(email, password);
      onLogin(adminData);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Incorrect email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="px-8 pt-8 pb-4 text-center">
            <ShieldCheckIcon className="w-10 h-10 text-gray-800 mx-auto" />
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight mt-2">DealNest Admin</h1>
          </div>
          <div className="p-8 pt-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-4 text-center">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                <input type="email" placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-12" required />
              </div>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-12" required />
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
