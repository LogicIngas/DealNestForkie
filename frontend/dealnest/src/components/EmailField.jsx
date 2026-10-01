import React, { useState } from 'react';
import { Mail, AlertCircle } from 'lucide-react';
import { normaliseEmail, validateEmail } from '../lib/validation';

/**
 * An email field that validates on change once it has been blurred, so a typo is
 * caught while the user is still looking at the field rather than after a failed
 * submit. The `required` HTML attribute and `type="email"` stay in place as the
 * no-JS / pre-hydration guard.
 */
export default function EmailField({
  id,
  name = 'email',
  label,
  value,
  onChange,
  placeholder = 'Email Address',
  autoComplete = 'email',
  className = 'input-field',
  disabled = false,
  // The login card's original field had a screen-reader-only label and no visible
  // one, so callers there keep that treatment instead of gaining a stray caption.
  hideLabel = false,
}) {
  const [touched, setTouched] = useState(false);
  const error = touched ? validateEmail(value) : null;

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className={hideLabel ? 'sr-only' : 'block text-xs font-semibold text-gray-600 mb-1.5'}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <Mail className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" aria-hidden="true" />
        <input
          id={id}
          name={name}
          type="email"
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={e => onChange(normaliseEmail(e.target.value))}
          onBlur={() => setTouched(true)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`pl-12 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200/50' : ''} ${className}`}
          required
        />
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1.5 mt-1.5 text-xs font-medium text-red-600"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-px" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
