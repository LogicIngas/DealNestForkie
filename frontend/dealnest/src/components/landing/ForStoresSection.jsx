import React from 'react';
import { Storefront, ChartBar, Ticket, Check, ShieldCheck } from '@phosphor-icons/react';
import { Bezel, IslandCta, Eyebrow } from './primitives';
import Reveal, { RevealGroup } from './Reveal';

const CAPABILITIES = [
  'Publish, edit and expire promotions yourself',
  'A store dashboard for redeeming claimed codes in-store',
  'One promoted deal floated to the top of the feed',
  'One featured deal per store, marked with a star',
  'Analytics on views, saves, claims, redeems and shares',
  'Anonymised customer insights broken down by city',
];

const SAMPLE_ROWS = [
  { label: 'Digital air fryer 5L', views: '1,284', rate: 18.4, width: '86%' },
  { label: '55" 4K smart TV', views: '932', rate: 11.2, width: '62%' },
  { label: 'Bluetooth speaker', views: '604', rate: 7.9, width: '41%' },
  { label: 'USB-C fast charger', views: '318', rate: 4.1, width: '22%' },
];

function DashboardPlate() {
  return (
    <Bezel radius="2.25rem" className="transition-transform duration-1000 ease-fluid sm:hover:-translate-y-2">
      {/* Deliberately white-on-white. The store's own dashboard is a light
          surface, so the mock here borrows the app's card treatment rather than
          inventing a darker one the product would never ship. */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-900/[0.06] px-7 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[0.7rem] bg-teal-50 ring-1 ring-inset ring-teal-600/15">
              <ChartBar size={17} weight="light" className="text-teal-600" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-sm font-medium text-gray-900">Mokoena Electronics</p>
              <p className="text-[11px] text-gray-500">Store dashboard · Joburg</p>
            </div>
          </div>
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] text-teal-700 ring-1 ring-inset ring-teal-600/20">
            Pro
          </span>
        </div>

        <dl className="grid grid-cols-3 border-b border-slate-900/[0.06]">
          {[
            { label: 'Views', value: '3,138' },
            { label: 'Claims', value: '412' },
            { label: 'Redeemed', value: '287' },
          ].map(stat => (
            <div key={stat.label} className="px-4 py-5 text-center">
              <dt className="font-display text-2xl font-light tracking-tight text-gray-900">{stat.value}</dt>
              <dd className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-gray-400">{stat.label}</dd>
            </div>
          ))}
        </dl>

        <div className="px-7 py-6">
          <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-gray-400">Conversion by promotion</p>
          <ul className="mt-5 space-y-4">
            {SAMPLE_ROWS.map(row => (
              <li key={row.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[13px] text-gray-700">{row.label}</span>
                  <span className="font-mono-brand flex-shrink-0 text-[11px] text-teal-700">{row.rate}%</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                    {/* The app's own action gradient, at full strength here. */}
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-500"
                      style={{ width: row.width }}
                    />
                  </div>
                  <span className="w-14 flex-shrink-0 text-right font-mono-brand text-[10px] text-gray-400">
                    {row.views}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-900/[0.06] px-7 py-5">
          <p className="text-[11px] leading-relaxed text-gray-500">
            Redeem a claimed code and the shopper's total updates immediately.
          </p>
          <span className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-[11px] font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20">
            <Ticket size={13} weight="light" aria-hidden="true" />
            Redeem
          </span>
        </div>
      </div>
    </Bezel>
  );
}

export default function ForStoresSection() {
  return (
    <section id="stores" className="relative scroll-mt-24 overflow-hidden bg-white py-24 sm:py-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(44rem 36rem at 88% 12%, rgba(13,148,136,0.07), transparent 62%),' +
            'radial-gradient(36rem 30rem at 2% 92%, rgba(16,185,129,0.05), transparent 64%)',
        }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-16 px-4 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-10">
        <div className="lg:col-span-6">
          <Reveal>
            <Eyebrow>
              <Storefront size={11} weight="fill" className="mr-1.5 align-[-1px]" aria-hidden="true" />
              For store owners
            </Eyebrow>
          </Reveal>

          <Reveal delay={90}>
            <h2 className="mt-8 font-display text-4xl font-light leading-[1.02] tracking-[-0.03em] text-gray-900 sm:text-6xl">
              Your shelf space, without the print-out.
            </h2>
          </Reveal>

          <Reveal delay={170}>
            <p className="mt-8 max-w-lg text-[1.0625rem] leading-relaxed text-gray-600">
              A promotion on DealNest is live in minutes and measurable the moment a shopper views it. You get
              the whole loop — publish, redeem, measure — in one dashboard.
            </p>
          </Reveal>

          <RevealGroup as="ul" className="mt-10 space-y-4" step={60}>
            {CAPABILITIES.map(item => (
              <li key={item} className="flex items-start gap-3.5 text-[15px] leading-relaxed text-gray-700">
                <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-teal-50 ring-1 ring-inset ring-teal-600/20">
                  <Check size={11} weight="bold" className="text-teal-600" aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </RevealGroup>

          <Reveal delay={300}>
            <div className="mt-11 flex flex-col gap-3 sm:flex-row sm:items-center">
              <IslandCta to="/store-signup">Register your store</IslandCta>
              <IslandCta to="/login" variant="ghost">
                Owner sign in
              </IslandCta>
            </div>
          </Reveal>

          <Reveal delay={370}>
            <p className="mt-8 flex items-start gap-3 text-xs leading-relaxed text-gray-500">
              <ShieldCheck size={15} weight="light" className="mt-px flex-shrink-0 text-teal-600" aria-hidden="true" />
              Paid perks are enforced on the server, not hidden in the interface. A non-Pro store&apos;s promoted
              and featured flags are stripped before the feed is served.
            </p>
          </Reveal>
        </div>

        <Reveal delay={220} className="lg:col-span-6 lg:pt-10">
          <DashboardPlate />
        </Reveal>
      </div>
    </section>
  );
}
