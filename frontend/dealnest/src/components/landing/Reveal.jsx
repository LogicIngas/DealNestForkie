import React, { useEffect, useRef, useState } from 'react';

/**
 * Scroll-triggered entry animation.
 *
 * Wraps a block in the `reveal` utility (displaced, blurred, transparent) and
 * adds `reveal-in` once it scrolls into view, so content arrives instead of
 * existing.
 *
 * This uses IntersectionObserver, not a scroll listener. A scroll listener runs
 * on every frame and forces the browser to re-evaluate layout; this costs nothing
 * until an element approaches the viewport and nothing at all afterwards.
 */

/* One observer is shared by every Reveal on the page. The landing page has a lot
   of them and a per-element observer would mean a per-element callback. */
let observer = null;

const getObserver = () => {
  if (observer) return observer;
  observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('reveal-in');
        // One-shot: once it has arrived, stop watching it.
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
  );
  return observer;
};

/**
 * @param delay milliseconds to hold the reveal, for staggering a group
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    // Without IntersectionObserver, or before first paint settles, show the
    // content. Leaving it at opacity 0 would mean an invisible page, which is
    // the failure mode this whole mechanism risks.
    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('reveal-in');
      return undefined;
    }

    if (delay) node.style.transitionDelay = `${delay}ms`;
    getObserver().observe(node);

    return () => getObserver().unobserve(node);
  }, [delay]);

  return (
    <Tag ref={ref} className={`reveal ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Staggers direct children as they arrive.
 *
 * The reveal class is merged onto each child rather than wrapped around it, so a
 * child that is a bento grid cell keeps its own `col-span-*` and stays a real grid
 * item, and a child that is a list item stays a direct child of its list.
 *
 * Pass `containerRef` when the children must be the only thing the parent
 * renders; otherwise the group wraps them in an element of its own.
 */
export function RevealGroup({ children, step = 90, base = 0, as: Tag = 'div', className = '', containerRef }) {
  const ownRef = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return undefined;
    }
    const node = (containerRef || ownRef).current;
    if (!node) return undefined;

    const io = new IntersectionObserver(
      entries => {
        if (!entries.some(e => e.isIntersecting)) return;
        setShown(true);
        io.disconnect();
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.04 }
    );
    io.observe(node);
    return () => io.disconnect();
    // containerRef is a stable ref object supplied by the caller.
  }, [containerRef]);

  const kids = React.Children.map(children, (child, i) => {
    if (!React.isValidElement(child)) return child;
    return React.cloneElement(child, {
      className: `reveal ${shown ? 'reveal-in' : ''} ${child.props.className || ''}`.trim(),
      style: shown ? { ...child.props.style, transitionDelay: `${base + i * step}ms` } : child.props.style,
    });
  });

  if (containerRef) return kids;

  return (
    <Tag ref={ownRef} className={className}>
      {kids}
    </Tag>
  );
}
