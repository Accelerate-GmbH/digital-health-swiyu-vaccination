# Beta-ID

Sandbox pseudo-identity credential carrying the attribute set of the future e-ID.

| | |
| --- | --- |
| **`vct`** | `betaid-sdjwt` |
| **Configuration id** | `betaid_sd_jwt` |
| **Format** | `dc+sd-jwt` |
| **Profile** | `swiss-profile-vc:1.0.0` |
| **Refreshable** | unspecified |
| **Claims** | 5 |

### Displayed as

| Locale | Name | Description |
| --- | --- | --- |
| `de-CH` | Beta-ID | Pseudo-Identitätsnachweis der Sandbox mit den Attributen der künftigen E-ID. |
| `fr-CH` | Beta-ID | n/a |
| `it-CH` | Beta-ID | n/a |
| `en-GB` | Beta-ID | Sandbox pseudo-identity credential carrying the attribute set of the future e-ID. |

## Governance

This credential type carries no governance block, because this project does
not govern it. See the issuing authority.



## Claims

`swiss-profile-vc:1.0.0` §3.2.2.4: an SD-JWT VC **MUST** only have
selectively disclosable claims, apart from the registered JWT claims of
§3.2.2.2, and other non-selectively-disclosable claims **MUST NOT** be
supported and **MUST** be rejected. So every claim in the table below is one
the holder releases or withholds; the credential cannot make any of them
mandatory to release.

Which claims are asked for is the verifier's decision and the credential
format does not constrain it. What this repository does about that is publish
each query it sends — its purpose, its scope and the DCQL query — as a
Verification Query Public Statement, see
[governance framework](../governance-framework.md#transparency-the-vqps).
That publishes the query shape, not the transaction. Whether a given request
is proportionate is a separate question, answered per credential and per
process, and this repository does not answer it here.

| Claim | Label | Type | Constraint | Semantic binding | Notes |
| --- | --- | --- | --- | --- | --- |
| `given_name` | Given name(s) | Text | string | n/a | n/a |
| `family_name` | Surname | Text | string | n/a | n/a |
| `birth_date` | Date of birth | DateTime | string, date | n/a | n/a |
| `age_over_18` | Over 18 | Boolean | boolean | n/a | n/a |
| `personal_administrative_number` | Social security number | Text | string | n/a | **protected field** |

## Generated artefacts

Produced by `npm run generate:config`, bound to each other by SRI hash:

| Artefact | Path | Served at |
| --- | --- | --- |
| SD-JWT VC Type Metadata | `config/<actor>/credentials/betaid-sd-jwt/vct.json` | `/oid4vci/vct/betaid-sd-jwt` |
| JSON Schema | `config/<actor>/credentials/betaid-sd-jwt/schema.json` | `/oid4vci/json-schema/betaid-sd-jwt` |
| OCA bundle | `config/<actor>/credentials/betaid-sd-jwt/oca.json` | `/oid4vci/oca/betaid-sd-jwt` |

---

*Generated from `packages/swiyu/src/credentials/betaid_sd_jwt.ts`. Do not edit by hand.*
