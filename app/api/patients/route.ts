// app/api/patients/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULTS,
  F,
  PATIENT_OBJECT,
  PATIENT_REFERENCE_FIELD,
} from '@/lib/patient-schema';
import {
  PatientInput,
  calculateAge,
  hasErrors,
  validatePatient,
} from '@/lib/patient-validation';
import {
  SalesforceRestError,
  createRecord,
  readRecord,
  soql,
} from '@/lib/salesforce-rest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function emailAlreadyExists(email: string): Promise<boolean> {
  const safe = email.replace(/'/g, "\\'");
  const rows = await soql<{ Id: string }>(
    `SELECT Id FROM ${PATIENT_OBJECT} WHERE ${F.email} = '${safe}' LIMIT 1`
  );
  return Boolean(rows[0]?.Id);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (origin && host && !origin.endsWith(host)) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 403 });
  }

  let input: Partial<PatientInput>;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const errors = validatePatient(input);
  if (hasErrors(errors)) {
    return NextResponse.json({ fieldErrors: errors }, { status: 422 });
  }

  const firstName = (input.firstName ?? '').trim();
  const lastName = (input.lastName ?? '').trim();
  const dateOfBirth = (input.dateOfBirth ?? '').trim();
  const email = (input.email ?? '').trim().toLowerCase();
  const phone = (input.phone ?? '').trim();
  const address = (input.address ?? '').trim();
  const age = calculateAge(dateOfBirth);

  if (age === null) {
    return NextResponse.json(
      { fieldErrors: { dateOfBirth: 'Enter a valid date of birth.' } },
      { status: 422 }
    );
  }

  try {
    if (await emailAlreadyExists(email)) {
      return NextResponse.json(
        {
          error:
            'We could not complete this registration online. Please call Silverline Health on 07 3000 0000.',
        },
        { status: 409 }
      );
    }

    const record: Record<string, unknown> = {
      ...DEFAULTS,
      [F.firstName]: firstName,
      [F.lastName]: lastName,
      [F.dateOfBirth]: dateOfBirth,
      [F.age]: age,
      [F.email]: email,
      [F.phone]: phone,
      [F.address]: address,
    };

    const id = await createRecord(PATIENT_OBJECT, record);

    let patientNumber = id;
    if (PATIENT_REFERENCE_FIELD) {
      const created = await readRecord(PATIENT_OBJECT, id, [PATIENT_REFERENCE_FIELD]);
      patientNumber = (created?.[PATIENT_REFERENCE_FIELD] as string) ?? id;
    }

    console.log('patient created', { id });

    return NextResponse.json({ patientNumber, age }, { status: 201 });
  } catch (err) {
    if (err instanceof SalesforceRestError) {
      console.error('patient create failed', err.status, err.code, err.errors);

      const guidance: Record<string, string> = {
        INVALID_TYPE: `Object "${PATIENT_OBJECT}" does not exist, or the integration user cannot access it.`,
        INVALID_FIELD: 'A field API name in lib/patient-schema.ts does not match the org.',
        REQUIRED_FIELD_MISSING: 'The object requires a field this form does not send.',
        INSUFFICIENT_ACCESS_OR_READONLY:
          'The integration user lacks Create permission on the object or Edit permission on a field.',
        INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST:
          'Status__c in DEFAULTS does not match the Patient Status picklist values in Salesforce.',
        STRING_TOO_LONG: 'A value exceeded the field length defined in Salesforce.',
        INVALID_EMAIL_ADDRESS: 'Salesforce rejected the email format.',
        CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY:
          'A trigger or validation rule on the Patient object rejected the record.',
      };

      const detail =
        process.env.NODE_ENV === 'development' ? guidance[err.code] ?? err.message : undefined;

      return NextResponse.json(
        {
          error:
            'We could not save your registration. Please check your details or call us on 07 3000 0000.',
          ...(detail ? { detail } : {}),
        },
        { status: 502 }
      );
    }

    console.error('patient create failed', err);
    return NextResponse.json(
      { error: 'We could not save your registration. Please try again shortly.' },
      { status: 502 }
    );
  }
}
