// lib/patient-validation.ts
//
// Shared by the registration form and the API route. Client-side validation
// gives fast feedback; server-side validation protects Salesforce.

import { LIMITS } from './patient-schema';

export type PatientInput = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
};

export type FieldErrors = Partial<Record<keyof PatientInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+()\-\s]{8,25}$/;

export function calculateAge(dateOfBirth: string, today = new Date()): number | null {
  if (!dateOfBirth) return null;

  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;

  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  const dayDelta = today.getDate() - dob.getDate();

  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1;
  }

  return age;
}

export function validatePatient(input: Partial<PatientInput>): FieldErrors {
  const e: FieldErrors = {};

  const firstName = (input.firstName ?? '').trim();
  if (!firstName) {
    e.firstName = 'Please enter your first name.';
  } else if (firstName.length > LIMITS.firstName) {
    e.firstName = `First name must be ${LIMITS.firstName} characters or fewer.`;
  }

  const lastName = (input.lastName ?? '').trim();
  if (!lastName) {
    e.lastName = 'Please enter your last name.';
  } else if (lastName.length > LIMITS.lastName) {
    e.lastName = `Last name must be ${LIMITS.lastName} characters or fewer.`;
  }

  const dateOfBirth = (input.dateOfBirth ?? '').trim();
  const age = calculateAge(dateOfBirth);
  if (!dateOfBirth) {
    e.dateOfBirth = 'Please enter your date of birth.';
  } else if (age === null) {
    e.dateOfBirth = 'Enter a valid date of birth.';
  } else if (age < 0) {
    e.dateOfBirth = 'Date of birth cannot be in the future.';
  } else if (age > 125) {
    e.dateOfBirth = 'Check the date of birth is correct.';
  }

  const email = (input.email ?? '').trim();
  if (!email) {
    e.email = 'Please enter your email address.';
  } else if (!EMAIL_RE.test(email)) {
    e.email = 'Enter a valid email address.';
  } else if (email.length > LIMITS.email) {
    e.email = 'That email address is too long.';
  }

  const phone = (input.phone ?? '').trim();
  if (!phone) {
    e.phone = 'Please enter your phone number.';
  } else if (!PHONE_RE.test(phone)) {
    e.phone = 'Enter a valid phone number.';
  } else if (phone.length > LIMITS.phone) {
    e.phone = 'That phone number is too long.';
  }

  const address = (input.address ?? '').trim();
  if (!address) {
    e.address = 'Please enter your address.';
  } else if (address.length > LIMITS.address) {
    e.address = `Address must be ${LIMITS.address} characters or fewer.`;
  }

  return e;
}

export function hasErrors(e: FieldErrors): boolean {
  return Object.keys(e).some((key) => Boolean(e[key as keyof FieldErrors]));
}
