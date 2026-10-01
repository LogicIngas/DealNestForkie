import React from 'react';
import { Check, Minus, Ticket, Bell, ChartLineUp, Star, Users, TrendUp, CalendarBlank, Upload } from '@phosphor-icons/react';
import { Bezel, IslandCta, Eyebrow } from './primitives';
import Reveal, { RevealGroup } from './Reveal';

/* Every entry below is an object with an `icon`, never a bare string. The list
   renders <f.icon />, and a string in that position resolves to undefined, which
   unmounts the whole page with React error #130 rather than degrading quietly.
   The first row of each paid plan is the "everything on Free" line, so it reuses
   the same tick as the other inherited rows rather than introducing a new shape. */
const FREE = [
  'Browse and search every live deal',
  'Save stores and bookmark deals',
  '10 saved deals on the free plan',
  'Claim and redeem voucher codes',
  'Total-saved tracker, streaks and points',
  'Reviews, reports and sharing',
];

const PLUS = [
  { icon: Ticket, text: 'Unlimited saved deals' },
  { icon: Bell, text: 'Deal and price-drop alerts' },
  { icon: ChartLineUp, text: 'Price history sparklines' },
  { icon: Star, text: 'Plus badge on your reviews' },
  { icon: Users, text: 'Personalised recommendations' },
];

const PRO = [
  { icon: TrendUp, text: 'Full analytics dashboard' },
  { icon: Users, text: 'Customer insights by city' },
  { icon: CalendarBlank, text: 'Promotion scheduling' },
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
    variant: 'outline',
    rows: FREE.map(text => ({ icon: Check, text })),
    withheld: 'Price-drop alerts and sparklines',
  },
  {
    id: 'plus',
    name: 'DealNest Plus',
    price: 'R49',
    cadence: 'per 30 days',
    blurb: 'For shoppers who want to hear the moment a price drops.',
    to: '/signup',
    cta: 'Start with Plus',
    variant: 'solid',
    featured: true,
    rows: [{ icon: Check, text: 'Everything on Free' }, ...PLUS],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R199',
    cadence: 'per 30 days',
    blurb: 'For stores publishing real promotions to real footfall.',
    to: '/store-signup',
    cta: 'Register your store',
    variant: 'outline',
    rows: [{ icon: Check, text: 'Everything on Free for your shopfront' }, ...PRO],
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="relative scroll-mt-24 bg-gray-50 py-24 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow>Pricing</Eyebrow>
            </Reveal>
            <Reveal delay={90}>
              <h2 className="mt-8 font-display text-4xl font-light leading-[1.02] tracking-[-0.03em] text-gray-900 sm:text-6xl">
                Free for shoppers. Two flat upgrades, no auto-renewal.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={170} as="p" className="text-[1.0625rem] leading-relaxed text-gray-600 lg:col-span-5">
            Paid plans run for 30 days and then expire on their own. Nothing renews silently, and the card you
            type in at checkout is never stored or logged.
          </Reveal>
        </div>

        {/* The featured plan is a full-scale cell in the grid, not a card lifted
            above its neighbours with a margin. On mobile the spans reset and it
            simply leads. */}
        <RevealGroup className="mt-16 grid grid-cols-1 items-start gap-6 md:grid-cols-12 lg:mt-24" step={110}>
          {PLANS.map(plan => (
            <Bezel
              key={plan.id}
              className={`col-span-1 h-full fluid duration-700 md:col-span-4 ${
                plan.featured ? 'bg-teal-50 ring-teal-600/20' : 'hover:bg-slate-300/60'
              }`}
              coreClassName="flex h-full flex-col p-8 sm:p-9"
            >
              <article className="flex h-full flex-col">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-xl font-medium tracking-tight text-gray-900">{plan.name}</h3>
                  {plan.featured && (
                    <span className="rounded-full bg-teal-600 px-3 py-1 text-[9px] font-medium uppercase tracking-[0.2em] text-white">
                      Most popular
                    </span>
                  )}
                </div>

                <p className="mt-4 text-sm leading-relaxed text-gray-500">{plan.blurb}</p>

                <p className="mt-8 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-light tracking-[-0.03em] text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-400">{plan.cadence}</span>
                </p>

                <ul className="mt-9 flex-1 space-y-3.5">
                  {plan.rows.map(row => (
                    <li key={row.text} className="flex items-start gap-3 text-sm leading-relaxed text-gray-700">
                      <row.icon
                        size={16}
                        weight="bold"
                        className="mt-0.5 flex-shrink-0 text-teal-600"
                        aria-hidden="true"
                      />
                      {row.text}
                    </li>
                  ))}
                  {plan.withheld && (
                    <li className="flex items-start gap-3 text-sm leading-relaxed text-gray-400">
                      <Minus size={16} weight="bold" className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                      {plan.withheld}
                    </li>
                  )}
                </ul>

                <IslandCta to={plan.to} variant={plan.variant} className="mt-10 w-full">
                  {plan.cta}
                </IslandCta>
              </article>
            </Bezel>
          ))}
        </RevealGroup>

        <Reveal delay={120} as="p" className="mx-auto mt-14 max-w-2xl text-center text-xs leading-relaxed text-gray-400">
          Checkout is DealNest's own: it validates the card you enter and decides an outcome locally, so nothing
          is charged. The upgrade path is disabled on the deployed site.
        </Reveal>
      </div>
    </section>
  );
}
