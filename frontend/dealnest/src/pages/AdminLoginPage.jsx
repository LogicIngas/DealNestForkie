import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { adminService } from '../services/api';
import logo from '../assets/logo.png';

export default function AdminLoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // A session-expired redirect drops the reason here; an empty state reads as
  // "nothing happened", which is how an expired token came to look like a broken site.
  const [notice, setNotice] = useState(() => sessionStorage.getItem('dealnest_admin_message') || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    sessionStorage.removeItem('dealnest_admin_message');
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
            <img src={logo} alt="DealNest" width={183} height={100} className="h-[100px] w-auto mx-auto" />
            <p className="flex items-center justify-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wider mt-2">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Admin Portal
            </p>
          </div>
          <div className="p-8 pt-4">
            {notice && (
              <div role="status" aria-live="polite" className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-sm mb-4 text-center">
                {notice}
              </div>
            )}
            {error && (
              <div role="alert" aria-live="polite" className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-4 text-center">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="admin-email" className="sr-only">Admin email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" aria-hidden="true" />
                  <input
                    id="admin-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Admin Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-12"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="admin-password" className="sr-only">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" aria-hidden="true" />
                  <input
                    id="admin-password"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-12"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
