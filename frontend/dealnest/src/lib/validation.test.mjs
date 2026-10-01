// Exercises validateEmail end to end, not just the regex, so the whole chain of
// guards is covered. A regex-only test passed while the function still rejected
// every valid address, which is how this defect shipped.
import { validateEmail, normaliseEmail, MAX_EMAIL_LENGTH } from './validation.js';

const CASES = [
  // Valid addresses that must be accepted.
  ['nexus@gmail.com', null],
  ['sam@example.co.za', null],
  ['a@b.com', null],
  ['x.y+z@sub.example.co.za', null],
  ['first.last+tag@example.com', null],
  ["o'brien@mail.example.org", null],
  ['UPPER@EXAMPLE.CO.ZA', null],
  // Padded input is a typo, not a different account.
  ['  nexus@gmail.com  ', null],
  // Rejections, with the message the user should actually see.
  ['', 'Email address is required.'],
  ['   ', 'Email address is required.'],
  ['no-at-sign', 'Enter an email address in the format name@example.co.za.'],
  ['two@at@signs.com', 'An email address can only contain one @.'],
  ['a@@b.com', 'An email address can only contain one @.'],
  ['has space@mail.com', 'An email address cannot contain spaces.'],
  ['double..dot@mail.com', 'An email address cannot contain two dots in a row.'],
  ['@leading.com', 'That does not look like a valid email address.'],
  ['trailing@', 'That does not look like a valid email address.'],
  ['a@b', 'That does not look like a valid email address.'],
  ['no-tld@mail.', 'That does not look like a valid email address.'],
  [`${'a'.repeat(MAX_EMAIL_LENGTH + 1)}@example.com`, 'That email address is too long.'],
];

let failures = 0;
for (const [input, expected] of CASES) {
  const got = validateEmail(input);
  const ok = got === expected;
  if (!ok) {
    failures += 1;
    console.log(`FAIL ${JSON.stringify(input).slice(0, 40)}`);
    console.log(`     expected: ${expected}`);
    console.log(`     got:      ${got}`);
  } else {
    console.log(`ok   ${JSON.stringify(input).slice(0, 40).padEnd(42)} ${got ?? 'valid'}`);
  }
}

// The regression that motivated this: these two must NOT be rejected, and a
// previous revision rejected both.
console.log('\nspecific regression check:');
for (const email of ['nexus@gmail.com', 'sam@example.co.za']) {
  const ok = validateEmail(email) === null;
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${email} -> ${validateEmail(email) ?? 'accepted'}`);
}

console.log(`\nnormaliseEmail: ${JSON.stringify(normaliseEmail('  sam@example.co.za  '))}`);
console.log(`null input:     ${JSON.stringify(normaliseEmail(null))}`);
console.log(`\n${CASES.length + 2} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
