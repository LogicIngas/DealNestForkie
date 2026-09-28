import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { userService } from '../services/api';
import logo from '../assets/logo.png';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await userService.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The token may be expired.');
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
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Set New Password</h2>
            
            {success ? (
              <div className="text-center space-y-4">
                <div role="alert" aria-live="polite" className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm">
                  Your password has been successfully reset!
                </div>
                <p className="text-sm text-gray-500">Redirecting to login...</p>
                <Link to="/login" className="btn-primary block mt-4 text-center py-2.5">Go to Login</Link>
              </div>
            ) : (
              <>
                {error && (
                  <div role="alert" aria-live="polite" className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-4 text-center">
                    {error}
                  </div>
                )}
                {!token && (
                  <div role="alert" aria-live="polite" className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-xl text-sm mb-4 text-center">
                    No reset token found in the URL. Please click the link in your email again.
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="new-password" className="sr-only">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" aria-hidden="true" />
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="New Password (min 8 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field pl-12 pr-12"
                        required
                        minLength={8}
                        disabled={!token}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                        disabled={!token}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading || !token} className="btn-primary">
                    {isLoading ? 'Resetting…' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
