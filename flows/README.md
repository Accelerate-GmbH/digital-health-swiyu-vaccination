# Flow blueprint

This directory is the **blueprint** deliverable of roadmap step 1: eleven flows
of the use case, written down so that they can be reviewed, disputed and reused
by other projects. They are kept separate from the code and from `docs/` because
they are intended for **transfer into a trust flows repository**, where they
will sit next to flows from sectors unrelated to this codebase.

The reference model they build on is the [Trust Flow Diagram
Repository](https://github.com/DIDAS-swiss/Trust-Flow-Diagram-Repository), whose
`basic-flow/` covers registration, issuance and verification for the Swiss e-ID
trust infrastructure. Its convention is that domain flows abstract those steps
and point back to it and these flows follow it.
[`likec4/`](likec4/README.md) holds the same flows as a C4 model, validated in
CI and published as interactive diagrams alongside the portal.
[`trust-flow-basis.md`](trust-flow-basis.md) records the mapping step by step:
which of our steps are the reference flow under another name, which are
health-specific additions and the three the reference model has no shape for,
each raised there as an issue.

That intent shapes the format:

- **One file per flow, self-contained.** A flow can be copied out on its own
  without dragging half a repository behind it. Cross-references between flows
  use flow ids, never file paths.
- **Machine-readable front matter, human-readable body.** The YAML block is
  what a registry can index: actors, credential types, protocols, trust markers,
  status. The prose is what a person needs in order to disagree with it.
- **Governance and standardisation constraints are first-class sections**, not
  footnotes. A flow that documents only the message exchange is the easy half.
  The half that decides whether a flow can be deployed is who is allowed to
  play each role, what they may ask for, what they must keep and which parts of
  the standards stack are fixed. The Swiss Profile settles the credential
  format, the algorithms and the protocol flows; what a use case decides is
  which claims its presentation requests select.
- **Open questions are recorded.** Where this project
  had to decide something that the ecosystem has not decided, the decision is
  marked as ours.

## Reading the front matter

| Field | Meaning |
| --- | --- |
| `id` | Stable identifier. Referenced from other flows and from code comments. |
| `type` | What kind of step this is. See the table below. |
| `status` | `implemented`: runnable in this repository. `partial`: the happy path is implemented, named gaps are not. `roadmap`: specified here, deliberately not built. |
| `roadmap_step` | 1 = Immunization Showcase (2026), 2 = International Patient Summary (2027), 3 = Swiss Health App (2028). |
| `actors` | Roles. An organisation may hold several. |
| `credentials` | `vct` values the flow issues or consumes. |
| `protocols` | Wire protocols, pinned to the Swiss Profile version. Empty where no message passes between parties. |
| `representations` | Information models the step produces or consumes. A representation is not a protocol and is recorded separately from one. |
| `input` | What the step consumes where that is not a protocol message. |
| `execution_scope` | `local` where the step is performed inside one party. Absent for steps that involve more than one. |
| `trust_markers` | Trust Protocol 2.0 markers the flow depends on. |
| `preconditions` | Flows or states that must already hold. |
| `basis` | The `basic-flow` view in the Trust Flow Diagram Repository this flow builds on. |

### `type`

The set is not homogeneous. Reading every entry as an exchange between parties
misdescribes three of them, so each declares its kind rather than leaving a
reader to infer it from `actors` and `protocols`.

| `type` | What it describes | Sequence view | Flows |
| --- | --- | --- | --- |
| `interaction-flow` | Messages exchanged between two or more parties over a named protocol | Yes, where the flow is modelled | F-01 to F-06, F-09, F-11 |
| `local-transformation` | A transformation performed inside one party on data it already holds. No protocol messages | No. A sequence diagram would show one lifeline | F-07 |
| `composed-flow` | A composition of other flows, adding an assembly step over their outputs | Not separately. The composed flows carry theirs | F-08 |
| `continuous-data-flow` | Repeated or streamed measurement rather than a discrete authored event | No. The authoring model is unresolved | F-10 |

A flow without a sequence view is therefore not necessarily unfinished. F-07 is
`implemented`, and it has no view because a sequence diagram of a single-party
transformation would show one lifeline. F-08, F-09 and F-10 are `roadmap` and
are not modelled; of those, F-08 and F-10 would not carry a view of their own
once built, because of their types.

`npm run check:flow-types` enforces the table above: every flow declares a known
type, a `local-transformation` names no protocols and declares
`execution_scope: local`, an `interaction-flow` names at least one protocol, an
information model is recorded under `representations` rather than `protocols`,
and every dynamic view in the model is claimed by exactly one
`interaction-flow`. It runs in CI on every pull request.

## Status of the set

| Flow | Title | Type | Status | Step |
| --- | --- | --- | --- | --- |
| [F-01](F-01-actor-onboarding.md) | Becoming an actor | `interaction-flow` | `partial` | 1 |
| [F-02](F-02-immunization-issuance.md) | Recording an administered dose | `interaction-flow` | `implemented` | 1 |
| [F-03](F-03-immunization-minimal-disclosure.md) | Presenting vaccination evidence with minimal disclosure | `interaction-flow` | `implemented` | 1 |
| [F-04](F-04-practice-check-in.md) | Check-in at the practice | `interaction-flow` | `implemented` | 1 |
| [F-05](F-05-prescription-redemption.md) | Prescription and its redemption | `interaction-flow` | `implemented` | 1 |
| [F-06](F-06-lifecycle-and-correction.md) | Correction, suspension and revocation | `interaction-flow` | `partial` | 1 |
| [F-07](F-07-model-projection.md) | Projecting into FHIR and openEHR | `local-transformation` | `implemented` | 1 |
| [F-08](F-08-patient-summary.md) | Assembling an International Patient Summary | `composed-flow` | `roadmap` | 2 |
| [F-09](F-09-secondary-use.md) | Secondary use under revocable research consent | `interaction-flow` | `roadmap` | 2 |
| [F-10](F-10-continuous-data.md) | Wearables and continuous data | `continuous-data-flow` | `roadmap` | 3 |
| [F-11](F-11-coverage-survey.md) | Answering the national coverage survey | `interaction-flow` | `roadmap` | 2 |

## What is deliberately not here

- **Wallet internals.** How a wallet stores, backs up or restores credentials is
  the wallet's concern and is specified by the Confederation.
- **Billing.** The practice bills through existing channels; making that a flow
  would imply the trust infrastructure replaces it, which it does not.
- **Identity proofing.** How a person obtains an e-ID is upstream of everything
  here. F-01 covers *organisational* onboarding only.
