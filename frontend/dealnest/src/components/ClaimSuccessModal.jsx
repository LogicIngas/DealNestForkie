import React, { useEffect, useRef } from 'react';
import { Ticket } from 'lucide-react';
import EmailVoucherButton from './EmailVoucherButton';

/**
 * Shown after a deal is claimed. Displays the code and offers to email it.
 *
 * Emailing is always opt-in: claiming a deal is not a request to be emailed, so no
 * mail leaves the server unless the user presses the button here.
 */
export default function ClaimSuccessModal({ redemption, onClose }) {
  const emailButtonRef = useRef(null);

  useEffect(() => {
    if (redemption) emailButtonRef.current?.focus();
  }, [redemption]);

  useEffect(() => {
    if (!redemption) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [redemption, onClose]);

  if (!redemption) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-modal-title"
        aria-describedby="claim-modal-message"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Ticket className="mx-auto text-teal-600 w-10 h-10" aria-hidden="true" />
        <h3 id="claim-modal-title" className="text-lg font-bold text-gray-800 mt-3">Deal claimed!</h3>
        <p id="claim-modal-message" className="text-sm text-gray-500 mt-1">Show this code in-store to redeem it.</p>
        <p className="font-mono text-2xl font-bold tracking-widest text-teal-600 bg-teal-50 rounded-xl py-4 mt-4">
          {redemption.code}
        </p>

        <EmailVoucherButton
          ref={emailButtonRef}
          redemptionId={redemption.redemptionID}
          variant="block"
          className="mt-4"
        />

        <button type="button" onClick={onClose} className="btn-primary mt-4">Got it</button>
      </div>
    </div>
  );
}
