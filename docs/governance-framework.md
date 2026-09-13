# Governance framework

A presentation raises several distinct questions, and the technical profile
answers only some of them: protocol validity, cryptographic validity, credential
and status validity, and holder key binding. Issuer trust is established through
the trust infrastructure. The remaining questions are governance questions and
this document answers those: who may assert a given fact, who may request it,
which claims specifically, on what legal basis, whether the relying party should
accept the presentation, and what happens to the data afterwards.

Keeping these separate matters. A presentation can be cryptographically valid
and still be one the relying party has no entitlement to request.

Everything described here is implemented and enforced in
[`packages/swiyu/src/governance.ts`](../packages/swiyu/src/governance.ts).
Where something is *not* implemented, it says so.

## Principles

1. **Minimisation is enforced where the query is built.** Once the wallet has
   answered, the data is out. A check at the verifier is a promise; a check at
   query construction is a control.
2. **A role is authoritatively established, not self-asserted.** An actor's
   software can of course assert a role; the governance question is whether that
   assertion is established by a trust statement from an accountable body and
   accepted by the relying party. In this project only the latter carries
   weight.
3. **MUST and SHOULD are kept apart.** Profile-level MUST rules are enforced
   under every policy. SHOULDs may be waived. A waiver is *recorded*, not
   silently applied.
4. **The audit record holds claim names and no claim values.** It must evidence an
   interaction stayed within the rules without becoming a second copy of the
   patient's data.
5. **Refusal is a first-class outcome.** A holder declining and a verifier
   being refused, are normal paths that the flow has to work through, not
   errors.
6. **The holder decides what is released.** `swiss-profile-vc:1.0.0` §3.2.2.4
   allows an SD-JWT VC only selectively disclosable claims, apart from the
   registered JWT claims listed in §3.2.2.2, so no business claim in this
   project can be made mandatory to release. A verifier states in advance what
   it will ask for; it cannot compel the answer, and a holder may release more
   than was asked.

## Actors and roles

**These role identifiers are project vocabulary.** `ch.didas.health.role.practice`,
`ch.didas.health.role.vaccinator` and the rest are governance abstractions
defined by this project. They are **not** swiyu roles, and they are not
standardised ecosystem vocabulary: the swiyu Trust Infrastructure has no health
role taxonomy, and no body exists today that could assign one. Their intended
mapping to the infrastructure is described under [the missing
layer](#the-missing-layer) — a role would correspond to a Governed Use Case
Authorization Trust Marker naming a credential type, issued by a governing
authority for the health domain. Until such a body exists the roles are
configured locally and the mapping is a design intention rather than a
deployment.

One organisation holds several roles: a family practice is also an authorised
vaccinator and often runs its own laboratory.

| Role | Identifier | Issues | Verifies |
| --- | --- | --- | --- |
| Insurer | `ch.didas.health.role.insurer` | Insurance card | n/a |
| Practice | `ch.didas.health.role.practice` | Prescription | Insurance card, Beta-ID, immunization, prescription |
| Vaccinator | `ch.didas.health.role.vaccinator` | Immunization | n/a |
| Laboratory | `ch.didas.health.role.laboratory` | Laboratory report | n/a |
| Pharmacy | `ch.didas.health.role.pharmacy` | n/a | Prescription, immunization, insurance card (limited) |
| Travel clinic | `ch.didas.health.role.travel-clinic` | n/a | Immunization (4 claims) |
| Research | `ch.didas.health.role.research` | n/a | Lab findings, immunization; never identifying claims |

The full per-claim entitlement matrix is generated from the definitions:
[docs/credentials/README.md](credentials/README.md).

## The three gates

Every interaction passes through the gates that apply to it, in order and each
records its reasoning either way.

### Gate 1 · `reviewIssuance()` · may this actor assert this?

Checked before any request reaches the issuer. An actor may issue a credential
type only if one of its registered roles is that type's `issuerRole`.

> A practice may issue an immunization record because it holds the vaccinator
> role. An insurer may not and is refused before a credential offer exists.

Underneath, this corresponds to a Governed Use Case Authorization Trust Marker
naming the credential type. **That marker cannot currently be issued**. See
[The missing layer](#the-missing-layer).

### Gate 2 · `reviewRequest()` · may this actor ask and for what?

Checked when the DCQL query is constructed. Three tests:

1. Does the requesting role hold an entitlement for this credential type?
2. Do the requested claims fall inside that entitlement?
3. Are any protected fields among them and is this role authorised for those
   specific fields?

A failure at any point stops the request before the patient sees it.

### Gate 3 · `reviewPresentation()` · should this be accepted?

A distinction worth keeping: the **verifier** is the technical component that
performs verification — here the swiyu generic verifier — while the **relying
party** is the organisation that acts on the result. Gates 1 and 2 and this gate
are relying-party decisions; the checks at step 2 below are the verifier's.

Checked on the response, in a deliberate order:

1. **Credential and status validity.** Revoked or suspended fails immediately,
   before any trust reasoning.
2. **Protocol and cryptographic validity, and holder key binding.** Signature,
   key binding and issuer identifier resolution, all performed by the generic
   verifier.
3. **Issuer trust**: trust markers evaluated against the configured policy.
4. **Business acceptance**: whether the relying party acts on the result, which
   no protocol decides.

## Trust markers and policies

The generic verifier evaluates Trust Protocol 2.0 markers on the credential's
issuer. The policy decides what to do with them.

| Marker | Meaning | Strict | Sandbox |
| --- | --- | --- | --- |
| `gucTM` without `gucaTM` | Governed use case, no authorisation | **Refuse** | **Refuse** |
| `viTM` | Verified identity | Require | Waive and record the waiver |
| `caTM` | Compliant actor | Require | Waive and record the waiver |

The first row is a MUST in `swiss-profile-trust:1.0` and is not configurable:
it is refused under every policy, including the Sandbox one.

`SANDBOX_HEALTH_POLICY` exists because Sandbox actors have not been through
identity onboarding, so the SHOULD-level rules cannot be satisfied there. The
rules are not deleted; each waiver appears in the journal with its reason. A
demonstrator that silently drops rules teaches that the rules are optional.

Production deployments set `SWIYU_TRUST_POLICY=strict` and mean it.

## Protected fields

`swiss-profile-trust:1.0` designates certain claims as **protected**: a verifier
needs an explicit authorisation to request them, *whatever credential type
carries them*.

| Field | Why |
| --- | --- |
| `personal_administrative_number` | The AHV/AVS number, a lifelong cross-sector identifier |

The practice holds this entitlement because Swiss billing runs on the AHV
number. The pharmacy does not and a pharmacy request for it is refused at gate
2, asserted in `packages/swiyu/test/governance.test.ts`.

The entitlement is written into the credential definition precisely so it is
reviewable. "Which of our partners can see the AHV number" should be a question
answerable by reading one file.

## What the E-ID Act does and does not decide

The Federal Act on Electronic Proof of Identity of 20 December 2024 (E-ID-Gesetz,
BGEID) governs the federal **trust infrastructure** and the **EID**. It does not
govern a health credential's content, and it does not say what a practice or a
pharmacy may ask for. Three of its provisions still set the frame this project
works in.

**Art. 1 para. 2 let. a** names the principles the technical and organisational
measures must implement, and they are the reason the infrastructure has the shape
it has: *Datenschutz durch Technik und datenschutzfreundliche Voreinstellungen*
(privacy by design and by default), *Datensicherheit*, *Datensparsamkeit*,
*dezentrale Datenspeicherung*, *Nachvollziehbarkeit und Wiederverwendbarkeit*,
and the infrastructure remaining under state control.

**Art. 10 para. 1** is the holder's control, stated as a requirement on the
system rather than as an aspiration:

> Beim Vorweisen eines elektronischen Nachweises muss die Inhaberin oder der
> Inhaber bestimmen können, welche Bestandteile davon und welche davon
> abgeleiteten Informationen an die Verifikatorin übermittelt werden.

When an electronic credential is presented, the holder must be able to determine
which parts of it, and which information *derived* from those parts, are
transmitted to the verifier. Art. 10 para. 2 adds that presentation and
verification happen without the issuer's knowledge. Note that the Act
contemplates derived information; `swiss-profile-vc:1.0.0` has no mechanism for
it, which is why over-18 is a claim the e-ID carries rather than a proof computed
over a withheld date of birth.

**Art. 23** is a proportionality test with teeth, and it applies **to the EID
only**. A verifier may request the personal data the EID contains where
verification of identity, or of a partial aspect of it, is provided for in
legislation, or where it is strictly necessary for the reliability of the
transaction, in particular to prevent misuse and identity theft. On a breach the
BIT records that in the Trust Registry *visible to the holder during a
transaction*, and may exclude the verifier from the register.

There is no equivalent statutory test for the other credentials in this
repository. A pharmacy asking a patient for their full vaccination history is not
answerable to Art. 23; it is answerable to whatever the health domain decides,
and the health domain has not decided. That is the same gap [the missing
layer](#the-missing-layer) describes from the trust-marker side.

## Legal basis, by credential type

These are **modelled** legal bases, not settled ones. Four of the citations were
read against Fedlex outside this environment on 2026-09-13, which confirmed two,
qualified the scope of a third and established that two of them named only part
of the applicable law; the table below carries the corrected form and
[source verification](source-verification.md) records the reading. The KVG
analysis list was not part of it. Legal review is still required before
deployment: a citation being correct is a different question from a deployment
being lawful.

| Credential | Modelled on |
| --- | --- |
| Insurance card | KVG/LAMal Art. 42a: the insurer issues the card |
| Immunization | EpG/LEp for the federal and cantonal framework, with professional, therapeutic-products and cantonal law deciding who may administer |
| Prescription | The applicable professional-practice and therapeutic-products legislation, including MedBG/LPMéd, HMG/LPTh and cantonal law |
| Laboratory report | A laboratory on the KVG analysis list, or the treating practice on its behalf |

These are recorded as `issuerBasis` on each credential type and surface in the
journal entry for every issuance.

## Retention

Retention attaches to the receiving role:

- **Practice.** Disclosed claims may be kept as long as the billing record
  requires. Where the information forms part of records subject to the
  accounting-law retention requirements, OR Art. 958f provides for ten years.
  Whether a given credential-derived attribute falls within that obligation
  depends on the purpose and the record it is retained in.
- **Pharmacy.** A dispensation record under HMG/LPTh, not the credential.
- **Travel clinic.** The conclusion that the series was confirmed, without a
  copy of every dose.
- **Research.** Only what the consent covers and never identifying claims,
  which the entitlement makes unobtainable anyway.

Note that building a FHIR resource from a presentation *is* retention. The
projection is governed by the same rule as the claims it was built from.

## Lifecycle governance

Three operations share one mechanism and must not be confused:

| Operation | Status | Reversible | Means |
| --- | --- | --- | --- |
| Suspend | `0x02` | Yes, via `ISSUED` | "Do not rely on this for now" |
| Revoke | `0x01` | **No** | "This assertion should not have been made" |
| Cancel | `0x01` | No | The offer was withdrawn before collection |

**The status list cannot distinguish motive.** "Recorded in error", "used up"
and "we no longer recognise this" produce the same bit. Only the issuer's
journal separates them, so the journal serves as a governance control.

Two rules follow, neither technically enforceable:

- **An immunization credential may be revoked only to correct a recording
  error**, never to withdraw a vaccination that took place. Revoking does not
  undo the dose; it withdraws an assertion the issuer should not have made.
- **A prescription is revoked on dispensing**, which is how it is kept
  single-use. Only the issuer can revoke, so redemption is a request between two
  accountable parties.

Status list contents are **public**, so a suspension is itself a disclosure.
That is a reason to prefer correction-by-revocation over
suspension-on-suspicion for sensitive credential types.

## The audit journal

Every gate decision produces a record:

```
timestamp · interaction id · actor role · actor DID · credential type
purpose scope · claim NAMES released · decision · reasons · retention rule
```

Deliberately absent: claim values. A test asserts that no AHV number and no
vaccine lot number ever reaches the journal.

This is what a practice must be able to show afterwards: who asked, for what
purpose, under which entitlement, what was released and what was decided,
without the record becoming a shadow copy of the patient's data.

## Transparency: the vqPS

Separately from entitlement, each verifier publishes its queries. Trust Protocol
2.0 defines the Verification Query Public Statement as a statement "provided by
verifiers to provide public transparency on their intended verification scope",
signed by a public transparency statement issuer. It carries a `purpose_name`
(at most 40 characters), a `purpose_description` (at most 1000), both
localisable, and a Verification Request Object holding the `scope` and the DCQL
query. This project submits those fields to
`POST /api/v1/trust/vqps-submissions` and the Trust Registry signs and publishes
the statement.

Read what the matching trust marker claims, and what it does not. Trust
Protocol 2.0 on the Transparent Verification Trust Marker, verbatim:

> The presence of this marker indicates that the ongoing verification request is
> publicly transparent and can be reviewed by 3rd party actors.
> This does not mean the individual verification - neither what data is requested,
> nor what data is exposed to the verifier - is publicly available, only that the
> verifier made the type of verifications they are performing public for review.

The vqPS publishes the query shape, not the transaction.

`tvTM` is also the weakest of the markers in the profile's own terms: the wallet
**MAY** decline a counterparty without it, and the profile names a
holder-consented override as a good reason not to require it.

This is self-service and available today. It is generated from the same objects
the verifier sends (`scripts/vqps.ts`), because a published statement that has
drifted from its implementation is worse than none: it is a public claim that
happens to be false.

## The missing layer

Organisation onboarding, identity onboarding and transparency are all
self-service and working. One layer is not.

| Layer | Establishes | Available |
| --- | --- | --- |
| Organisation | ePortal account, business partner, API access | **Yes** |
| Identity | `did:webvh` on the Base Registry, proof of possession → `viTM` | **Yes** |
| Transparency | vqPS: this verifier, this scope, this query | **Yes** |
| **Entitlement** | `gucaTM`: this DID may issue *this* health credential type | **No** |

**No health-domain governance body exists** to issue that last marker. Until one
does, verification relies on explicitly listed `accepted_issuer_dids`, adequate
for a pilot, inadequate at scale, since every verifier must be told about every
legitimate issuer out of band.

### What such a body would have to do

1. **Define the role vocabulary** and decide whether it is health-specific or
   shared across sectors, which determines whether a verifier in another domain
   can interpret a health role at all.
2. **Grant roles against existing registers**: the cantonal authorisation to
   practise, the MedReg entry, the GLN in Refdata, the BAG number for insurers.
   A grant not traceable to one of these is a new register in disguise.
3. **Withdraw them.** When an authorisation to practise is revoked, the trust
   statement must follow, or credentials issued afterwards still verify. Nothing
   in the technical stack notices this on its own.
4. **Adjudicate entitlements**: decide which roles may request which claims,
   and publish that decision.
5. **Run an appeal path.** A trust registry entry has real economic
   consequences for a practice.

## Open governance questions

1. **Who governs the health domain?** A cantonal health authority, the FOPH, a
   sector association, or a body constituted for the purpose. Unanswered.
2. **How are roles expressed in a trust statement?** This project uses reverse
   DNS strings. Whether the ecosystem adopts a shared vocabulary decides
   cross-sector interpretability.
3. **Representation and delegation.** A parent for a child, a carer for an
   adult. No model exists and this blocks the largest real population for
   immunization records.
4. **Emergency access.** Consent-at-presentation assumes a conscious patient.
   Any break-glass mechanism reintroduces the party this design removes.
5. **Notification.** Nothing tells a patient that a credential they hold has
   been revoked. For a vaccination record that is potentially a clinical risk.

---

Each flow in [`flows/`](../flows/README.md) carries its own governance
constraints section, stated against the specification clause it comes from.
