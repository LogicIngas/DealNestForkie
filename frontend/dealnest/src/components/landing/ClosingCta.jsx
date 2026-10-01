import React from 'react';
import { Link } from 'react-router-dom';
import { Bezel, IslandCta } from './primitives';
import Reveal from './Reveal';

export default function ClosingCta({ isAuthenticated }) {
  return (
    <section className="relative overflow-hidden bg-gray-50 py-24 sm:py-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(50rem 34rem at 50% 108%, rgba(13,148,136,0.12), transparent 66%),' +
            'radial-gradient(30rem 24rem at 50% -10%, rgba(16,185,129,0.08), transparent 64%)',
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-8 lg:px-10">
        <Bezel radius="2.5rem" inset="0.4375rem" coreClassName="px-6 py-20 text-center sm:px-14 sm:py-28">
          <Reveal>
            <h2 className="mx-auto max-w-3xl font-display text-4xl font-light leading-[1.0] tracking-[-0.035em] text-gray-900 sm:text-6xl lg:text-7xl">
              Your neighbourhood is already discounting.
            </h2>
          </Reveal>

          <Reveal delay={110}>
            <p className="mx-auto mt-8 max-w-xl text-[1.0625rem] leading-relaxed text-gray-600">
              Join free and start claiming. Store owners can publish a promotion the same afternoon.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <IslandCta to={isAuthenticated ? '/app' : '/signup'}>
                {isAuthenticated ? 'Open the app' : 'Create your free account'}
              </IslandCta>
              <IslandCta to="/store-signup" variant="outline">
                List your store
              </IslandCta>
            </div>
          </Reveal>

          {!isAuthenticated && (
            <Reveal delay={280} as="p" className="mt-9 text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-teal-700 underline decoration-teal-700/30 underline-offset-4 fluid duration-500 hover:text-teal-600"
              >
                Sign in
              </Link>
            </Reveal>
          )}
        </Bezel>
      </div>
    </section>
  );
}
