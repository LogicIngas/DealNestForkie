import React from 'react';
import { Link } from 'react-router-dom';
import { Store as StoreIcon, BarChart3, Ticket, Check, ArrowRight, ShieldCheck } from 'lucide-react';

const CAPABILITIES = [
  'Publish, edit and expire promotions yourself',
  'A store dashboard for redeeming claimed codes in-store',
  'One promoted deal floated to the top of the feed',
  'One featured deal per store, marked with a star',
  'Analytics on views, saves, claims, redeems and shares',
  'Anonymised customer insights broken down by city',
];

const SAMPLE_ROWS = [
  { label: 'Digital air fryer 5L', views: '1,284', rate: '18.4%', width: 'w-[86%]' },
  { label: '55" 4K smart TV', views: '932', rate: '11.2%', width: 'w-[62%]' },
  { label: 'Bluetooth speaker', views: '604', rate: '7.9%', width: 'w-[41%]' },
  { label: 'USB-C fast charger', views: '318', rate: '4.1%', width: 'w-[22%]' },
];

export default function ForStoresSection() {
  return (
    <section id="stores" className="scroll-mt-20 bg-gray-900 py-20 sm:py-28 relative overflow-hidden">
      <div aria-hidden="true" className="absolute -top-32 right-0 w-[32rem] h-[32rem] rounded-full bg-teal-600/20 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-40 -left-20 w-[26rem] h-[26rem] rounded-full bg-emerald-600/10 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-500/15 border border-teal-400/30 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-teal-300">
            <StoreIcon className="w-3.5 h-3.5" aria-hidden="true" />
            For store owners
          </span>

          <h2 className="mt-6 text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
            Your shelf space, without the print-out.
          </h2>

          <p className="mt-5 text-lg text-gray-300 leading-relaxed">
            A promotion on DealNest is live in minutes and measurable the moment a shopper views it. You get the
            whole loop — publish, redeem, measure — in one dashboard.
          </p>

          <ul className="mt-8 space-y-3.5">
            {CAPABILITIES.map(item => (
              <li key={item} className="flex items-start gap-3 text-sm sm:text-base text-gray-200">
                <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col sm:flex-row gap-3.5">
            <Link
              to="/store-signup"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 px-7 py-4 text-base font-extrabold text-white hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-500/25 transition-all"
            >
              Register your store
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-gray-700 px-7 py-4 text-base font-bold text-gray-200 hover:border-teal-400 hover:text-white transition-colors"
            >
              Owner sign in
            </Link>
          </div>

          <p className="mt-7 flex items-start gap-2.5 text-xs text-gray-400 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            Paid perks are enforced on the server, not hidden in the interface. A non-Pro store's promoted and
            featured flags are stripped before the feed is served.
          </p>
        </div>

        <div className="relative">
          <div className="rounded-3xl bg-white shadow-2xl shadow-black/40 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-gray-900">Mokoena Electronics</p>
                  <p className="text-[11px] text-gray-500">Store dashboard · Joburg</p>
                </div>
              </div>
              <span className="rounded-full bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider">
                Pro
              </span>
            </div>

            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
              {[
                { label: 'Views', value: '3,138' },
                { label: 'Claims', value: '412' },
                { label: 'Redeemed', value: '287' },
              ].map(stat => (
                <div key={stat.label} className="px-4 py-4 text-center">
                  <p className="text-xl font-extrabold text-gray-900">{stat.value}</p>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="px-6 py-5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Conversion by promotion</p>
              <ul className="mt-4 space-y-4">
                {SAMPLE_ROWS.map(row => (
                  <li key={row.label}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-semibold text-gray-700 truncate">{row.label}</span>
                      <span className="text-xs font-extrabold text-teal-600 flex-shrink-0">{row.rate}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 ${row.width}`} />
                      </div>
                      <span className="text-[11px] text-gray-400 w-12 text-right flex-shrink-0">{row.views} views</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Redeem a claimed code in-store and the shopper's total-saved updates immediately.
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 flex-shrink-0">
                <Ticket className="w-4 h-4 text-teal-600" aria-hidden="true" />
                Redeem
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
