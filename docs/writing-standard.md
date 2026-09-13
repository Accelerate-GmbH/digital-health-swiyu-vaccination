# Writing standard

The intended readers of this repository are government, standards bodies,
architects, protocol engineers, healthcare professionals and regulators. The
prose is written to be read literally by them and to remain defensible when it
is.

This document is the standing rule. [`articulation-pass.md`](articulation-pass.md)
records the pass that applied it and the sentences it accepted.
`npm run check:articulation` enforces the mechanical part.

## What this is not

Not a blog post, a product page, an advocacy paper, a conversational explainer
or marketing copy.

## 1 · Say what the component does

Every sentence should state what the architecture, protocol, component, actor or
implementation does. A technical property is not a human, legal, business,
privacy or security conclusion, and does not become one without a separate
justification.

| Write | Rather than |
| --- | --- |
| the presentation contains four disclosed claims | the verifier learns only what it needs |
| the verifier evaluates the credential status entry | the credential is valid |
| the wallet requires the holder to approve the presentation | the holder gives consent |
| the issuer is not contacted during this status check | the issuer learns nothing |

## 2 · No rhetorical shorthand

Formulations of this kind are removed unless they are literally and
demonstrably true: *the root the whole system hangs from*, *the credential
outlives its issuer*, *nothing else connects the two*, *trust runs both ways*,
*the rest stay on the phone*, *the same person*, *proves protection*, *the
system knows*, *the architecture guarantees*, *cannot happen*, *always*,
*never*.

Removal is not substitution. Rewrite the underlying proposition precisely rather
than swapping the phrase for a milder one.

## 3 · No promotional adjectives

*Secure*, *privacy-preserving*, *trusted*, *robust*, *seamless*, *powerful*,
*innovative*, *resilient* and *interoperable* are used only where the text
defines the property or cites its basis.

Write "a presentation using selective disclosure in which the specified
undisclosed claim values are omitted" rather than "a privacy-preserving
presentation".

## 4 · Name the actor and the mechanism

Not *the system checks*, *the infrastructure decides*, *trust is established*.

Write *the verifier checks*, *the wallet evaluates*, *the issuer signs*, *the
policy layer rejects*, *the Trust Registry provides*, *the relying organisation
determines*.

## 5 · Preserve these distinctions

Do not collapse:

- verification and acceptance
- signature validity and factual truth
- issuer identity and issuer authorisation
- presentation approval and legal consent
- selective disclosure and anonymity
- selective disclosure and unlinkability
- credential status and overall credential validity
- verifier and relying party
- credential possession and business outcome
- technical capability and governance permission

Where a sentence crosses one of these boundaries, split it.

## 6 · Short exact sentences

Precision does not require dense prose. Three sentences that each state one
thing are preferred to one sentence combining request construction,
authorisation, disclosure and approval.

## 7 · No pedagogical filler

Remove *this is important because*, *what this means is*, *the key point here
is*, *this is the beauty of*. State the proposition.

## 8 · Architecture-neutral

The text does not imply that decentralised is inherently better than
centralised, that credentials inherently replace registries, that wallets
inherently improve privacy, that verifiable credentials inherently prevent
fraud, or that an architecture is superior because the demonstrator uses it.
Describe the property and its trade-offs.

## 9 · Strong words only where the source is strong

*MUST*, *SHOULD*, *MAY*, *required*, *prohibited*, *guaranteed* and *impossible*
are used only where a specification, a law or an enforced implementation
constraint supports them. Otherwise: *supports*, *permits*, *is designed to*,
*can*, *may*, *in this implementation*, *under the current profile*, *subject to
applicable policy*.

## 10 · Separate repository fact from external fact

Write *in this demonstrator*, *this repository models*, *the current Swiss
Profile requires*, *the BGEID provides*, *DIDAS proposes*.

A choice made in this demonstrator must not read as a swiyu requirement, and a
swiyu profile rule must not read as a general property of verifiable
credentials.

## The test applied to each sentence

1. What exact object is being described?
2. Which actor performs the action?
3. Which mechanism causes the result?
4. What conclusion is actually supported?
5. Does the wording imply anything stronger than that?

If the answer to 5 is yes, rewrite.
