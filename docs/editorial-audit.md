# Editorial and claims audit

A file-by-file classification of every textual file in this repository, against
two standards: the register expected of DIDAS material, and the evidentiary
standard that each claim should be able to meet.

The audit was produced from a full local checkout, not from the GitHub web
interface, so the coverage below is complete rather than partial: 118 tracked
files, of which 84 carry prose.

## Classification scheme

| Class | Meaning |
| --- | --- |
| **OK** | No action. Register and claims are appropriate as they stand. |
| **Edit** | Register or phrasing needs work. Technical substance is sound. |
| **Verify** | Contains a statement whose truth must be checked against a primary source or a live component before it can stand. |
| **Rewrite** | Structure or framing is the problem, not individual sentences. |
| **Generated** | Produced by a script. Fix the generator, never the file. |

## The editorial standard applied

1. **Credential lifecycle.** The canonical wording is *issued, held, presented and
   verified*. Shortened forms that omit the holder or the presentation are
   corrected, not mechanically substituted: a sentence about what the code does
   ("the first five are issued and verified by the code in this repository")
   describes implementation coverage, and is rewritten to say that rather than
   being padded out into lifecycle language.
2. **Architectural properties are stated narrowly.** The defensible property is
   that *the exchange model does not require a central repository containing the
   clinical payloads exchanged through these credentials*. Claims of the form
   "no registry", "no central system", "no honeypot" are not defensible, because
   the swiyu Trust Infrastructure has registry components on which this project
   depends.
3. **Layers, not alternatives.** HL7 FHIR and openEHR address healthcare
   semantics, information models and clinical data exchange and persistence.
   Verifiable credentials and the swiyu Trust Infrastructure address
   authenticity, provenance, controlled presentation and trust relationships.
   These compose. Text that frames them as competing architectures is rewritten.
4. **Project policy is labelled as project policy.** A rule this repository
   chooses is never presented in the same voice as a rule a specification
   imposes.
5. **Distinct questions stay distinct.** Protocol validity, cryptographic
   validity, credential and status validity, issuer trust, holder key binding,
   presentation verification, authorisation, legal basis and relying-party
   acceptance are nine questions. "Verification" is used only for the one it
   names.
6. **No blame.** Historical platforms are discussed as architectural
   considerations, not as failures attributable to their builders.

## Status of this audit

Items marked **done** were applied in the commit that introduced this file or in
the commits preceding it on the same branch. Items marked **open** are
identified and not yet applied.

## Root and documentation

| File | Class | Finding | Status |
| --- | --- | --- | --- |
| `README.md` | Rewrite | Colloquial register; "No registry sits in the middle of any of it"; meineimpfungen attribution of blame; FHIR/openEHR framed as a repository-versus-wallet choice; lifecycle shorthand; implemented, specified and roadmap material not separated | **done** — restructured into fourteen sections with an explicit four-way status table |
| `docs/business-case.md` | Rewrite | "There is no honeypot"; "No registry to build"; "a booklet in a drawer outlasts a platform"; "the technology is ready some distance ahead of the institutional arrangements" | **done** — four passages replaced; readiness claim replaced with the building-blocks formulation |
| `docs/roadmap.md` | Rewrite | Same readiness claim; "No registry, no CDR, no FHIR server, no patient index"; "the coherent position for a decentralised design is that it becomes one issuer among others. That position has to be argued for" | **done** — EPD/EGD item reframed as future work with roles to be examined; the operating claim scoped to what this repository runs |
| `docs/positioning.md` | Rewrite | Framed as an argument between architectures: "declines the repository", "deliberate alternatives", "strong where the CDR approach is weak" | **done** — reframed as complementary layers; the openEHR objection retained, since conceding it is a strength |
| `docs/glossary.md` | Rewrite | Definitions mixed official swiyu terms with this project's readings, which risks implementation assumptions being read as standard definitions | **done** — entries now separate the official meaning from *In this demonstrator*; authoritative sources named |
| `docs/governance-framework.md` | Edit | "A role is granted, never claimed" is too absolute; "The technical profile answers *can this message be validated*" collapses nine distinct questions into one | **done** — both reframed; the nine questions named in the opening |
| `docs/spec-conformance.md` | Verify | "Every rule this project enforces and where it comes from" sets an evidentiary burden the file must meet rule by rule | **done** — 63 section references machine-checked against the profile text; nine ambiguous citations qualified; three rows corrected; project-policy rows now labelled |
| `docs/onboarding-sandbox.md` | Edit / Verify | "each is a separate legal entity with its own DID" and "cannot be automated, delegated to a contractor" are categorical statements about the onboarding model | **done** — both qualified; a required-by-swiyu / this-demonstrator / recommended-practice convention added |
| `docs/integration-guide.md` | Verify | Absolute statements about what the generic components do and do not do require checking against the current components | **open** |
| `docs/architecture.md` | Edit | "The one-sentence version" collapses the layering; "Health records live in the patient's wallet" overstates what the demonstrator holds | **open** |
| `docs/public-health.md` | Verify | Epidemiological claims about coverage measurement and outbreak response need sourcing | **open** |
| `docs/ehealth-suisse-alignment.md` | Verify | Alignment claims against eHealth Suisse exchange formats need confirmation by someone who can read the current specifications | **open** |
| `docs/source-verification.md` | OK | This file exists to carry the evidentiary record and does so | — |
| `docs/README.md` | Edit | Index page; minor register | **open** |
| `docs/credentials/*.md` | Generated | 6 files, produced by `scripts/generate-docs.ts`; CI fails if they drift | Fix the generator |

## Flows

| File | Class | Finding | Status |
| --- | --- | --- | --- |
| `flows/F-01` … `flows/F-11` | Edit | Eleven flow files. Register is largely appropriate — each already separates governance constraints, standardisation constraints and open questions, which is the discipline the rest of the repository should adopt. Residual issues: rhetorical contrast in F-02, F-08 and F-11; "is not a" constructions; a small number of absolute statements | **open** |
| `flows/README.md` | Edit | Index; minor register | **open** |
| `flows/trust-flow-basis.md` | Edit | Second-person register | **open** |
| `flows/likec4/health-flow.likec4` | Edit | Diagram `notes` are user-visible on the published flow site and carry the same register as the prose | **open** |
| `flows/likec4/README.md` | OK | Accurate; lists the seven modelled flow views | — |

## Portal

| File | Class | Finding | Status |
| --- | --- | --- | --- |
| `site/index.html` | Rewrite | Externally visible communication reproducing the documentation's register. "The platform was badly built. That explanation is accurate as far as it goes."; "EPD / DEP as one issuer among others"; a headline statistic reading "0 registries, repositories or patient indexes operated by anyone"; a 190-word single-sentence governance paragraph; no statement of scope or limitations anywhere on the page | **done** — full register pass; 21 passages replaced, a *What this prototype is and is not* section added, and the rendered page checked in a headless browser for layout, tag balance and script errors |

## Application and library code

Prose in code is user-visible in two ways: through generated documentation, and
through the demonstration interface. It is in scope.

| File | Class | Finding | Status |
| --- | --- | --- | --- |
| `apps/demo/src/ui/page.ts` | Edit | UI strings carry the same register as the portal, including a readiness formulation and an architectural absolute | **open** |
| `apps/demo/src/domain/services.ts`, `mock/server.ts`, `routes/*.ts`, `server.ts`, `config.ts`, `domain/store.ts`, `domain/status-lists.ts`, `mock/state.ts` | Edit | Comment register; no claim defects identified | **open** |
| `packages/swiyu/src/credentials/immunization.ts` | Edit | Comments carry rhetorical constructions; one of the more heavily flagged files in the scan | **open** |
| `packages/swiyu/src/credentials/beta-id.ts` | OK | Corrected earlier on this branch: it now states which four of the nine Art. 15 para. 1 items the Beta-ID carries | — |
| `packages/swiyu/src/profile.ts` | OK | All 33 pinned constants machine-checked against the specification text; no mismatches | — |
| `packages/swiyu/src/conformance.ts` | Edit | One comment presents a project policy in specification voice | **open** |
| `packages/swiyu/src/credential-definition.ts`, `queries.ts`, `projections.ts`, `governance.ts`, `dcql.ts`, `issuer-client.ts`, `verifier-client.ts`, `cesr.ts`, `sri.ts`, `http.ts`, `types.ts`, `browser.ts`, `index.ts`, `credentials/{index,insurance-card,lab-report,prescription}.ts` | Edit / OK | Comment register only; no claim defects identified in the scan | **open** |
| `packages/swiyu/test/*.ts` | OK | 6 files. Test names are descriptive; no external claims | — |
| `scripts/generate-config.ts`, `generate-docs.ts`, `vqps.ts` | Edit | Header comments carry repository register; `generate-docs.ts` additionally emits prose into every credential page and is therefore the highest-leverage single file | **open** |
| `scripts/onboard.sh` | Edit | Operator-facing output strings | **open** |

## Configuration, data and workflows

| File | Class | Status |
| --- | --- | --- |
| `config/**` | Generated | 21 files from `scripts/generate-config.ts`; CI fails if they drift |
| `package.json`, `package-lock.json`, `tsconfig*.json`, `vitest.config.ts`, `docker-compose.yml`, `Dockerfile`, `.gitignore`, `.env.example` | OK | No prose claims |
| `.github/workflows/ci.yml`, `.github/workflows/pages.yml` | Edit | Step comments carry repository register; no claim defects |
| `site/*.css`, `flows/likec4/*.json` | OK | — |

## Statements that still require independent verification

These are the claims most likely to be challenged, and the audit does not settle
them.

| Statement | Where | What would settle it |
| --- | --- | --- |
| The legal basis on which each issuer acts: KVG/LAMal Art. 42a, OR Art. 958f, MedBG/LPMéd, EpG/LEp, the KVG analysis list | `governance-framework.md`, credential definitions | Review by qualified counsel. None of these statutes has been read in this environment |
| What the swiyu generic issuer and verifier do and do not implement | `integration-guide.md`, several `spec-conformance.md` rows attributed to "generic issuer" / "generic verifier" | Testing against the current components, or confirmation from the component documentation |
| Coverage-measurement and outbreak-response claims | `public-health.md`, `business-case.md` | An epidemiological source |
| Alignment with eHealth Suisse exchange formats | `ehealth-suisse-alignment.md` | Review against the current CH VACD, CH EMED and CH Core specifications |
| FHIR element paths and openEHR archetype bindings | Credential definitions, `positioning.md` | Review by HL7 Switzerland and openEHR Switzerland. Bindings were checked against the openEHR CKM mirror; they are not endorsed |
| Attribution and outcome of GovTech Hackathon 2026 project 28 | `README.md`, `positioning.md` | A primary source. `govtech.digisus-lab.ch` is not reachable from this environment |
| The e-ID availability date | Previously "e-ID from 2026" | The current programme schedule. The claim has been removed rather than restated |

## Method

The scan covered every tracked file matching `*.md`, `*.html`, `*.ts`,
`*.likec4`, `*.yml`, `*.sh`, `*.mjs` and `*.css`, excluding generated output,
for eight patterns: architectural absolutes, lifecycle shorthand, blame and
polemic, readiness overclaim, project policy stated as an inherent property, the
FHIR/openEHR dichotomy, second-person register, and rhetorical
negation-contrast. Pattern matching locates candidates; every hit was read
before being classified, and the scan's own false positives — second person is
correct in a runbook and an integration guide — were discarded rather than
"fixed".
