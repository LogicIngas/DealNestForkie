import React from 'react';
import { Tag, Clock, MapPin, Star, Ticket, Check, Storefront, Lightning } from '@phosphor-icons/react';
import { Bezel, IslandCta, Eyebrow } from './primitives';
import Reveal from './Reveal';

// Illustrative cards, not live data — the marketing page must render with no
// session and no API call. The two deals mirror what the demo seed publishes so
// the prices here match what you actually see after `npm run seed`.
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
    tilt: '-1.6deg',
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
    tilt: '1.4deg',
  },
];

const STATS = [
  { value: '8', label: 'Deal categories' },
  { value: '6', label: 'Cities covered' },
  { value: 'R49', label: 'Plus, per 30 days' },
  { value: 'R0', label: 'To start saving' },
];

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function voucherCode(seed) {
  let out = '';
  for (let i = 0; i < 8; i += 1) out += CODE_CHARS[(seed * (i + 3) * 7 + i * 11) % CODE_CHARS.length];
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

function DealPlate({ deal }) {
  return (
    // The resting tilt sits on the shell and the hover lift on the core. Both
    // write `transform`, so on a single element the later one would win and the
    // other would never be seen; split across two they compose.
    //
    // The angle arrives as a custom property so Tailwind can scope it to `sm:`
    // and leave the plates square below that. An inline `transform` cannot be
    // made responsive, and a tilted card is a mis-tap waiting to happen on a
    // phone.
    <Bezel
      className="h-full rotate-0 transition-transform duration-1000 ease-fluid hover:rotate-0 sm:rotate-[var(--tilt)] sm:hover:rotate-0"
      style={{ '--tilt': deal.tilt }}
    >
      <article className="group h-full p-6 transition-transform duration-1000 ease-fluid hover:-translate-y-1.5">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-[0.875rem] bg-teal-50 ring-1 ring-inset ring-teal-600/15">
            <Ticket size={20} weight="light" className="text-teal-600" aria-hidden="true" />
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/20">
            <Tag size={12} weight="fill" aria-hidden="true" />
            {deal.off}% off
          </span>
        </div>

        <h3 className="mt-6 font-display text-xl font-medium tracking-tight text-gray-900">{deal.title}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-gray-500">
          <MapPin size={13} weight="light" className="text-gray-400" aria-hidden="true" />
          {deal.store} · {deal.city}
        </p>

        <div className="mt-6 flex items-baseline gap-2.5">
          <span className="font-display text-3xl font-medium tracking-tight text-gray-900">
            R{deal.now.toLocaleString('en-ZA')}
          </span>
          <span className="text-sm text-gray-400 line-through">R{deal.was.toLocaleString('en-ZA')}</span>
        </div>
        <p className="mt-1 text-xs font-medium text-teal-700">
          You save R{(deal.was - deal.now).toLocaleString('en-ZA')}
        </p>

        {/* The dashed well reads as a tear-off ticket stub. */}
        <div className="mt-6 rounded-2xl border border-dashed border-teal-700/20 bg-teal-50/60 px-4 py-3.5">
          <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-teal-700/60">Voucher code</p>
          <p className="mt-1 font-mono-brand text-lg tracking-[0.18em] text-teal-900">
            {voucherCode(deal.was)}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-900/[0.06] pt-4 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Clock size={13} weight="light" className="text-amber-500" aria-hidden="true" />
            {deal.daysLeft} days left
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-amber-500">
            <Star size={13} weight="fill" aria-hidden="true" />
            4.8
          </span>
        </div>
      </article>
    </Bezel>
  );
}

export default function HeroSection({ isAuthenticated }) {
  return (
    // gray-50, the exact page the app shell renders, so the marketing page and
    // the product sit on the same ground the moment you sign in.
    <section className="relative min-h-[100dvh] overflow-hidden bg-gray-50 pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Radial mesh orbs, painted as static gradients rather than blurred
          elements. Two composited layers cost nothing per frame, where a blurred
          div re-filters itself on every step of the scroll. Kept far weaker than
          a dark hero needs — at these opacities they are ambient light on a light
          page, not glowing orbs. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(48rem 40rem at 78% -8%, rgba(13,148,136,0.10), transparent 60%),' +
            'radial-gradient(40rem 34rem at 6% 42%, rgba(16,185,129,0.07), transparent 62%),' +
            'radial-gradient(52rem 44rem at 50% 108%, rgba(13,148,136,0.06), transparent 60%)',
        }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-16 px-4 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:px-10">
        <div className="lg:col-span-6 lg:pt-16">
          <Reveal>
            <Eyebrow>
              <Lightning size={11} weight="fill" className="mr-1.5 align-[-1px]" aria-hidden="true" />
              South Africa&apos;s local deals marketplace
            </Eyebrow>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-8 font-display text-[3.25rem] font-light leading-[0.98] tracking-[-0.035em] text-gray-900 sm:text-7xl lg:text-[5.25rem]">
              The best deals
              <br />
              in your street,
              <br />
              <span className="text-teal-700">all in one nest.</span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-9 max-w-lg text-[1.0625rem] leading-relaxed text-gray-600 sm:text-lg">
              Local stores publish their real promotions. You browse, save and claim a voucher code, then show it
              in-store. No coupon hunting, no expired printouts.
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-11 flex flex-col gap-3 sm:flex-row sm:items-center">
              <IslandCta to={isAuthenticated ? '/app' : '/signup'}>
                {isAuthenticated ? 'Open the app' : 'Start saving free'}
              </IslandCta>
              <IslandCta href="#stores" variant="outline">
                <Storefront size={16} weight="light" aria-hidden="true" />
                I own a store
              </IslandCta>
            </div>
          </Reveal>

          <Reveal delay={340}>
            <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-[13px] text-gray-500">
              {['Free to join', 'No card needed to browse', 'Nothing auto-renews'].map(item => (
                <li key={item} className="inline-flex items-center gap-2">
                  <Check size={14} weight="bold" className="text-teal-600" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* The showcase is deliberately off-axis: the second plate drops and
            tilts against the first, so the pair reads as a physical arrangement
            rather than two centred columns. */}
        <div className="relative lg:col-span-6">
          <Reveal
            delay={200}
            className="grid gap-6 sm:grid-cols-2 sm:[&>*:nth-child(2)]:mt-14 lg:[&>*:nth-child(2)]:mt-20"
          >
            {SHOWCASE.map(deal => (
              <DealPlate key={deal.id} deal={deal} />
            ))}
          </Reveal>

          <Reveal delay={420} className="mt-10 lg:absolute lg:-bottom-12 lg:-left-6 lg:mt-0 lg:w-64">
            <Bezel coreClassName="bg-white p-5">
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-gray-400">Redeemed in store</p>
              <p className="mt-2 font-display text-sm font-medium text-gray-900">7 days ago</p>
              <p className="mt-0.5 font-display text-2xl font-medium tracking-tight text-teal-700">R1 000 saved</p>
            </Bezel>
          </Reveal>
        </div>
      </div>

      <Reveal delay={140} className="relative mx-auto mt-24 max-w-7xl px-4 sm:mt-32 sm:px-8 lg:px-10">
        <Bezel radius="1.75rem" inset="0.3125rem" coreClassName="bg-white px-7 py-8 sm:px-10">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-6">
            {STATS.map(stat => (
              <div key={stat.label}>
                <dt className="font-display text-3xl font-light tracking-tight text-gray-900 sm:text-4xl">
                  {stat.value}
                </dt>
                <dd className="mt-2 text-xs text-gray-500">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </Bezel>
      </Reveal>
    </section>
  );
}
