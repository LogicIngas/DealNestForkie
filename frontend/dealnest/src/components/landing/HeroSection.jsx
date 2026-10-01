import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, Clock, MapPin, Star, Ticket, Check, Store as StoreIcon, Sparkles } from 'lucide-react';

// Illustrative cards, not live data — the marketing page must render with no
// session and no API call. The two deals mirror what the demo seed publishes so
// the prices on this page match what you actually see after `npm run seed`.
const SHOWCASE = [
  {
    id: 'airfryer',
    store: 'Mokoena Electronics',
    city: 'Joburg',
    title: 'Digital air fryer 5L',
    was: 2199,
    now: 1199,
    off: 46,
    daysLeft: 5,
    category: 'ELECTRONICS',
    accent: 'from-blue-500 to-blue-600',
  },
  {
    id: 'tv',
    store: 'Mokoena Electronics',
    city: 'Joburg',
    title: '55" 4K smart TV',
    was: 15999,
    now: 9599,
    off: 40,
    daysLeft: 9,
    category: 'ELECTRONICS',
    accent: 'from-violet-500 to-violet-600',
  },
];

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function voucherCode(seed) {
  let out = '';
  for (let i = 0; i < 8; i += 1) out += CODE_CHARS[(seed * (i + 3) * 7 + i * 11) % CODE_CHARS.length];
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

export default function HeroSection({ isAuthenticated }) {
  const primaryTo = isAuthenticated ? '/app' : '/signup';
  const primaryLabel = isAuthenticated ? 'Open the app' : 'Start saving free';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div
        aria-hidden="true"
        className="absolute -top-40 -right-32 w-[34rem] h-[34rem] rounded-full bg-teal-300/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-48 -left-24 w-[30rem] h-[30rem] rounded-full bg-emerald-400/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-14 lg:gap-8 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 px-4 py-1.5 text-xs font-bold text-teal-50 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            South Africa's local deals marketplace
          </span>

          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
            The best deals in your neighbourhood,
            <span className="block text-teal-100">all in one nest.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-teal-50/90 max-w-xl leading-relaxed">
            Local stores publish their real promotions. You browse, save and claim a voucher code, then show it
            in-store. No coupon hunting, no expired printouts.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3.5">
            <Link
              to={primaryTo}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-base font-extrabold text-teal-700 shadow-xl shadow-teal-900/20 hover:-translate-y-0.5 hover:shadow-2xl transition-all"
            >
              {primaryLabel}
              <Tag className="w-5 h-5" aria-hidden="true" />
            </Link>
            <a
              href="#stores"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/40 bg-white/10 backdrop-blur-sm px-7 py-4 text-base font-bold text-white hover:bg-white/20 hover:border-white/70 transition-all"
            >
              <StoreIcon className="w-5 h-5" aria-hidden="true" />
              I own a store
            </a>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-teal-50/90">
            {['Free to join', 'No card needed to browse', 'Nothing auto-renews'].map(item => (
              <li key={item} className="inline-flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-200" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {SHOWCASE.map(deal => (
              <article
                key={deal.id}
                className="bg-white rounded-3xl shadow-2xl shadow-teal-900/25 p-5 hover:-translate-y-1 transition-transform"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${deal.accent} flex items-center justify-center`}>
                    <Ticket className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 text-white px-2.5 py-1 text-xs font-extrabold">
                    <Tag className="w-3 h-3" aria-hidden="true" />
                    {deal.off}% OFF
                  </span>
                </div>

                <h3 className="mt-4 font-extrabold text-gray-900 leading-snug">{deal.title}</h3>
                <p className="mt-1 text-sm text-gray-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  {deal.store} · {deal.city}
                </p>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-teal-600">
                    R{deal.now.toLocaleString('en-ZA')}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    R{deal.was.toLocaleString('en-ZA')}
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold text-emerald-600">
                  You save R{(deal.was - deal.now).toLocaleString('en-ZA')}
                </p>

                <div className="mt-4 rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/70 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700">Voucher code</p>
                  <p className="font-mono text-lg font-extrabold tracking-[0.2em] text-teal-900 mt-0.5">
                    {voucherCode(deal.id.length + deal.now)}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-orange-500" aria-hidden="true" />
                    {deal.daysLeft} days left
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                    <Star className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true" />
                    4.8
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="absolute -bottom-6 -left-2 sm:left-4 lg:-left-6 hidden sm:block bg-white rounded-2xl shadow-xl shadow-teal-900/15 px-5 py-4 border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Redeemed in store</p>
            <p className="mt-1 text-sm font-extrabold text-gray-900">
              7 days ago · R1 000 saved
            </p>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 mt-20 sm:mt-24">
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-5 sm:p-7">
          {[
            { value: '8', label: 'Deal categories' },
            { value: '6', label: 'Cities covered' },
            { value: 'R49', label: 'Plus, per 30 days' },
            { value: 'R0', label: 'To start saving' },
          ].map(stat => (
            <div key={stat.label} className="text-center sm:text-left">
              <dt className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{stat.value}</dt>
              <dd className="mt-1 text-xs sm:text-sm font-semibold text-teal-100/85">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
