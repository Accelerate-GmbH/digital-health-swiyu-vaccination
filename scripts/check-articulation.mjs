#!/usr/bin/env node
/**
 * Hold the public prose to the articulation rule.
 *
 *     node scripts/check-articulation.mjs          # check
 *     node scripts/check-articulation.mjs --list   # print what is flagged
 *     node scripts/check-articulation.mjs --accept # record the current set as reviewed
 *
 * The rule, from the 2026-09-13 pass recorded in docs/articulation-pass.md:
 * every statement should identify the object or data under discussion, the
 * actor performing the action, the mechanism producing the result, what
 * conclusion follows and what conclusion does not. A protocol property is not a
 * human, legal, clinical or business conclusion.
 *
 * Certain words carry that risk. "Verified" without an object, "trust" as a
 * bare verb, "only" and "never" outside a mechanism statement, "consent" for
 * what is a wallet confirmation, "identity" where the mechanism establishes
 * possession of a credential, "unlinkable" without a correlation surface.
 *
 * This finds the sentences that use them, and compares that set against
 * scripts/articulation-accepted.json, which records the ones already reviewed
 * and the category under which each was accepted. A sentence that is neither
 * accepted nor rewritten fails the check, so new prose gets the same reading
 * the pass gave the existing prose.
 *
 * Accepting is a judgement, not a suppression. --accept rewrites the file from
 * the current state, so the diff shows a reviewer exactly which new sentences
 * an author decided were fine.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ACCEPTED = join(ROOT, 'scripts', 'articulation-accepted.json');

const FILES = [
  'site/index.html',
  'README.md',
  ...readdirSync(join(ROOT, 'docs')).filter((f) => f.endsWith('.md')).sort().map((f) => `docs/${f}`),
  ...readdirSync(join(ROOT, 'flows')).filter((f) => f.endsWith('.md')).sort().map((f) => `flows/${f}`),
  // The LikeC4 model carries the step notes that the rendered diagrams and the
  // flow documents both draw on, so the notes are public prose under a file
  // extension the earlier list did not reach.
  ...readdirSync(join(ROOT, 'flows', 'likec4')).filter((f) => f.endsWith('.likec4')).sort()
    .map((f) => `flows/likec4/${f}`),
];

// A sentence is risky when it uses one of these and the surrounding words do
// not already supply the missing precision.
const SAFE_TRUST = /trust (registry|registries|infrastructure|statement|statements|marker|markers|protocol|anchor|anchors|domain|list|lists|ecosystem|flow|flows|policy|policies|chain)|Trust Protocol|trust-|swiyu Trust/i;
const VERIFY_OBJECT = /verif\w+\s+(the\s+)?(signature|issuer|status|holder|binding|presentation|credential|proof|token|key|identity attribute|source|claim)|(signature|issuer|status|holder binding|presentation|credential)\s+\w{0,12}\s?verif/i;
const SAFE_VERIFY = /verifier|verifiable|swiss-profile-verification|source verification|verification query|\/verifications|verification path|VERIFIERS/i;
const SAFE_ONLY = /read-?only|only when|only if|only one|only two|only three|only four|only five|only six|only seven|only eight|only nine|only ten|only the (first|second|last)/i;
const SAFE_PROTECTED = /protected (claim|field|fields|verification|issuance)|protected under|CODE/i;
const SAFE_PROVE = /proof of possession|proof element|zero-knowledge|predicate proof/i;
const SAFE_IDENTITY = /identity (credential|attribute|provider|trust marker|verification service)|Beta-ID|e-ID|identity onboarding/i;
const SAFE_PRIVATE = /private key|private organisation|private sector|private entit|private practice/i;
const SAFE_CONSENT = /research consent|standing-authorisation|legal consent|clinical consent|consent credential|Human Research/i;

function strip(text, path) {
  if (path.endsWith('.html')) {
    // The disclosure explorer renders its copy from string literals in a script
    // block, so those strings are public prose and the rule applies to them.
    // The code around them is not: an identifier or a comment that happens to
    // use a watched word states nothing about the system. Each script block is
    // therefore reduced to its string literals, of which the single-word ones
    // are dropped as identifiers, keys and class names, and each survivor is
    // terminated so two adjacent literals do not splice into a run-on sentence.
    text = text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, (_, body) =>
      ' ' + (body.match(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g) ?? [])
              .map((lit) => lit.slice(1, -1).trim())
              .filter((lit) => /\s/.test(lit) && /[a-z]{3}/i.test(lit))
              .map((lit) => (/[.:;!?]$/.test(lit) ? lit : `${lit}.`))
              .join(' ') + ' ');
    text = text.replace(/<svg\b[\s\S]*?<\/svg>/g, ' ')
               .replace(/<style\b[\s\S]*?<\/style>/g, ' ')
               .replace(/<pre\b[\s\S]*?<\/pre>/g, ' ')
               .replace(/<[^>]+>/g, ' ');
  } else if (path.endsWith('.likec4')) {
    // The prose in the model is the note blocks. Element names, titles and
    // technology strings around them are labels rather than statements.
    text = (text.match(/'''[\s\S]*?'''/g) ?? []).map((n) => n.slice(3, -3)).join('\n\n');
  } else {
    text = text.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/```[\s\S]*?```/g, ' ');
  }
  return text.replace(/`[^`]*`/g, ' CODE ')
             .replace(/https?:\/\/\S+/g, ' URL ')
             .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
}

function sentences(text) {
  return text.replace(/\s+/g, ' ').split(/(?<=[.:;!?])\s+(?=[A-Z*\-|])/)
             .map((s) => s.trim()).filter(Boolean);
}

function risks(s) {
  const out = [];
  if (/\b(prove|proves|proved|proving|proof|proofs)\b/i.test(s) && !SAFE_PROVE.test(s)) out.push('prove');
  if (/\bverif\w+/i.test(s.replace(SAFE_VERIFY, ' ')) && !VERIFY_OBJECT.test(s)) out.push('verify-no-object');
  if (/\btrust(s|ed|worthy)?\b/i.test(s.replace(SAFE_TRUST, ' '))) out.push('trust-bare');
  const noSafeOnly = s.replace(SAFE_ONLY, ' ');
  if (/\b(never|always|guarantee\w*|nothing else|the same person|only)\b/i.test(noSafeOnly)) out.push('absolute');
  if (/\b(identity|identities)\b/i.test(s) && !SAFE_IDENTITY.test(s)) out.push('identity');
  if (/\b(protected|protection|protects)\b/i.test(s) && !SAFE_PROTECTED.test(s)) out.push('protected');
  if (/\b(private|privacy)\b/i.test(s) && !SAFE_PRIVATE.test(s)) out.push('privacy');
  if (/\b(secure|security|securely)\b/i.test(s)) out.push('secure');
  if (/\b(anonymous|anonymity|anonymised|anonymized)\b/i.test(s)) out.push('anonymous');
  if (/\b(consent|consents|consented)\b/i.test(s) && !SAFE_CONSENT.test(s)) out.push('consent');
  if (/\b(unlinkable|unlinkability|linkable|linkability)\b/i.test(s) &&
      !/credential identifier|holder key|claim values|status-list reference|timing|network metadata|correlation surface/i.test(s)) {
    out.push('linkability-no-surface');
  }
  return out;
}

function fingerprint(file, sentence) {
  return createHash('sha256').update(`${file}\0${sentence}`).digest('hex').slice(0, 16);
}

const flagged = [];
for (const path of FILES) {
  const full = join(ROOT, path);
  if (!existsSync(full)) continue;
  for (const s of sentences(strip(readFileSync(full, 'utf8'), path))) {
    const r = risks(s);
    if (r.length) flagged.push({ id: fingerprint(path, s), file: path, risk: r, sentence: s });
  }
}

const accepted = existsSync(ACCEPTED) ? JSON.parse(readFileSync(ACCEPTED, 'utf8')) : { reviewed: {} };
const args = process.argv.slice(2);

if (args.includes('--accept')) {
  const reviewed = {};
  for (const f of flagged) {
    reviewed[f.id] = accepted.reviewed[f.id] ?? { file: f.file, risk: f.risk.join(','), sentence: f.sentence.slice(0, 160) };
  }
  writeFileSync(ACCEPTED, JSON.stringify({ note: accepted.note, reviewed }, null, 1) + '\n');
  console.log(`Recorded ${Object.keys(reviewed).length} reviewed sentences.`);
  process.exit(0);
}

const unreviewed = flagged.filter((f) => !accepted.reviewed[f.id]);

if (args.includes('--list')) {
  for (const f of flagged) {
    const mark = accepted.reviewed[f.id] ? ' ' : '!';
    console.log(`${mark} ${f.file}  [${f.risk.join(',')}]\n    ${f.sentence.slice(0, 150)}`);
  }
}

console.log(`${flagged.length} sentences use a word the articulation rule watches; ` +
  `${flagged.length - unreviewed.length} reviewed, ${unreviewed.length} not.`);

if (unreviewed.length) {
  console.log();
  console.log('Not yet reviewed:');
  for (const f of unreviewed.slice(0, 40)) {
    console.log(`  - ${f.file} [${f.risk.join(',')}]`);
    console.log(`      ${f.sentence.slice(0, 150)}`);
  }
  if (unreviewed.length > 40) console.log(`  … and ${unreviewed.length - 40} more`);
  console.log();
  console.log('Rewrite the sentence, or record it as reviewed with:');
  console.log('  node scripts/check-articulation.mjs --accept');
  console.log('See docs/articulation-pass.md for the rule and the categories.');
  process.exit(1);
}

console.log('Every flagged sentence has been through the articulation rule.');
