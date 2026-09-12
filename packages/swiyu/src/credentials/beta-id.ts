/**
 * The Beta-ID, described in the same shape as this project's own credential
 * types so it can be used in a DCQL query.
 *
 * It is the Sandbox stand-in for the e-ID. It carries a *subset* of the EID
 * content of Art. 15 para. 1 BGEID - surname, given names, date of birth and
 * the AHV number - and not the rest of that list (sex, place of origin, place
 * of birth, nationality, facial image). `age_over_18` is not in Art. 15 at
 * all: it is information derived from the date of birth, which Art. 10 para. 1
 * contemplates the holder releasing in place of the underlying claim.
 *
 * The flows here use only claims in that subset, so they do not change shape
 * when the e-ID replaces the Beta-ID. A flow needing nationality or a facial
 * image cannot be written against the Beta-ID today.
 *
 * Two deliberate omissions. There is no `governance` block: the Confederation
 * governs this credential and writing rules for it here
 * would put expectations in our repository that nobody here can enforce. And
 * it is not a member of `CREDENTIAL_DEFINITIONS`, which is the set of types
 * this project *issues*. We only ever verify this one.
 */

import type { CredentialDefinition } from '../credential-definition.js';
import { BETA_ID } from '../profile.js';

export const BETA_ID_CREDENTIAL: CredentialDefinition = {
  configurationId: 'betaid_sd_jwt',
  vct: BETA_ID.vct,
  name: 'Beta-ID',
  displayName: { 'de-CH': 'Beta-ID', 'fr-CH': 'Beta-ID', 'it-CH': 'Beta-ID', 'en-GB': 'Beta-ID' },
  description: {
    'de-CH': 'Pseudo-Identitätsnachweis der Sandbox mit einem Teil der Attribute der künftigen E-ID.',
    'en-GB': 'Sandbox pseudo-identity credential carrying part of the future e-ID attribute set.',
  },
  backgroundColor: '#8A1C21',
  claims: [
    {
      name: 'given_name',
      type: 'Text',
      label: { 'de-CH': 'Vorname(n)', 'en-GB': 'Given name(s)' },
      schema: { type: 'string' },
    },
    {
      name: 'family_name',
      type: 'Text',
      label: { 'de-CH': 'Name', 'en-GB': 'Surname' },
      schema: { type: 'string' },
    },
    {
      name: 'birth_date',
      type: 'DateTime',
      label: { 'de-CH': 'Geburtsdatum', 'en-GB': 'Date of birth' },
      schema: { type: 'string', format: 'date' },
    },
    {
      name: 'age_over_18',
      type: 'Boolean',
      label: { 'de-CH': 'Über 18', 'en-GB': 'Over 18' },
      schema: { type: 'boolean' },
    },
    {
      name: 'personal_administrative_number',
      type: 'Text',
      label: { 'de-CH': 'AHV-Nummer', 'en-GB': 'Social security number' },
      schema: { type: 'string' },
    },
  ],
};
