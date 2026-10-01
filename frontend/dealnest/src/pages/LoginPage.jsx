import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { userService, storeService } from '../services/api';
import EmailField from '../components/EmailField';
import { validateEmail } from '../lib/validation';
import logo from '../assets/logo.png';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice] = useState(() => sessionStorage.getItem('dealnest_session_message') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState('login'); // 'login' | 'forgot_password'
  const [resetMessage, setResetMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Where to go once signed in. A category link on the landing page or the home feed sends
  // an anonymous visitor here carrying ?category=…; without this the category was silently
  // dropped and the visitor landed on an unfiltered home feed. Only in-app paths are
  // honoured — anything else in the state falls back to /app rather than being navigated to.
  const destination = (() => {
    const from = location.state?.from;
    return typeof from === 'string' && /^\/app(\/|$)/.test(from) ? from : '/app';
  })();

  useEffect(() => {
    sessionStorage.removeItem('dealnest_session_message');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setDevResetUrl('');

    // Guard both branches: a malformed address on forgot-password would silently
    // produce the generic "if that account exists" reply and look like a sent email.
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);

    if (view === 'forgot_password') {
      try {
        const response = await userService.forgotPassword(email);
        setResetMessage(response.message || 'Check your email for the reset link.');
        if (response.devResetUrl) {
          setDevResetUrl(response.devResetUrl);
        }
      } catch (err) {
        setError(err.message || 'Failed to send reset link.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const userData = await userService.login(email, password);
      const linkedStore = await storeService.findByUserId(userData.userID);
      const userRole = linkedStore ? 'store' : 'customer';
      onLogin(userData, userRole);
      navigate(destination);
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
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
              {view === 'login' ? 'Welcome Back' : 'Reset Password'}
            </h2>
            {notice && (
              <div role="alert" aria-live="polite" className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-xl text-sm mb-4 text-center">
                {notice}
              </div>
            )}
            {error && (
              <div role="alert" aria-live="polite" className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-4 text-center">
                {error}
              </div>
            )}
            {resetMessage && (
              <div role="alert" aria-live="polite" className="bg-teal-50 border border-teal-200 text-teal-700 p-4 rounded-xl text-sm mb-4 text-center">
                <p>{resetMessage}</p>
                {devResetUrl && (
                  <div className="mt-3 pt-3 border-t border-teal-200">
                    <a
                      href={devResetUrl}
                      className="inline-block px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-xs transition shadow-sm"
                    >
                      🔗 Open Reset Password Page (Local Dev)
                    </a>
                  </div>
                )}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <EmailField
                id="login-email"
                label="Email address"
                hideLabel
                value={email}
                onChange={setEmail}
              />
              {view === 'login' && (
                <>
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
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => { setView('forgot_password'); setError(''); setResetMessage(''); }}
                      className="text-xs font-semibold text-teal-600 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </>
              )}
              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? 'Please wait…' : view === 'login' ? 'Sign In' : 'Send Reset Link'}
              </button>
              {view === 'forgot_password' && (
                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => { setView('login'); setError(''); setResetMessage(''); }}
                    className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition"
                  >
                    Back to Login
                  </button>
                </div>
              )}
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
