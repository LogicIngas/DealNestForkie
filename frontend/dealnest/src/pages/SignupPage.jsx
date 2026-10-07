import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Phone, User, ShoppingBag, MapPin, Zap, Star, Tag } from 'lucide-react';
import { userService } from '../services/api';
import EmailField from '../components/EmailField';
import { validateEmail } from '../lib/validation';
import { LOGO_HEADER } from '../assets/logos';

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
  const [locationGranted, setLocationGranted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setLocationGranted(true);
      },
      () => {}
    );
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailError = validateEmail(formData.email);
    if (emailError) {
      setError(emailError);
      return;
    }

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
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── LEFT PANEL – Form ── */}
      <div className="flex flex-col justify-center bg-white w-full lg:w-1/2 overflow-y-auto px-8 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-md mx-auto lg:mx-0">
          {/* Logo */}
          <div style={{ marginBottom: '40px' }}>
            <Link
              to="/"
              aria-label="Go to DealNest home"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <img
                src={LOGO_HEADER.src}
                srcSet={LOGO_HEADER.srcSet}
                sizes={LOGO_HEADER.sizes}
                alt="DealNest"
                width={103}
                height={56}
                style={{ height: '40px', width: 'auto' }}
              />
            </Link>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#111827', marginBottom: '8px', lineHeight: '1.2' }}>
              Join DealNest
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
              Create an account to browse and save local deals.
            </p>
          </div>

          {error && (
            <div role="alert" aria-live="polite" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>First Name</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', width: '18px', height: '18px' }} />
                  <input 
                    type="text" 
                    name="firstName" 
                    placeholder="First Name" 
                    onChange={handleChange}
                    className="input-field"
                    style={{ paddingLeft: '44px' }}
                    required 
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Last Name</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', width: '18px', height: '18px' }} />
                  <input 
                    type="text" 
                    name="lastName" 
                    placeholder="Last Name" 
                    onChange={handleChange}
                    className="input-field"
                    style={{ paddingLeft: '44px' }}
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Email</label>
              <EmailField
                id="signup-email"
                value={formData.email}
                onChange={value => setFormData(prev => ({ ...prev, email: value }))}
                hideLabel
                label="Email"
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', width: '18px', height: '18px' }} />
                <input 
                  type="text" 
                  name="phoneNumber" 
                  placeholder="e.g. 0821234567" 
                  onChange={handleChange}
                  className="input-field"
                  style={{ paddingLeft: '44px' }}
                  required 
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', width: '18px', height: '18px' }} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  placeholder="Min 8 chars" 
                  onChange={handleChange}
                  className="input-field"
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                >
                  {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                </button>
              </div>
            </div>

            {!locationGranted && (
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9ca3af' }}>
                <MapPin style={{ width: '13px', height: '13px' }} /> Enable location so we can show nearby deals
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ marginTop: '4px', fontSize: '15px', letterSpacing: '0.01em' }}
            >
              {isLoading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          {/* Footer links */}
          <div style={{ marginTop: '28px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#0d9488', fontWeight: '700', textDecoration: 'none' }}>Sign In</Link>
            </p>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              Own a business?{' '}
              <Link to="/store-signup" style={{ color: '#0d9488', fontWeight: '700', textDecoration: 'none' }}>Register Store</Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL – Brand / Testimonial (desktop only) ── */}
      <div
        aria-hidden="true"
        className="hidden lg:flex lg:w-1/2 flex-col justify-between relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 40%, #059669 100%)',
          padding: '56px 52px',
        }}
      >
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '360px', height: '360px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '38%', left: '55%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        {/* Top: hero text */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: '999px', marginBottom: '32px' }}>
            <Zap style={{ width: '13px', height: '13px', color: '#a7f3d0' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#a7f3d0', letterSpacing: '0.07em', textTransform: 'uppercase' }}>South Africa's local deals marketplace</span>
          </div>

          <h2 style={{ fontSize: '2.75rem', fontWeight: '300', lineHeight: '1.02', letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '20px' }}>
            The best deals<br />
            in your street,<br />
            <span style={{ fontWeight: '800', color: '#a7f3d0' }}>all in one nest.</span>
          </h2>

          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.7', maxWidth: '380px' }}>
            Local stores publish their real promotions. Browse, save and claim a voucher code, then show it in-store. No coupon hunting, no expired printouts.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '32px', marginTop: '40px', flexWrap: 'wrap' }}>
            {[
              { value: '8', label: 'Deal categories' },
              { value: '6', label: 'Cities covered' },
              { value: 'R0', label: 'Free to join' },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: '1.875rem', fontWeight: '800', color: '#ffffff', lineHeight: '1' }}>{stat.value}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '5px', fontWeight: '500', letterSpacing: '0.04em' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: testimonial card + feature badges */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Testimonial */}
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '16px', padding: '24px 28px', marginBottom: '28px' }}>
            <svg width="22" height="16" viewBox="0 0 24 18" fill="none" style={{ marginBottom: '12px', opacity: 0.55 }}>
              <path d="M0 18V10.8C0 7.8 0.9 5.3 2.7 3.3 4.5 1.1 6.9 0 10 0l1.2 2.1C9 2.5 7.3 3.3 6 4.5 4.7 5.7 4 7.2 3.8 9H7V18H0zm13 0V10.8c0-3 .9-5.5 2.7-7.5C17.5 1.1 19.9 0 23 0l1.2 2.1c-2.2.4-3.9 1.2-5.2 2.4-1.3 1.2-2 2.7-2.2 4.5H20V18h-7z" fill="white"/>
            </svg>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.65', fontStyle: 'italic', marginBottom: '18px' }}>
              "DealNest completely changed how I shop. I found a 46% discount on an air fryer I'd been eyeing for months — right at a store two streets away."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #a7f3d0, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#0f766e', fontSize: '13px', flexShrink: 0 }}>
                TM
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>Thabo Mokoena</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>DealNest customer · Johannesburg</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} style={{ width: '12px', height: '12px', fill: '#fbbf24', color: '#fbbf24' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Feature chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {[
              { icon: <Tag style={{ width: '13px', height: '13px' }} />, text: 'Real store deals' },
              { icon: <MapPin style={{ width: '13px', height: '13px' }} />, text: 'Near you always' },
              { icon: <Zap style={{ width: '13px', height: '13px' }} />, text: 'Instant vouchers' },
            ].map(chip => (
              <div
                key={chip.text}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 14px', borderRadius: '999px', color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: '600' }}
              >
                {chip.icon}
                {chip.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}