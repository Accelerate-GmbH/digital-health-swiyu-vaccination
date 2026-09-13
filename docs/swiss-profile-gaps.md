# Swiss Profile gaps

Capabilities this demonstrator requires that the current Swiss Profiles 1.0 and
Trust Protocol 2.0 do not define. Each carries a stable identifier so a flow can
reference it and a reader can follow it in both directions.

A gap is not a defect in the profiles. Each is a requirement this project can
state concretely because it built or specified the flow that needs it.

**Scope of the word "current".** Current means Swiss Profiles 1.0
(`swiss-profile-anchor`, `-issuance`, `-verification`, `-vc`, `-trust`) and Trust
Protocol 2.0, as read for [Swiss Profile conformance](spec-conformance.md) on
2026-09-13. Where a statement below describes a limitation, it describes the
profile at that version and not a permanent property.

## Reading the classification

Each flow declares `profile_status` in its front matter.

| Value | Meaning |
| --- | --- |
| `current-profile` | Every mechanism it uses is defined by the current profiles |
| `mixed` | Current-profile mechanisms plus this project's own policy layer, its role vocabulary or its information-model bindings, none of which are part of the profiles |
| `beyond-current-profile` | The flow requires at least one mechanism the current profiles do not define |

`mixed` is the common case. A flow can run end to end on the current profiles
and still depend on decisions the profiles leave to a deployment.

## Gap table

| Gap | Capability | Affected flows | Current limitation | Likely change area | Change type |
| --- | --- | --- | --- | --- | --- |
| GP-01 | Multi-instance credential presentation | F-08 | One credential instance per DCQL query; `multiple` NOT SUPPORTED | Swiss Profile Verification | specification |
| GP-02 | Provenance of a derived representation | F-07, F-08 | No defined way to carry or retain provenance from a verified presentation into FHIR or openEHR | Swiss Profile VC, interoperability profile | specification, implementation |
| GP-03 | Holder-originated authorisation object | F-09 | No holder-as-issuer pattern, and no lifecycle or verifier interpretation for one | Swiss Profile Issuance, Trust Protocol | specification, governance |
| GP-04 | Standing authorisation for a continuing exchange | F-10 | Each presentation is a discrete, separately approved interaction | Swiss Profile Verification, governance | specification, governance |
| GP-05 | Measurement and device provenance | F-10 | No attestation model for the device or software producing a measurement; key attestation is about key storage | Swiss Profile Issuance, Trust Protocol | specification |
| GP-06 | Richer lifecycle and status semantics | F-05, F-06 | The Token Status List carries a status value and no reason | Swiss Profile VC, issuer APIs | specification, implementation |
| GP-07 | Supersession and replacement | F-06 | No defined lineage between a corrected credential and the one it replaces | Swiss Profile VC | specification |
| GP-08 | Predicate and derived-attribute presentation | F-03, F-11 | SD-JWT discloses or withholds a claim; there is no mechanism to demonstrate a predicate over a withheld value | Swiss Profile VC, cryptographic suite | specification |
| GP-09 | Structural unlinkability | F-03, F-11 | Selective disclosure removes claim values and leaves other correlation surfaces in place | Swiss Profile VC, Swiss Profile Issuance | specification |
| GP-10 | Cross-domain and cross-border trust evaluation | F-08 | Trust statements are evaluated within the Swiss trust domain; no defined recognition path across trust domains | Swiss Profile Trust, Trust Protocol, organisational-identity governance | specification, governance, legal/policy |

External standards and bridges relevant to GP-10: LEI (ISO 17442), vLEI within
the GLEIF ecosystem governance framework, a Swiss organisational identifier
(OrgID) if and when one is available, the swiyu organisational DID, Trust
Protocol 2.0, and sector-specific authorisation.

---

## GP-01 · Multi-instance credential presentation

**Required by:** F-08.

**Current limitation.** `swiss-profile-verification:1.0.0` states that DCQL
`multiple` is NOT SUPPORTED, so one credential query returns at most one
credential instance. Several credential queries in one authorization request are
supported and this repository uses them: F-04 sends two, one for the Beta-ID and
one for the insurance card, and that flow is implemented.

The limitation is therefore narrower than "one credential per verification" and
harder to work around. An International Patient Summary needs several instances
of the same credential type, one per administered dose, and the number is not
known when the request is built. A verifier cannot enumerate one query per dose
for a count it does not have.

**Required capability.** One of:

- several credential instances satisfying one credential query;
- several DCQL credential queries with defined response semantics for a set
  whose size the verifier does not know in advance;
- another standardised composition mechanism.

Whichever is chosen, the verifier has to be able to associate each returned
credential with the query it answers, and to determine whether the request was
satisfied completely or partially. A summary assembled from an unknown subset,
with no way to distinguish "no allergy credential presented" from "no allergy
credential held", is a clinical hazard rather than a formatting problem.

**Likely affected area.** Swiss Profile Verification.

---

## GP-02 · Provenance of a derived representation

**Required by:** F-07, and F-08 when a summary is composed from several
presentations.

**Current limitation.** F-07 transforms disclosed claims into a FHIR resource or
an openEHR composition. Four things are distinct and the profiles define a
relationship between only the first two:

1. the signed source credential;
2. the verified presentation result;
3. the derived FHIR or openEHR representation;
4. provenance linking 3 back to 1 and 2.

A derived representation does not inherit the cryptographic properties of the
credential it was built from. The FHIR resource carries no signature, so nothing
about its provenance can be checked from the resource alone.

**Required capability.** A Swiss interoperability profile could define how
provenance is carried or retained when a verified presentation is transformed
into FHIR or openEHR structures: what is retained, how the derived object
references it, and what a downstream system may conclude from the reference.

**Likely affected area.** Swiss Profile VC, and an interoperability profile
alongside the eHealth Suisse exchange formats.

---

## GP-03 · Holder-originated authorisation object

**Required by:** F-09.

**Current limitation.** F-09 explores a holder-controlled authorisation object
with its own lifecycle and withdrawal semantics. The current Swiss Profiles do
not define a holder-as-issuer pattern, nor the governance model that would go
with one.

**Required capability.** Definition of:

- a holder-as-issuer mechanism or an equivalent;
- key binding for it;
- its lifecycle;
- withdrawal and status;
- how a verifier interprets it;
- how governance treats it.

**The distinction that must not be lost.** Such a mechanism is a protocol
artefact. It is not, by itself, a conclusion that legal consent or consent under
the Human Research Act has been obtained. Four things stay separate: wallet
approval of a presentation, protocol authorisation, legal consent, and research
consent under applicable law.

**Likely affected area.** Swiss Profile Issuance, Trust Protocol.

---

## GP-04 · Standing authorisation and continuous disclosure

**Required by:** F-10.

**Current limitation.** Each presentation is a discrete interaction the holder
approves in the wallet. A continuing exchange of measurements has no equivalent.

**Required capability.** A mechanism covering establishment, duration, scope,
modification, suspension, withdrawal, holder visibility, and evidence that an
ongoing exchange remains within the scope currently authorised.

The mechanism might be a standing authorisation object, a capability, an
OAuth-style grant, a credential, or another governed construct. This document
does not select one: the requirement is stated before the mechanism, because the
choice depends on the governance model as much as on the protocol.

**Likely affected area.** Swiss Profile Verification, and governance.

---

## GP-05 · Measurement and device provenance

**Required by:** F-10.

**Current limitation.** Five things are distinct in a continuous-measurement
setting and the profiles address none of them as a set:

1. device identity;
2. the software or algorithm producing or transforming the measurement;
3. the person or subject the measurement is attributed to;
4. the actor making that attribution;
5. the assurance associated with each of the above.

**What this is not.** Key attestation under `swiss-profile-issuance:1.0.0`
concerns how a wallet's key is stored and is not a statement about where a
measurement came from. Device attestation is not a Trust Protocol trust marker:
Trust Protocol 2.0 defines `viTM`, `caTM`, `tvTM`, `gucTM` and `gucaTM`, and
device attestation is not among them.

**Likely affected area.** Swiss Profile Issuance, Trust Protocol.

---

## GP-06 · Richer lifecycle and status semantics

**Relevant to:** F-05, F-06.

**Current limitation.** The Token Status List carries a status value at an index
and no reason. The issuer-side lifecycle state and the business reason live in
the issuer's own systems and journal.

Three things stay distinct and are conflated easily:

- the published Token Status List value;
- the issuer-side lifecycle state recorded through the management API;
- the business reason: dispensed, erroneous, superseded, cancelled, replaced.

**Required capability.** A defined way for a verifier to obtain a reason where
the use case needs one.

**The constraint on any solution.** Putting domain semantics on the status list
makes them readable by anyone who can read the list, which is a correlation and
disclosure surface. A richer status value is not obviously an improvement and
the privacy consequences have to be evaluated with the functional benefit.

**Likely affected area.** Swiss Profile VC, and the issuer management APIs.

---

## GP-07 · Supersession and replacement

**Relevant to:** F-06 and longitudinal health records generally.

**Current limitation.** When a recorded dose is corrected, the issuer revokes one
credential and issues another. Nothing in the credential expresses that
credential B supersedes credential A.

**Required capability.** Explicit lineage, together with a treatment of the
correlation it introduces: a stable link between two credentials is exactly the
kind of stable identifier GP-09 is about, so the lineage has to be expressible
without making every presentation of the successor correlatable to the
predecessor.

The model should distinguish correction, replacement, supersession, revocation
and expiry. CH VACD already models supersession and merge conflicts for
immunization records, which is a candidate shape for the clinical layer even
where the credential layer does not carry it.

**Likely affected area.** Swiss Profile VC.

---

## GP-08 · Predicate and derived-attribute presentation

**Relevant to:** F-03, F-11, and eligibility and age checks generally.

**Current limitation.** Three mechanisms are distinct:

- **A pre-computed issuer claim.** The issuer computes a boolean and issues it as
  a claim. The holder discloses the claim. This works today and is what this
  repository does where a threshold is needed.
- **Selective disclosure.** The holder discloses some claims and withholds
  others. This works today.
- **A cryptographic predicate proof.** The holder demonstrates that a withheld
  value satisfies a condition. SD-JWT does not provide this, and the profile
  mandates SD-JWT VC and no other format.

Selective disclosure is not a predicate proof, and this repository does not
present it as one.

**Required capability.** Where a Swiss use case needs "age above threshold",
"value in range" or "eligibility satisfied" without disclosing the source value,
the profile would have to record whether the answer is a pre-computed claim or a
cryptographic mechanism. A pre-computed claim moves the decision to the issuer
and requires the issuer to know the question in advance.

**Likely affected area.** Swiss Profile VC and its cryptographic suite. ES256 is
the only signature algorithm the current profile permits, which constrains the
candidates.

---

## GP-09 · Structural unlinkability

**Relevant to:** F-03, F-11.

**Current limitation.** Selective disclosure removes undisclosed claim values
from a presentation. It does not remove the other surfaces over which two
presentations may be correlated:

- credential identifiers;
- holder-binding keys;
- disclosed stable claim values;
- status-list references;
- issuer identifiers;
- presentation artefacts;
- timing;
- network metadata.

Selective disclosure is not unlinkability, and this document does not use one
word for the other.

**Required capability.** If stronger unlinkability is a Swiss requirement, the
correlation model has to be established first: which surfaces matter for which
use case, and against which adversary. Batch issuance, key rotation, pairwise
binding, pairwise identifiers, different credential constructions and additional
cryptographic mechanisms are all candidates. This document does not prescribe
one before the model exists.

**Likely affected area.** Swiss Profile VC, Swiss Profile Issuance.

---

## GP-10 · Cross-domain and cross-border trust evaluation

**Relevant to:** F-08, and any interaction where an organisation in one trust
domain deals with an organisation governed by another.

**Current limitation.** Cryptographic verification of a Swiss credential
establishes which key signed it and, through identifier resolution, which issuer
holds that key. It does not establish that the organisation is recognised,
authorised or acceptable in another jurisdiction or trust framework. Trust
statements are published and evaluated within the Swiss trust domain, and no
recognition path across trust domains is defined.

**Required capability.** Future work would need to define:

- recognition of Swiss governing authorities outside Switzerland;
- recognition of foreign governing authorities by Swiss relying parties;
- mapping of issuer and verifier authorisations between domains;
- federation of governed-use-case semantics;
- cross-border interpretation of credential-type authorisations;
- treatment of foreign organisational identifiers and business-register
  information.

**Likely affected area.** Swiss Profile Trust, Trust Protocol,
organisational-identity governance, and alignment with a Swiss OrgID if one is
established. This is not primarily a credential-format question.

### GP-10a · LEI and vLEI as an organisational bridge

LEI and vLEI are worth evaluating as a bridge between Swiss organisational trust
and external trust domains. The model is complementary rather than substitutive.
LEI and vLEI do not replace Swiss organisational identifiers, swiyu DIDs, Swiss
trust statements, sector-specific authorisations or Swiss governance.

```
Swiss trust domain
    swiyu DID                     technical identifier in the Swiss trust infrastructure
    Swiss trust statements        Swiss governance and authorisation
    Swiss sector authorisation    domain-specific governance decision
           │
           │ bound to
           ▼
          LEI                     globally recognised legal-entity reference
           │
           │ vLEI organisational assertions
           ▼
External trust domain             foreign relying party, evaluating under its own policy
```

**What each part can answer.** An LEI can provide a globally recognised
reference for the legal entity, so a foreign relying party can determine which
legal entity an organisational identifier refers to. Where suitable vLEI
credentials exist, they can carry cryptographically verifiable assertions about
organisational identity, roles and authority within the vLEI governance
framework, so a foreign relying party can determine which organisational role or
authority has been asserted for a holder.

**What it does not answer.** Whether the organisation is authorised to issue or
verify a given credential type, in a given jurisdiction, for a given governed use
case. That remains a governance decision and a relying-party policy decision. A
vLEI credential may establish an asserted role within its own framework;
acceptance as an authorised issuer or verifier for a Swiss or a foreign governed
use case is separate.

**Questions the design would have to answer.**

1. How a swiyu organisational DID is bound to an LEI.
2. Which actor is authoritative for that binding.
3. Whether the binding is represented as a swiyu trust statement, a vLEI
   credential, a registry assertion, or a combination.
4. How organisational changes and legal-status changes propagate.
5. How vLEI role credentials relate to Swiss sector-specific authorisations.
6. Whether a foreign verifier can identify the organisation through LEI or vLEI
   while independently evaluating Swiss governance assertions.
7. How the reverse path works, for a foreign organisation interacting with a
   Swiss verifier.
8. How stale or conflicting assertions are handled.
9. Whether the bridge introduces correlation or dependency that the Swiss path
   does not already carry.
10. How organisational authority is expressed for machine agents acting on behalf
    of an organisation.

**Design principle: dual anchoring rather than replacement.** A Swiss
organisational actor should be able to remain governed by Swiss law and the Swiss
trust infrastructure while also carrying a globally resolvable organisational
identity anchor. The separation to maintain:

| Concept | What it is |
| --- | --- |
| swiyu DID | Technical identifier within the Swiss trust infrastructure |
| Swiss organisational identifier | The Swiss legal and administrative context |
| LEI | Globally recognised legal-entity reference |
| vLEI | Portable assertions about organisational role or authority, within the vLEI governance framework |
| Swiss trust statements | Swiss and domain-specific governance and authorisation |
| Relying-party policy | Whether those assertions satisfy the local transaction |

A graph may connect these. One must not silently substitute for another.

The objective is interoperability between trust domains without collapsing them
into a single global governance system: global standards, local governance.

---

## What a gap is not

A gap recorded here is a requirement, not an implementation. None of these has
been built, endorsed by the swiyu programme, or reviewed by a standards body.
Recording a gap says that this project met the requirement while building or
specifying a flow, that it could state the requirement precisely, and that the
current profiles do not define a mechanism for it.
