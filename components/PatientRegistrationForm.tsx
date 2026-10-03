'use client';

import { useMemo, useRef, useState } from 'react';
import { LIMITS } from '@/lib/patient-schema';
import {
  FieldErrors,
  PatientInput,
  calculateAge,
  hasErrors,
  validatePatient,
} from '@/lib/patient-validation';

const EMPTY: PatientInput = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  address: '',
};

type Success = {
  patientNumber: string;
  age?: number;
};

export default function PatientRegistrationForm() {
  const [values, setValues] = useState<PatientInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<Success | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const age = useMemo(() => calculateAge(values.dateOfBirth), [values.dateOfBirth]);

  function set<K extends keyof PatientInput>(key: K, value: PatientInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const found = validatePatient(values);
    if (hasErrors(found)) {
      setErrors(found);
      summaryRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 422 && data.fieldErrors) {
        setErrors(data.fieldErrors);
        summaryRef.current?.focus();
        return;
      }

      if (!res.ok) {
        setFormError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setSuccess({ patientNumber: data.patientNumber, age: data.age });
    } catch {
      setFormError('We could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6" role="status">
        <h2 className="text-lg font-semibold text-emerald-900">Registration received</h2>
        <p className="mt-2 text-sm text-emerald-900">
          Your patient number is{' '}
          <strong className="break-all font-mono text-base">{success.patientNumber}</strong>.
        </p>
        {typeof success.age === 'number' && (
          <p className="mt-3 text-sm text-emerald-800">
            Our system calculated your age as {success.age}.
          </p>
        )}
        <p className="mt-3 text-sm text-emerald-800">
          Our front desk team will review your registration before your first appointment.
        </p>
        <button
          type="button"
          onClick={() => {
            setValues(EMPTY);
            setSuccess(null);
          }}
          className="mt-5 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-900"
        >
          Register another patient
        </button>
      </div>
    );
  }

  const errorList = Object.entries(errors).filter(([, v]) => Boolean(v));

  const inputCls = (field: keyof PatientInput) =>
    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20 ' +
    (errors[field] ? 'border-red-400 bg-red-50' : 'border-line focus:border-brand');

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {errorList.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4"
        >
          <p className="text-sm font-semibold text-red-900">
            Please correct the following before submitting:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">
            {errorList.map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      {formError && (
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          {formError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-ink">
            First name
          </label>
          <input
            id="firstName"
            type="text"
            maxLength={LIMITS.firstName}
            autoComplete="given-name"
            value={values.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            aria-invalid={Boolean(errors.firstName)}
            className={inputCls('firstName')}
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-700">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-ink">
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            maxLength={LIMITS.lastName}
            autoComplete="family-name"
            value={values.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            aria-invalid={Boolean(errors.lastName)}
            className={inputCls('lastName')}
          />
          {errors.lastName && <p className="mt-1 text-xs text-red-700">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="dateOfBirth" className="mb-1 block text-sm font-medium text-ink">
          Date of birth
        </label>
        <input
          id="dateOfBirth"
          type="date"
          value={values.dateOfBirth}
          onChange={(e) => set('dateOfBirth', e.target.value)}
          aria-invalid={Boolean(errors.dateOfBirth)}
          className={inputCls('dateOfBirth')}
        />
        <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs">
          <span className="text-red-700">{errors.dateOfBirth ?? ''}</span>
          {age !== null && age >= 0 && (
            <span className="text-muted">Calculated age: {age}</span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
            Email address
          </label>
          <input
            id="email"
            type="email"
            maxLength={LIMITS.email}
            autoComplete="email"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            aria-invalid={Boolean(errors.email)}
            className={inputCls('email')}
          />
          {errors.email && <p className="mt-1 text-xs text-red-700">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-ink">
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            maxLength={LIMITS.phone}
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            className={inputCls('phone')}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-700">{errors.phone}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="address" className="mb-1 block text-sm font-medium text-ink">
          Residential address
        </label>
        <textarea
          id="address"
          rows={4}
          maxLength={LIMITS.address}
          autoComplete="street-address"
          value={values.address}
          onChange={(e) => set('address', e.target.value)}
          aria-invalid={Boolean(errors.address)}
          className={inputCls('address') + ' resize-y'}
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-red-700">{errors.address ?? ''}</span>
          <span className="text-muted">
            {values.address.length} / {LIMITS.address}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
      >
        {submitting ? 'Registering...' : 'Register as a new patient'}
      </button>
    </form>
  );
}
