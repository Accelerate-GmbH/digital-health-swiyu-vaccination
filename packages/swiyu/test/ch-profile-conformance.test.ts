import { describe, expect, it } from 'vitest';

import { IMMUNIZATION, projectToFhir } from '../src/index.js';

/**
 * Structural conformance of `projectToFhir` output against the constraints
 * `ch-vacd-immunization` states.
 *
 * **This is not FHIR validation.** A validator run needs the `hl7.fhir.r4.core`
 * and CH IG packages from the FHIR package registry, which is unreachable from
 * the environment this repository is developed in, so no resource here has been
 * through one. See `docs/source-verification.md`.
 *
 * What this file does instead is pin the constraints that can be checked
 * without a validator, taken from the FSH source of
 * `hl7ch/ch-vacd` at version `7.0.0-ballot`
 * (`input/fsh/profiles/CHVACDImmunization.fsh`). The value of doing so is
 * narrow but real: if the projection stops emitting a required element, that
 * becomes a test failure rather than something a receiving system discovers.
 *
 * The distinction matters when reading the result. Passing here means the
 * projection carries the elements the profile requires. It does not mean a
 * resource is profile-conformant: cardinality on nested elements, terminology
 * binding strength, reference target types and the profile's parent chain
 * (`CHCoreImmunization` → `Immunization`) are all unchecked.
 */

/** A full disclosure, so that every element the profile can require is present. */
const FULL_DISCLOSURE = {
  patient_given_name: 'Anna',
  patient_family_name: 'Muster',
  patient_birth_date: '1988-09-12',
  vaccine_code: '871895005',
  vaccine_name: 'dTpa-IPV combination vaccine',
  occurrence_date: '2026-09-11',
  lot_number: 'S4021-B',
  route: 'IM',
  target_disease: ['76902006'],
  dose_number: 1,
  doses_in_series: 3,
} as const;

describe('ch-vacd-immunization · structural conformance', () => {
  it('carries the elements FHIR R4 Immunization requires', () => {
    const { resource } = projectToFhir(IMMUNIZATION, { ...FULL_DISCLOSURE });

    // Base R4 Immunization: status, vaccineCode and patient are all 1..1, and
    // occurrence[x] is a required choice. CHCoreImmunization, the parent of
    // ch-vacd-immunization, does not relax any of them.
    expect(resource.resourceType).toBe('Immunization');
    expect(resource.status).toBe('completed');
    expect(resource.vaccineCode).toBeDefined();
    expect(resource.patient).toBeDefined();
    expect(resource.occurrenceDateTime ?? resource.occurrenceString).toBeDefined();
  });

  it('satisfies ch-vacd-occurrence-1', () => {
    // Invariant on the profile, severity warning:
    //   "occurrence.exists() and (occurrence is string).not()"
    // An occurrenceString without an occurrenceDateTime breaks automated
    // processing, which is what the invariant exists to discourage.
    const { resource } = projectToFhir(IMMUNIZATION, { ...FULL_DISCLOSURE });
    expect(resource.occurrenceDateTime).toBe('2026-09-11');
    expect(resource.occurrenceString).toBeUndefined();
  });

  it('codes the vaccine against SNOMED CT', () => {
    const { resource } = projectToFhir(IMMUNIZATION, { ...FULL_DISCLOSURE });
    const coding = (resource.vaccineCode as { coding: { system: string; code: string }[] }).coding;
    expect(coding[0]?.system).toBe('http://snomed.info/sct');
    expect(coding[0]?.code).toBe('871895005');
  });

  it('assembles dose, series and target disease under protocolApplied', () => {
    const { resource } = projectToFhir(IMMUNIZATION, { ...FULL_DISCLOSURE });
    const applied = (resource.protocolApplied as Record<string, unknown>[])[0]!;
    expect(applied.doseNumberPositiveInt).toBe(1);
    expect(applied.seriesDosesPositiveInt).toBe(3);
    expect((applied.targetDisease as { coding: { system: string }[] }[])[0]?.coding[0]?.system).toBe(
      'http://snomed.info/sct',
    );
  });

  /**
   * A known and deliberate gap, pinned so that it stays visible.
   *
   * `ch-vacd-immunization` makes `CHVACDExtensionVerificationStatus` mandatory:
   *
   *   extension contains … CHVACDExtensionVerificationStatus named verificationStatus 1..1
   *
   * with the definition "Status of verification by a practitioner. Attention:
   * changes the interpretation of the content of the resource!". Its value set
   * offers SNOMED CT 59156000 "Confirmed by" and 76104008 "Not confirmed by",
   * and it exists so a practitioner can state whether they verified data
   * entered by a patient or a relative.
   *
   * The projection does not emit it, and adding it is not a one-line fix. Every
   * dose this project issues is issued by an authorised vaccinator, so
   * "confirmed" would be correct today and would silently become wrong the
   * moment a patient-recorded dose is supported, which roadmap step 2
   * contemplates. Asserting a verification status that the credential does not
   * carry would be inventing clinical meaning at projection time.
   *
   * So the projection omits it and this test records that, which means a
   * resource from `projectToFhir` is **not** conformant to
   * `ch-vacd-immunization` as it stands. `docs/ehealth-suisse-alignment.md`
   * says so in prose; this is the executable form. If the credential ever
   * carries a verification status, emit it and change this test.
   */
  it('does not yet emit the mandatory verificationStatus extension', () => {
    const { resource } = projectToFhir(IMMUNIZATION, { ...FULL_DISCLOSURE });
    const extensions = (resource.extension ?? []) as { url?: string }[];
    const verificationStatus = extensions.find((e) => e.url?.includes('verification-status'));
    expect(verificationStatus).toBeUndefined();
  });

  it('projects a partial disclosure without inventing required elements', () => {
    // The four claims a travel clinic is entitled to. status is supplied by the
    // projection because a credential only ever attests a dose that was given;
    // vaccineCode and patient are genuinely absent and stay absent.
    const { resource } = projectToFhir(IMMUNIZATION, {
      target_disease: ['76902006'],
      occurrence_date: '2026-09-11',
      dose_number: 1,
      doses_in_series: 3,
    });
    expect(resource.status).toBe('completed');
    expect(resource.occurrenceDateTime).toBe('2026-09-11');
    expect(resource.vaccineCode).toBeUndefined();
    expect((resource.patient as { display?: string }).display).toBeUndefined();
  });
});
