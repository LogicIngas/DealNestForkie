import React, { useEffect } from 'react';
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import CategoriesSection from '../components/landing/CategoriesSection';
import ForStoresSection from '../components/landing/ForStoresSection';
import PricingSection from '../components/landing/PricingSection';
import ClosingCta from '../components/landing/ClosingCta';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage({ isAuthenticated }) {
  // Every in-page link on this page targets an anchor, so a visitor who lands
  // mid-page (a shared #pricing URL, or a back-navigation) would otherwise start
  // at the top of the document.
  useEffect(() => {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="landing-tokens relative bg-gray-50 font-display antialiased">
      {/* Film grain, pinned to the viewport rather than the page, so it never
          repaints while the document scrolls. */}
      <div className="grain" aria-hidden="true" />

      <a
        href="#how"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:bg-teal-600 focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      <LandingNav isAuthenticated={isAuthenticated} />

      <main>
        <HeroSection isAuthenticated={isAuthenticated} />
        <HowItWorksSection />
        <CategoriesSection />
        <ForStoresSection />
        <PricingSection />
        <ClosingCta isAuthenticated={isAuthenticated} />
      </main>

      <LandingFooter isAuthenticated={isAuthenticated} />
    </div>
  );
}
