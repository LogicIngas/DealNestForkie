// Client-side email checks.
//
// This is a UX guard only — it saves a round trip and shows the error while the
// field is still in view. The authoritative check is on the server (Helper.isValidEmail
// via commons-validator in UserServiceImpl / StoreServiceImpl), because anything
// that runs in a browser can be bypassed by calling the API directly.

// Deliberately stricter than the HTML type="email" attribute, which accepts
// "a@b" and other addresses no real provider issues.
const EMAIL_PATTERN = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

export const MAX_EMAIL_LENGTH = 254;

/**
 * Trims surrounding whitespace. A pasted address (" sam@example.co.za ") is a
 * typo, not a different account, and the space would otherwise be persisted as
 * part of the address.
 */
export const normaliseEmail = (value) => (value || '').trim();

/**
 * @returns {string|null} an error message, or null when the address looks valid.
 */
export function validateEmail(value) {
  const email = normaliseEmail(value);

  if (!email) return 'Email address is required.';
  if (email.length > MAX_EMAIL_LENGTH) return 'That email address is too long.';
  if (/\s/.test(email)) return 'An email address cannot contain spaces.';
  if (!email.includes('@')) return 'Enter an email address in the format name@example.co.za.';
  // Count the separators rather than comparing positions. The previous check
  // compared `includes('@', 1)` — a boolean — against `lastIndexOf('@') + 1` — a
  // number. `!==` between a boolean and a number is always true, so this fired on
  // every address containing an @, and the line above had already handled the
  // ones without. No valid address could get past it, and the "one @" message
  // was the only thing a user could ever see.
  if ((email.match(/@/g) || []).length > 1) {
    return 'An email address can only contain one @.';
  }
  // Ordered ahead of the pattern test so the doubled dot is reported as the
  // specific typo it is. The pattern rejects it too, so checking it afterwards
  // meant this branch could never fire and its message was dead.
  if (/\.\./.test(email)) return 'An email address cannot contain two dots in a row.';
  if (!EMAIL_PATTERN.test(email)) return 'That does not look like a valid email address.';

  return null;
}

export const isValidEmail = (value) => validateEmail(value) === null;
