import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, CreditCard, Lock, X } from 'lucide-react';
import { paymentService } from '../services/api';

/**
 * DealNest's own card checkout.
 *
 * <p>Six rules are applied to what was typed and reported one by one, because a
 * card check that can only say "invalid" tells the person holding the card nothing
 * about which rule they broke. The server runs them all and returns each result; this
 * component shows them and refuses to submit while any has failed.
 *
 * <p>Submitting does not charge anyone. It stands in for the step a card network
 * performs, decided locally, which is what makes the validation worth showing: a
 * hosted gateway's sandbox never sees the card, so there is nothing there to check.
 * The whole path is disabled in the deployed environment — see the notice below.
 *
 * <p>The Luhn check and brand detection are duplicated here for speed, so a typo is
 * reported as it happens rather than after a round trip. The server remains the
 * authority; this only decides when to bother asking it.
 */

/** Scheme ranges, kept in step with CardBrand on the server. */
const BRANDS = [
  { brand: 'VISA', display: 'Visa', prefixes: ['4'], lengths: [16, 19], cvvLength: 3 },
  { brand: 'MASTERCARD', display: 'Mastercard', prefixes: ['51', '52', '53', '54', '55'], lengths: [16], cvvLength: 3 },
  { brand: 'AMEX', display: 'American Express', prefixes: ['34', '37'], lengths: [15], cvvLength: 4 },
  { brand: 'DISCOVER', display: 'Discover', prefixes: ['6011', '644', '645', '646', '647', '648', '649', '65'], lengths: [16, 19], cvvLength: 3 },
  { brand: 'DINERS_CLUB', display: 'Diners Club', prefixes: ['36', '38'], lengths: [14, 16, 19], cvvLength: 3 },
  { brand: 'JCB', display: 'JCB', prefixes: ['3528', '3529', '353', '354', '355', '356', '357', '358', '359'], lengths: [16, 17, 18, 19], cvvLength: 3 },
  { brand: 'UNIONPAY', display: 'UnionPay', prefixes: ['62'], lengths: [16, 17, 18, 19], cvvLength: 3 },
];

/** Checks in the order the server runs them, so the list never reshuffles. */
const CHECK_ORDER = [
  'cardNumber.characters',
  'cardNumber.length',
  'cardNumber.scheme',
  'cardNumber.luhn',
  'expiry',
  'cvv',
  'holderName',
];

function detectBrand(digits) {
  return (
    BRANDS.find((candidate) => {
      if (!candidate.prefixes.some((prefix) => digits.startsWith(prefix))) return false;
      return candidate.lengths.includes(digits.length);
    }) || null
  );
}

function luhnValid(digits) {
  if (!/^\d+$/.test(digits) || digits.length < 12) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

const digitsOnly = (value) => value.replace(/\D/g, '');

/** Groups the number the way it is printed on the card: in fours. */
function formatNumber(value) {
  const digits = digitsOnly(value).slice(0, 19);
  return digits.match(/.{1,4}/g)?.join(' ') || digits;
}

/** "0429" -> "04/29", capped at four digits. */
function formatExpiry(value) {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

const fieldClass =
  'w-full px-3 py-2.5 rounded-xl border text-sm bg-white outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100';
const labelClass = 'block text-xs font-semibold text-gray-600 mb-1.5';

export default function CardCheckoutForm({ accountType, amountCents, onPaid, onCancel }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [holderName, setHolderName] = useState('');

  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [decline, setDecline] = useState(null);
  const [error, setError] = useState(null);

  const digits = useMemo(() => digitsOnly(cardNumber), [cardNumber]);
  const known = useMemo(() => detectBrand(digits), [digits]);
  const cvvLength = known?.cvvLength ?? 3;

  // A result from an earlier card is worse than none at all, so clear it whenever
  // the details change underneath it.
  useEffect(() => {
    setResult(null);
    setDecline(null);
  }, [cardNumber, expiry, cvv, holderName]);

  const locallyBroken = useMemo(() => {
    const reasons = [];
    if (!digits) reasons.push('Enter the card number.');
    else if (known) {
      if (!luhnValid(digits)) reasons.push('That card number fails its checksum.');
    } else if (digits.length < 12) {
      reasons.push('Keep typing — the number is too short to check yet.');
    }
    if (cvv && cvv.length !== cvvLength) {
      reasons.push(`${known?.display || 'This card'} uses ${cvvLength} digits.`);
    }
    return reasons;
  }, [digits, known, cvv, cvvLength]);

  const amount = (amountCents / 100).toFixed(2);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setDecline(null);
    try {
      const response = await paymentService.pay({
        cardNumber,
        expiry,
        cvv,
        holderName,
        accountType,
      });
      setResult(response);

      if (response?.authorisation?.outcome === 'APPROVED') {
        onPaid?.(response);
        return;
      }
      // A decline is a real answer from the payment step, not an error in the form,
      // so it is shown as a declined outcome with the reason it carries.
      setDecline(response?.authorisation);
    } catch (caught) {
      // A 400 means the server rejected the card. The message names only the first
      // rule that failed, which is the wrong level of detail for a form whose whole
      // point is showing what was checked — so ask for the full list and render it.
      if (caught.status === 400) {
        try {
          setResult(await paymentService.check({ cardNumber, expiry, cvv, holderName }));
        } catch {
          setError(caught.message);
        }
      } else {
        setError(caught.message || 'Could not complete the payment.');
      }
    } finally {
      setBusy(false);
    }
  };

  const approved = result?.authorisation?.outcome === 'APPROVED';
  const checks = result?.checks
    ? [...result.checks].sort(
        (a, b) => CHECK_ORDER.indexOf(a.id) - CHECK_ORDER.indexOf(b.id),
      )
    : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <Lock size={15} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-amber-800">
          <strong className="font-semibold">Nothing is charged.</strong> These details are checked in
          the browser and validated on the server, then an outcome is decided locally to stand in for
          a card network. No payment leaves DealNest, and the card number is never stored or logged.
          This path is switched off on the live site.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="cardNumber">
          Card number
        </label>
        <div className="relative">
          <input
            id="cardNumber"
            name="cardNumber"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck="false"
            placeholder="4111 1111 1111 1111"
            value={cardNumber}
            onChange={(event) => setCardNumber(formatNumber(event.target.value))}
            aria-describedby="cardNumberBrand"
            className={`${fieldClass} pr-28 font-mono tracking-wider ${digits && !known ? 'border-red-300' : 'border-gray-200'}`}
          />
          {known && (
            <span
              id="cardNumberBrand"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500"
            >
              {known.display}
            </span>
          )}
        </div>
        {digits && !known && digits.length >= 12 && (
          <p className="mt-1.5 text-xs text-red-600">That is not a card number we recognise.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="cardExpiry">
            Expiry
          </label>
          <input
            id="cardExpiry"
            name="expiry"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="MM/YY"
            value={expiry}
            onChange={(event) => setExpiry(formatExpiry(event.target.value))}
            className={`${fieldClass} font-mono ${expiry ? 'border-gray-200' : 'border-gray-200'}`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="cardCvv">
            CVV <span className="font-normal text-gray-400">({cvvLength} digits)</span>
          </label>
          <input
            id="cardCvv"
            name="cvv"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={cvvLength}
            placeholder={'•'.repeat(cvvLength)}
            value={cvv}
            onChange={(event) => setCvv(digitsOnly(event.target.value).slice(0, cvvLength))}
            className={`${fieldClass} font-mono ${cvv.length === cvvLength ? 'border-gray-200' : 'border-gray-300'}`}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="cardHolder">
          Name on card
        </label>
        <input
          id="cardHolder"
          name="holderName"
          type="text"
          autoComplete="off"
          placeholder="As printed on the card"
          value={holderName}
          onChange={(event) => setHolderName(event.target.value)}
          className={`${fieldClass} border-gray-200`}
        />
      </div>

      {checks.length > 0 && (
        <ul className="space-y-1.5 rounded-xl border border-gray-200 bg-gray-50 p-3">
          {checks.map((check) => (
            <li key={check.id} className="flex items-start gap-2 text-xs">
              {check.passed ? (
                <Check size={14} className="mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />
              ) : (
                <X size={14} className="mt-0.5 shrink-0 text-red-500" aria-hidden="true" />
              )}
              <span className={check.passed ? 'text-gray-600' : 'text-red-600'}>
                <span className="font-semibold">{check.label}:</span> {check.detail}
              </span>
            </li>
          ))}
        </ul>
      )}

      {locallyBroken.length > 0 && !checks.length && (
        <p className="text-xs text-gray-500">{locallyBroken[0]}</p>
      )}

      {decline && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3"
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
          <div className="text-xs text-red-700">
            <p className="font-semibold">
              Declined — {decline.message} ({decline.reasonCode})
            </p>
            <p className="mt-1 text-red-600">Reference {decline.reference}. Nothing was charged.</p>
          </div>
        </div>
      )}

      {approved && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-teal-200 bg-teal-50 p-3"
        >
          <Check size={15} className="mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />
          <div className="text-xs text-teal-800">
            <p className="font-semibold">Authorised — R{amount} on the simulated network.</p>
            <p className="mt-1 text-teal-700">
              {result.authorisation.brand} ending {result.authorisation.last4} · ref{' '}
              {result.authorisation.reference} · auth code {result.authorisation.authCode}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3"
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={busy || locallyBroken.length > 0}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
        >
          <CreditCard size={16} aria-hidden="true" />
          {busy ? 'Authorising…' : `Pay R${amount}`}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
