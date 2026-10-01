import React from 'react';
import { Link } from 'react-router-dom';
import { Storefront, ShieldCheck, Ticket, ChartLineUp } from '@phosphor-icons/react';
import Reveal from './Reveal';

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

const PROMISES = [
  { icon: ShieldCheck, text: 'Tier gating is enforced server-side' },
  { icon: Ticket, text: 'Checkout never stores or logs your card' },
  { icon: ChartLineUp, text: 'Store analytics tracked automatically' },
];

export default function LandingFooter({ isAuthenticated }) {
  return (
    <footer className="relative bg-gray-50 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-900/10 to-transparent" />

        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Reveal>
              <Link to="/" className="flex items-center gap-2.5 font-display text-[0.9375rem] font-semibold tracking-tight text-gray-900">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-teal-600 to-emerald-600">
                  <Storefront size={15} weight="fill" className="text-white" />
                </span>
                DealNest
              </Link>
            </Reveal>

            <Reveal delay={80}>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-gray-500">
                A two-sided marketplace for local deals. Stores publish real promotions, shoppers claim a voucher
                code and redeem it in-store.
              </p>
            </Reveal>

            <Reveal delay={140}>
              <ul className="mt-8 space-y-3">
                {PROMISES.map(p => (
                  <li key={p.text} className="flex items-center gap-2.5 text-[13px] text-gray-500">
                    <p.icon size={14} weight="light" className="flex-shrink-0 text-teal-600" aria-hidden="true" />
                    {p.text}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={100} className="lg:col-span-3">
            <h3 className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-400">Get started</h3>
            <ul className="mt-6 space-y-3.5 text-sm">
              {SHOPPER_LINKS.map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-gray-500 fluid duration-500 hover:text-teal-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={160} className="lg:col-span-3">
            <h3 className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-400">The app</h3>
            <ul className="mt-6 space-y-3.5 text-sm">
              {PRODUCT_LINKS.map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-gray-500 fluid duration-500 hover:text-teal-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-slate-900/[0.06] py-8 text-xs text-gray-400 sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} DealNest. Prices in ZAR.</p>
          <p className="flex items-center gap-2">
            {isAuthenticated ? 'Signed in — ' : ''}
            <Link to="/app" className="font-medium text-teal-700 fluid duration-500 hover:text-teal-600">
              Open the app
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
