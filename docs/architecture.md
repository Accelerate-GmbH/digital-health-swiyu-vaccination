# Architecture

## The one-sentence version

Health records live in the patient's wallet as SD-JWT VCs; the clinical
information models of openEHR and HL7 FHIR are reused to describe them; the
swiyu generic components carry the protocol; and a governance layer decides who
may issue what and who may ask for which claims.

## Components

```mermaid
flowchart TB
    subgraph ours["This repository"]
        BA["Business applications<br/>insurer · practice · pharmacy · travel clinic"]
        GOV["Governance layer<br/>roles · entitlements · trust policy · journal"]
        DEF["Credential definitions<br/>claims + FHIR/openEHR bindings + governance"]
        PROJ["Projections → FHIR / openEHR"]
        CONF["Swiss Profile conformance checks"]
    end
    subgraph fed["Confederation, operated by FOITT"]
        GI["swiyu-issuer<br/>OID4VCI · DPoP · SD-JWT VC · status lists"]
        GV["swiyu-verifier<br/>OID4VP · JAR · decryption · status · trust markers"]
        BR["Base Registry<br/>DIDs · status lists"]
        TR["Trust Registry<br/>Trust Protocol 2.0"]
    end
    W["swiyu Sandbox Wallet<br/>(the patient's phone)"]

    DEF --> CONF --> GI
    DEF --> GV
    BA --> GOV
    GOV --> GI
    GOV --> GV
    GI <--> W
    GV <--> W
    GI --> BR
    GV --> BR
    GV --> TR
    GV --> PROJ --> BA
```

**What we do not implement, on purpose.** DPoP, key attestation, application-layer
encryption, signed issuer metadata, SD-JWT assembly and disclosure handling, JAR
signing, response decryption, key binding verification, DID resolution, status
list signing and publication, trust marker evaluation. All of it belongs to the
generic components. All of it is where conformance is decided and none of it
belongs in a practice management system. The business applications create offers,
state what they want to verify and read outcomes.

## The four layers

### 1 · Credential definitions: one source of truth

A credential type in this ecosystem needs four artefacts that must agree: the
OID4VCI `credential_configurations_supported` entry, the SD-JWT VC Type
Metadata, a JSON Schema and an OCA bundle for the wallet's rendering.
Hand-maintaining four documents per type is how they drift apart.

Here one `CredentialDefinition` generates all four
(`scripts/generate-config.ts`), computes the CESR self-addressing digests OCA
requires and the SRI hashes that bind the documents together and refuses to
emit anything the profile would reject. The definition also carries the two
things that are usually kept elsewhere: the **semantic bindings** onto FHIR and
openEHR and the **governance rules**: who may issue, who may ask, for what,
with what retention.

### 2 · Governance: decisions made in code

```mermaid
flowchart LR
    R["Request to verify"] --> RR["reviewRequest()<br/>role entitled? claims within envelope?<br/>protected fields authorised?"]
    RR -->|deny| J1["journal · refused, with reasons"]
    RR -->|allow| Q["Build DCQL · send"]
    Q --> P["Presentation"]
    P --> RP["reviewPresentation()<br/>status list → trust markers → policy"]
    RP --> J2["journal · decided, with reasons"]
    I["Request to issue"] --> RI["reviewIssuance()<br/>does this actor hold the issuer role?"]
    RI -->|deny| J1
```

Three properties hold:

- **Minimisation is enforced where the query is built.** After the wallet has
  answered, the data is out and a check at the verifier is only a promise.
- **MUST and SHOULD are kept apart.** A governed use case without authorization
  is refused under every policy. The profile's SHOULDs are waived under the
  Sandbox policy and *recorded as waived*, because a demo that silently drops
  rules teaches that the rules are optional.
- **The journal holds claim names and no claim values.** It evidences that an interaction was
  within the rules without becoming a second copy of the patient's data. A test
  asserts it.

### 3 · Protocol: the generic components

Each actor runs its own instances with its own DID. The management APIs are the
only surface the business applications touch
(`IssuerManagementClient`, `VerifierManagementClient`).

`SWIYU_MODE` switches between the bundled mock and real deployments. The mock
reproduces the management contract — the same paths and the same payload shapes
— so switching is a configuration change rather than a code change. It
reproduces **none** of the cryptography: no signing, no DPoP, no encryption and
no identifier resolution. The demonstration interface and the mock's own source
both state this.

### 4 · Projection: rebuilding FHIR and openEHR representations

At presentation time, a verifier rebuilds a FHIR resource or an openEHR flat
composition from the disclosed claims, locally. Derived, never authoritative;
legitimately partial. See [F-07](../flows/F-07-model-projection.md).

Claim bindings name the FHIR element path, the openEHR archetype and the node
name as published in the Clinical Knowledge Manager. The flat path alone would
not be enough: it is specific to an operational template this project does not
publish, so it cannot be checked and six of them were in fact wrong until they
were checked against CKM ([source verification](source-verification.md)).

This demonstrator reuses the information models and does not operate a FHIR
server or an openEHR clinical data repository. That is a scope choice for this
prototype rather than a position on either architecture, and it has a substantive
limitation: a credential is a point-in-time attestation, while a vaccination
record has to stay clinically usable over a lifetime, which is what a
longitudinal record provides. That limitation, the openEHR clinical data
repository showcase it comes from, and the two directions in which the layers
compose, are in [positioning](positioning.md).

## Why four separate actors

Four actors means four identifiers, four trust statements, four entitlements and
presentations that cross organisational boundaries. Modelling them as one
service would be simpler to run but would exercise none of that: the properties
this demonstrator is built to show only appear between separate organisations.
The check-in flow combines credentials from the Confederation and from an
insurer; the redemption flow requires the pharmacy to ask the practice to
revoke, because only the issuer can.

## Trade-offs taken

| Decision | Why | What it costs |
| --- | --- | --- |
| `vct` as a URN | Issued credentials and DCQL queries keep their meaning when a deployment moves host | An extra indirection through `vct_metadata_uri` |
| External URL baked into generated config | The issuer metadata hashes the exact bytes of the Type Metadata; a templated URL would hash a document never served | Config must be regenerated per environment |
| One credential per vaccination dose | Authorship stays with the administering party; each issuer revokes only its own assertion | "Is the series complete?" spans several credentials |
| Prescription revoked on dispensing | Single use, with the single-use property recorded only on the status list | A window between presentation and revocation (F-05) |
| Mock is not cryptographic | A mock that states which steps it omits is less misleading than one that appears complete | The mock establishes nothing about protocol conformance |
| In-memory demo state | The demo is a demo | Restarting loses the encounters; the credentials stay in the wallet |
