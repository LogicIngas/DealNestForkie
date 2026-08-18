import React, { useEffect, useRef, useState } from 'react';
import { Flag } from 'lucide-react';

const REASONS = [
  { value: 'MISLEADING', label: 'Misleading information' },
  { value: 'EXPIRED', label: 'Deal has expired' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { value: 'SCAM', label: 'Looks like a scam' },
  { value: 'DUPLICATE', label: 'Duplicate listing' },
  { value: 'OTHER', label: 'Other' },
];

export default function ReportDealModal({ open, dealTitle, onClose, onSubmit, submitting }) {
  const [reason, setReason] = useState('MISLEADING');
  const [details, setDetails] = useState('');
  const cancelRef = useRef(null);

  useEffect(() => {
    if (open) {
      setReason('MISLEADING');
      setDetails('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(reason, details.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <Flag size={18} className="text-red-500" />
          </div>
          <div className="min-w-0">
            <h3 id="report-modal-title" className="text-lg font-bold text-gray-800">Report deal</h3>
            {dealTitle && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{dealTitle}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-1.5" role="radiogroup" aria-label="Reason">
            {REASONS.map(r => (
              <label
                key={r.value}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-sm font-medium cursor-pointer transition ${reason === r.value ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                />
                {r.label}
              </label>
            ))}
          </div>

          <label htmlFor="report-details" className="sr-only">Additional details</label>
          <textarea
            id="report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Add details (optional)…"
            rows={2}
            maxLength={500}
            className="w-full mt-3 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
          />

          <div className="flex gap-2 mt-5">
            <button
              ref={cancelRef}
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
