# Source verification

What in this repository was checked against a primary source, what rests on a
secondary source and what could not be verified here at all.

The project's claims fall into visibly different classes. "`nonce_endpoint` is
REQUIRED" was read out of the profile text. "The insurer issues the insurance
card under KVG/LAMal Art. 42a" is a legal statement that reads with the same
confidence and has no such backing behind it. Setting both in the same typeface,
in the same tables, without saying which is which, is itself a defect.

Verification date: 2026-09-11. A second pass on 2026-09-12 read the swiyu
specification text and the E-ID Act; both are recorded at the end of this
document, and they correct findings above.

## Legend

| Class | Meaning |
| --- | --- |
| **P** | Primary: the artefact itself was fetched and read in this environment |
| **S** | Secondary: the primary source is unreachable here, so the statement rests on search-result summaries and cross-references |
| **U** | Unverified: asserted in the repository. No source available here could confirm it |
| **R** | Reported: read against the primary source outside this environment and reported into the repository. Not re-checkable here, and not this environment's own reading |

## P · Verified against the primary artefact

### swiyu Swiss Profiles 1.0

The four profiles (`anchor`, `issuance`, `verification`, `vc`) were cloned from
the public specification repository and re-cloned a second time to rule out a
stale working copy; both clones resolved to the same commit, `91f09f1`.

A checking script compared every pinned value in
`packages/swiyu/src/profile.ts` and every rule row in
[`spec-conformance.md`](spec-conformance.md) against the profile text:

| Checked | Result |
| --- | --- |
| Profile version strings, spec version pins | 65 items compared |
| Cryptography (ES256, P-256, ECDH-ES, sha-256) | match |
| JOSE `typ` values, wallet deeplink scheme | match |
| Numeric limits (batch size, field lengths, status list bits) | match |
| Token status types and protected claim names | match |
| Sandbox hostnames and trust-anchor DIDs | match |
| 17 rules stated as "NOT SUPPORTED" or "MUST" | match |
| **Mismatches** | **0** |

Two limits differ between layers and the stricter one is enforced: the verifier
management API accepts a `purpose_name` up to 50 characters, while a vqPS
`purpose_name` MUST NOT exceed 40, and this project enforces 40. The 40 was
attributed to the Trust Registry until the 2026-09-12 pass read it in Trust
Protocol 2.0.

### openEHR archetypes

Every archetype identifier and node name used in a claim binding was checked
against the published ADL in the openEHR Clinical Knowledge Manager mirror
(`github.com/openEHR/CKM-mirror`), cloned and read here. The pinned list lives
in `packages/swiyu/test/semantics.test.ts`, so a typo now fails the test run.

| Archetype | Nodes bound | Exists in CKM |
| --- | --- | --- |
| `openEHR-EHR-ACTION.medication.v1` | Medication item, Medication management, Route | yes |
| `openEHR-EHR-CLUSTER.medication.v2` | Batch ID, Name | yes |
| `openEHR-EHR-INSTRUCTION.medication_order.v3` | Medication item, Overall directions description, Dispense amount | yes |
| `openEHR-EHR-OBSERVATION.laboratory_test_result.v1` | Test name, Conclusion | yes |
| `openEHR-EHR-CLUSTER.laboratory_test_analyte.v1` | Analyte name, Analyte result, Reference range guidance | yes |
| `openEHR-EHR-CLUSTER.specimen.v1` | Collection date/time | yes |

This check found and corrected six wrong bindings. `lot_number` had been bound
to a `batch_id` node directly on `ACTION.medication.v1`, which has no such node
Batch ID lives in `CLUSTER.medication.v2`, slotted into the action's
"Medication details". The dosage instruction had been bound to a
"Dose description" node that `INSTRUCTION.medication_order.v3` does not define
(the free-text node is "Overall directions description"), the dispense quantity
to an "Amount" node it does not define either ("Dispense amount") and the three
laboratory analyte claims to an `analyte_result` group that belongs to
`CLUSTER.laboratory_test_analyte.v1`, one level down from the observation entry.

All six were plausible-looking and all six were wrong. A flat path is
template-specific and this project publishes no operational template, so a flat
path on its own is unfalsifiable, which is why the bindings now carry the
archetype and the CKM node name as well and why the test pins them.

The `templateId` values (`DIDAS.immunisation.v0` and siblings) are local names
for templates this project has not modelled. They are not CKM templates and are
not claimed to be. See [the roadmap](roadmap.md).

### GovTech Hackathon 2024 · project 1103

The project page itself is unreachable from this environment, but the team's own
repositories are public on GitHub and were cloned and read in full:

- `Abdagon/hackathon-2024-ssi-health`: the challenge text, the project
  documentation, the team and `health-ssi-schema.md`, the logical schema.
- `Abdagon/health-ssi-2`: the follow-on architecture and the learnings log.
- `needToRoll/govTechHack24-ssi-health`: the implementation, including the
  credential payloads the wallet actually carried.
- `janesp/health-ssi`, `SSI-Solutions/vcms`: the origin repository and the
  credential management system used at the hackathon.

Confirmed from these primary artefacts:

| Statement | Source |
| --- | --- |
| Challenge owner Peter Janes, DIDAS Health working group lead | `Pitch-DIDAS-GovTech24.md` |
| Won the future-oriented category, GovTech Hackathon 2024 | same, with the award photographs |
| Patient "John Miller", Dr. Charles Brewster, «Universal Pharmacy» | same |
| QR check-in triggering a proof request for insurance and health information | same |
| Wallet held allergies and medication alongside the insurance card | same |
| Credential schemas derived from FHIR subsets | `health-ssi-schema.md` |
| Insurance proof modelled on `ch-core-patient`, keyed by AVS13 | same |
| Practitioner identified by GLN | same |
| SD-JWT chosen as the signature format | `health-ssi-2/README.md` |

Two findings from these repositories changed this project's content:

1. **The 2024 payloads coded medication with ATC** (`A02BC01` omeprazole,
   `N02BE01` paracetamol). This repository's prescription credential codes with
   GTIN, which is what a Swiss pharmacy dispenses against and CH EMED carries
   both. The divergence is deliberate and had gone unstated; it is now noted in
   [`positioning.md`](positioning.md).
2. **The 2024 lineage's own learnings log records a pivot** away from treating
   verifiable credentials as the source of truth, toward referenced information,
   to accommodate other data sources. That is the same objection the openEHR
   showcase raises from the other direction and it is discussed in
   [`positioning.md`](positioning.md).

The 2024 project's transition staging is quoted from
`Pitch-DIDAS-GovTech24.md`.

### GovTech Hackathon 2026 · event framing

`github.com/swiss/govtech-hackathon-2026` was cloned and read: the hackathon ran
28 to 29 May 2026 at the FOITT in Zollikofen, organised by the DTI division of the
Federal Chancellery with BFH, with challenges published on
`govtech.digisus-lab.ch/event/2`.

## S · The swiyu Trust Protocol staging

The Sandbox and production differences in
[`onboarding-sandbox.md`](onboarding-sandbox.md#from-the-sandbox-to-production)
come from two places, neither of them a published specification page.

| Statement | Where it comes from |
| --- | --- |
| The onboarding steps that are optional in the test environment: payment at both registers, the QES-signed formal declaration, the official verification | Slide 28 of the deck below, where those boxes are dashed and the legend reads "optional in the test environment" |
| Protected Issuance Trust List and Auth Trust Statements currently cover AN1 and AN2 | Slide 30 of the same deck, footnote |
| Protected Verification Auth Trust Statements currently cover the AHV number only | Slide 30 of the same deck, footnote. Consistent with the protected-field rule this project already enforces against `swiss-profile-trust:1.0` |
| AN1 is the e-ID. AN2 is other authoritative public issuer credentials from federal, cantonal or municipal authorities. AN3 is the open ecosystem where private organisations issue on the same infrastructure | Supplied by the project lead. The paper that defines them, *Zielbild E-ID*, is named below but could not be read from here |
| The ambition levels originate in the Federal Office of Justice discussion paper *Zielbild E-ID*, September 2021, chapter 4.2 | `bj.admin.ch` and the `digitale-gesellschaft.ch` mirror are both blocked at the egress gateway. The chapter reference is quoted in the consultation report and in contemporaneous coverage, corroborated across more than one search summary |
| Consultation respondents held that an ambition level 3 trust infrastructure was the one required. The Federal Council's direction-setting decision of 17 December 2021 opened the infrastructure beyond the e-ID to cantonal authorities and private entities | Same. `eid.admin.ch` carries the decision announcement and is also blocked here |

The deck is `Retail_eCommerce_..._Moderation_V04`, by Vasily Suvorov, shown at
the retail roundtable on 1 July 2026.

One inference is this repository's own, marked as such in the runbook: that a
practice, a pharmacy and an insurer are private organisations and therefore sit
in AN3. It follows from the AN3 definition above rather than from any statement
about health specifically.

The deck also uses a second vocabulary for the trust artefacts: Identity Trust
Statement, Verification Query Public Statement, Protected Verification Auth TS,
Protected Issuance TLS and Auth TS, Non-Compliance Trust List Statement. This
repository uses the trust marker names of Trust Protocol 2.0 alongside them.

**Settled on 2026-09-12, see the last section.** There is no second vocabulary.
Those are the specification's own names for its six statement types — idTS,
vqPS, pvaTS, piaTS, piTLS, ncTLS — and the trust markers are a different thing
from the statements, not another name for them: a marker is what an actor
resolves a statement into. `trust-protocol-v2-0.md` was read directly. It is
reachable from here after all, over `raw.githubusercontent.com`, even though the
rendered site and `api.github.com` are both blocked at the egress gateway.

The host separation, the Beta-ID attribute set and the two trust policies are
**not** in this class. They are read from `profile.ts`, from CD-001 and from
`governance.ts` in this repository.

## S · Secondary sources only

Every one of the following hosts answers 403 at this environment's egress
gateway, for direct fetch and for archive and text-extraction proxies alike:
`hack.opendata.ch`, `govtech.digisus-lab.ch`, `openehr.atlassian.net`,
`confluence.didas.ch`, `wiki.openehr.org`, `discourse.openehr.org`,
`openehr.org`, `specifications.openehr.org`, `fhir.ch`, `build.fhir.org`,
`i14y.admin.ch`, `www.bk.admin.ch`, `web.archive.org`, `archive.org`,
`eventornado.com`, `r.jina.ai`. Anonymous GitHub cloning and web search are the
only channels that work. `OpendataCH/hackopendata-archive` was cloned on the
chance that it mirrored the project pages; it does not contain project 1103.

So the following are recorded as reported by search-result summaries and
corroborated across more than one of them:

| Statement | Primary source, unreachable |
| --- | --- |
| GovTech Hackathon 2026 project 28 is the openEHR Switzerland "2026 Showcase Impf-Modul" | `govtech.digisus-lab.ch/project/28`. **Superseded 2026-09-13**: verified against openEHR Switzerland's own project page and meeting notes, see **R** below |
| Its data flow is FHIR intake in CH VACD format → validation → persistence as an openEHR COMPOSITION in a clinical data repository, "not as a JSON blob" | `openehr.atlassian.net/.../3468427363` |
| openEHR Switzerland and HL7 Switzerland have formed a joint working group to turn that showcase into a reusable implementation blueprint | `openehr.org/from-proof-of-concept-to-a-reusable-blueprint/` |
| Its scope: clinical models, terminology bindings, mapping artefacts, demographic references, transformation logic, orchestration, architectural patterns | same |
| Its architecture: FHIR façade, orchestration and transformation services, an openEHR CDR and a FHIR-based demographic server, with FHIRconnect/openFHIR for bidirectional mapping | same |
| It is positioned as extensible to further clinical domains and to SwissHDS | same |
| CH VACD is legally mandated for use within the Swiss EPR | `fhir.ch/ig/ch-vacd/` |
| The 2026-09-08 Joint Working Group plenum | `openehr.atlassian.net/.../3996811327` |

The plenum page in particular returned nothing in search beyond its existence.
Nothing in this repository depends on its content; where the Joint Working Group
is referenced, it is on the strength of the published blueprint announcement.

FHIRconnect and openFHIR themselves are better attested. The specification is
on GitHub (`openFHIR/openfhir`) and described in arXiv:2511.14618. But this
repository does not implement them, so they are cited as context only.

The IPS section codes used in [the roadmap](roadmap.md) (Allergies 48765-2,
Medications 10160-0, Problems 11450-4, Procedures 47519-4, Immunizations
11369-6, Results 30954-2, Devices 46264-8) were read from `deak-ai/healthwallet-ips`,
the DIDAS lineage's own open-source IPS wallet and are primary to that
repository but secondary to the IPS specification, which is unreachable here.

## U · Asserted and unverified here

These are the statements to have a lawyer read before this material is reused.
They are stated in the repository as though settled; they are not and no source
available in this environment could confirm them.

| Assertion | Where it appears |
| --- | --- |
| A laboratory's authorisation deriving from the KVG analysis list | `governance-framework.md`, `lab-report.ts` |

The four statutory citations that stood here until 2026-09-13 have moved to
**R** below. They were read against Fedlex outside this environment and the
reading changed two of them.

The same caution applies to the healthcare retention periods used in the
governance policies and to the claim that a practice may retain what it
verified at check-in. These are modelled as policy and the policy is
configurable and the citations are the project's own reading.

Two further categories are unverified for a different reason. No source could
settle them, because they are about this code:

- **Nothing here has run against the live swiyu Sandbox.** Every conformance
  rule is enforced against the profile text. No server has accepted or rejected
  one of these requests. The onboarding script was verified against the real DID
  Toolbox, which found three real bugs; the issuance and verification paths have
  not had the equivalent.
- **Illustrative codes are illustrative.** SNOMED CT vaccine codes, GLNs, BAG
  numbers, GTINs and LOINC codes in demo data are plausible and are not real. A
  deployment must take them from the terminology server. The schemas constrain
  their shape and can say nothing about their truth.

## P · 2026-09-13 · two defects the missing validator would have caught

Checking `projectToFhir` against the constraints of `ch-vacd-immunization`,
rather than against the description of them, found two structural errors. Both
are now fixed and pinned by tests.

**`birthDate` was being set on a `Reference`.** FHIR's `Reference` has
`reference`, `type`, `identifier` and `display` and no `birthDate`, so a
disclosed date of birth was being written to an element that does not exist,
on `Immunization.patient` and again on `Coverage.beneficiary`. CH VACD allows
`contained 0..1` for exactly this case — its own short description is
"Immunization inline resource" — so the date now goes on a contained `Patient`
and the reference resolves to it.

**An undisclosed name was rendered as `display: "unknown"`.** FHIR requires a
subject on these resources, so the element has to exist, and the previous code
filled it with the literal string "unknown". That reads as a patient whose name
is not known, when what happened is that the holder chose not to release it —
the opposite of what this project claims about selective disclosure, asserted in
a clinical resource. The absence now carries the `data-absent-reason` extension
with `masked`, "information is not available due to security, privacy or related
reasons". The projection for `Coverage` already handled this correctly, with a
comment reading "An empty element would claim the holder released a name they
did not"; the `Immunization` path did not.

Neither defect was reachable by reading the code against the prose. Both came
out of comparing the output with the profile's FSH source.

**What still has not happened is validation.** `packages.fhir.org`,
`packages2.fhir.org` and `packages.simplifier.net` are blocked at this
environment's egress gateway and GitHub release downloads answer 403, so the
HL7 validator and the `hl7.fhir.r4.core` package cannot be obtained here.
`packages/swiyu/test/ch-profile-conformance.test.ts` checks what can be checked
without them and says so in its own header. One known non-conformance is
recorded there and in
[`ehealth-suisse-alignment.md`](ehealth-suisse-alignment.md): the mandatory
`CHVACDExtensionVerificationStatus` is not emitted, deliberately.

## S · 2026-09-13 · the coverage survey, corroborated

The epidemiological description in [`public-health.md`](public-health.md) was
checked as far as the blocked hosts allow. The coordinating institute, the
sampled age groups of 2, 8 and 16, the three-year cycle and the involvement of
the Federal Office of Public Health and all 26 cantons are corroborated across
independent secondary sources, which moves them from **U** to **S**. The survey
also appears under the name *Kantonales Durchimpfungsmonitoring Schweiz*.

One figure does not agree and is now flagged in that file: this repository says
the survey has run since 1999, while secondary sources describe the three-year
cycle as running since 2005. Both can be true of different things, and neither
was confirmed here.

## R · 2026-09-13 · the legal citations, read against Fedlex

The four statutory citations were read against the current Fedlex texts. The
reading was done outside this environment and reported into the repository, so
it carries the **R** class: `fedlex.admin.ch` answers nothing through this
environment's egress gateway, and none of it was re-checked here.

| Citation | Status | What the reading added |
| --- | --- | --- |
| **KVG/LAMal Art. 42a** | verified | Art. 42a is the statutory basis for the compulsory-health-insurance card, and the Versichertenkarte ordinance defines the insurer's issuance obligation. It does not by itself establish a legal basis for every attribute or processing operation modelled in the credential |
| **OR Art. 958f** | verified, with a scope qualification | Ten years applies to the business books and accounting records within the article's scope. Whether particular credential-derived information forms part of such a record depends on the processing purpose and the record concerned |
| **MedBG/LPMéd** | citation requires refinement | MedBG governs qualification, registration and authorisation for the university medical professions. Prescribing and dispensing of medicinal products are governed more directly by therapeutic-products law, HMG/LPTh, and by cantonal law. The authority to prescribe follows from those together, and the authorisation model should be verified for the intended issuer population |
| **EpG/LEp** | partially verified | The Epidemics Act and Ordinance establish the federal and cantonal vaccination framework. Whether an individual professional or organisation may administer vaccinations depends additionally on professional law, therapeutic-products law and cantonal law. The single-line citation is incomplete rather than wrong |

The two that required work are corrected at source rather than in a note:
`prescription.ts` and `immunization.ts` now name the further bodies of law, and
the governance framework, the generated credential pages and the glossary follow
from them.

**Deployment-specific legal conclusions still require qualified legal review.**
That sentence is unchanged by this reading and is the reason every `issuerBasis`
string still ends with it. A citation being correct is a different question from
a deployment being lawful.

## R · 2026-09-13 · the coverage survey, against BAG and EBPI primary sources

Read against Federal Office of Public Health and University of Zurich EBPI
primary sources, including the FOPH's 2020 to 2022 coverage report. These facts
move from **S** to verified:

- The Institute of Epidemiology, Biostatistics and Prevention at the University
  of Zurich coordinates the survey, on behalf of the FOPH and together with the
  cantons
- Nationwide collection has run **since 1999**
- The monitored age groups are **2, 8 and 16**
- Children are selected at random from population registers or by an equivalent
  sampling methodology
- Families are invited **by letter** and asked to provide the vaccination
  record, as a copy, the original or a secure electronic upload
- The survey runs in multi-year cycles, and all 26 cantons took part in the
  2020 to 2022 round

This settles the figure flagged in **S** above: the 1999 date belongs to the
nationwide collection, and the 2005 date the secondary sources give belongs to
the three-year cycle, which is a different statement.

**Three claims in this repository are not covered by that reading** and should
be sourced individually before anyone relies on them:

| Claim | Where |
| --- | --- |
| "Up to three contact attempts" | [`public-health.md`](public-health.md), [`F-11`](../flows/F-11-coverage-survey.md) |
| Per-canton operational workflow | [`F-11`](../flows/F-11-coverage-survey.md) |
| That the sampling frame already carries the age and the canton, which is what lets the flow ask for no identifying claim | [`roadmap.md`](roadmap.md), [`F-11`](../flows/F-11-coverage-survey.md) |

The third is the one that matters, because the privacy argument for F-11 rests
on it. A register-drawn sample plainly knows who it drew, and what the survey
operator holds at the point of invitation is a different question that the
sources above do not answer.

## R · 2026-09-13 · GovTech Hackathon 2026, project 28

Verified in the same reading, against openEHR Switzerland's own material rather
than the hackathon site. Its project page for the *2026 Showcase Impf-Modul*
records the hackathon preparation and the event on **28 and 29 May 2026**,
including the *Challenge Impfen*, and its meeting notes of 19 May link that
challenge to `govtech.digisus-lab.ch/project/28` alongside the implementation
repositories. The subsequent openEHR Switzerland and HL7 Switzerland
communication describes the resulting architecture as a FHIR façade,
transformation services, an openEHR clinical data repository and FHIR-based
person-data services, with immunisation based on CH VACD.

This removes the dependency recorded in **S** above, where the attribution
rested on the hackathon page this environment cannot reach.

## R · 2026-09-13 · what the FHIR and openEHR mappings do and do not establish

The referenced FHIR profiles, identifiers and elements, and the openEHR
archetypes and node references, were checked against their published source
artefacts. They are correct as semantic references.

That is one of four separate questions and the other three are open:

| Question | Status |
| --- | --- |
| **Reference correctness.** Do the cited FHIR profiles, elements and identifier systems, and the openEHR archetypes and node references, exist and resolve as cited? | **Verified** against CH VACD, CH Core and the CKM artefacts |
| **FHIR profile conformance.** Does a generated resource satisfy the profile's cardinalities, invariants, slicing, terminology bindings, references, extension rules and required elements? | **Not established.** That needs the HL7 validator with the Swiss implementation-guide packages loaded, and neither the packages nor the validator can be obtained here |
| **openEHR template conformance.** Is a generated composition valid against a published operational template? | **Not established.** A plausible flat path into an archetype does not demonstrate it. The openEHR REST specification separates parseability from template validation and gives 422 for content that parses and does not validate |
| **Endorsement.** Has any standards body endorsed this work? | **Not claimed.** No endorsement by HL7 Switzerland, eHealth Suisse, openEHR International or openEHR Switzerland |

Reference correctness, instance conformance and endorsement are three different
things, and conformance splits again between FHIR and openEHR because the
machinery that would establish each is different. The sections above keep them
apart deliberately.

## P · 2026-09-13 · generic components and the CH implementation guides

Two classes of statement that earlier passes could not reach were checked.

**The swiyu generic components.** The `swiyu-issuer` and `swiyu-verifier`
repository READMEs are readable over `raw.githubusercontent.com`, and the
onboarding cookbooks were already fetched. The management API paths in
[`integration-guide.md`](integration-guide.md) match the cookbooks exactly:
`POST /management/api/status-list`, `POST /management/api/credentials`,
`PATCH /management/api/credentials/{id}/status?credentialStatus=…`,
`POST /management/api/verifications`, `GET /management/api/verifications/{id}`.
The `swiyu-verifier` README shows `POST /management/verifications` without the
`api` segment; the cookbook, this repository's client and the guide all use the
longer form, and the discrepancy is now noted in the guide rather than silently
resolved.

Corrected as a result: the claim that 100'000 entries is "the registry's
ceiling" for a status list. The cookbook documents a 200 kB maximum file size,
"subject to evaluation and might change for go-live", and uses 100'000 as an
example value; the figure this project works to is derived from the size limit,
which the guide now says. Status list immutability after initialisation is
recorded as an assumption, being stated in no source reachable here. The claim
that the verifier's management API accepts a 50-character `purpose_name` is
marked as this project's observation for the same reason.

Confirmed and left alone: the error-code table, every entry of which appears in
the verifier's `VerificationErrorResponseCode`; `credential_refresh_disabled`,
which `swiss-profile-issuance` defines as an OPTIONAL boolean; and that
`status_lists` takes the `statusRegistryUrl`.

**The CH implementation guides.** `hl7ch/ch-vacd` clones from this environment.
Every claim in [`ehealth-suisse-alignment.md`](ehealth-suisse-alignment.md) was
checked against the FSH source at version `7.0.0-ballot` and matched, including
the three extensions the document repurposes:

| Claim | In the IG |
| --- | --- |
| `ch-vacd-immunization` | `Profile: CHVACDImmunization`, `Id: ch-vacd-immunization` |
| `relatesTo` identifies the replaced or corrected entry | `EntryResourceCrossReferences named relatesTo 0..1`, definition quoted verbatim |
| `conflict` is an indicator for merging conflicts | `CHVACDExtensionMergingConflictEntryReference named conflict 0..*`, definition "Indicator for merging conflicts." |
| `verificationStatus` is mandatory 1..1 and changes interpretation | `CHVACDExtensionVerificationStatus named verificationStatus 1..1`, definition "Status of verification by a practitioner. Attention: changes the interpretation of the content of the resource!" |
| Travel indication SNOMED CT `129018004` "Traveling" | `CHVACDTravelInformation`, `* code = $sct#129018004` |

**Still unverified: the epidemiology.** `bag.admin.ch`, `ebpi.uzh.ch` and the
literature databases are blocked here, so the survey description in
[`public-health.md`](public-health.md) — start year, coordinating institute,
sampled age groups, cycle length, contact procedure — rests on what was supplied
to the project. That file now carries a sourcing note saying so, and its section
heading no longer states the conclusion as fact.

## 2026-09-12 · the specifications are readable, and a wording pass

**One reachability finding above is wrong and is corrected here.** The four Swiss
Profiles were genuinely read on 2026-09-11, as the P section says.
`trust-protocol-v2-0.md` was recorded as unreachable, and the mapping question
was left open on that basis. It is reachable. The rendered site
`swiyu-admin-ch.github.io` is blocked at this environment's egress gateway and so
is `api.github.com`, but the markdown the site is built from is served by
`raw.githubusercontent.com`, which is not:

```
https://raw.githubusercontent.com/swiyu-admin-ch/swiyu-admin-ch.github.io/main/_specifications/<file>.md
https://raw.githubusercontent.com/swiyu-admin-ch/swiyu-admin-ch.github.io/main/_cookbooks/<file>.md
```

Eight documents were fetched this way: the four Swiss Profiles again,
`trust-protocol-v2-0`, and the trust-protocol-2-0, generic-verifier and
base-and-trust-registry cookbooks. Two channels had failed and the conclusion
drawn was that every channel had.

What the primary text settles that was open before:

| Question | Answer from the specification |
| --- | --- |
| Where the artefact sits in Trust Protocol 2.0 | `trust-protocol-v2-0`, Statement types: the vqPS is one of six statement types, alongside idTS, pvaTS, piaTS, piTLS and ncTLS, and it is the statement behind the Transparent Verification Trust Marker |
| Whether the deck's vocabulary maps to the specification's | It is the specification's vocabulary. "Verification Query Public Statement" is the specification's own term, not the deck's |
| Whether publishing is a duty | The verifier **MUST** provide the relevant vqPS to the wallet and **MUST** link its `scope` claim from the request, for a verification that carries the tvTM. The wallet **MAY** decline a counterparty without that marker |
| What the tvTM actually claims | The *type* of verification is public for third-party review. The specification says explicitly that the individual verification, what was requested and what was exposed, is not |
| Where the 40-character `purpose_name` limit comes from | The protocol, not the registry: the vqPS table says `purpose_name` **MUST NOT** contain more than 40 characters, and `purpose_description` no more than 1000 |

The rule wording that had drifted into paraphrase is now quoted with the profile
and the section that states it. A paraphrase of a MUST reads like the MUST and
cannot be checked against anything.

| Was | Is | Why |
| --- | --- | --- |
| "The Swiss Profile forbids non-disclosable business claims outright" | §3.2.2.4 as written: an SD-JWT VC **MUST** only have selectively disclosable claims apart from the registered JWT claims of §3.2.2.2, and others **MUST NOT** be supported and **MUST** be rejected | The paraphrase lost the §3.2.2.2 exception entirely |
| "each verifier **publishes what it asks for**" | the specification's sentence: the vqPS is "provided by verifiers to provide public transparency on their intended verification scope" | The old phrasing was this repository's, and it overstated: the transaction is not published, the query shape is |
| "a four-claim presentation of an eighteen-claim credential" | no count | Copied into five pages; the counts are 5, 18, 11, 10 and 10 |
| "Self-determination and data minimisation are governing principles of the Swiss ecosystem" | removed | No source read here states it in those terms. Minimisation is already principle 1 of the [governance framework](governance-framework.md) as something this project enforces, which is a claim about this project and is checkable |

One thing checked and found correct: `scripts/vqps.ts` submits `sub`,
`purpose_name`, `purpose_description`, `scope` and `query` flat, while the signed
statement in `trust-protocol-v2-0` nests `scope` and `query` inside a `request`
object and flattens the localised maps into `purpose_name#<lang>` claims. That
is not a divergence. The submission body is what the base-and-trust-registry
cookbook documents for `POST /api/v1/trust/vqps-submissions`; the registry signs
and publishes, and it is the registry that produces the statement shape.

Every string constant in `packages/swiyu/src/profile.ts` was then checked against
the fetched text mechanically rather than by eye: 33 literals, 32 of them present
verbatim in the specification corpus. The one that is not,
`https://status-reg-api.trust-infra.swiyu-int.admin.ch`, is documented in the
generic-issuer cookbook as `SWIYU_STATUS_REGISTRPY_API_URL` (the typo is the
cookbook's), which was fetched to confirm it. No mismatches.

Still not established here: nothing in this repository has run against the live
Sandbox, which the section above already says and this pass does not change.

## P · 2026-09-12 · the E-ID Act, read

`fedlex.admin.ch` is blocked at this environment's egress gateway for both
`www.fedlex.admin.ch` and `fedlex.data.admin.ch`, and so are `bj.admin.ch`,
`eid.admin.ch` and `de.wikipedia.org`. The project lead supplied the Federal
Gazette text directly: *Bundesgesetz über den elektronischen Identitätsnachweis
und andere elektronische Nachweise (E-ID-Gesetz, BGEID)* of 20 December 2024,
BBl 2025 20, referendum deadline 19 April 2025. It was read in full.

**What the Act covers.** Art. 1 para. 1: the federal trust infrastructure, the
roles and responsibilities in providing and using it, and the EID together with
other electronic credentials. It is not a health-data statute and decides
nothing about what a health verifier may request.

| Statement | Where in the Act |
| --- | --- |
| Privacy by design and by default, data security, *Datensparsamkeit*, decentralised storage, traceability and reusability, state control | Art. 1 para. 2 let. a, as principles the technical and organisational measures must implement |
| The holder must be able to determine which parts of a credential, and which information derived from them, reach the verifier | Art. 10 para. 1 |
| Presentation and verification happen without the issuer's knowledge | Art. 10 para. 2 |
| A verifier may request the EID's personal data only where legislation provides for the identity check, or where it is strictly necessary for the reliability of the transaction; a breach is recorded in the Trust Registry visible to the holder during a transaction, and can mean exclusion from the register | Art. 23, **for the EID only** |
| The EID's content: official name, given names, date of birth, sex, place of origin, place of birth, nationality, facial image, AHV number, plus credential metadata and optional additions | Art. 15 paras. 1 to 3 |

**One claim this corrected.** Five places said the Beta-ID "carries the Art. 15
BGEID attribute set" and that the e-ID would replace it "with the same
attributes". It does not. The Beta-ID carries four of the nine items in Art. 15
para. 1 — surname, given names, date of birth, AHV number — and none of sex,
place of origin, place of birth, nationality or facial image. It also carries
`age_over_18`, which Art. 15 does not list at all: that is derived information of
the kind Art. 10 para. 1 contemplates. The flows here use only claims in the
subset, so they do keep their shape at go-live, but that is a narrower statement
than the one that was being made, and a flow needing nationality or a facial
image has nothing to test against today.

**What the Act does not settle**, and what the earlier removal of "self-
determination and data minimisation are governing principles of the Swiss
ecosystem" was right to be cautious about: those principles are stated by this
Act, for this infrastructure and this credential. Extending them to a health
credential issued by a private practice is an argument, not a citation. The
[governance framework](governance-framework.md#what-the-e-id-act-does-and-does-not-decide)
now makes the argument explicitly and marks where it stops.

The legal statements in the **U** section above are a different matter: they are
other statutes and none of them was read here. Reading the E-ID Act moves
nothing in that list. Four of the five were later read against Fedlex outside
this environment and are recorded under **R**; the KVG analysis list was not.
