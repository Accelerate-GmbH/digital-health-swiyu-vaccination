# Positioning

## Two showcases, one hackathon

At the GovTech Hackathon 2026 the Swiss vaccination record was taken up twice,
from opposite ends.

**Project 28**, from openEHR Switzerland, is the "2026 Showcase Impf-Modul":
vaccination data arrives as FHIR in CH VACD format, is validated against
profiles and terminology and is persisted semantically as an openEHR
COMPOSITION in a clinical data repository, explicitly "not as a JSON blob". It
has since been picked up by a joint working group of openEHR Switzerland and HL7
Switzerland, whose stated aim is to turn it into a reusable, governable
implementation blueprint covering clinical models, terminology bindings, mapping
artefacts, demographic references, transformation logic and orchestration, with
FHIRconnect and openFHIR doing the bidirectional mapping and a FHIR façade over
the repository. It is offered as extensible to further clinical domains and to
the Swiss Health Data Space.

**This repository** takes the lineage of project 1103 from the 2024 hackathon
forward onto the swiyu Trust Infrastructure. It reuses the same clinical models
— the same archetypes, the same CH VACD element paths, the same terminology
bindings — and adds a credential exchange layer over them. A vaccination is
issued to the patient's wallet as an SD-JWT VC and stored there. It is presented
with selective disclosure after the holder confirms the request, and the relying
party evaluates the issuer signature, the credential status and the holder
binding.
This demonstrator operates no clinical data repository of its own.

The two projects address different layers of the same problem. Project 28
addresses healthcare semantics, information models and clinical persistence.
This repository addresses authenticity, provenance, controlled presentation and
trust relationships. They are composable, and the sections below set out both
where they compose and what this demonstrator does not provide on its own.

## What a credential exchange layer does not provide

A credential exchange layer does not substitute for a longitudinal clinical
record. The clearest statement of this comes from the openEHR side:

> A vaccination record must remain clinically usable throughout a person's
> lifetime and a document exchanged at a particular point in time is not the
> same as a longitudinal record maintained over decades.

This is correct, and it identifies the limits of what this demonstrator
provides. A credential is a signed statement about one event, made at one moment,
by one issuer. A lifetime of immunisations is a set of such statements, held
across a succession of devices, by issuers that may have merged, been dissolved
or rotated their keys. A clinical data repository answers "is this patient
protected against diphtheria?" as a query over a maintained record. A wallet
answers it from the credentials the holder has retained and chooses to present.

Three specific consequences follow, none of which this repository resolves:

1. **Series reconciliation.** F-02 acknowledges it: the prototype cannot reliably
   tell a third dose from a duplicate record of the second, because it has no
   view of the series, only of the credentials the holder chose to present.
2. **Correction and supersession.** F-06 acknowledges it: revoking a credential
   makes it unusable but does not notify the holder or place the corrected
   record beside it. In a CDR, a correction is a new version of a known object.
3. **Custody over decades.** Key rotation, device loss, inheritance, incapacity.
   The swiyu wallet has a recovery story; a forty-year one, across issuers who
   have ceased to exist, remains undemonstrated here.

In summary, the two layers have complementary strengths. A credential exchange
layer contributes per-request holder confirmation, selective disclosure,
issuer-signed provenance and an exchange model that does not require a central
store of the clinical payloads. A repository-based architecture contributes longitudinal
continuity, query over a maintained record, versioned correction and
reconciliation. Neither supplies what the other does.

## What the 2024 lineage already learned

The objection also arose inside the DIDAS project. Its own follow-on
repository records, in its learnings log, a pivot:

> Architecture changed from verifiable credentials as «source of truth» to
> referenced information to accommodate for other sources of health data (e.g.
> local Apple HealthKit / Android Health Connect, remote EHR).

That is the same conclusion reached from the wallet side, for a more practical
reason: health data has other homes and a wallet that insists on being the only
one does not survive contact with them. It was written before this repository
existed and it argues against the maximal form of the position this repository
takes.

The defensible claim is therefore a narrow one about where a credential is the
right instrument:

**A credential is the right carrier for a fact that a specific party attested at
a specific moment and that a patient needs to present to someone who has no
right to their whole record.** A vaccination at a border. Cover at a reception
desk. A prescription at a pharmacy counter. Each of these is a presentation, and
the wallet is the right instrument for a presentation.

For "what is this patient's immunisation status", the appropriate instrument is
a longitudinal record. A credential answers for one dose within it.

## The 2024 staging, where the two meet

Project 1103 published a three-stage transition and it remains the clearest
frame available:

1. **Document-oriented ("EPD 1.0").** The current Swiss EPR: reports as PDFs,
   which makes search and automated processing all but impossible.
2. **Structured, server-based ("EPD 2.0").** Structured, standardised clinical
   information on server technologies that are readily available today.
3. **Structured, wallet-based ("EPD 3.0").** The same standards, carried as
   verifiable credentials in the wallets of the E-ID trust infrastructure.

with the caveat, from the same document, that "there will certainly be extended
transition periods and overlaps between the above stages".

Project 28 demonstrates stage 2 and this repository demonstrates stage 3. The
staging is the 2024 project's own framing and is reproduced here as published;
this repository does not assert it as a target architecture for the Swiss health
sector. The section below sets out where the two compose.

## Where they compose

The models are the shared surface, which is why this repository reuses them:

- Every claim here carries its **CH VACD / CH EMED / CH Core FHIR element path**
  and its **openEHR archetype and CKM node name**, verified against the
  published archetypes (see [source verification](source-verification.md)).
- `projectToFhir` and `projectToOpenEhr` turn a presented credential into a
  CH VACD `Immunization` or a flat openEHR composition at the point of receipt.

Composition between the two approaches is therefore already specified, in both
directions:

**Repository → wallet.** A CDR holding a patient's immunisations can issue any
one of them as a credential, because the credential's claims are already
archetype-bound. The patient gains a presentable artefact; the CDR keeps the
longitudinal record. F-02 already models this exchange. It simply assumes the
issuer is a practice. Nothing in the flow depends on that.

**Wallet → repository.** A presented credential projects to a CH VACD
`Immunization` that a FHIR façade accepts and FHIRconnect maps to a COMPOSITION.
That is the same ingestion path project 28 already built. The credential then
serves as an issuer-signed statement of provenance for a record entry, whose
signature and status a receiving system can check. That is stronger provenance
than the repository would otherwise hold, because it carries the
issuer's own signature over the content, where a transport-level assertion about
who sent the data carries only the sender.

The unresolved question is a governance one: who governs the models when both
stages are live. That is the joint working group's remit and a good reason for
this repository's flows to be transferable to it.

## Divergences

Places where this repository knowingly differs from the sources it draws on:

| Topic | Source | Here | Why |
| --- | --- | --- | --- |
| Medication coding | Project 1103 used ATC (`A02BC01`) | GTIN | A pharmacy dispenses against a package; CH EMED carries both codings and step 2 should too |
| Insurance identity | Project 1103 keyed the insurance proof on AVS13 | AVS13 present but governed | `personal_administrative_number` is a protected field under swiyu Trust Protocol 2.0; asking for it needs an entitlement and the check-in flow does not ask |
| Signature format | Project 1103 used AnonCreds via VCMS, with SD-JWT planned | SD-JWT VC only | The Swiss Profile permits nothing else: ISO mdoc and W3C VCDM are NOT SUPPORTED |
| Persistence | Project 28 persists to a CDR | This demonstrator does not persist | Scope of this prototype; the projections exist so that a deployment can compose the two |
| Allergies | Project 1103's wallet carried allergies | Not implemented | Roadmap step 2 (IPS); the check-in flow requests cover only |

That last row is a functional gap against the project this repository set out to
implement and it is recorded as such in [the roadmap](roadmap.md).
