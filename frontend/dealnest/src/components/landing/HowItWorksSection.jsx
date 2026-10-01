import React, { useRef } from 'react';
import { MagnifyingGlass, Ticket, Storefront, Bell, ChartLineUp, Upload, CalendarBlank } from '@phosphor-icons/react';
import { Bezel, IslandCta, Eyebrow } from './primitives';
import Reveal, { RevealGroup } from './Reveal';

const SHOPPER_STEPS = [
  {
    icon: MagnifyingGlass,
    title: 'Browse what is live near you',
    body: 'Search by product, store, city or category. Filter by rating, deals only, distance and a budget ceiling.',
  },
  {
    icon: Ticket,
    title: 'Claim a voucher code',
    body: 'One tap generates a unique code tied to that promotion. Every code you have claimed lives in one place.',
  },
  {
    icon: Storefront,
    title: 'Show it in-store, done',
    body: 'The cashier redeems the code and your total-saved tracker updates. Streaks and points build as you go.',
  },
];

/* Both lists are objects with an `icon`, never a bare string. The markup below
   renders <f.icon />, and a string there resolves to undefined, which takes the
   whole page down with React error #130 rather than failing quietly. */
const TIERS = [
  {
    id: 'plus',
    name: 'DealNest Plus',
    forWho: 'for shoppers',
    price: 'R49',
    cadence: 'for 30 days',
    blurb: 'Not a subscription that quietly rolls over. It expires and you decide.',
    cta: 'Create a free account',
    to: '/signup',
    accent: 'text-amber-600',
    ring: 'ring-amber-500/25',
    wash: 'bg-amber-50',
    features: [
      { icon: Ticket, label: 'Unlimited saved deals' },
      { icon: Bell, label: 'Deal and price-drop alerts' },
      { icon: ChartLineUp, label: 'Price history sparklines' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    forWho: 'for store owners',
    price: 'R199',
    cadence: 'for 30 days',
    blurb: 'Reach shoppers who are already searching in your category.',
    cta: 'Register your store',
    to: '/store-signup',
    accent: 'text-teal-700',
    ring: 'ring-teal-600/20',
    wash: 'bg-teal-50',
    features: [
      { icon: ChartLineUp, label: 'Views, saves, claims, redeems, shares' },
      { icon: Upload, label: 'Bulk CSV promotion upload' },
      { icon: CalendarBlank, label: 'Scheduling with auto activate/expire' },
    ],
  },
];

export default function HowItWorksSection() {
  const stepsRef = useRef(null);

  return (
    // A full white band, breaking the gray-50 the app shell uses so the page has
    // rhythm without leaving its palette.
    <section id="how" className="relative scroll-mt-24 bg-white py-24 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        {/* Editorial split: the argument sits in the left half, the numbered
            steps cascade down the right as a Z-axis stack. */}
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <Eyebrow>How it works</Eyebrow>
            </Reveal>
            <Reveal delay={90}>
              <h2 className="mt-8 font-display text-4xl font-light leading-[1.02] tracking-[-0.03em] text-gray-900 sm:text-6xl">
                Three steps from scrolling to saving.
              </h2>
            </Reveal>
            <Reveal delay={170}>
              <p className="mt-8 max-w-md text-[1.0625rem] leading-relaxed text-gray-600">
                DealNest works for both sides of the counter. Shoppers find and redeem. Stores publish and
                measure. Both run on the same catalogue.
              </p>
            </Reveal>
          </div>

          {/* The bezel shell is the list item itself. An <ol> only takes its
              numbering and semantics from its own direct children, so wrapping
              each step in a div would quietly break that — hence containerRef,
              which lets the group stagger the children without adding a wrapper. */}
          <ol ref={stepsRef} className="grid gap-5 sm:grid-cols-3 lg:col-span-7 lg:gap-6">
            <RevealGroup containerRef={stepsRef}>
              {SHOPPER_STEPS.map((step, i) => (
                <Bezel
                  key={step.title}
                  as="li"
                  className="group h-full fluid duration-700 hover:bg-slate-300/60"
                  coreClassName="flex h-full flex-col p-7"
                >
                  <span className="font-mono-brand text-[11px] tracking-[0.2em] text-gray-400">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="mt-5 grid h-11 w-11 place-items-center rounded-[0.875rem] bg-teal-50 ring-1 ring-inset ring-teal-600/15 transition-transform duration-700 ease-fluid group-hover:scale-105">
                    <step.icon size={19} weight="light" className="text-teal-600" aria-hidden="true" />
                  </span>
                  <h3 className="mt-7 font-display text-lg font-medium tracking-tight text-gray-900">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">{step.body}</p>
                </Bezel>
              ))}
            </RevealGroup>
          </ol>
        </div>

        <RevealGroup className="mt-24 grid gap-6 lg:mt-32 lg:grid-cols-2" step={120}>
          {TIERS.map(tier => (
            <Bezel
              key={tier.id}
              className={`h-full ring-1 ${tier.ring}`}
              coreClassName={`flex h-full flex-col p-8 sm:p-10 ${tier.wash}`}
            >
              <section className="flex h-full flex-col">
                <div className="flex items-baseline gap-3">
                  <h3 className="font-display text-2xl font-light tracking-tight text-gray-900">{tier.name}</h3>
                  <span className="text-xs text-gray-400">{tier.forWho}</span>
                </div>

                <p className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-light tracking-tight text-gray-900">{tier.price}</span>
                  <span className="text-sm text-gray-400">{tier.cadence}</span>
                </p>
                <p className="mt-4 text-sm leading-relaxed text-gray-500">{tier.blurb}</p>

                <ul className="mt-8 flex-1 space-y-3.5">
                  {tier.features.map(f => (
                    <li key={f.label} className="flex items-start gap-3 text-sm text-gray-700">
                      <f.icon size={17} weight="light" className={`mt-0.5 flex-shrink-0 ${tier.accent}`} aria-hidden="true" />
                      {f.label}
                    </li>
                  ))}
                </ul>

                <IslandCta to={tier.to} variant={tier.id === 'pro' ? 'teal' : 'outline'} className="mt-9 self-start">
                  {tier.cta}
                </IslandCta>
              </section>
            </Bezel>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
