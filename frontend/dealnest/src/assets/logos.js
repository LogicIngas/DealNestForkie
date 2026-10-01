// The logo is the one asset on every screen, and it used to be shipped at its authoring
// size — 1408x768, 199 kB — to paint boxes no larger than 103x56 (the app header) or
// 220x120 (the sign-in screen). The browser downloaded and decoded the whole thing on
// every page load, then threw most of it away.
//
// Three pre-scaled copies of the original fix that. This module exists to hold the URLs
// in one place, because the density arithmetic is easy to get backwards per call site, and
// because it is the only form Vite keeps.
//
// Why `new URL(..., import.meta.url)` and not a plain `import`: an asset binding that is
// only ever interpolated into a `srcSet` template literal gets tree-shaken out of the
// bundle, and the file is never emitted to dist at all. The build looked correct and the
// 1x candidate 404'd at runtime. A `new URL` against import.meta.url is a statically
// analysed pattern, so every variant is emitted and hashed like any other asset reference,
// and the numbers below are plain strings that nothing can drop.
//
// The densities, so the next person does not have to re-derive them:
//   header      renders 103x56  -> 1x = 103x56,  2x = 206x112
//   sign-in     renders 220x120 -> 1x = 220x120, 2x = 440x240
// The 235x128 copy serves as both "header at 2x" and "sign-in at 1x"; the 469x256 copy is
// the sign-in 2x. The original 1408x768 stays in the repo as the master these came from.

const LOGO_64 = new URL('./logo-64.png', import.meta.url).href;
const LOGO_128 = new URL('./logo-128.png', import.meta.url).href;
const LOGO_256 = new URL('./logo-256.png', import.meta.url).href;

/** Header / dashboard wordmark: 103x56. 9.5 kB on a 2x screen, 3.4 kB on a 1x one. */
export const LOGO_HEADER = {
  src: LOGO_128,
  srcSet: `${LOGO_64} 1x, ${LOGO_128} 2x`,
  sizes: '103px',
};

/** Sign-in / reset wordmark: 220x120. 29.4 kB on a 2x screen, 9.5 kB on a 1x one. */
export const LOGO_LARGE = {
  src: LOGO_256,
  srcSet: `${LOGO_128} 1x, ${LOGO_256} 2x`,
  sizes: '220px',
};
