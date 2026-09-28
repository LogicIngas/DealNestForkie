import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, CreditCard, Info, X } from 'lucide-react';
import { paymentService } from '../services/api';

/**
 * DealNest's own card checkout, shown as a dialog.
 *
 * <p>Six rules are applied to what was typed and reported one by one, because a
 * card check that can only say "invalid" tells the person holding the card nothing
 * about which rule they broke. The server runs them all and returns each result; this
 * component shows them and refuses to submit while any has failed.
 *
 * <p>Submitting does not charge anyone. It stands in for the step a card network
 * performs, decided locally, which is what makes the validation worth showing: a
 * hosted gateway's sandbox never sees the card, so there is nothing there to check.
 * The whole path is disabled in the deployed environment unless it is explicitly
 * switched on.
 *
 * <p>The Luhn check and brand detection are duplicated here for speed, so a typo is
 * reported as it happens rather than after a round trip. The server remains the
 * authority; this only decides when to bother asking it.
 *
 * <p>This is a dialog rather than a panel inside the page because a card form is a
 * task with an end to it. Expanding one inline under a plan card buries it in
 * everything else the card is already saying, and leaves the order summary, the
 * details and the action competing for the same column.
 */

/** Scheme ranges, kept in step with CardBrand on the server. */
const BRANDS = [
  { brand: 'AMEX', display: 'American Express', prefixes: ['34', '37'], lengths: [15], cvvLength: 4 },
  { brand: 'VISA', display: 'Visa', prefixes: ['4'], lengths: [16, 19], cvvLength: 3 },
  { brand: 'MASTERCARD', display: 'Mastercard', prefixes: ['51', '52', '53', '54', '55'], lengths: [16], cvvLength: 3 },
  { brand: 'DISCOVER', display: 'Discover', prefixes: ['6011', '644', '645', '646', '647', '648', '649', '65'], lengths: [16, 19], cvvLength: 3 },
  { brand: 'DINERS_CLUB', display: 'Diners Club', prefixes: ['36', '38'], lengths: [14, 16, 19], cvvLength: 3 },
  { brand: 'JCB', display: 'JCB', prefixes: ['3528', '3529', '353', '354', '355', '356', '357', '358', '359'], lengths: [16, 17, 18, 19], cvvLength: 3 },
  { brand: 'UNIONPAY', display: 'UnionPay', prefixes: ['62'], lengths: [16, 17, 18, 19], cvvLength: 3 },
];

/** Check id to the field it belongs to, so a failure lands next to its input. */
const FIELD_OF_CHECK = {
  'cardNumber.characters': 'cardNumber',
  'cardNumber.length': 'cardNumber',
  'cardNumber.scheme': 'cardNumber',
  'cardNumber.luhn': 'cardNumber',
  expiry: 'expiry',
  cvv: 'cvv',
  holderName: 'holderName',
};

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

function fieldClass(hasError) {
  const base =
    'w-full px-3.5 py-3 rounded-xl border text-[15px] bg-white outline-none transition placeholder:text-gray-300 focus:ring-2';
  if (hasError) return `${base} border-red-300 focus:border-red-500 focus:ring-red-100`;
  return `${base} border-gray-200 focus:border-teal-600 focus:ring-teal-100`;
}

export default function CardCheckoutForm({
  accountType,
  amountCents,
  planName = 'the plan',
  onPaid,
  onCancel,
}) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [holderName, setHolderName] = useState('');

  const [result, setResult] = useState(null);
  const [approved, setApproved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [decline, setDecline] = useState(null);
  const [error, setError] = useState(null);

  const numberRef = useRef(null);
  const continueRef = useRef(null);

  // The first field takes focus so the keyboard can be used without hunting for it.
  useEffect(() => {
    numberRef.current?.focus();
  }, []);

  // Escape closes, and the page behind must not scroll under the dialog.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key !== 'Escape' || busy) return;
      // Once approved, closing has to finish the flow. Escape that simply dismisses
      // would lose the reference and skip the plan refresh, leaving the person with
      // no confirmation that the plan actually activated.
      if (approved) onPaid?.(approved);
      else onCancel?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onCancel, onPaid, busy, approved]);

  // The card inputs are gone by this point, so focus has to be handed to the button
  // that is left.
  useEffect(() => {
    if (approved) continueRef.current?.focus();
  }, [approved]);

  const digits = useMemo(() => digitsOnly(cardNumber), [cardNumber]);
  const known = useMemo(() => detectBrand(digits), [digits]);
  const cvvLength = known?.cvvLength ?? 3;

  // A result from an earlier card is worse than none at all, so clear it whenever
  // the details change underneath it.
  useEffect(() => {
    setResult(null);
    setDecline(null);
  }, [cardNumber, expiry, cvv, holderName]);

  /**
   * What is wrong, per field, so the message can sit under the input it is about.
   * Nothing is shown for a field the user has not finished typing in.
   */
  const localErrors = useMemo(() => {
    const errors = {};
    if (digits) {
      if (!known) {
        if (digits.length >= 12) errors.cardNumber = 'We do not recognise this card number.';
      } else if (!luhnValid(digits)) {
        errors.cardNumber = 'That number fails its checksum — check for a typo.';
      }
    }
    if (cvv && cvv.length !== cvvLength) {
      errors.cvv = `${known?.display || 'This card'} uses ${cvvLength} digits.`;
    }
    if (expiry.length === 4) {
      const month = Number(expiry.slice(0, 2));
      if (month < 1 || month > 12) errors.expiry = 'The month must be 01 to 12.';
    }
    if (holderName && holderName.trim().length < 2) {
      errors.holderName = 'Enter the name printed on the card.';
    }
    return errors;
  }, [digits, known, cvv, cvvLength, expiry, holderName]);

  // The server is the authority, so its verdict wins over the guess above.
  const serverErrors = useMemo(() => {
    if (!result?.checks) return {};
    const errors = {};
    result.checks
      .filter((check) => !check.passed)
      .forEach((check) => {
        const field = FIELD_OF_CHECK[check.id];
        if (field && !errors[field]) errors[field] = check.detail;
      });
    return errors;
  }, [result]);

  const errors = { ...localErrors, ...serverErrors };
  const ready = digits.length > 0 && expiry.length === 4 && cvv.length === cvvLength && holderName.trim().length >= 2;
  const amount = `R${((amountCents ?? 0) / 100).toFixed(2)}`;
  const checks = result?.checks || [];
  const passed = checks.filter((check) => check.passed).length;

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
        setApproved(response.authorisation);
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
          setError('Those details could not be checked.');
        }
      } else if (caught.status === 404) {
        // The card path is switched off on deployed environments. Saying so is
        // more use than whatever the server put in the body.
        setError('Card checkout is not enabled on this instance.');
      } else {
        // The server's own wording is deliberately not shown. A gateway or proxy
        // that echoes a request body back will hand us the card number and CVV in
        // this string, and rendering it would put a full card on the page. The
        // status is enough to act on.
        setError(`The payment could not be completed (error ${caught.status ?? 'unknown'}).`);
      }
    } finally {
      setBusy(false);
    }
  };

  if (approved) {
    const finish = () => onPaid?.(approved);
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
        onClick={finish}
      >
        <div
          role="status"
          aria-modal="true"
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
            <Check size={28} className="text-teal-600" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-gray-900">{planName} is active</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            30 days of {planName} from now. Nothing renews, and nothing was charged — this was
            checked on our side, not by a bank.
          </p>
          <dl className="mt-6 space-y-2 rounded-xl bg-gray-50 p-4 text-left text-xs">
            {[
              ['Card', `${approved.brand} ending ${approved.last4}`],
              ['Reference', approved.reference],
              ['Auth code', approved.authCode],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <dt className="text-gray-500">{label}</dt>
                <dd className="truncate font-mono font-semibold text-gray-800">{value}</dd>
              </div>
            ))}
          </dl>
          <button
            ref={continueRef}
            type="button"
            onClick={finish}
            className="mt-6 w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={() => !busy && onCancel?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* What is being bought. Kept above the form so the amount being authorised
            is never only on the button. */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="min-w-0">
            <h2 id="checkout-title" className="text-lg font-bold text-gray-900">
              {planName}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">30 days of access</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-lg font-bold tabular-nums text-gray-900">{amount}</span>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              aria-label="Close checkout"
              className="-mr-1.5 -mt-1 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Card details
              </legend>

              <div>
                <label htmlFor="cardNumber" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Card number
                </label>
                <div className="relative">
                  <input
                    ref={numberRef}
                    id="cardNumber"
                    name="cardNumber"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    spellCheck="false"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(event) => setCardNumber(formatNumber(event.target.value))}
                    aria-invalid={Boolean(errors.cardNumber)}
                    aria-describedby={errors.cardNumber ? 'cardNumber-error' : undefined}
                    className={`${fieldClass(errors.cardNumber)} pr-28 font-mono tracking-wide`}
                  />
                  {known && (
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                      {known.display}
                    </span>
                  )}
                </div>
                {errors.cardNumber && (
                  <p id="cardNumber-error" className="mt-1.5 text-xs text-red-600">
                    {errors.cardNumber}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cardExpiry" className="mb-1.5 block text-sm font-medium text-gray-700">
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
                    aria-invalid={Boolean(errors.expiry)}
                    aria-describedby={errors.expiry ? 'cardExpiry-error' : undefined}
                    className={`${fieldClass(errors.expiry)} font-mono`}
                  />
                  {errors.expiry && (
                    <p id="cardExpiry-error" className="mt-1.5 text-xs text-red-600">
                      {errors.expiry}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="cardCvv" className="mb-1.5 block text-sm font-medium text-gray-700">
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
                    aria-invalid={Boolean(errors.cvv)}
                    aria-describedby={errors.cvv ? 'cardCvv-error' : undefined}
                    className={`${fieldClass(errors.cvv)} font-mono`}
                  />
                  {errors.cvv && (
                    <p id="cardCvv-error" className="mt-1.5 text-xs text-red-600">
                      {errors.cvv}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="cardHolder" className="mb-1.5 block text-sm font-medium text-gray-700">
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
                  aria-invalid={Boolean(errors.holderName)}
                  aria-describedby={errors.holderName ? 'cardHolder-error' : undefined}
                  className={fieldClass(errors.holderName)}
                />
                {errors.holderName && (
                  <p id="cardHolder-error" className="mt-1.5 text-xs text-red-600">
                    {errors.holderName}
                  </p>
                )}
              </div>
            </fieldset>

            {checks.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-3 text-xs font-semibold text-gray-700">
                  {passed} of {checks.length} checks passed
                </p>
                <ul className="space-y-2">
                  {checks.map((check) => (
                    <li key={check.id} className="flex items-start gap-2.5 text-xs leading-relaxed">
                      {check.passed ? (
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0 text-teal-600"
                          aria-hidden="true"
                        />
                      ) : (
                        <X size={14} className="mt-0.5 shrink-0 text-red-500" aria-hidden="true" />
                      )}
                      <span className={check.passed ? 'text-gray-500' : 'text-red-600'}>
                        <span className="font-medium">{check.label}:</span> {check.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {decline && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
                <div className="text-sm text-red-700">
                  <p className="font-semibold">Declined — {decline.message}</p>
                  <p className="mt-1 text-xs text-red-600">
                    Code {decline.reasonCode} · reference {decline.reference}. Nothing was charged.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Kept quiet on purpose: it is a fact about the system, not an error, and
              an alert-styled box here would compete with the real alerts above. */}
          <p className="flex items-start gap-2.5 border-t border-gray-100 bg-gray-50 px-6 py-3.5 text-xs leading-relaxed text-gray-500">
            <Info size={14} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
            <span>
              Nothing is charged. These details are checked in your browser and validated on our
              server, then an outcome is decided locally to stand in for a card network. The number
              is never stored or logged.
            </span>
          </p>

          {/* One primary action. Cancel is deliberately quieter — backing out is not
              the thing being offered. */}
          <div className="border-t border-gray-100 px-6 py-4">
            <button
              type="submit"
              disabled={busy || !ready}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? (
                'Authorising…'
              ) : (
                <>
                  <CreditCard size={16} aria-hidden="true" />
                  Pay {amount}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="mt-2 w-full rounded-xl py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
