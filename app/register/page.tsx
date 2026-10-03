import type { Metadata } from 'next';
import PatientRegistrationForm from '@/components/PatientRegistrationForm';

export const metadata: Metadata = {
  title: 'New patient registration | Silverline Health',
  description: 'Register as a new Silverline Health patient.',
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <header className="mb-8">
        <p className="mb-3 font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-[0.18em] text-brand">
          New patients
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-ink">
          Register with Silverline Health
        </h1>
        <p className="mt-3 leading-relaxed text-body">
          Complete this form to create your patient record before booking your first appointment.
          We calculate age from your date of birth so the record stays accurate over time.
        </p>
      </header>

      <div
        role="note"
        className="mb-8 rounded-lg border-l-4 border-signal bg-wash p-4 text-sm text-ink"
      >
        <strong className="font-semibold">If this is a medical emergency, call 000.</strong> This
        registration form is not monitored continuously.
      </div>

      <div className="rounded-xl border border-line bg-card p-6">
        <PatientRegistrationForm />
      </div>

      <p className="mt-6 text-xs text-muted">
        Your information is sent to Silverline&apos;s Salesforce patient records system through
        this website&apos;s server. Salesforce credentials are never sent to your browser.
      </p>
    </div>
  );
}
