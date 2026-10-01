import React from 'react';
import { Link } from 'react-router-dom';
import { List, Storefront } from '@phosphor-icons/react';
import { IslandCta } from './primitives';

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#categories', label: 'Categories' },
  { href: '#stores', label: 'For stores' },
  { href: '#pricing', label: 'Pricing' },
];

/**
 * A floating glass island, detached from the top of the page, rather than a bar
 * glued to it. It matches the app's white-glass card treatment instead of
 * inventing a dark chrome the product does not use. It is also the one element
 * here that gets a backdrop blur, because it is fixed — blur on a scrolling
 * container would repaint the page on every frame.
 */
export default function LandingNav({ isAuthenticated }) {
  const [open, setOpen] = React.useState(false);
  const [linksIn, setLinksIn] = React.useState(false);

  // The sheet covers the page, so stop the document scrolling behind it.
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /* Reset before each open, then release a frame later. Without the reset the
     links would still be settled from last time and the stagger would not
     replay. The double rAF makes sure the reset has painted before the class
     that starts the transition is applied — otherwise the browser coalesces
     both into one and nothing animates. */
  React.useEffect(() => {
    if (!open) {
      setLinksIn(false);
      return undefined;
    }
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setLinksIn(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [open]);

  React.useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 px-4 pt-5 sm:px-6 sm:pt-6">
        <nav
          className="ambient mx-auto flex w-full max-w-6xl items-center justify-between gap-6 rounded-full bg-white/80 p-1.5 pl-5 ring-1 ring-inset ring-slate-900/[0.06] backdrop-blur-2xl sm:pl-6"
          aria-label="Main"
        >
          <Link
            to="/"
            className="flex items-center gap-2.5 font-display text-[0.9375rem] font-semibold tracking-tight text-gray-900"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-teal-600 to-emerald-600">
              <Storefront size={15} weight="fill" className="text-white" />
            </span>
            DealNest
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map(link => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-full px-4 py-2 text-sm text-gray-500 fluid duration-500 hover:bg-slate-100 hover:text-gray-900"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated ? (
              <IslandCta to="/app" className="px-5 py-2.5 text-sm">
                Open the app
              </IslandCta>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2.5 text-sm text-gray-500 fluid duration-500 hover:text-gray-900"
                >
                  Sign in
                </Link>
                <IslandCta to="/signup" className="px-5 py-2.5 text-sm">
                  Start saving
                </IslandCta>
              </>
            )}
          </div>

          {/* The bars rotate into an X rather than being swapped for a cross
              icon, so the control reads as one object deforming. */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-full text-gray-700 fluid duration-500 hover:bg-slate-100 lg:hidden"
          >
            <List size={22} weight="light" />
          </button>
        </nav>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-white/90 backdrop-blur-3xl lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
            <span className="flex items-center gap-2.5 font-display text-[0.9375rem] font-semibold text-gray-900">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-teal-600 to-emerald-600">
                <Storefront size={15} weight="fill" className="text-white" />
              </span>
              DealNest
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="relative grid h-10 w-10 place-items-center rounded-full text-gray-700 fluid duration-500 hover:bg-slate-100"
            >
              <span className="absolute h-px w-5 rotate-45 bg-current fluid duration-500" />
              <span className="absolute h-px w-5 -rotate-45 bg-current fluid duration-500" />
            </button>
          </div>

          <ul className="flex flex-1 flex-col justify-center gap-1 px-5 sm:px-6">
            {LINKS.map((link, i) => (
              <li
                key={link.href}
                /* Slides up out of an invisible box, each link a beat behind the
                   one above it. The overlay only exists once it is open, so the
                   entrance has to be driven by a state change after mount rather
                   than by a class present from the first frame. */
                className={`fluid duration-700 ${
                  linksIn ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
                }`}
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block font-display py-4 text-4xl font-light tracking-tight text-gray-900 fluid duration-500 hover:text-teal-700"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 px-5 pb-8 sm:px-6">
            <IslandCta to={isAuthenticated ? '/app' : '/signup'} onClick={() => setOpen(false)} className="w-full">
              {isAuthenticated ? 'Open the app' : 'Start saving'}
            </IslandCta>
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-full px-6 py-3 text-center text-sm font-semibold text-teal-700 ring-1 ring-inset ring-teal-700/20 fluid duration-500 hover:bg-teal-50"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
