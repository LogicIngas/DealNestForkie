import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Ticket, Store as StoreIcon, Bell, LineChart, Upload, CalendarClock } from 'lucide-react';

const SHOPPER_STEPS = [
  {
    icon: Search,
    title: 'Browse what is live near you',
    body: 'Search by product, store, city or category. Filter by minimum rating, deals only, distance and a budget ceiling.',
  },
  {
    icon: Ticket,
    title: 'Claim a voucher code',
    body: 'One tap generates a unique code tied to that promotion. Keep every code you have claimed in one place.',
  },
  {
    icon: StoreIcon,
    title: 'Show it in-store, done',
    body: 'The cashier redeems the code and your total-saved tracker updates. Streaks and points build as you go.',
  },
];

const PLUS_FEATURES = [
  { icon: Bell, label: 'Deal and price-drop alerts' },
  { icon: LineChart, label: 'Price history sparklines' },
  { icon: Ticket, label: 'Unlimited saved deals' },
];

const PRO_FEATURES = [
  { icon: LineChart, label: 'Views, saves, claims, redeems, shares' },
  { icon: Upload, label: 'Bulk CSV promotion upload' },
  { icon: CalendarClock, label: 'Scheduling with auto activate/expire' },
];

export default function HowItWorksSection() {
  return (
    <section id="how" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-teal-600">How it works</p>
          <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
            Three steps from scrolling to saving.
          </h2>
          <p className="mt-5 text-lg text-gray-600 leading-relaxed">
            DealNest works for both sides of the counter. Shoppers find and redeem. Stores publish and measure.
            Both run on the same catalogue.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {SHOPPER_STEPS.map((step, i) => (
            <li key={step.title} className="relative bg-gray-50 rounded-3xl border border-gray-100 p-7 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-100/40 transition-all">
              <span className="absolute -top-4 left-7 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-sm font-extrabold text-white shadow-md">
                {i + 1}
              </span>
              <div className="mt-3 h-12 w-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                <step.icon className="w-6 h-6 text-teal-600" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-7 sm:p-9">
            <h3 className="text-xl font-extrabold text-gray-900">DealNest Plus — for shoppers</h3>
            <p className="mt-2 text-sm text-gray-600">
              R49 for 30 days. Not a subscription that quietly rolls over — it expires and you decide.
            </p>
            <ul className="mt-6 space-y-3">
              {PLUS_FEATURES.map(f => (
                <li key={f.label} className="flex items-start gap-3 text-sm font-semibold text-gray-700">
                  <f.icon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {f.label}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="mt-7 inline-flex items-center rounded-xl bg-white border-2 border-amber-300 px-5 py-2.5 text-sm font-extrabold text-amber-700 hover:bg-amber-100 transition-colors"
            >
              Create a free account
            </Link>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 p-7 sm:p-9">
            <h3 className="text-xl font-extrabold text-gray-900">Pro — for store owners</h3>
            <p className="mt-2 text-sm text-gray-600">
              R199 for 30 days. Reach shoppers who are already searching in your category.
            </p>
            <ul className="mt-6 space-y-3">
              {PRO_FEATURES.map(f => (
                <li key={f.label} className="flex items-start gap-3 text-sm font-semibold text-gray-700">
                  <f.icon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {f.label}
                </li>
              ))}
            </ul>
            <Link
              to="/store-signup"
              className="mt-7 inline-flex items-center rounded-xl bg-white border-2 border-teal-300 px-5 py-2.5 text-sm font-extrabold text-teal-700 hover:bg-teal-100 transition-colors"
            >
              Register your store
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
