import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from '@phosphor-icons/react';

/**
 * The pieces every section on this page is built from.
 *
 * Colours are not invented here. They follow the app shell: a gray-50 page,
 * #1f2937 ink, the teal-600 to emerald-600 action gradient, and white glass
 * plates on a recessed tray — the same treatment as the app's .card-glass.
 * A marketing page that does not look like the product it is selling is worse
 * than a plain one.
 */

/**
 * Double-bezel container: a plate sitting in a tray.
 *
 * The core's radius is the shell's radius minus the shell's padding, so the two
 * curves stay concentric. Applied through the bezel-shell / bezel-core utilities
 * in index.css with the numbers passed as custom properties, because Tailwind
 * only emits utilities it can read literally in the source — an interpolated
 * `rounded-[calc(...)]` is invisible to the scanner and generates no CSS at all,
 * leaving every card square. The classes are static; only the values are dynamic.
 */
export function Bezel({
  children,
  className = '',
  coreClassName = '',
  radius = '1.5rem',
  inset = '0.3125rem',
  as: Tag = 'div',
  style,
  ...rest
}) {
  const geometry = { '--bezel-radius': radius, '--bezel-inset': inset, ...style };
  return (
    <Tag
      className={`bezel-shell bg-slate-200/70 bezel-light ${className}`.replace(/\s+/g, ' ')}
      style={geometry}
      {...rest}
    >
      <div
        className={`bezel-core core-sheen ambient relative h-full overflow-hidden bg-white ${coreClassName}`.replace(
          /\s+/g,
          ' '
        )}
      >
        {children}
      </div>
    </Tag>
  );
}

/**
 * Pill button with the trailing arrow nested in its own circular well.
 *
 * The arrow is never a bare glyph beside the label. It lives in a disc that
 * translates diagonally on hover while the button presses in, so the control
 * reads as one object with internal tension rather than two adjacent elements.
 * The solid variant reuses the app's exact action gradient.
 */
export function IslandCta({ to, href, children, variant = 'solid', className = '', ...rest }) {
  const skins = {
    // The app's btn-primary gradient: teal-600 into emerald-600.
    solid: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-500 hover:to-emerald-500',
    teal: 'bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-600/20 hover:bg-teal-100',
    outline: 'bg-white text-teal-700 ring-1 ring-inset ring-teal-700/20 hover:bg-teal-50',
    ghost: 'text-teal-700 hover:bg-teal-50',
  };

  const wellTone = {
    solid: 'bg-white/20',
    teal: 'bg-teal-600/10',
    outline: 'bg-teal-600/10',
    ghost: 'bg-teal-600/10',
  };

  const body = (
    <>
      <span>{children}</span>
      <span
        aria-hidden="true"
        className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full fluid duration-700 group-hover:translate-x-1 group-hover:-translate-y-px group-hover:scale-105 ${wellTone[variant] || wellTone.solid}`}
      >
        <ArrowUpRight size={15} weight="bold" />
      </span>
    </>
  );

  const base =
    `group inline-flex items-center justify-center gap-3 rounded-full px-6 py-3 text-[0.9375rem] font-semibold ` +
    `fluid duration-700 active:scale-[0.98] ${skins[variant] || skins.solid} ${className}`.replace(/\s+/g, ' ');

  if (to) {
    return (
      <Link to={to} className={base} {...rest}>
        {body}
      </Link>
    );
  }
  return (
    <a href={href} className={base} {...rest}>
      {body}
    </a>
  );
}

/** Microscopic pill that precedes a heading. */
export function Eyebrow({ children, tone = 'teal', className = '' }) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700 ring-teal-600/15',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    slate: 'bg-slate-100 text-slate-600 ring-slate-900/10',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ring-1 ring-inset ${
        tones[tone] || tones.teal
      } ${className}`.replace(/\s+/g, ' ')}
    >
      {children}
    </span>
  );
}
