# Integration guide

For a practice management system, pharmacy software or insurer back office that
wants to issue or verify credentials. Written against this repository's
`@didas/swiyu` package, but the API surface is the generic components' and is
the same from any language.

## What you integrate with and what you don't

You talk to **two management APIs**, both HTTP and JSON:

```
swiyu-issuer      POST /management/api/status-list
                  POST /management/api/credentials
                  PATCH /management/api/credentials/{id}/status

swiyu-verifier    POST /management/api/verifications
                  GET  /management/api/verifications/{id}
```

The generic components provide the protocol layer, so an integrating system does
not implement OpenID4VCI, OpenID4VP, DPoP, key attestation, application-layer
encryption, signed issuer metadata, SD-JWT assembly and disclosure handling, JAR
signing, response decryption, key binding verification, identifier resolution,
status list signing and publication, or trust marker evaluation.

That is where protocol conformance is decided, which is the argument for not
reimplementing it in each practice management system.

**Endpoint paths verified** against the swiyu
[generic issuer](https://swiyu-admin-ch.github.io/cookbooks/onboarding-generic-issuer/)
and
[generic verifier](https://swiyu-admin-ch.github.io/cookbooks/onboarding-generic-verifier/)
cookbooks. Note that the `swiyu-verifier` repository README shows
`POST /management/verifications` without the `api` segment; the cookbook and this
repository's client both use `/management/api/verifications`. Confirm against the
Swagger UI of your own deployment before relying on either.

## Issuing a credential

```ts
import { IssuerManagementClient, IMMUNIZATION, reviewIssuance } from '@didas/swiyu';

const issuer = new IssuerManagementClient({ baseUrl: process.env.PRAXIS_ISSUER_URL });

// 1. Governance first: refuse before anything reaches the issuer.
const decision = reviewIssuance(IMMUNIZATION, myRoles);
if (decision.outcome === 'deny') throw new Error(decision.reasons.at(-1));

// 2. A status list, once per issuer. Immutable after initialisation.
//    Two bits per entry: the only setting that supports revocation AND suspension.
const list = await issuer.createStatusList({ maxLength: 10_000, config: { bits: 2 } });

// 3. The offer. The deeplink is what goes in the QR code.
const offer = await issuer.createOffer({
  metadata_credential_supported_id: [IMMUNIZATION.configurationId],
  credential_subject_data: { /* claims */ },
  offer_validity_seconds: 86_400,
  credential_valid_from: new Date().toISOString(),
  credential_valid_until: farFuture.toISOString(),
  status_lists: [list.statusRegistryUrl],
});
```

Keep `offer.management_id`. It is the only handle you have on the credential
afterwards: revocation, suspension and status queries all take it.

### Constraints worth knowing before you start

- **`status_lists` takes the `statusRegistryUrl`, not the id.** Creating a status
  list returns both; the credential offer references the URL. Store the URL.
- **Plan status list capacity up front.** The generic-issuer cookbook's example
  creates a list with `maxLength: 100000` at two bits per entry, and states that
  the maximum status list file size is currently 200 kB, "subject to evaluation
  and might change for go-live". This project treats 100'000 entries as the
  working ceiling on that basis; it is a derived figure, not a documented limit.
  *Not verified here:* whether a status list's type, config or length can be
  changed after initialisation. This repository assumes they cannot.
- **`exp` and `expiry_date` are different.** `credential_valid_until` sets `exp`:
  past it, the credential cannot be presented at all. A business `expiry_date`
  claim only warns the holder and leaves the decision to the verifier. Collapsing
  the two removes judgement from cases where it belongs.
- **Set `credential_refresh_disabled`** for anything single-use. A wallet that
  can silently re-fetch a prescription defeats redemption-by-revocation.

## Verifying a presentation

```ts
import {
  VerifierManagementClient, assertVerificationRequest, credentialQuery, dcqlQuery,
  reviewRequest, reviewPresentation, disclosedClaims, IMMUNIZATION,
  SANDBOX_HEALTH_POLICY,
} from '@didas/swiyu';

const claims = ['target_disease', 'occurrence_date', 'dose_number', 'doses_in_series'];

// 1. Am I entitled to ask for these?
const allowed = reviewRequest({ definition: IMMUNIZATION, role: myRole, requestedClaims: claims });
if (allowed.outcome === 'deny') throw new Error(allowed.reasons.at(-1));

// 2. Build the request. Both flags are MUSTs of the profile.
const request = {
  dcql_query: dcqlQuery(credentialQuery({
    id: 'immunization', definition: IMMUNIZATION, claims,
    acceptedIssuerDids: [PRACTICE_DID],
  })),
  jwt_secured_authorization_request: true,
  response_mode: 'direct_post.jwt' as const,
  accepted_issuer_dids: [PRACTICE_DID],
  verification_purpose: {
    scope: 'ch.didas.health.immunization.status',
    purpose_name: { default: 'Check vaccination protection' },   // ≤ 40 chars
    purpose_description: { default: '…' },
  },
};
assertVerificationRequest(request);   // fail here, ahead of the wallet

const verification = await verifier.createVerification(request);
// → verification.verification_deeplink into a QR code; state starts PENDING

// 3. Read the outcome.
const result = await verifier.get(verification.id);
const decision = reviewPresentation(
  result.credential_evaluation?.immunization?.[0],
  SANDBOX_HEALTH_POLICY,
);
if (decision.outcome === 'allow') {
  const released = disclosedClaims(result, 'immunization');
}
```

### Constraints worth knowing before you start

- **`purpose_name` is capped at 40 characters.** Trust Protocol 2.0 states that a
  vqPS `purpose_name` **MUST NOT** contain more than 40 characters per locale.
  This project has observed the verifier's own management API accepting longer
  values, so a name that passes locally can still fail at publication; that
  observation is not documented in any source reachable here.
  `assertVerificationRequest` enforces 40 either way.
- **The verifier can register the vqPS for you.** Where
  `SWIYU_TMS_AUTHORING_URL` is configured, supplying `verification_purpose` in
  the request makes the generic verifier register or reuse a vqPS with the Trust
  Management Service and inject it into the signed authorization request. This
  repository instead submits statements itself with `scripts/vqps.ts`, so that the
  published statement is generated from the same objects the verifier sends.
- **`multiple` is NOT SUPPORTED, and the multi-query case is under
  clarification.** This demonstrator places two Credential Queries in one
  authorization request for F-04, one for the Beta-ID and one for the insurance
  card. OpenID4VP 1.0 defines several Credential Queries in the `credentials`
  array. `swiss-profile-verification:1.0.0` §6.1 states that `multiple` is NOT
  SUPPORTED and adds that "only a single credential can be used in a
  verification". Conformance of the multi-query pattern therefore remains under
  clarification; see
  [GP-01](swiss-profile-gaps.md#gp-01--multi-credential-and-multi-instance-presentation-semantics).
  Plan for the possibility that a deployment has to send separate
  verifications.
- **Always set `accepted_issuer_dids` or `trust_anchors`.** Without either, every
  issuer DID is accepted and you cannot evaluate your counterparty at all.
- **`PENDING` is normal.** Poll, or take the webhook. The wallet is showing the
  presentation request to the holder for confirmation.
- **A declined request is not an error.** `client_rejected` is a defined
  response and your flow must work when it arrives.
- **Claims come back keyed by DCQL query id.** Credential type is not the key.

## Using what you receive

```ts
import { projectToFhir, projectToOpenEhr, definitionByVct } from '@didas/swiyu';

const definition = definitionByVct('urn:vct:ch.didas.health.immunization:1.0')!;
const { resource, unmapped } = projectToFhir(definition, released);
```

Two properties you must design around:

1. **The projection is derived, not authoritative.** The signed credential is
   the evidence; the FHIR resource carries no signature. If you need provenance,
   retain the presentation itself.
2. **The projection is legitimately partial.** After selective disclosure a
   `DiagnosticReport` may have findings and no patient name. Treating a missing
   element as an error will break you on the first minimal presentation. This is
   the real integration cost of the approach.

`unmapped` lists disclosed claims with no binding, so a modelling gap surfaces
instead of silently losing data.

## Error handling

| You see | It means |
| --- | --- |
| `ProtectedClaimError` | You asked for a protected field without an entitlement. Not retryable. |
| `ConformanceError` | Your request violates the Swiss Profile. The findings name the clause. |
| `SwiyuApiError` 4xx | The generic component rejected it. Read the body. |
| `SwiyuApiError` 0 | Network. The component is down or unreachable. |
| `credential_revoked` / `_suspended` | The status list says no. Terminal for revoked. |
| `credential_missing_data` | The credential presented does not contain the required fields. |
| `client_rejected` | The holder rejected the verification request. A normal outcome. |
| `issuer_not_accepted` | The issuer was not in the allow-list given in the request. |
| `holder_binding_mismatch` | The holder's proof of control over the credential was invalid. |

The codes above are those this project handles. The generic verifier defines
more; see `VerificationErrorResponseCode` in the
[swiyu-verifier documentation](https://github.com/swiyu-admin-ch/swiyu-verifier).

## Checklist before you go live

- [ ] `preflight` and `spaces` pass; you know which environment your DIDs are in
- [ ] Separate keys: `assert-key-01` credentials, `assert-key-02` status list, `auth-key-01` JAR
- [ ] `keys/` **and** `.didtoolbox/` backed up. Losing the update key means a DID you can never change
- [ ] `EXTERNAL_URL` is https and reachable from a phone
- [ ] Config regenerated for that exact URL (the metadata SRI-hashes what it serves)
- [ ] A vqPS published for every verification scope you send
- [ ] `SWIYU_TRUST_POLICY=strict` if this is production
- [ ] You store `management_id` for every credential you issue
- [ ] Your journal records claim names and not values
- [ ] Your flow degrades gracefully when the holder declines

## Reference

- [Credential reference](credentials/README.md): claims, bindings, entitlements
- [Architecture](architecture.md): how the layers fit
- [Swiss Profile conformance](spec-conformance.md): every rule and where it comes from
- [Governance framework](governance-framework.md): the gates in detail
- [Sandbox onboarding](onboarding-sandbox.md): getting DIDs and tokens
