import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Minus, Bell, LineChart, Ticket, Upload, CalendarClock, Star, Users, TrendingUp } from 'lucide-react';

const FREE = [
  'Browse and search every live deal',
  'Save stores and bookmark deals',
  '10 saved deals on the free plan',
  'Claim and redeem voucher codes',
  'Total-saved tracker, streaks and points',
  'Reviews, reports and sharing',
];

const PLUS = [
  'Everything on Free',
  { icon: Ticket, text: 'Unlimited saved deals' },
  { icon: Bell, text: 'Deal and price-drop alerts' },
  { icon: LineChart, text: 'Price history sparklines' },
  { icon: Star, text: 'Plus badge on your reviews' },
  { icon: Users, text: 'Personalised recommendations' },
];

const PRO = [
  'Everything on Free for your shopfront',
  { icon: TrendingUp, text: 'Full analytics dashboard' },
  { icon: Users, text: 'Customer insights by city' },
  { icon: CalendarClock, text: 'Promotion scheduling' },
  { icon: Upload, text: 'Bulk CSV upload' },
  { icon: Star, text: 'Promoted and featured flags' },
];

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 'R0',
    cadence: 'forever',
    blurb: 'Everything you need to start using local deals.',
    to: '/signup',
    cta: 'Create a free account',
    features: FREE.map(text => ({ icon: Check, text, tone: 'neutral' })),
    featured: false,
  },
  {
    id: 'plus',
    name: 'DealNest Plus',
    price: 'R49',
    cadence: 'per 30 days',
    blurb: 'For shoppers who want to be told the moment a price drops.',
    to: '/signup',
    cta: 'Start with Plus',
    features: PLUS,
    featured: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R199',
    cadence: 'per 30 days',
    blurb: 'For stores publishing real promotions to real footfall.',
    to: '/store-signup',
    cta: 'Register your store',
    features: PRO,
    featured: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-teal-600">Pricing</p>
          <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
            Free for shoppers. Two flat upgrades, no auto-renewal.
          </h2>
          <p className="mt-5 text-lg text-gray-600 leading-relaxed">
            Paid plans run for 30 days and then expire on their own. Nothing renews silently, and the card you
            type in at checkout is never stored or logged.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3 items-start">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-7 sm:p-8 h-full flex flex-col ${
                plan.featured
                  ? 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-2xl shadow-teal-200/50 lg:-my-4 lg:py-12'
                  : 'bg-gray-50 border border-gray-100'
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3.5 left-7 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-950">
                  Most popular
                </span>
              )}

              <h3 className={`text-lg font-extrabold ${plan.featured ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              <p className={`mt-1.5 text-sm ${plan.featured ? 'text-teal-50/85' : 'text-gray-500'}`}>{plan.blurb}</p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                <span className={`text-sm font-semibold ${plan.featured ? 'text-teal-50/80' : 'text-gray-500'}`}>
                  {plan.cadence}
                </span>
              </div>

              <ul className="mt-7 space-y-3 flex-1">
                {plan.features.map(feature => (
                  <li
                    key={feature.text}
                    className={`flex items-start gap-3 text-sm ${
                      plan.featured ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    <feature.icon
                      className={`flex-shrink-0 mt-0.5 ${plan.featured ? 'text-teal-200' : 'text-teal-600'}`}
                      style={{ width: 18, height: 18 }}
                      aria-hidden="true"
                    />
                    {feature.text}
                  </li>
                ))}
                {plan.id === 'free' && (
                  <li className="flex items-start gap-3 text-sm text-gray-400">
                    <Minus className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    Price-drop alerts and sparklines
                  </li>
                )}
              </ul>

              <Link
                to={plan.to}
                className={`mt-8 inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-extrabold transition-all ${
                  plan.featured
                    ? 'bg-white text-teal-700 hover:-translate-y-0.5 hover:shadow-lg'
                    : 'bg-white border-2 border-teal-600 text-teal-700 hover:bg-teal-50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Checkout is DealNest's own: it validates the card you enter and decides an outcome locally, so nothing
          is charged. The upgrade path is disabled on the deployed site.
        </p>
      </div>
    </section>
  );
}
