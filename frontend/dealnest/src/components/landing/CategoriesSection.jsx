import React from 'react';
import { Link } from 'react-router-dom';
import { CaretRight } from '@phosphor-icons/react';
import { Bezel, Eyebrow } from './primitives';
import Reveal, { RevealGroup } from './Reveal';

/* Local copy of the category list rather than the shared CATEGORIES constant.
   That constant carries Lucide components and Tailwind colour classes sized for
   a white app surface, and importing it would drag both onto this page. The
   values are the same eight, so they still match the Explore filter query. */
const CATEGORIES = [
  { value: 'GROCERY', label: 'Grocery', blurb: 'Weekly specials and bulk bundles' },
  { value: 'PHARMACY', label: 'Pharmacy', blurb: 'Essentials, scripts and wellness' },
  { value: 'FASHION', label: 'Fashion', blurb: 'End-of-season markdowns' },
  { value: 'ELECTRONICS', label: 'Electronics', blurb: 'TVs, appliances and gear' },
  { value: 'RESTAURANT', label: 'Restaurant', blurb: 'Set menus, takeaways and brunch' },
  { value: 'BEAUTY', label: 'Beauty', blurb: 'Skincare, salon and spa' },
  { value: 'HOME_GOODS', label: 'Home', blurb: 'Furniture, textiles and decor' },
  { value: 'OTHER', label: 'Other', blurb: 'Everything a local shop sells' },
];

/* Bento weights. The first two cells are deliberately oversized and offset, and
   the last one spans the full row, so the grid never resolves into a tidy row of
   equal cards. Below md every span resets to one column — see the `col-span-*`
   pairs in the className, each of which is overridden by `col-span-1` first. */
const WEIGHTS = [
  'col-span-1 md:col-span-4 md:row-span-2',
  'col-span-1 md:col-span-4',
  'col-span-1 md:col-span-4',
  'col-span-1 md:col-span-5',
  'col-span-1 md:col-span-3',
  'col-span-1 md:col-span-4',
  'col-span-1 md:col-span-4',
  'col-span-1 md:col-span-8',
];

export default function CategoriesSection() {
  return (
    <section id="categories" className="relative scroll-mt-24 bg-gray-50 py-24 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow>Categories</Eyebrow>
            </Reveal>
            <Reveal delay={90}>
              <h2 className="mt-8 font-display text-4xl font-light leading-[1.02] tracking-[-0.03em] text-gray-900 sm:text-6xl">
                Everything you buy locally, in one feed.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={170} as="p" className="text-[1.0625rem] leading-relaxed text-gray-600 lg:col-span-5">
            Stores are tagged by category, so your Explore filters and your deal alerts both work off the same
            eight categories.
          </Reveal>
        </div>

        <RevealGroup className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-12 md:auto-rows-[minmax(0,11rem)] lg:mt-24" step={80}>
          {CATEGORIES.map((cat, i) => {
            const lead = i === 0;
            return (
              <Bezel
                key={cat.value}
                className={`group ${WEIGHTS[i]} fluid duration-700 hover:bg-slate-300/60`}
                coreClassName="flex h-full flex-col p-7 sm:p-8"
              >
                <Link
                  to={`/app/explore?category=${cat.value}`}
                  className="flex h-full flex-col focus-visible:outline-none"
                >
                  <span className="font-mono-brand text-[11px] tracking-[0.2em] text-gray-400">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <h3
                    className={`mt-auto font-display font-medium tracking-tight text-gray-900 fluid duration-700 group-hover:text-teal-700 ${
                      lead ? 'mt-6 text-3xl sm:text-4xl' : 'mt-6 text-2xl'
                    }`}
                  >
                    {cat.label}
                  </h3>

                  <div className="mt-3 flex items-end justify-between gap-4">
                    <p className="max-w-[16rem] text-sm leading-relaxed text-gray-500">{cat.blurb}</p>
                    <span
                      aria-hidden="true"
                      className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-slate-100 text-gray-400 fluid duration-700 group-hover:translate-x-1 group-hover:bg-teal-50 group-hover:text-teal-700"
                    >
                      <CaretRight size={14} weight="bold" />
                    </span>
                  </div>
                </Link>
              </Bezel>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
