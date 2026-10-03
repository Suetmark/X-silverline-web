// lib/patient-schema.ts
//
// Salesforce Patient__c schema assumptions for the public registration form.
// If your org uses different API names, change them here and nowhere else.

export const PATIENT_OBJECT = 'Patient__c';

export const PATIENT_REFERENCE_FIELD: string | null = 'Patient_ID__c';

export const F = {
  firstName: 'Name',
  lastName: 'Last_Name__c',
  dateOfBirth: 'Date_of_Birth__c',
  age: 'Age__c',
  email: 'Email__c',
  phone: 'Phone__c',
  address: 'Address__c',
  status: 'Status__c',
} as const;

export const DEFAULTS: Record<string, unknown> = {
  [F.status]: 'New',
};

export const LIMITS = {
  firstName: 80,
  lastName: 50,
  email: 254,
  phone: 40,
  address: 255,
} as const;
