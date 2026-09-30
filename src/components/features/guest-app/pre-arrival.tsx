'use client';

import { ExpandableField } from './field-controls';
import { Field, FormScreen, Notice, TextButton } from './guest-ui';
import type { GuestRecord, RoomPreferences, SavedCompanion } from './prototype-model';
import { ROOM_PREFERENCE_OPTIONS, isCompleteCompanion } from './prototype-model';
import { Button } from '@/components/ui';
import { ArrowRight, Camera, Check, CheckCircle, PencilSimple, Plus, UploadSimple, X } from '@phosphor-icons/react';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

/*
  Pre-arrival: the guest's ID (scanned or typed), who else is staying, and
  room preferences -- what the hotel needs before the guest walks in.
*/

export type Companion = {
  name: string;
  nationality?: string;
  email?: string;
  mobile?: string;
  documentNumber?: string;
  expiry?: string;
};

/** What a scan reads off the document. Name and nationality are optional so a form can keep its own. */
export type PassportFields = {
  documentNumber: string;
  expiry: string;
  fullName?: string;
  nationality?: string;
  /** Printed on the document; the forms do not ask for them. */
  dateOfBirth?: string;
  sex?: 'F' | 'M';
};

export const DEMO_PASSPORT_FIELDS: PassportFields = {
  documentNumber: 'P1234567A',
  expiry: '2030-05-20',
  nationality: 'Filipino',
  dateOfBirth: '1994-03-18',
  sex: 'F',
};

/** The sample document a companion's scan "reads", so the demo fills every field. */
export const DEMO_COMPANION_PASSPORT: PassportFields = {
  fullName: 'Elena Santos',
  nationality: 'Filipino',
  documentNumber: 'P7734120B',
  expiry: '2031-02-14',
  dateOfBirth: '1996-07-02',
  sex: 'F',
};

export const NATIONALITY_CODES: Record<string, string> = { filipino: 'PHL', american: 'USA', japanese: 'JPN', korean: 'KOR', australian: 'AUS', british: 'GBR' };

export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** "1994-03-18" -> "18 MAR 1994", as passports print it. */
/* --------------------------------------------------------------------------
   The passport data page the scan "reads".

   Laid out like a real ICAO 9303 page -- portrait, fields, and the two
   machine-readable lines with genuine check digits -- so the capture step
   reads as the finished product. It is a generic passport, not any issuing
   state's design, and it carries SPECIMEN across it so a screenshot cannot
   pass for a document.
   -------------------------------------------------------------------------- */

export function passportDate(iso?: string) {
  const [year, month, day] = (iso ?? '').split('-');
  return year && month && day ? `${day} ${MONTHS[Number(month) - 1]} ${year}` : '';
}

/** ICAO 9303 check digit: weights 7-3-1 over digits, letters (A=10) and fillers (<=0). */
export function mrzCheck(field: string) {
  const value = (char: string) => (/\d/.test(char) ? Number(char) : /[A-Z]/.test(char) ? char.charCodeAt(0) - 55 : 0);
  return String([...field].reduce((sum, char, i) => sum + value(char) * [7, 3, 1][i % 3]!, 0) % 10);
}

export function machineReadableZone(surname: string, given: string, fields: PassportFields, code: string) {
  const clean = (text: string) => text.toUpperCase().replace(/[^A-Z0-9]+/g, '<');
  const pad = (text: string, length: number) => text.slice(0, length).padEnd(length, '<');
  const yymmdd = (iso?: string) => (iso ?? '').replace(/-/g, '').slice(2) || '<<<<<<';
  const line1 = pad(`P<${code}${clean(surname)}<<${clean(given)}`, 44);
  const doc = pad(clean(fields.documentNumber), 9);
  const dob = yymmdd(fields.dateOfBirth);
  const exp = yymmdd(fields.expiry);
  const personal = '<'.repeat(14);
  const docPart = `${doc}${mrzCheck(doc)}`;
  const dobPart = `${dob}${mrzCheck(dob)}`;
  const expPart = `${exp}${mrzCheck(exp)}`;
  const personalPart = `${personal}${mrzCheck(personal)}`;
  const composite = mrzCheck(`${docPart}${dobPart}${expPart}${personalPart}`);
  const line2 = `${docPart}${code}${dobPart}${fields.sex ?? '<'}${expPart}${personalPart}${composite}`;
  return [line1, line2];
}

/** An illustrated ID headshot: plain backdrop, shoulders square, no real face. */
export function PassportPortrait({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 78" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="passport-portrait-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6ebef" />
          <stop offset="1" stopColor="#cfd7dd" />
        </linearGradient>
      </defs>
      <rect width="60" height="78" fill="url(#passport-portrait-bg)" />
      <path d="M4 78c1-13 10-19 26-19s25 6 26 19Z" fill="#3b4350" />
      <path d="M24 50h12v11c0 3-12 3-12 0Z" fill="#c9987a" />
      <path d="M22 60c3 4 13 4 16 0l3 3c-4 6-18 6-22 0Z" fill="#f2f2f0" opacity="0.9" />
      <ellipse cx="30" cy="35" rx="12.5" ry="15.5" fill="#d8aa8a" />
      <path d="M17 36c-2-14 5-22 13-22 9 0 16 7 13 22-1-6-4-10-8-12-4 3-11 5-17 4-1 3-1 5-1 8Z" fill="#2a201b" />
      <path d="M17 34c-1 9 1 16 4 21 0-7-1-14-4-21ZM43 34c1 9-1 16-4 21 0-7 1-14 4-21Z" fill="#2a201b" />
    </svg>
  );
}

export function PassportDataPage({ name, fields, reading }: { name: string; fields: PassportFields; reading: boolean }) {
  const parts = name.trim().split(/\s+/);
  const surname = parts.length > 1 ? parts[parts.length - 1]! : parts[0] ?? '';
  const given = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
  const code = NATIONALITY_CODES[(fields.nationality ?? '').toLowerCase()] ?? 'XXX';
  const [line1, line2] = machineReadableZone(surname, given, fields, code);
  const row = (label: string, value: string) => <div><dt>{label}</dt><dd>{value || '—'}</dd></div>;

  return (
    <figure className="guest-passport" data-reading={reading || undefined} aria-label={`Passport data page for ${name}`}>
      <div className="guest-passport__band">
        <b>Passport</b>
        <span>Type P · {code}</span>
      </div>
      <div className="guest-passport__body">
        <PassportPortrait className="guest-passport__portrait" />
        <dl className="guest-passport__fields">
          {row('Surname', surname.toUpperCase())}
          {row('Given names', given.toUpperCase())}
          {row('Nationality', (fields.nationality ?? '').toUpperCase())}
          <div className="guest-passport__pair">
            {row('Date of birth', passportDate(fields.dateOfBirth))}
            {row('Sex', fields.sex ?? '')}
          </div>
          {row('Passport no.', fields.documentNumber)}
          {row('Date of expiry', passportDate(fields.expiry))}
        </dl>
        <PassportPortrait className="guest-passport__ghost" />
      </div>
      <div className="guest-passport__mrz" aria-hidden="true">
        <span>{line1}</span>
        <span>{line2}</span>
      </div>
      <span className="guest-passport__specimen" aria-hidden="true">Specimen</span>
      {reading ? <span className="guest-passport__scan" aria-hidden="true" /> : null}
    </figure>
  );
}

export function PassportCapturePanel({
  subjectName,
  onAutofill,
  sample = DEMO_PASSPORT_FIELDS,
}: {
  subjectName: string;
  onAutofill: (fields: PassportFields) => void;
  /** The fields the simulated read returns. */
  sample?: PassportFields;
}) {
  const [step, setStep] = useState<'idle' | 'reading' | 'complete'>('idle');
  const [source, setSource] = useState<'photo' | 'upload' | null>(null);

  useEffect(() => {
    if (step !== 'reading') return;

    // Long enough to see the scan pass once over the page.
    const timeout = window.setTimeout(() => {
      onAutofill(sample);
      setStep('complete');
    }, 1300);

    return () => window.clearTimeout(timeout);
  }, [onAutofill, sample, step]);
  const shownName = subjectName || sample.fullName || 'Guest';

  // Choosing a photo is the whole request: the read starts at once, no second tap.
  const openDemoPreview = (nextSource: 'photo' | 'upload') => {
    setSource(nextSource);
    setStep('reading');
  };

  return (
    <section className="guest-passport-capture" aria-label={`Passport for ${shownName}`}>
      {step === 'idle' ? (
        <div className="guest-passport-capture__choices" role="group" aria-label="Passport photo options">
          <button
            className={`guest-passport-capture__choice${source === 'photo' ? ' is-selected' : ''}`}
            type="button"
            aria-pressed={source === 'photo'}
            onClick={() => openDemoPreview('photo')}
          >
            <Camera size={21} aria-hidden="true" />
            <b>Take a photo</b>
            <small>Use your camera</small>
          </button>
          <button
            className={`guest-passport-capture__choice${source === 'upload' ? ' is-selected' : ''}`}
            type="button"
            aria-pressed={source === 'upload'}
            onClick={() => openDemoPreview('upload')}
          >
            <UploadSimple size={21} aria-hidden="true" />
            <b>Upload a photo</b>
            <small>From your photos</small>
          </button>
        </div>
      ) : (
        <>
          <PassportDataPage name={sample.fullName ?? shownName} fields={sample} reading={step === 'reading'} />
          <div className="guest-passport-capture__status-row">
            {step === 'reading' ? (
              <p className="guest-passport-capture__status" role="status" aria-live="polite" aria-atomic="true">
                Reading your passport…
              </p>
            ) : (
              <>
                <p className="guest-passport-capture__status is-complete" role="status" aria-live="polite" aria-atomic="true">
                  <CheckCircle weight="fill" aria-hidden="true" />Details added below
                </p>
                <button type="button" className="guest-passport-capture__retake" onClick={() => { setStep('idle'); setSource(null); }}>
                  Retake
                </button>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export type AdditionalGuestsScreenProps = {
  /** How many the booking is for, lead included. */
  bookedGuests?: number;
  primaryGuestName: string;
  primaryGuestEmail?: string;
  /** Who is already on the list: people named for this stay, and anyone on record who fits the booking. */
  initialCompanions: SavedCompanion[];
  /** People on record who did not fit, offered with one tap each. */
  suggestions?: SavedCompanion[];
  onSave: (companions: Companion[]) => void;
};

/** "Ana Santos" -> "AS"; one name gives one letter. */
export function initialsOf(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join('') || '?';
}

/**
 * Step 1 of 2: who the guest is, led by the passport scan that fills most of it.
 * With an ID on file the same screen opens filled in and asks only for a
 * check: the scan moves behind "Scan a new passport", for when it changed.
 */
export function IdentityStep({ guestName, email, record, passportFields, onPassportFieldsChange, onContinue }: {
  guestName: string;
  email: string;
  /** What the hotel already has from a previous registration. */
  record?: GuestRecord;
  passportFields: PassportFields;
  onPassportFieldsChange: (fields: PassportFields) => void;
  onContinue: (identity: { name: string; email: string; mobile: string; nationality: string; passport: PassportFields }) => void;
}) {
  const [contact, setContact] = useState({ email, mobile: record?.mobile ?? '' });
  const [contactOpen, setContactOpen] = useState(false);
  const [person, setPerson] = useState({ name: guestName, nationality: record?.nationality ?? '' });
  const [rescan, setRescan] = useState(false);
  const readDocument = useCallback((fields: PassportFields) => {
    setPerson((current) => ({ name: fields.fullName ?? current.name, nationality: fields.nationality ?? current.nationality }));
    onPassportFieldsChange(fields);
  }, [onPassportFieldsChange]);
  const onFile = Boolean(record);
  const ready = Boolean(person.name.trim() && person.nationality.trim() && passportFields.documentNumber?.trim() && passportFields.expiry);
  return (
    <FormScreen
      step="1 of 2"
      title={onFile ? 'Confirm your ID' : 'You and your ID'}
      text={onFile ? 'We filled in what the hotel has from your last stay. Check it, and change anything that is different. Sent securely to the property for registration.' : 'Scan your passport or ID and we fill in the rest. Sent securely to the property for registration.'}
    >
      {onFile && !rescan ? (
        <TextButton onClick={() => setRescan(true)}>Scan a new passport or ID</TextButton>
      ) : (
        <PassportCapturePanel subjectName={person.name} onAutofill={readDocument} />
      )}
      <Field label="Full name" name="guest-name" value={person.name} onValueChange={(name) => setPerson((current) => ({ ...current, name }))} required />
      <Field label="Nationality" name="nationality" placeholder="e.g. Filipino" value={person.nationality} onValueChange={(nationality) => setPerson((current) => ({ ...current, nationality }))} required />
      <Field label="Passport or ID number" name="document-number" placeholder="As printed on the document" value={passportFields.documentNumber} onValueChange={(documentNumber) => onPassportFieldsChange({ ...passportFields, documentNumber })} required />
      <Field label="Expiry date" name="expiry" type="date" value={passportFields.expiry} onValueChange={(expiry) => onPassportFieldsChange({ ...passportFields, expiry })} required />
      <ExpandableField label="Contact" value={[contact.email, contact.mobile].filter(Boolean).join(' · ') || 'Add contact details'} aside={email ? 'From your account' : 'Optional'} open={contactOpen} onToggle={() => setContactOpen((open) => !open)}>
        <Field label="Email" name="guest-email" type="email" value={contact.email} onValueChange={(value) => setContact((current) => ({ ...current, email: value }))} />
        <Field label="Mobile" name="guest-mobile" type="tel" value={contact.mobile} onValueChange={(mobile) => setContact((current) => ({ ...current, mobile }))} />
      </ExpandableField>
      <Button className="guest-button guest-button--primary" type="button" disabled={!ready} onClick={() => onContinue({ name: person.name.trim(), email: contact.email.trim(), mobile: contact.mobile.trim(), nationality: person.nationality.trim(), passport: passportFields })}>{ready ? (onFile ? 'Confirm and continue' : 'Continue') : 'Scan or fill in your ID to continue'}<ArrowRight aria-hidden="true" /></Button>
    </FormScreen>
  );
}

export function AdditionalGuestsScreen({
  bookedGuests,
  primaryGuestName,
  primaryGuestEmail = '',
  initialCompanions,
  suggestions = [],
  onSave,
}: AdditionalGuestsScreenProps) {
  const [mode, setMode] = useState<'list' | 'details'>('list');
  const [companions, setCompanions] = useState<Companion[]>(() => initialCompanions.map((person) => ({ ...person, nationality: person.nationality ?? '' })));
  /** Which row the details form is changing; null means it is adding one. */
  const [editing, setEditing] = useState<number | null>(null);
  const offered = suggestions.filter((person) => !companions.some((added) => added.name.trim().toLowerCase() === person.name.trim().toLowerCase()));
  const [draft, setDraft] = useState<Companion>({
    name: '',
    nationality: '',
    email: '',
    mobile: '',
    documentNumber: '',
    expiry: '',
  });
  const handlePassportAutofill = useCallback((fields: PassportFields) => {
    setDraft((current) => ({
      ...current,
      name: fields.fullName ?? current.name,
      nationality: fields.nationality ?? current.nationality,
      documentNumber: fields.documentNumber,
      expiry: fields.expiry,
    }));
  }, []);

  const handleRemoveGuest = (index: number) => {
    setCompanions((prev) => prev.filter((_, i) => i !== index));
  };

  /*
    ID first: the scan reads the name, nationality, number and expiry off the
    document, so typing them before it only to have it fill them again was
    the same work twice. Everything stays editable; contact is optional.
  */
  if (mode === 'details') {
    return (
      <FormScreen
        step="Additional guest"
        title="Who is staying with you?"
        text="Scan their passport or ID and we fill in the rest. Sent securely to the property for registration."
      >
        <form
          className="guest-form"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const name = draft.name.trim();
            if (!name) return;
            const saved: Companion = {
              name,
              nationality: draft.nationality?.trim() || '',
              email: draft.email?.trim(),
              mobile: draft.mobile?.trim(),
              documentNumber: draft.documentNumber?.trim(),
              expiry: draft.expiry,
            };
            setCompanions((prev) => (editing === null ? [...prev, saved] : prev.map((person, i) => (i === editing ? saved : person))));
            setEditing(null);
            setMode('list');
          }}
        >
          <PassportCapturePanel subjectName={draft.name} sample={DEMO_COMPANION_PASSPORT} onAutofill={handlePassportAutofill} />
          <Field
            label="Full name"
            name="companion-name"
            placeholder="As shown on the ID"
            value={draft.name}
            onValueChange={(name) => setDraft((current) => ({ ...current, name }))}
            required
          />
          <Field
            label="Nationality"
            name="companion-nationality"
            placeholder="e.g. Filipino"
            value={draft.nationality ?? ''}
            onValueChange={(nationality) => setDraft((current) => ({ ...current, nationality }))}
            required
          />
          {/* The hotel registers every guest, so a companion needs the same ID details as the lead. */}
          <Field
            label="Passport or ID number"
            name="companion-document"
            placeholder="As printed on the document"
            value={draft.documentNumber ?? ''}
            onValueChange={(documentNumber) => setDraft((current) => ({ ...current, documentNumber }))}
            required
          />
          <Field
            label="Expiry date"
            name="companion-expiry"
            type="date"
            value={draft.expiry ?? ''}
            onValueChange={(expiry) => setDraft((current) => ({ ...current, expiry }))}
            required
          />
          <Field
            label="Email (optional)"
            name="companion-email"
            type="email"
            placeholder="companion@example.com"
            value={draft.email ?? ''}
            onValueChange={(email) => setDraft((current) => ({ ...current, email }))}
          />
          <Field
            label="Mobile (optional)"
            name="companion-mobile"
            type="tel"
            placeholder="+63 917 555 0100"
            value={draft.mobile ?? ''}
            onValueChange={(mobile) => setDraft((current) => ({ ...current, mobile }))}
          />
          <Button className="guest-button guest-button--primary" type="submit" disabled={!draft.name.trim() || !draft.nationality?.trim() || !draft.documentNumber?.trim() || !draft.expiry}>
            {draft.name.trim() && draft.nationality?.trim() && draft.documentNumber?.trim() && draft.expiry ? (editing === null ? 'Save guest' : 'Save changes') : 'Scan or fill in their ID to save'}<ArrowRight aria-hidden="true" />
          </Button>
          <TextButton onClick={() => { setEditing(null); setMode('list'); }}>Cancel</TextButton>
        </form>
      </FormScreen>
    );
  }

  return (
    <FormScreen
      step="2 of 2"
      title="Who else is staying?"
      text="Additional guests do not need their own accounts."
    >
      {/* More guests than the booking was made for is the hotel's call, and possibly a charge. */}
      {bookedGuests && companions.length + 1 > bookedGuests ? (
        <Notice tone="warning" title={`Your booking is for ${bookedGuests} ${bookedGuests === 1 ? 'guest' : 'guests'}`}>
          {`You have listed ${companions.length + 1}. The front desk confirms whether the room takes an extra guest, and any charge for one.`}
        </Notice>
      ) : null}
      {/*
        One list for everyone on the booking, lead first -- a manifest, not a
        card for the booker and a different one for the rest.
      */}
      <section className="guest-manifest" aria-label="Guests on this booking">
        <ul className="guest-manifest__list">
          <li className="guest-manifest__row is-lead">
            <span className="guest-manifest__monogram" aria-hidden="true">{initialsOf(primaryGuestName)}</span>
            <span className="guest-manifest__who">
              <b>{primaryGuestName}</b>
            <small>{primaryGuestEmail || 'Name on booking'}</small>
            </span>
            <span className="guest-manifest__role">Lead</span>
          </li>
          {companions.map((companion, idx) => (
            <li key={idx} className="guest-manifest__row">
              <span className="guest-manifest__monogram" aria-hidden="true">{initialsOf(companion.name)}</span>
              <span className="guest-manifest__who">
                <b>{companion.name}</b>
                <small>{isCompleteCompanion(companion) ? 'Additional guest · ID on file' : 'Additional guest · ID needed'}</small>
              </span>
              <button
                type="button"
                className="guest-companion-remove guest-manifest__remove"
                aria-label={`Edit ${companion.name}`}
                onClick={() => { setDraft({ email: '', mobile: '', documentNumber: '', expiry: '', ...companion }); setEditing(idx); setMode('details'); }}
              >
                <PencilSimple aria-hidden="true" />
              </button>
              <button
                type="button"
                className="guest-companion-remove guest-manifest__remove"
                aria-label={`Remove ${companion.name}`}
                onClick={() => handleRemoveGuest(idx)}
              >
                <X aria-hidden="true" />
              </button>
            </li>
          ))}
          <li className="guest-manifest__row guest-manifest__row--add">
            <button
              type="button"
              className="guest-manifest__add"
              onClick={() => {
                setEditing(null);
                setDraft({
                  name: '',
                  nationality: '',
                  email: '',
                  mobile: '',
                  documentNumber: '',
                  expiry: '',
                });
                setMode('details');
              }}
            >
              <span className="guest-manifest__monogram" aria-hidden="true"><Plus /></span>
              Add a guest
            </button>
          </li>
        </ul>
      </section>

      {offered.length ? (
        <section className="guest-companion-suggestions" aria-label="Travelled with you before">
          <h2>Travelled with you before</h2>
          <div className="guest-preference-chips">
            {offered.map((person) => (
              <button key={person.name} type="button" className="guest-preference-chip" aria-label={`Add ${person.name}`} onClick={() => setCompanions((prev) => [...prev, { ...person, nationality: person.nationality ?? '' }])}>
                <Plus aria-hidden="true" />{person.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <Button
        className="guest-button guest-button--primary"
        type="button"
        onClick={() => onSave(companions.filter((person) => person.name.trim()))}
      >
        {companions.length === 0 ? 'Just me — finish' : 'Finish'}<ArrowRight aria-hidden="true" />
      </Button>
    </FormScreen>
  );
}

/** A row of pill toggles. `multiple` switches it from radio-like to checkbox-like. */
export function PreferenceChips({ legend, options, selected, multiple = false, onChange }: {
  legend: string;
  options: readonly string[];
  selected: string[];
  multiple?: boolean;
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset className="guest-preference-group">
      <legend>{legend}{multiple ? <small>Choose any</small> : null}</legend>
      <div className="guest-preference-chips">
        {options.map((option) => {
          const on = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              className={`guest-preference-chip${on ? ' is-selected' : ''}`}
              onClick={() => onChange(
                multiple
                  ? (on ? selected.filter((item) => item !== option) : [...selected, option])
                  : [option],
              )}
            >
              {on ? <Check aria-hidden="true" /> : null}{option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * `property` is set only when the upcoming home opened the screen, and it
 * changes what saving means: sent to that hotel for this stay, as well as
 * kept on file for the next booking.
 */
export function RoomPreferencesScreen({ preferences, property, onSave, onCancel }: {
  preferences: RoomPreferences;
  property?: string;
  onSave: (next: RoomPreferences) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<RoomPreferences>({
    ...preferences,
    smoking: preferences.smoking ?? 'Non-smoking',
    location: preferences.location ?? [],
    view: preferences.view ?? [],
    bedding: preferences.bedding ?? [],
    note: preferences.note ?? '',
  });
  const set = (patch: Partial<RoomPreferences>) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <div className="guest-stack">
      <div className="guest-page-title">
        <h1>Room preferences</h1>
        <p>
          {property
            ? `Sent to ${property} for this stay, and saved for the next time you book.`
            : 'We’ll save these above the property level and use them the next time you book.'}
        </p>
      </div>
      <form
        className="guest-form"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          onSave({ ...draft, note: draft.note?.trim() || undefined });
        }}
      >
        <PreferenceChips legend="Bed type" options={ROOM_PREFERENCE_OPTIONS.bed} selected={[draft.bed]} onChange={([bed]) => set({ bed })} />
        <PreferenceChips legend="Smoking" options={ROOM_PREFERENCE_OPTIONS.smoking} selected={draft.smoking ? [draft.smoking] : []} onChange={([smoking]) => set({ smoking })} />
        <PreferenceChips legend="Preferred floor" options={ROOM_PREFERENCE_OPTIONS.floor} selected={[draft.floor]} onChange={([floor]) => set({ floor })} />
        <PreferenceChips legend="Room location" multiple options={ROOM_PREFERENCE_OPTIONS.location} selected={draft.location ?? []} onChange={(location) => set({ location })} />
        <PreferenceChips legend="Window & view" multiple options={ROOM_PREFERENCE_OPTIONS.view} selected={draft.view ?? []} onChange={(view) => set({ view })} />
        <PreferenceChips legend="Bedding" multiple options={ROOM_PREFERENCE_OPTIONS.bedding} selected={draft.bedding ?? []} onChange={(bedding) => set({ bedding })} />
        <PreferenceChips legend="Accessibility needs" multiple options={ROOM_PREFERENCE_OPTIONS.accessibility} selected={draft.accessibility} onChange={(accessibility) => set({ accessibility })} />
        <label className="guest-field">
          <span>Note to the hotel <small>Optional</small></span>
          <textarea
            name="preference-note"
            rows={3}
            maxLength={280}
            placeholder="Anything else that makes the room right for you"
            value={draft.note ?? ''}
            onChange={(event) => set({ note: event.target.value })}
          />
        </label>
        <Notice title="Requests, not guarantees">The hotel matches what it can when it assigns your room.</Notice>
        <Button className="guest-button guest-button--primary" type="submit">
          Save preferences<ArrowRight aria-hidden="true" />
        </Button>
        <TextButton onClick={onCancel}>{property ? 'Back to home' : 'Back to profile'}</TextButton>
      </form>
    </div>
  );
}
