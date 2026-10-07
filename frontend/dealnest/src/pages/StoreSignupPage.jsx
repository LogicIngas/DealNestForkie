import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Zap, Star, Tag } from 'lucide-react';
import { storeService, userService } from '../services/api';
import { CATEGORIES } from '../constants/categories';
import EmailField from '../components/EmailField';
import { validateEmail } from '../lib/validation';
import { LOGO_HEADER } from '../assets/logos';

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
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── LEFT PANEL – Form ── */}
      <div className="flex flex-col justify-center bg-white w-full lg:w-1/2 overflow-y-auto px-8 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-md mx-auto lg:mx-0">
          
          {/* Logo */}
          <div style={{ marginBottom: '32px' }}>
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

          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#111827', marginBottom: '8px', lineHeight: '1.2' }}>
              Register Your Store
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
              Start sharing deals with customers in your neighborhood.
            </p>
          </div>

          {error && (
            <div role="alert" aria-live="polite" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Store Name</label>
              <input name="storeName" placeholder="Store Name" onChange={handleChange} className="input-field" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>First Name</label>
                <input name="ownerFirstName" placeholder="Owner First Name" onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Last Name</label>
                <input name="ownerLastName" placeholder="Owner Last Name" onChange={handleChange} className="input-field" required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Email</label>
              <EmailField
                id="store-signup-email"
                value={formData.email}
                onChange={value => setFormData(prev => ({ ...prev, email: value }))}
                placeholder="Business Email"
                hideLabel
                label="Email"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Password</label>
                <input name="password" type="password" placeholder="Min 8 chars" onChange={handleChange} className="input-field" required minLength={8} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Phone</label>
                <input name="phoneNumber" placeholder="Phone Number" onChange={handleChange} className="input-field" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Address</label>
                <input name="address" placeholder="Address" onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>City</label>
                <input name="city" placeholder="City" onChange={handleChange} className="input-field" required />
              </div>
            </div>

            <div style={{ marginTop: '-8px' }}>
              <button
                type="button"
                onClick={handleLookupAddress}
                disabled={isLookingUp}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#0d9488', background: 'none', border: 'none', cursor: isLookingUp ? 'not-allowed' : 'pointer', opacity: isLookingUp ? 0.6 : 1 }}
              >
                <MapPin size={14} /> {isLookingUp ? 'Looking up…' : 'Look up coordinates from address'}
              </button>
              {lookupStatus && <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{lookupStatus}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Category</label>
              <select name="category" onChange={handleChange} className="input-field" value={formData.category}>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '4px', fontSize: '15px', letterSpacing: '0.01em' }}>
              {isLoading ? 'Registering...' : 'Register Store'}
            </button>
          </form>

          {/* Footer links */}
          <div style={{ marginTop: '28px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              Already registered?{' '}
              <Link to="/login" style={{ color: '#0d9488', fontWeight: '700', textDecoration: 'none' }}>Log In</Link>
            </p>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              Looking for deals?{' '}
              <Link to="/signup" style={{ color: '#0d9488', fontWeight: '700', textDecoration: 'none' }}>Customer Sign Up</Link>
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
