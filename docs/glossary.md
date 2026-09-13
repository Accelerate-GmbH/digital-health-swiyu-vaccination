# Glossary

This glossary covers the Swiss administrative, verifiable-credential and
clinical-informatics vocabulary needed to read the rest of the repository.

**How to read the entries.** Where a term is defined by the swiyu programme or a
specification, the entry gives that meaning first. Where this demonstrator makes
a choice, applies a narrower reading or adds something of its own, that is marked
*In this demonstrator* and is not part of the official definition. The
authoritative sources are the [swiyu
specifications](https://swiyu-admin-ch.github.io/specifications/) and the
[DIDAS glossary](https://github.com/DIDAS-swiss/didas-glossary); where this file
and those differ, they are correct.

## The trust infrastructure

**swiyu.** The Swiss Trust Infrastructure, operated by FOITT, on which the e-ID
is built. It is the infrastructure, not the credential.

**Sandbox.** The test environment, renamed from "Public Beta" by change dossier
CD-001 and separated from production. Hosts carry `swiyu-int`. It requires its
own wallet; the production swiyu Wallet does not accept Sandbox credentials.

**Base Registry.** Publishes DID documents and status lists. Under
`swiss-profile-vc:1.0.0` §12.1 the Status Provider MUST be the registry provided
by FOITT, so that it is a different party from the issuer.
*In this demonstrator:* the Base Registry and the Trust Registry are the shared
components this project depends on. The status lists it publishes carry status
bits and no patient data.

**Trust Registry.** Publishes trust statements about actors under Trust Protocol
2.0: identity trust statements, authorisation statements and the Verification
Query Public Statements that verifiers publish about the queries they send.

**Generic issuer / verifier.** `swiyu-issuer` and `swiyu-verifier`, the
Confederation's reference implementations. Each actor runs its own instance.
They implement the protocol, so business applications do not have to.
*In this demonstrator:* the four actors each run one, and the application code
addresses them through their management APIs only.

**Beta-ID.** The Sandbox stand-in for the e-ID, carrying four of the nine items
of EID content listed in Art. 15 para. 1 BGEID - surname, given names, date of
birth, AHV number - plus a derived `age_over_18`. Free from the Beta Credential
Service. Self-declared data.

**Swiss Profile.** The Confederation's narrowing of the international
specifications. Four of them: `anchor` (identifiers), `issuance`, `verification`,
`vc` (credential format). Version 1.0 throughout this project.

**Change dossier (CD).** A published breaking or notable change to the
infrastructure. CD-001 separated Sandbox from production; CD-006 introduced
Trust Protocol 2.0.

## Credentials

**Verifiable credential (VC).** A set of claims, signed by an issuer, held by
the subject, presentable to a verifier without contacting the issuer.

**Issuer / holder / verifier.** Who asserts, who keeps, who asks. The three
roles of the model. A practice is an issuer of prescriptions and a verifier of
insurance cards.

**SD-JWT VC.** The credential format. Each claim is individually disclosable, so
a holder can answer a verifier's request with a subset of the credential's claims
and leave the values of the rest undisclosed.

**`vct`.** Verifiable credential type. Identifies what a credential *is*. This
project uses stable URNs (`urn:vct:ch.didas.health.immunization:1.0`) so issued
credentials keep their meaning when a deployment moves host.

**Selective disclosure.** Releasing some claims and not others. Not redaction
after the fact: undisclosed claims are never transmitted.

**Key binding.** Proof that the wallet presenting a credential holds the key it
was issued to. Without it a credential is a bearer token.

**Status list / Token Status List.** A published list with one entry per
credential, saying whether it is still valid. A credential carries the index
that finds its own entry. The entry is two bits wide, which is what supports
both revocation and suspension. The list carries nothing else: no patient, no
medication, no verifier and no cryptographic keys. Those live in the DID
documents, which the Base Registry publishes separately.

**`exp` vs `expiry_date`.** `exp` is absolute: past it a credential cannot be
presented. `expiry_date` is a business fact that warns the holder and leaves the
decision to the verifier. An expired e-ID is still adequate proof of being over
18; collapsing the two removes that judgement.

## Protocols

**OpenID4VCI.** How a credential gets into a wallet. This project uses only the
pre-authorized code flow: a QR code carries the offer.

**OpenID4VP.** How a wallet presents a credential to a verifier.

**DCQL.** The query language a verifier uses to say which credential and which
claims it wants. The list in a DCQL query *is* the minimisation decision.

**JAR.** JWT-Secured Authorization Request. The verifier signs its request, so
a wallet can tell who is asking before showing a consent screen.

**DPoP.** Proves that the party using an access token is the party it was
issued to.
Mandatory throughout issuance in the Swiss Profile.

**`direct_post.jwt`.** The response mode the profile requires: the presentation
is always encrypted.

## Identity and trust

**DID.** A decentralised identifier. An actor's public identity, resolvable to
its keys without a certificate authority.

**`did:webvh`.** The DID method the Swiss Profile requires. Formerly spelled
`did:tdw`; CD-001 requires new DIDs to use the new name.

**DID log.** The append-only history of a DID document, each entry signed with
the *update key*. Lose that key and the DID can never be changed again.

**Proof of possession (PoP).** A JWT signed with a DID's private key proving
control of it. How the Trust Registry verifies an onboarding.

**Trust marker.** A machine-readable statement about an actor:

| Marker | Says |
| --- | --- |
| `viTM` | Verified Identity: the Confederation checked who this is |
| `caTM` | Compliant Actor |
| `gucTM` | This is a governed use case |
| `gucaTM` | This actor is authorised for that governed use case |

**Protected field.** A claim requiring explicit authorisation to request,
whatever credential carries it. In Switzerland: the AHV number.

**vqPS.** Verification Query Public Statement. A verifier publishing what it
asks for and why. Self-service, available today.

## Swiss health administration

**AHV / AVS number.** The 13-digit social security number (`756.xxxx.xxxx.xx`).
A lifelong cross-sector identifier, which is why it is a protected field. In
credentials it appears as `personal_administrative_number`.

**KVG / LAMal.** The mandatory health insurance act. **VVG** is supplementary
cover; **UVG** is accident insurance.

**VeKa.** The insurance card and the 20-digit number printed on it. Identifies
the card. The person is identified separately.

**BAG / OFSP.** The Federal Office of Public Health. Insurers carry a BAG
registration number.

**GLN.** Global Location Number, the 13-digit identifier for Swiss health
professionals and organisations, held in the Refdata index.

**MedReg.** The federal register of medical professionals.

**EpG / LEp.** The epidemics act, which establishes the federal and cantonal
vaccination framework. Whether a given professional or organisation may
administer a vaccination depends additionally on professional, therapeutic-
products and cantonal law.

**MedBG / LPMéd.** The medical professions act, which governs qualification,
registration and authorisation for the university medical professions. Authority
to prescribe medicinal products follows from professional-practice and
therapeutic-products legislation together, including MedBG/LPMéd, HMG/LPTh and
cantonal law.

**EPD / EGD.** The Swiss electronic patient record.
*In this demonstrator:* not integrated. How the electronic patient record
infrastructure and holder-controlled credentials could interoperate — including
the potential issuer, source, verifier and repository roles each could play — is
future work, and this project does not prescribe a target architecture. See
[roadmap](roadmap.md).

**`meineimpfungen.ch`.** The national electronic vaccination record, closed in
2021, after which the records it held were no longer accessible to the people
they described. Cited in this repository as an illustration of availability and
continuity risk, not as a judgement on that implementation.

## Clinical models

**openEHR.** An approach to clinical information modelling based on
*archetypes* (reusable clinical concepts) and *templates* (their use in a
context), with an associated persistence model.
*In this demonstrator:* the information models are reused and no clinical data
repository is operated. That is a scope choice for this prototype, not a
position on how openEHR should be deployed.

**Archetype.** E.g. `openEHR-EHR-OBSERVATION.laboratory_test_result.v1`.

**Flat format.** An openEHR composition as template-path-to-value pairs, with
`:n` indices on repeating nodes. What a CDR's flat endpoint accepts.

**HL7 FHIR.** The interoperability standard most health systems already speak.
Data is *resources*: `Immunization`, `MedicationRequest`, `Observation`,
`Coverage`.

**Profile.** A constrained FHIR resource for a context. **CH VACD** covers
vaccination data, **CH EMED** medication, **CH Core** the basics.

**IPS.** International Patient Summary. The minimum dataset for unplanned care:
allergies, medication, problems, immunizations. Roadmap step 2.

**LOINC.** Codes for laboratory analytes. **SNOMED CT.** Clinical concepts
including vaccines and diseases. **UCUM.** Units. **GTIN.** Medication packs.

**CDR.** Clinical data repository. This project deliberately does not build
one.

## This project

**Actor.** One organisation with one DID. Four of them: insurer, practice,
pharmacy, travel clinic.

**Role.** A registered capability. One actor holds several; a practice is also
a vaccinator and a laboratory.

**Entitlement.** Which claims a role may request from a credential type. The
ceiling, enforced when the query is built.

**Gate.** One of the three governance checks: `reviewIssuance`,
`reviewRequest`, `reviewPresentation`.

**Journal.** The audit record. Claim names, never values.

**Projection.** A FHIR resource or openEHR composition rebuilt locally from
disclosed claims. Derived, never authoritative; legitimately partial.

**Flow.** A documented interaction in [`flows/`](../flows/README.md), with its
governance and standardisation constraints and its open questions. The blueprint.
