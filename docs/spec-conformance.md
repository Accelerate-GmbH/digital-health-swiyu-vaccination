# Swiss Profile conformance

The rules this project enforces, each traced to the specification section that
states it. It is a record of what has been checked, not a certification: rules
are enforced against the profile text, not against a live deployment, and nothing
here has been run against production. See
[`source-verification.md`](source-verification.md) for what was and was not
verified against a primary source.

Rules marked **checked** are asserted by `packages/swiyu/src/conformance.ts` and
covered by `packages/swiyu/test/conformance.test.ts`; a violation fails the build
or the request rather than reaching a wallet.

Profiles are pinned in `packages/swiyu/src/profile.ts`, one file to change when
the profile moves.

**Specification requirement or project policy.** The tables below carry rules
from the Swiss Profiles and from Trust Protocol 2.0. Where this project enforces
something the specifications do not require — a stricter limit, an additional
refusal, a deployment convention — the row is marked **[project policy]** and
names the reason. Those rows are this repository's choices and are not
conformance requirements for anyone else.

**On the section numbers.** Each profile states that its subsections "rely on the
numbering from the original reference specification", and a profile embeds more
than one specification. `swiss-profile-vc` alone contains Token Status List
Draft 20, RFC 9901, SD-JWT VC Draft 15 and OCA 1.0, so a bare "§7.1" in it means
*Status Types Values* under the status list and *Rendering Metadata* under
SD-JWT VC — two different rules. Nine references in the table below were bare and
therefore ambiguous. The Source column now names the embedded specification
first, so each row resolves to one place.

## Cryptography · all profiles

| Rule | Source | Status |
| --- | --- | --- |
| JWS algorithm MUST be ES256 | all four profiles, "Cryptography" | **checked** in issuer metadata |
| Encryption MUST be ECDH-ES with P-256 | issuance, verification, vc | emitted in metadata |
| Hash function MUST be sha-256 | vc | used for SRI and CESR digests |
| `did:webvh` hash SHA-256, cryptosuite `eddsa-jcs-2022` | anchor | onboarding |

## swiss-profile-issuance:1.0.0 · OpenID4VCI 1.0 + DPoP

| Rule | Source | Status |
| --- | --- | --- |
| `profile_version` REQUIRED in metadata body and JWT headers | §12.2.4 | **checked** |
| Only IETF SD-JWT VC is supported; the Credential Format Profiles "ISO mdoc" and "W3C VCDM" are NOT SUPPORTED | §3.3.1 | **checked** |
| Pre-authorized code flow MUST be supported; authorization code flow NOT | §3.3.3, §3.4 | only flow used |
| `authorization_details` and `scope` NOT SUPPORTED | §3.3.4, §12.2.4 | **checked** |
| `nonce_endpoint` REQUIRED | §12.2.4 | **checked** |
| `authorization_servers`, `notification_endpoint` NOT SUPPORTED | §12.2.4 | **checked** |
| `credential_request_encryption.encryption_required` MUST be true | §12.2.4 | **checked** |
| `credential_response_encryption.encryption_required` MUST be true | §12.2.4 | **checked** |
| `cryptographic_binding_methods_supported` MUST be `jwk` | §12.2.4 | **checked** |
| `proof_types_supported` MUST be `jwt` | §12.2.4 | **checked** |
| `batch_size` MUST be ≥ 10 | §14.A | **checked** |
| Logos MUST be base64 data URLs, png or jpeg | §12.2.4 | **checked** |
| `claims[].mandatory` NOT SUPPORTED | §12.2.4 | **checked** |
| `display[].background_image`, `text_color` NOT SUPPORTED | §12.2.4 | **checked** |
| Signed metadata MUST be provided and used | §12.2.3 | generic issuer |
| Token and credential requests MUST carry DPoP | OID4VCI §6, §8.2 | generic issuer |
| Key attestation for hardware-bound credentials | Appendix D | generic issuer |
| Batch payload limit 20 MB | §8.3 | documented in `LIMITS` |

## swiss-profile-verification:1.0.0 · OpenID4VP 1.0 + JAR

| Rule | Source | Status |
| --- | --- | --- |
| `profile_version` REQUIRED in the JAR header | §5 | generic verifier |
| Verifiers MUST send a signed JAR | §5 | **checked** |
| `response_mode` MUST be `direct_post.jwt` | §5.2, §8 | **checked** |
| Client Identifier Prefix `decentralized_identifier` MUST be supported and SHOULD be used; an absent or unknown prefix MUST be interpreted as it | §5.9.2, §5.9.3 | generic verifier |
| DCQL `multiple` NOT SUPPORTED | OID4VP §6.1 | **checked** |
| Trusted authorities MUST use the `did` type | OID4VP §6.1.1 | **checked** |
| ISO mdoc claim semantics NOT SUPPORTED | §7.2 | **checked** via format |
| `transaction_data` NOT SUPPORTED | §5.1, §8.4 | not used |
| `request_uri_method` post NOT SUPPORTED | §5.10 | not used |
| `aud` of the request object MUST be `https://self-issued.me/v2` | §5.8 | generic verifier |
| Wallet schemes `openid4vp://` and `swiyu-verify://` | §9 | generic verifier |
| Authorization response size 21 MB | §13 | documented in `LIMITS` |

**[project policy]** `checkVerificationRequest()` refuses a request that sets
neither `accepted_issuer_dids` nor `trust_anchors`. No profile requires this.
The reasoning is that `swiss-profile-trust` requires an actor to evaluate its
counterparty's trust markers, and a request accepting every issuer identifier
leaves nothing to evaluate. Other deployments may reasonably decide otherwise.

## swiss-profile-vc:1.0.0 · SD-JWT VC, Token Status List, OCA

| Rule | Source | Status |
| --- | --- | --- |
| `profile_version` REQUIRED in the Status List Token JWT header, the SD-JWT VC header, the VCT body and the OCA bundle | TSL §5, SD-JWT VC §5, OCA | **checked** |
| Media type MUST be `application/dc+sd-jwt` | RFC 9901 §9.11 | constant |
| "An SD-JWT VC **MUST** only have selectively disclosable claims, apart form the claims listed in 3.2.2.2 Registered JWT Claims. Other non-selectively dislosable claims **MUST NOT** be supported and **MUST** be rejected." (quoted as written, two typos included) | SD-JWT VC §3.2.2.4 | credential definitions |
| `_sd_alg` MUST be sha-256; decoy digests NOT SUPPORTED | RFC 9901 §4.1.1, §4.2.5 | generic issuer |
| Array-element and recursive disclosures MUST be supported | RFC 9901 §4.2.2, §4.2.6 | used for `medication`, `findings` |
| Structured SD-JWT NOT SUPPORTED; flat and recursive only | RFC 9901 §6.3 | credential definitions |
| Status types limited to VALID, INVALID, SUSPENDED | TSL §7.1 | `TOKEN_STATUS` |
| CBOR/CWT/COSE status lists NOT SUPPORTED | TSL §4.3, §5.2, §6.3 | JWT only |
| Status list aggregation and historical resolution NOT SUPPORTED | TSL §8.4, §9 | not used |
| Status provider MUST be the FOITT registry | TSL §12.1 | deployment |
| Status list token > 200 bytes, ≤ 200 KB | TSL §13 | `LIMITS`, enforced on create |
| `exp` REQUIRED on the status list token; `iat` within 24 h | TSL §13 | generic issuer |
| `expiry_date` is a disclosure; `exp` MUST NOT be | SD-JWT VC §3.2.2.2 | credential definitions |
| Type Metadata `extends` and `extends#integrity` NOT SUPPORTED | SD-JWT VC §5.2 | generator emits none |
| Rendering `simple` and `svg_templates` NOT SUPPORTED | SD-JWT VC §7.1.1 to 2 | OCA only |
| Claim metadata NOT SUPPORTED | SD-JWT VC §8 | not emitted |
| OCA: exactly one root Capture Base | OCA, bundle | **checked** |
| OCA: `classification`, `flagged_attributes` NOT SUPPORTED | OCA, Capture Base | **checked** |
| OCA: overlay set limited to the profile's list | OCA, Overlays | **checked** |
| OCA: Branding Overlay media MUST be data URLs | OCA, Branding | **checked** |
| OCA: Label 1.1, Branding 1.1, Data Source 2.0, Order 1.0 | OCA, Additional Overlays | generated |
| CESR SHA-256 self-addressing digests | OCA, CESR encoding | `cesr.ts`, tested |

## swiss-profile-anchor:1.0.0 · DID Core + did:webvh

| Rule | Source | Status |
| --- | --- | --- |
| `kid` MUST be an absolute `{DID}#{key}`; neither part may contain `#` | JWT validation | generic components |
| `iss` is optional and MUST be ignored if present | JWT validation | generic components |
| `publicKeyJwk` REQUIRED; `publicKeyMultibase` MUST NOT be used | §5.2.1 | onboarding |
| `service`, `alsoKnownAs`, `keyAgreement`, `capability*` NOT SUPPORTED | §5, §5.3 | onboarding |
| `portable` false, `witness` `{}`, `watchers` `[]` | §3.7.1 | onboarding |
| `/whois` and did:web fallback NOT SUPPORTED | §2.1, §3.8 | Trust Protocol instead |

## Trust Protocol 2.0 · swiss-profile-trust:1.0

| Rule | Source | Status |
| --- | --- | --- |
| An actor MUST decline a trust relationship with `gucTM` but without `gucaTM` | Trust requirements | enforced under every policy |
| An actor SHOULD decline one without `viTM` | Trust requirements | strict policy; waiver recorded under sandbox |
| The wallet MAY decline one without `caTM`, and one without `tvTM` | Trust requirements | strict policy |
| `personal_administrative_number` (AHV number) is the one protected field; it needs special permission to verify regardless of the VCT carrying it | Protected fields | enforced at query construction; refuses without entitlement |
| vqPS `purpose_name` MUST NOT exceed 40 characters; `purpose_description` MUST NOT exceed 1000 | TP 2.0, vqPS | **checked**; `scripts/vqps.ts` refuses to emit past either |
| **[project policy]** `purpose_description` is additionally capped at 500 characters in `conformance.ts` | the verifier management API's own limit, stricter than the protocol's 1000 | **checked** |
| Each DCQL Credential Query MUST carry a `meta` object with a non-empty `vct_values` | TP 2.0, Verification Type: DCQL | query construction |
| A verifier MUST provide the relevant vqPS to the wallet and MUST link its `scope` claim via the request's `scope` parameter | TP 2.0, Verification | generic verifier |

The signed vqPS is not assembled here. `scripts/vqps.ts` submits `sub`,
`purpose_name`, `purpose_description`, `scope` and `query` to
`POST /api/v1/trust/vqps-submissions`, and the Trust Registry signs and
publishes the statement: it is the registry that produces the
`swiyu-verification-query-public-statement+jwt` header, wraps `scope` and
`query` into the `request` object with `"type": "DCQL"`, and flattens the
localised maps into `purpose_name#<lang>` claims. The submission shape is the
one the onboarding cookbook documents, which is why it differs from the
statement shape in the protocol specification.

## Change dossiers tracked

| CD | Effect here |
| --- | --- |
| CD-001 Actors restriction, Sandbox/prod separation | `did:webvh` only; Sandbox Wallet only; Sandbox hosts in `SANDBOX` |
| CD-002 Issuer security enforcements | generic issuer |
| CD-004 Verifier security enforcements | generic verifier |
| CD-005 DPoP enforcement | generic issuer |
| CD-006 Trust Protocol 2.0 | marker model in `governance.ts` |
| CD-007 Ed25519VerificationKey removed | ES256 / P-256 only |

## What is not covered

The bundled mock performs **no signing, no DPoP, no encryption and no DID
resolution**. Everything attributed above to "generic issuer" or "generic
verifier" is unexercised when `SWIYU_MODE=mock`. Protocol conformance is
established by running against real generic components and, for the wallet side,
against the [swiyu generic application
test](https://github.com/swiyu-admin-ch/swiyu-generic-application-test) and
[test wallet](https://github.com/swiyu-admin-ch/swiyu-generic-test-wallet).
