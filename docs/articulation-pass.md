# Articulation pass, 2026-09-13

A pass over the public-facing text with one rule: every statement should identify
the object or data under discussion, the actor performing the action, the
technical mechanism producing the result, what conclusion follows and what
conclusion does not. No statement should move from a protocol property to a
human, legal, clinical or business conclusion without saying that it is doing so.

This document records what changed, what remains asserted strongly and on what
basis, and which statements depend on behaviour or governance that is not
settled.

## 1 · File-by-file change log

### `site/index.html`

| Where | Was | Is |
| --- | --- | --- |
| Lede | "verified by a relying party"; "the remaining fourteen are not transmitted" | The clinic evaluates the issuer signature, the credential status and the holder binding. The presentation request selects four of eighteen claims and the remaining claims are not included in the presentation |
| Facts | "claims released" | "claims included in the presentation" |
| Facts | "0 clinical repositories, which runs on the Confederation's registries" | Names what the registries are read for: identifier, status and trust information |
| Terms, selective disclosure | "a verifier receives only the claims it asked for and is entitled to. The rest stay on the phone" | The issuer commits to each claim separately, the holder opens some commitments and leaves others closed, and unselected claims are not included in the response |
| Terms, status list | "saying whether it is still valid… Nothing else connects the two" | Each credential carries the index of its own entry; a verifier fetches the list and reads that entry; the representation carries no clinical payload and no patient attributes |
| Terms, wallet | "the app that stores credentials and releases claims" | Adds the storage and lifecycle model, and that release happens in response to a presentation request |
| Mechanism | "what its role entitles it to assert"; "with the patient's consent"; "whether a credential is still valid and nothing else" | The credential types its role permits in this project's policy configuration; after the patient confirms the request in the wallet; a status entry per credential and no clinical payload |
| Figure | Arrow labelled "checks validity" | "reads status" |
| Figcaption | "It asks for five claims and no identifier" | "Its presentation request selects five claims and no person identifier" |
| Disclosure section | "Once the wallet has answered, the data has left the phone. Any check applied after that point is a promise about how the recipient will behave" | A check applied after the response operates on claims the verifier already holds, so it constrains later use rather than which claims were received |
| Governance | "a valid signature establishes who signed" | A signature that verifies establishes which key signed and, through identifier resolution, which issuer holds that key |
| Governance gate 3 | "a governed use case without authorisation is refused, because that rule is a MUST" | Names the markers: `gucTM` without `gucaTM`, declined under every policy, at MUST level in `swiss-profile-trust:1.0` |
| Standards | "a missing element is a valid outcome" | An absent element is an expected outcome of the disclosure rather than a data error |
| Public health | "The survey needs no identifying claim, because the sampling frame already carries the age and the canton" | The response does not require a person identifier; the stratum arrives inside the invitation credential; other disclosed values and protocol metadata may still contribute to correlation |
| Public health | "Consent adds no new step" | The wallet adds a confirmation of the presentation request rather than a new legal consent |
| Unlinkability | "The party receiving data cannot connect it to the person it came from" | Two named properties, each tied to the correlation surfaces that decide it |
| Open questions | "A credential presented twice is the same credential, so two verifiers comparing notes can tell it is the same person" | Repeated presentations may be correlatable where they expose stable credential-level or claim-level information; the degree depends on format, holder binding, disclosed claims and protocol |
| Scope | "Unlinkability is not claimed. It does not make presentations unlinkable" | Names the surfaces selective disclosure does not remove |
| Explorer, research role | "The entitlement excludes every identifying claim by construction" | The demonstrator's policy configuration prevents the research role from requesting the identifying claims |
| Explorer, statistics role | "The EBPI survey drew this household from the population register, so it already holds the age band and the canton" | The stratum arrives inside the invitation credential, so the request does not name a person identifier |
| Explorer, practice role | "The holder consents per presentation" | Each presentation is confirmed by the holder in the wallet, per request |

### `README.md`

| Where | Change |
| --- | --- |
| Purpose | "cryptographically verifiable, privacy-preserving and governed exchange" replaced by the four properties actually added: a checkable signature over the issued claims, selective disclosure at claim level, status resolution without contacting the issuer, and a policy layer deciding which role may issue a type and which claims a role may request |
| Governance, issuance | Names the policy configuration the vaccinator role comes from |
| Governance, request | "Enforcing minimisation after the wallet has responded would be too late" replaced by what a later check would and would not constrain |
| Governance, protected fields | "requires special permission to verify" becomes an explicit authorisation before a verifier may request it |
| Interoperability | "an absent element is a valid outcome" becomes an expected outcome of the disclosure |
| Scope, predicate proofs | Restated as a demonstration that a claim satisfies a condition without disclosing the value; the age threshold is a claim the issuer computed |
| Scope, unlinkability | Names the correlation surfaces that remain |

### `docs/`

| File | Change |
| --- | --- |
| `architecture.md` | The journal "proves an interaction was" becomes "evidences" |
| `business-case.md` | "a patient who wants to prove one fact"; the patient row's "can prove anywhere"; the pharmacy row's "verified and redeemed exactly once"; "nothing else was demonstrably ready" |
| `glossary.md` | Status list "carries nothing else"; proof of possession "proving" becomes "demonstrating" |
| `governance-framework.md` | The audit record "must prove an interaction" becomes "must evidence" |
| `integration-guide.md` | "the patient is looking at a consent screen" becomes the wallet showing the request for confirmation; "`client_rejected` is a valid answer" becomes a defined response |
| `public-health.md` | "the survey asks for the five claims it needs and gets nothing else" becomes what the request selects and what is not included; the consent row names research consent |
| `roadmap.md` | The survey "needs no identifying claim, because the sampling frame already carries the age and the canton" is removed; standing consent becomes standing authorisation; an unconscious patient cannot confirm a presentation request |
| `source-verification.md` | The sampling-frame row records where the claim was asserted and that it was removed |

### `flows/`

| File | Change |
| --- | --- |
| `F-02` | "the attestation goes into the patient's wallet and stays there" becomes the wallet storing the credential under its own storage and lifecycle model |
| `F-04` | "who are you and who is paying" becomes the identity attributes and cover attributes reception obtains; "reads the patient's identity" becomes reads the identity attributes disclosed; a name mismatch becomes a difference between the name attested by each issuer |
| `F-05` | The status list "records that a credential is no longer valid and nothing else" becomes the status value the issuer published and what the representation does not carry |
| `F-06` | "a status value per entry and nothing else" becomes a status value and no accompanying reason |
| `F-07` | "the FHIR resource proves nothing on its own" becomes: it carries no signature, so nothing about its provenance can be checked from the resource alone |
| `F-09` | Withdrawal, re-identification and Human Research Act paragraphs; "not anonymous" becomes "not anonymised data" with the distinction stated |
| `F-11` | The predicate-proof paragraph, the residual leak, the governance constraint and the open question; the sampling-frame claim removed |
| `README.md` | "a use case chooses only what it asks for" becomes which claims its presentation requests select |
| `likec4/health-flow.likec4` | The wallet step becomes confirm rather than consent; the two-issuer note states what reception evaluates; the coverage-survey note names the correlation surface |

### Generated content

`config/` and `docs/credentials/` were regenerated from a rebuilt package and are
byte-identical to the committed versions, because this pass changed prose and no
credential definition. The `issuerBasis` and retention strings were changed in
the definitions by the preceding change and are already reflected there.

## 1b · The sweep, and how it stays done

The pass above rewrote the sentences that made a claim. The sweep behind it read
every sentence in the public prose that uses one of the watched words, 276 of
them across nineteen files, and decided each one.

Most were kept as written, for four reasons that recur:

| Kept because | Example |
| --- | --- |
| The word names a component | "trust registry", "trust marker", "the verifier" |
| The sentence quotes the specification | The `tvTM` and `vqPS` passages in the governance framework |
| The absolute is true of the mechanism | "Only the issuer can revoke", "the journal records claim names and no values" |
| The object is already named | "verified against the CH VACD FSH source" |

[`scripts/check-articulation.mjs`](../scripts/check-articulation.mjs) keeps the
sweep from decaying. It finds the sentences that use a watched word without the
surrounding precision, and compares them against
`scripts/articulation-accepted.json`, which records the 276 already read and the
category each was accepted under. A sentence that is neither rewritten nor
recorded fails `npm run verify`, so new prose gets the same reading. Accepting
is a judgement rather than a suppression: `--accept` rewrites the file from the
current state, so a reviewer sees in the diff exactly which new sentences an
author decided were fine.

The watched words are `prove`, `verify`, `valid`, `trust`, `identity`,
`anonymous`, `unlinkable`, `linkable`, `private`, `privacy`, `consent`,
`authorised`, `entitled`, `protected`, `secure`, `only`, `never`, `always`,
`guarantee`, `nothing else` and `the same person`.

## 2 · Strong assertions that remain, and their basis

These are stated without hedging on purpose. Each is checkable.

| Assertion | Basis |
| --- | --- |
| A counterparty carrying `gucTM` without `gucaTM` is declined under every policy | `swiss-profile-trust:1.0` states the rule at MUST level. `SANDBOX_HEALTH_POLICY` and `STRICT_HEALTH_POLICY` both enforce it, and a test covers the Sandbox path |
| The journal records claim names and no claim values | A test asserts that no AHV number and no vaccine lot number reaches the journal |
| A query naming a claim outside the requesting role's entitlement is rejected while the query is built | `reviewRequest()` in `governance.ts`, exercised by the DCQL builder tests |
| The immunization credential type defines eighteen claims, and the travel-clinic entitlement covers four | Read from `credentials/immunization.ts`; the portal explorer's data is checked against the same source |
| The status-list representation carries no clinical payload and no patient attributes | IETF Token Status List: the entry is a status value at an index |
| DCQL `multiple` is NOT SUPPORTED, so one query returns one credential | `swiss-profile-verification:1.0.0`, quoted in `spec-conformance.md` |
| Predicate proofs are not available in this profile | SD-JWT VC discloses or withholds a claim; the profile mandates that format and no other |
| The FHIR resource produced by a projection carries no signature | `projections.ts` emits a resource and no proof element; the test suite pins the shape |
| Nothing here has run against production swiyu | Statement about this repository's own history |

## 3 · Statements whose precision depends on something unresolved

| Statement | What it depends on |
| --- | --- |
| That an issuer's authorisation to issue a governed credential type is expressed as a trust statement carrying markers | No health-domain governance body exists to issue such a statement. The mechanism is specified; nothing has issued one for a health role |
| That the role identifiers `ch.didas.health.role.*` map onto a Governed Use Case Authorization Trust Marker | This project's own vocabulary and its intended mapping. Not swiyu roles and not standardised ecosystem vocabulary |
| That the SHOULD-level trust rules are waived under the Sandbox policy and enforced under the strict policy | The strict policy has never run against production swiyu, so the assertion is about the code path rather than about observed behaviour |
| That revoking a credential causes later presentations to fail | Depends on the verifier resolving status before accepting. The profile requires it; this repository cannot observe whether every deployed verifier does |
| That batch issuance would reduce the credential-level correlation surface | The profile supports batches of at least ten. This project does not use them, so the effect is reasoned rather than measured |
| That a zero-knowledge presentation would close the invitation-index correlation | Depends on a scheme that is a candidate rather than a decision, tracked in issue 10, and on its fit with ES256 and the Swiss Profile |
| The three coverage-survey claims not covered by the FOPH and EBPI reading | The three contact attempts, per-canton operational workflow, and what the sampling frame holds at the point of invitation. Recorded in [source verification](source-verification.md) |
| Every statutory citation | Four were read against Fedlex outside this environment on 2026-09-13 and two were corrected. Deployment-specific conclusions still need qualified counsel, and the KVG analysis list was not part of that reading |
