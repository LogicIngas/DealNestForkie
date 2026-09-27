import React, { useState } from 'react';
import { Check, Mail } from 'lucide-react';
import { redemptionService } from '../services/api';

/**
 * "Send to email" control for one voucher.
 *
 * The server always emails the address on the user's own record and rate-limits
 * repeats, so this only has to surface the outcome. A refusal (cooldown, missing
 * address, provider down) is shown as returned rather than swallowed, because the
 * user pressed a button and deserves to know why nothing arrived.
 */
export default function EmailVoucherButton({ redemptionId, variant = 'pill', className = '', ref }) {
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSend = async () => {
    setSending(true);
    setFeedback(null);
    try {
      const result = await redemptionService.sendCodeToEmail(redemptionId);
      setFeedback({ ok: true, message: result?.message || 'Emailed to you.' });
    } catch (error) {
      setFeedback({ ok: false, message: error.message || 'Could not send the email.' });
    } finally {
      setSending(false);
    }
  };

  const sent = Boolean(feedback?.ok);
  const label = sending ? 'Sending…' : sent ? 'Emailed' : 'Send to email';
  const pillClass =
    'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition disabled:opacity-60 ' +
    (sent
      ? 'border-teal-600 bg-teal-600 text-white'
      : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-600');
  const blockClass =
    'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm transition disabled:opacity-60 ' +
    (sent
      ? 'border-teal-600 text-teal-700 bg-teal-50'
      : 'border-teal-600 text-teal-700 hover:bg-teal-50');

  return (
    <div className={className}>
      <button
        ref={ref}
        type="button"
        onClick={handleSend}
        disabled={sending || sent}
        aria-label={sent ? 'Voucher emailed' : 'Send voucher to email'}
        className={variant === 'block' ? blockClass : pillClass}
      >
        {sent ? <Check size={14} aria-hidden="true" /> : <Mail size={14} aria-hidden="true" />}
        {label}
      </button>
      {feedback && (
        <p role="status" className={`text-xs mt-1.5 ${feedback.ok ? 'text-green-600' : 'text-red-600'}`}>
          {feedback.message}
        </p>
      )}
    </div>
  );
}
