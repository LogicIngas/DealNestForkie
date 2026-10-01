import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../../constants/categories';

// Each category links into Explore, which is behind the authenticated shell —
// the /app prefix keeps it inside the app rather than colliding with the
// landing page's own routes.
const BLURBS = {
  GROCERY: 'Weekly specials and bulk bundles',
  PHARMACY: 'Essentials, scripts and wellness',
  FASHION: 'End-of-season markdowns',
  ELECTRONICS: 'TVs, appliances and gear',
  RESTAURANT: 'Set menus, takeaways and brunch',
  BEAUTY: 'Skincare, salon and spa',
  HOME_GOODS: 'Furniture, textiles and decor',
  OTHER: 'Everything a local shop sells',
};

export default function CategoriesSection() {
  return (
    <section id="categories" className="scroll-mt-20 bg-gray-50 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-teal-600">Categories</p>
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
              Everything you buy locally, in one feed.
            </h2>
          </div>
          <p className="text-gray-600 leading-relaxed md:max-w-sm">
            Stores are tagged by category, so your Explore filters and your deal alerts both work off the same
            eight categories.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.value}
              to={`/app/explore?category=${cat.value}`}
              className="group bg-white rounded-3xl border border-gray-100 p-6 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-100/50 transition-all"
            >
              <div
                className={`h-14 w-14 rounded-2xl ${cat.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}
              >
                <cat.icon className={`w-7 h-7 ${cat.color}`} aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-gray-900 flex items-center justify-between gap-2">
                {cat.label}
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" aria-hidden="true" />
              </h3>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{BLURBS[cat.value]}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
