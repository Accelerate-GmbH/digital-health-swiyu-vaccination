# Running against the swiyu Sandbox

The demo runs offline by default. This is what it takes to run the same code
against the real Sandbox trust infrastructure.

Budget a day for a first onboarding, mostly waiting on portal steps. Repeat it
per actor. In the model used here each actor is a separate organisation with its
own identifier; whether a given deployment needs one identifier per legal entity,
per organisational unit or per service is a decision for that deployment and for
the applicable swiyu onboarding rules, not something this runbook settles.

**How to read this runbook.** Steps marked *required by swiyu* follow the
programme's own onboarding process. Steps marked *this demonstrator* are choices
made here and may not apply elsewhere. Anything else is suggested operational
practice. Where this text and the current swiyu onboarding documentation differ,
the latter is correct; the
[cookbooks](https://swiyu-admin-ch.github.io/cookbooks/) are the authoritative
source.

> **This is the Sandbox.** The environment formerly called Public Beta was
> renamed Sandbox by change dossier CD-001 and separated from production. Use
> the **swiyu Sandbox Wallet** ([iOS](https://apps.apple.com/us/app/swiyu-sandbox-wallet/id6771296857),
> [Android](https://github.com/swiyu-admin-ch/eidch-android-wallet/releases)).
> the production swiyu Wallet will refuse these credentials.

## What only a person can do

Three steps in this runbook require an authorised representative of the
organisation to act, because they bind an organisation to a cryptographic
identity. They are not suitable for an unattended CI job. Whether an
organisation may have an agent carry them out on its behalf is a question for its
own governance and for the applicable swiyu terms, and is not determined here:

1. **The ePortal account and business partner registration.** A federal ePortal
   account for the organisation, then a business partner under it.
2. **The trust onboarding.** Proving control of the DID's assertion key to the
   Trust Registry, which is what yields the Verified Identity Trust Marker.
3. **Accepting that DIDs are chargeable.** The Base Registry bills per hosted
   DID. Decide how many you actually need before creating them.

Everything else is scripted: key generation, DID logs, API calls, deployment.

### Limits and costs

| | |
| --- | --- |
| Business partners per ePortal account | 50 |
| DIDs per business partner | 100. **Each DID is charged** |
| Status lists per business partner | 200 |

One business partner can hold several DIDs, so a four-actor demo needs **one**
registration. Trust onboarding is still per DID.

### The leanest setup that shows the showcase

| Actor | DID | Keys | Why |
| --- | --- | --- | --- |
| Practice | 1 | assert ×2 (SD-JWT, status list), auth ×1 | Issues the immunization credential and verifies at check-in |
| Travel clinic | 1 | auth ×1 | Verifies four claims. This is the demonstration |

Two DIDs. The insurer and pharmacy can come later; the Beta-ID is free from the
Beta Credential Service. Check-in needs an insurance card, so either add a third
DID for the insurer or run the immunization flow on its own.

## The scripted path

Once you have an ePortal account, a business partner and API tokens,
`scripts/onboard.sh` does the rest. It needs `curl`, `jq`, `openssl` and a
Java runtime:

```bash
cp .env.onboard.example .env.onboard     # fill in PARTNER_ID and the tokens
./scripts/onboard.sh preflight            # tokens valid? subscribed to the right APIs?
./scripts/onboard.sh spaces              # read-only: which environment are you actually in?
CREATE_SPACE=yes \
./scripts/onboard.sh did praxis          # claim a space, make keys, upload the DID log
#  → start the trust onboarding for this DID in the Service Portal, then:
./scripts/onboard.sh trust-first praxis
./scripts/onboard.sh did travel-clinic
./scripts/onboard.sh trust-add praxis travel-clinic
./scripts/onboard.sh vqps                # publish what each verifier asks for
./scripts/onboard.sh env                 # DIDs and verification methods
./scripts/onboard.sh env --with-keys     # ...plus the PEM keys, into .env.generated (0600)
```

`env` prints to stdout and deliberately leaves private keys out of your
terminal scrollback. `--with-keys` writes `.env.generated` instead, mode 600
and git-ignored, with each PEM flattened to the single-line `\n`-escaped form
the generic components expect.

Private keys are generated on your machine under `.swiyu/<actor>/.didtoolbox/`,
are git-ignored and are never transmitted. The DID log that *is* uploaded
contains public keys only. **Back that directory up**: a lost signing key means
a DID you can no longer update and a lost assertion key means credentials you
can no longer revoke.

Two guards worth knowing about:

- **`spaces` before `did`.** It is read-only and free, it proves the tokens
  work and it prints the registry host your DIDs would actually live on. That
  host, not the API host you call, decides whether a DID is a Sandbox DID or
  a production one, because the DID is derived from it. Check it before you
  spend anything.
- **`CREATE_SPACE=yes` is required** to request a new DID space, because each
  one is chargeable. Without it the script stops and tells you what it would
  have bought.

Running against production instead of the Sandbox: `SWIYU_ENV=prod`. The
default is `sandbox` and CD-001 keeps the two strictly apart. A credential
issued in one cannot be presented in the other and each needs its own wallet.

Subscribing an application to a new API does **not** widen tokens you already
hold; mint fresh ones afterwards or `preflight` will tell you the subscription
is missing.

The manual steps below are what the script automates, kept for when something
goes wrong and you need to see the actual call.

## 1 · Business partner and API access

1. Register on the [swiyu Service Portal](https://portal.trust-infra.swiyu-int.admin.ch)
   and note your `PARTNER_ID`.
2. Subscribe to the swiyu Trust Infrastructure APIs on the
   [API self-service portal](https://selfservice.api.admin.ch/api-selfservice/apis).
   You need `swiyucorebusiness_status` for status lists.
3. Save the customer key, customer secret, access token and refresh token. The
   refresh token is shown once.

## 2 · Keys and DID

Use [DID Toolbox](https://github.com/swiyu-admin-ch/didtoolbox-java/releases/latest)
**2.1.0 or newer**. CD-001 requires new DIDs to use `did:webvh` and older
tooling emits the superseded `did:tdw` spelling.

```bash
# Reserve an identifier entry; keep the identifierRegistryUrl it returns.
curl -X POST -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://identifier-reg-api.trust-infra.swiyu-int.admin.ch/api/v1/identifier/business-entities/$PARTNER_ID/identifier/"

# Generate the DID log.
java -jar didtoolbox.jar create --identifier-registry-url "$IDENTIFIER_REGISTRY_URL"

# Upload it.
curl -X PUT -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' \
  --data @did.jsonl \
  "https://identifier-reg-api.trust-infra.swiyu-int.admin.ch/api/v1/identifier/business-entities/$PARTNER_ID/identifier-entries/$ENTRY_ID"
```

Three P-256 key pairs per issuing actor, each with one job:

| Key | Verification method | Used for |
| --- | --- | --- |
| `assert-key-01` | `#assert-key-01` | Signing issued credentials |
| `assert-key-02` | `#assert-key-02` | Signing the status list token |
| `auth-key-01` | `#auth-key-01` | Signing the verifier's JAR |

Separate keys are not ceremony: the status list is published publicly and
re-signed daily, while the credential signing key should be used as little as
possible. A verifier-only actor needs the authentication key alone.

> **`didtoolbox create` on its own generates only `assert-key-01`.** Left to
> itself it gives you one assertion key, which forces the credential signing
> key to double as the status list key. `onboard.sh` therefore generates the
> three P-256 pairs with `openssl` and passes their public keys in:
>
> ```bash
> java -jar didtoolbox.jar create -u "$IDENTIFIER_REGISTRY_URL" \
>   -a assert-key-01,keys/assert-key-01.pub \
>   -a assert-key-02,keys/assert-key-02.pub \
>   -t auth-key-01,keys/auth-key-01.pub > did.jsonl
> ```
>
> The Ed25519 **DID update key** is still generated by the toolbox itself into
> `.didtoolbox/id_ed25519`. Losing it means a DID you can never change again,
> so back up `keys/` *and* `.didtoolbox/`.

> **Reading the DID back out of the log: use `.state.id`.**
> The first log entry contains `"method":"did:webvh:1.0"` in `parameters`,
> which appears *before* the identifier, so `grep -o 'did:webvh:[^"]*'`
> happily returns `did:webvh:1.0` and everything downstream is silently wrong.
>
> ```bash
> DID=$(head -1 did.jsonl | jq -r '.state.id')
> ```

Then complete the trust onboarding in the Service Portal with a proof of
possession JWT signed with the assertion key. That yields the Verified Identity Trust
Marker. Consider migrating to
[Trust Protocol 2.0](https://swiyu-admin-ch.github.io/change-dossiers/CD-006-Trust-Protocol-2.0/)
at the same time.

> **The role grant does not exist yet.** `viTM` says the Confederation verified
> *who* you are. It does not say you are a medical practice authorised to
> vaccinate. That statement needs a health-domain governance body and there
> isn't one. Until there is, verification relies on explicitly listed issuer
> DIDs. See [F-01](../flows/F-01-actor-onboarding.md), open question 1.

## 3 · Publish what each verifier will ask for (vqPS)

This is the step most easily mistaken for "we need a governance body first". It
is not. It is self-service and it is the mechanism by which a verifier states
publicly what it intends to request.

A **Verification Query Public Statement** is a signed JWT published to the Trust
Registry carrying a scope, a localised purpose and the DCQL query itself. Submit
one per verifier DID per query:

```bash
curl -X POST -H "Authorization: Bearer $TRUST_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  "https://trust-reg-api.trust-infra.swiyu-int.admin.ch/api/v1/trust/vqps-submissions" \
  -d '{
    "sub": "'"$TRAVEL_CLINIC_DID"'",
    "scope": "ch.didas.health.immunization.status",
    "purpose_name": { "default": "Check vaccination protection" },
    "purpose_description": { "default": "Asks only which diseases you were vaccinated against and when, but not the vaccine brand, the batch number, or the organisation that administered the dose." },
    "query": { "credentials": [ { "id": "immunization", "format": "dc+sd-jwt",
      "meta": { "vct_values": ["urn:vct:ch.didas.health.immunization:1.0"] },
      "claims": [ {"path":["target_disease"]}, {"path":["occurrence_date"]},
                  {"path":["dose_number"]}, {"path":["doses_in_series"]} ] } ] }
  }'
```

The scope, purpose and query are exactly the `verification_purpose` and
`dcql_query` this project already builds, so the published statement and the
running verifier cannot disagree.

> **A limit worth noting.** Trust Protocol 2.0 says a vqPS `purpose_name`
> MUST NOT contain more than **40 characters** per locale, while the generic
> verifier's own management API accepts 50. A 45-character name passes locally
> and fails at publication. `conformance.ts` enforces 40 for this reason.

### What is still not possible

Publishing *what you ask for* is self-service. Being certified as *entitled to
ask*, the Governed Use Case Authorization Trust Marker naming a health
credential type, is not, because no health-domain governance body exists to
issue it. Until one does, verification relies on `accepted_issuer_dids`, which
this project sets on every request and which is sufficient for a pilot.
See [F-01](../flows/F-01-actor-onboarding.md).

## 4 · Generate the configuration

```bash
npm run generate:config -- \
  --insurer-url       https://insurer.example.ch \
  --praxis-url        https://praxis.example.ch \
  --pharmacy-url      https://pharmacy.example.ch \
  --travel-clinic-url https://travel.example.ch
```

These URLs are baked into the generated metadata, because the issuer metadata
carries an SRI hash over the exact bytes of the Type Metadata document. Change a
URL, regenerate. This is a deployment step that recurs.

The generator runs the conformance checks and fails before emitting
metadata a wallet would reject.

## 5 · Start the components

```bash
cp .env.example .env    # fill in from steps 1 and 2
docker compose up
```

`EXTERNAL_URL` must be an **https** URL the wallet can actually reach, from a
phone, over the public internet, with a certificate it trusts. The wallet refuses
plain http and `localhost` is not reachable from a phone.

In practice this means one of:

| | Good for | Watch out for |
| --- | --- | --- |
| A tunnel (`cloudflared`, `ngrok`) from a laptop | A demo you run yourself | The URL changes each restart and the generated config is pinned to it. Regenerate every time |
| A small VPS or cloud host with a real certificate | A demo other people can try | Needs a stable hostname, which is what you want anyway |

Whichever you pick, the URL goes into the config generation in step 4 as well
as into the environment: the issuer metadata carries an SRI hash over the exact
bytes of the Type Metadata document served at that URL.

## 6 · Run the business application

```bash
SWIYU_MODE=sandbox npm start
```

Get a Beta-ID from the [Beta Credential Service](https://www.bcs.admin.ch/bcs-web)
It carries a subset of the EID content of Art. 15 para. 1 BGEID plus a derived
`age_over_18`. Then walk the journey, scanning each QR code with the Sandbox
Wallet.

## Checks when something does not work

| Symptom | Usual cause |
| --- | --- |
| Wallet refuses to open the deeplink | `EXTERNAL_URL` is http, unreachable, or has a certificate the phone rejects |
| Wallet reports invalid metadata | Config generated for a different URL than the issuer serves; regenerate |
| Credential collected but blank in the wallet | OCA bundle unreachable or its SRI hash does not match; every OCA object must be valid or the whole bundle is discarded |
| Verification always fails | `accepted_issuer_dids` does not contain the actual issuer DID |
| Status list upload rejected | `iat` older than 24 hours, `exp` missing or past, or the token exceeds 200 KB |
| Production swiyu Wallet refuses everything | Expected under CD-001. Use the Sandbox Wallet |

## Validating properly

The mock establishes nothing about protocol conformance. Against real components, use
the Confederation's own harnesses:

- [swiyu-generic-application-test](https://github.com/swiyu-admin-ch/swiyu-generic-application-test)
- [swiyu-generic-test-wallet](https://github.com/swiyu-admin-ch/swiyu-generic-test-wallet)

## From the Sandbox to production

The application code does not change. The environment, the onboarding and one
environment variable do.

### Onboarding stops being optional

Both environments ask for the same two registrations. The Sandbox treats four
of the steps inside them as optional. Production does not.

| Register | Required in both | Required only in production |
| --- | --- | --- |
| Base Register | Profile creation, DID setup | Payment |
| Trust Register | Additional data entry, proof of DID controllership | A formal declaration signed with a qualified electronic signature, payment, official verification of the organisation |

The Identity Trust Statement a wallet checks before it shows a consent screen
is worth something in production because a person at the Confederation verified
the organisation behind it. In the Sandbox that verification is skipped, which
is why this project runs the Sandbox trust policy described below.

### The addresses change and the two environments do not mix

Sandbox hosts carry a `swiyu-int` segment. Production uses the equivalent
`swiyu` hosts. CD-001 forbids mixing them and the wallets enforce it: the
Sandbox Wallet talks only to the Sandbox and the swiyu Wallet only to
production. A credential issued in one environment cannot be presented in the
other. The host in `identifierRegistryUrl` decides which environment a DID
lives in, so that is the value to check first when something is refused.

### The Beta-ID becomes the e-ID

Today the patient holds a Beta-ID from the Beta Credential Service and its data
is self-declared. In production the patient holds the e-ID and the
Confederation has verified the person behind it. The Beta-ID carries surname,
given names, date of birth and the AHV number, four of the nine items of EID
content listed in Article 15 paragraph 1 BGEID, plus the derived `age_over_18`.
F-04 asks only for claims in that set, so it keeps its shape. Only the issuer
DID and the `vct` change. A flow needing nationality, place of origin, place of
birth, sex or the facial image has nothing to test against today.

### The trust policy becomes strict

```bash
SWIYU_TRUST_POLICY=strict
```

The Sandbox policy keeps every MUST rule of the Swiss Profile and records the
SHOULD rules as waived, writing the reason for each waiver into the journal.
The strict policy requires a Verified Identity Trust Marker and a Compliant
Actor Trust Marker as well. Both policies enforce the governed use case rule,
which is a MUST and is not configurable.

### Ambition levels and what they mean for health

The swiyu Trust Protocol separates common trust building blocks from sectoral
governance. Identity Trust Statements and the Verification Query Public
Statement are common. Any onboarded actor gets them and they answer "who is
this" and "what do they say they will ask for". The right to issue a **governed
credential type** is sectoral and it is being opened in stages:

| | Scope |
| --- | --- |
| **AN1** | The e-ID only |
| **AN2** | Other authoritative public issuer credentials, from federal, cantonal or municipal authorities |
| **AN3** | The open ecosystem, where private and public issuers and verifiers meet and private organisations issue on the same infrastructure |

The levels are not a swiyu invention. They come from the Federal Office of
Justice discussion paper *Zielbild E-ID* of September 2021, chapter 4.2, and
Switzerland picked one. Respondents to the public consultation argued that an
ambition level 3 trust infrastructure was the one required. On 17 December 2021
the Federal Council took the direction-setting decision that the
infrastructure should carry more than the e-ID and should be open to cantonal
authorities and to private entities. AN3 is therefore the stated national
target rather than a stretch goal.

That is worth holding next to the footnote above. The target is AN3. The
delivered protocol reaches AN1 and AN2. This showcase needs AN3.

Protected Issuance Trust List and Auth Trust Statements, the mechanism behind
governed credential types, currently cover **AN1 and AN2**. Protected
Verification Auth Trust Statements, the mechanism behind protected fields,
currently cover **the AHV number only**, which is exactly the one protected
field this project handles.

Most issuers in this showcase are private organisations: a practice, a
pharmacy, an insurer. Governed issuance for them is an AN3 capability. A
cantonal vaccination service would fall under AN2. So the gap this repository
reports is two gaps stacked. No health-domain governance body has been stood up
to grant the role. The protocol layer that such a body would grant it through is
not yet open to private health issuers. Going to production does not resolve
either one.

swiyu's own position is that a sector brings its own governance. The
infrastructure supports it. Health has not yet done it.
