import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Store as StoreIcon } from 'lucide-react';
import logo from '../../assets/logo.png';

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#categories', label: 'Categories' },
  { href: '#stores', label: 'For stores' },
  { href: '#pricing', label: 'Pricing' },
];

export default function LandingNav({ isAuthenticated }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The mobile sheet covers the page, so lock the body behind it while it's open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all ${
        scrolled ? 'bg-white/85 backdrop-blur-lg border-b border-gray-100 shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className={`flex items-center justify-between transition-all ${scrolled ? 'h-16' : 'h-20'}`}>
          <Link to="/" className="flex items-center gap-2.5" aria-label="DealNest home">
            <img src={logo} alt="DealNest" width={86} height={46} className="h-11 w-auto" />
          </Link>

          <nav className="hidden lg:flex items-center gap-8" aria-label="Main">
            {LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors hover:text-teal-700 ${
                  scrolled ? 'text-gray-600' : 'text-gray-700'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/store-signup"
              className={`inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors ${
                scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-800 hover:bg-white/60'
              }`}
            >
              <StoreIcon className="w-4 h-4" aria-hidden="true" />
              List your store
            </Link>
            {isAuthenticated ? (
              <Link
                to="/app"
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-teal-200/60 hover:shadow-lg hover:shadow-teal-300/60 hover:-translate-y-0.5 transition-all"
              >
                Open the app
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-gray-700 hover:text-teal-700 transition-colors px-2">
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-teal-200/60 hover:shadow-lg hover:shadow-teal-300/60 hover:-translate-y-0.5 transition-all"
                >
                  Start saving
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between h-20 px-5">
            <img src={logo} alt="DealNest" width={86} height={46} className="h-11 w-auto" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="px-5 pt-4 flex flex-col" aria-label="Mobile">
            {LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-lg font-bold text-gray-800 py-4 border-b border-gray-100"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/store-signup"
              onClick={() => setOpen(false)}
              className="text-lg font-bold text-gray-800 py-4 border-b border-gray-100"
            >
              List your store
            </Link>
            <div className="mt-8 flex flex-col gap-3">
              {isAuthenticated ? (
                <Link
                  to="/app"
                  onClick={() => setOpen(false)}
                  className="w-full text-center rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-base font-bold text-white"
                >
                  Open the app
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="w-full text-center rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-base font-bold text-white"
                  >
                    Start saving
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="w-full text-center rounded-2xl border-2 border-teal-600 px-6 py-4 text-base font-bold text-teal-700"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
