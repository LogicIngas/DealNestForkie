import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, Store as StoreIcon, ArrowRight } from 'lucide-react';

export default function ClosingCta({ isAuthenticated }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 py-20 sm:py-24">
      <div aria-hidden="true" className="absolute -top-24 -left-20 w-[28rem] h-[28rem] rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -right-16 w-[26rem] h-[26rem] rounded-full bg-emerald-300/20 blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.08]">
          Your neighbourhood is already discounting.
        </h2>
        <p className="mt-5 text-lg text-teal-50/90 leading-relaxed max-w-2xl mx-auto">
          Join free and start claiming. Store owners can publish a promotion the same afternoon.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={isAuthenticated ? '/app' : '/signup'}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-extrabold text-teal-700 shadow-xl shadow-teal-900/20 hover:-translate-y-0.5 hover:shadow-2xl transition-all"
          >
            {isAuthenticated ? 'Open the app' : 'Create your free account'}
            <Tag className="w-5 h-5" aria-hidden="true" />
          </Link>
          <Link
            to="/store-signup"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/50 bg-white/10 backdrop-blur-sm px-8 py-4 text-base font-bold text-white hover:bg-white/20 hover:border-white transition-all"
          >
            <StoreIcon className="w-5 h-5" aria-hidden="true" />
            List your store
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>

        {!isAuthenticated && (
          <p className="mt-8 text-sm text-teal-100/80">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-white underline underline-offset-4 hover:text-teal-50">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
