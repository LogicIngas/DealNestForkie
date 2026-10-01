import React from 'react';
import { Link } from 'react-router-dom';
import { Store as StoreIcon, ShieldCheck, Ticket, LineChart } from 'lucide-react';
import logo from '../../assets/logo.png';

const SHOPPER_LINKS = [
  { to: '/signup', label: 'Create an account' },
  { to: '/login', label: 'Sign in' },
  { to: '/store-signup', label: 'Register a store' },
];

const PRODUCT_LINKS = [
  { to: '/app/explore', label: 'Explore deals' },
  { to: '/app/deals', label: 'Search by product' },
  { to: '/app/profile', label: 'DealNest Plus' },
];

export default function LandingFooter({ isAuthenticated }) {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <img src={logo} alt="DealNest" width={140} height={76} className="h-14 w-auto" />
            <p className="mt-5 text-sm leading-relaxed max-w-sm">
              A two-sided marketplace for local deals. Stores publish real promotions, shoppers claim a voucher
              code and redeem it in-store.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-500 flex-shrink-0" aria-hidden="true" />
                Tier gating is enforced server-side
              </li>
              <li className="flex items-center gap-2.5">
                <Ticket className="w-4 h-4 text-teal-500 flex-shrink-0" aria-hidden="true" />
                Checkout never stores or logs your card
              </li>
              <li className="flex items-center gap-2.5">
                <LineChart className="w-4 h-4 text-teal-500 flex-shrink-0" aria-hidden="true" />
                Store analytics tracked automatically
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Get started</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {SHOPPER_LINKS.map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-teal-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">The app</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {PRODUCT_LINKS.map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-teal-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <p>&copy; {new Date().getFullYear()} DealNest. Prices in ZAR.</p>
          <p className="flex items-center gap-2">
            <StoreIcon className="w-4 h-4 text-teal-500" aria-hidden="true" />
            {isAuthenticated ? 'Signed in — ' : ''}
            <Link to="/app" className="font-bold text-teal-400 hover:text-teal-300 transition-colors">
              Open the app
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
