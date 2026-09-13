#!/usr/bin/env node
/**
 * Hold the flow front matter to its declared schema.
 *
 *     node scripts/check-flow-types.mjs
 *
 * The set in flows/ is not homogeneous, and the ways it varies are independent
 * of each other. An earlier version of this check used one `type` field with
 * four mutually exclusive values, which conflated them: F-08 is a composition
 * *and* an inter-party exchange, and F-10 is continuous, which says nothing
 * about whether it is local or multi-party. Four orthogonal characteristics
 * replace it:
 *
 *   kind               flow | transformation
 *   interaction_scope  multi-party | local | unresolved
 *   composition        atomic | composed | unresolved
 *   data_mode          discrete | continuous
 *
 * What is enforced, semantically rather than by shape:
 *
 *   1. Every flow declares all four, from the known sets.
 *   2. interaction_scope local means no inter-party protocol exchange, so
 *      `protocols` is empty. kind transformation implies interaction_scope
 *      local.
 *   3. interaction_scope multi-party names at least one protocol, unless
 *      protocol_status says the protocol is unresolved.
 *   4. interaction_scope unresolved requires protocol_status unresolved, so an
 *      open question is declared rather than left as an empty field.
 *   5. An information model belongs in `representations` and not in
 *      `protocols`.
 *   6. Every dynamic view in the LikeC4 model is claimed by exactly one flow
 *      whose interaction_scope is multi-party, and every implemented or partial
 *      multi-party flow has one. composition composed does not prevent a view.
 *   7. data_mode is independent of all of the above and constrains nothing.
 *   8. profile_status is declared, and any profile_gaps it names exist in
 *      docs/swiss-profile-gaps.md.
 *
 * Rules 6 and 8 are what tie the metadata to the model and to the gap register
 * rather than leaving the three to drift apart.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FLOWS = join(ROOT, 'flows');
const MODEL = join(FLOWS, 'likec4', 'health-flow.likec4');
const GAPS = join(ROOT, 'docs', 'swiss-profile-gaps.md');

const ENUMS = {
  kind: ['flow', 'transformation'],
  interaction_scope: ['multi-party', 'local', 'unresolved'],
  composition: ['atomic', 'composed', 'unresolved'],
  data_mode: ['discrete', 'continuous'],
  profile_status: ['current-profile', 'mixed', 'beyond-current-profile'],
};

// Names of information models, which belong in `representations`. A wire
// protocol carries messages between parties; these describe how data is shaped.
const REPRESENTATION = /\b(FHIR|openEHR|IPS|CDA|HL7 v2)\b/;

/** Minimal front-matter reader: the flows use scalars and lists of scalars. */
function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const out = {};
  let key = null;
  for (const line of m[1].split('\n')) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && key) { (out[key] ||= []).push(item[1].replace(/\s+#.*$/, '').trim()); continue; }
    if (/^\s+\S/.test(line) && key) continue; // continuation of a wrapped list item
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      const v = kv[2].trim();
      out[key] = v === '[]' ? [] : v === '' ? [] : v.replace(/\s+#.*$/, '');
    }
  }
  return out;
}

const model = existsSync(MODEL) ? readFileSync(MODEL, 'utf8') : '';
const viewNames = [...model.matchAll(/dynamic view (\w+)/g)].map((m) => m[1]);

// The model names its views after the flow rather than by id, so the mapping is
// declared here and checked in both directions.
const VIEW_OF = {
  'F-01': 'actorOnboarding',
  'F-02': 'immunizationIssuance',
  'F-03': 'protectionCheck',
  'F-04': 'practiceCheckIn',
  'F-05': 'prescriptionRedemption',
  'F-06': 'correction',
  'F-11': 'coverageSurvey',
};

const gapText = existsSync(GAPS) ? readFileSync(GAPS, 'utf8') : '';
const knownGaps = new Set([...gapText.matchAll(/^## (GP-\d+)\b/gm)].map((m) => m[1]));

const problems = [];
const files = readdirSync(FLOWS).filter((f) => /^F-\d\d.*\.md$/.test(f)).sort();
const seen = [];

for (const file of files) {
  const fm = frontMatter(readFileSync(join(FLOWS, file), 'utf8'));
  if (!fm) { problems.push(`${file}: no front matter`); continue; }
  const say = (m) => problems.push(`${file}: ${m}`);

  let bad = false;
  for (const [field, values] of Object.entries(ENUMS)) {
    const v = fm[field];
    if (!v || Array.isArray(v)) { say(`no \`${field}\`. One of: ${values.join(', ')}`); bad = true; }
    else if (!values.includes(v)) { say(`unknown ${field} \`${v}\`. One of: ${values.join(', ')}`); bad = true; }
  }
  if (bad) continue;

  const protocols = [].concat(fm.protocols ?? []);
  const scope = fm.interaction_scope;

  for (const p of protocols) {
    if (REPRESENTATION.test(p)) {
      say(`\`${p}\` is an information model listed under \`protocols\`. Move it to \`representations\`.`);
    }
  }

  // Rule 2. Locality is about whether messages cross a party boundary.
  if (fm.kind === 'transformation' && scope !== 'local') {
    say(`kind transformation implies interaction_scope local, not \`${scope}\`.`);
  }
  if (scope === 'local' && protocols.length) {
    say('interaction_scope local exchanges no messages between parties, so `protocols` must be empty.');
  }

  // Rules 3 and 4. An open protocol question is declared, not left blank.
  if (scope === 'multi-party' && !protocols.length && fm.protocol_status !== 'unresolved') {
    say('interaction_scope multi-party names at least one protocol, or declares `protocol_status: unresolved`.');
  }
  if (scope === 'unresolved' && fm.protocol_status !== 'unresolved') {
    say('interaction_scope unresolved requires `protocol_status: unresolved`.');
  }
  if (fm.protocol_status && fm.protocol_status !== 'unresolved') {
    say(`unknown protocol_status \`${fm.protocol_status}\`. The only value is \`unresolved\`.`);
  }

  // Rule 6. composition is not consulted here: a composed flow may carry a view.
  const view = VIEW_OF[fm.id];
  if (view) {
    seen.push(view);
    if (scope !== 'multi-party') {
      say(`has the dynamic view \`${view}\` but interaction_scope is \`${scope}\`. A sequence view renders an exchange between parties.`);
    }
    if (!viewNames.includes(view)) {
      say(`expects the dynamic view \`${view}\`, which the model does not define.`);
    }
  } else if (scope === 'multi-party' && ['implemented', 'partial'].includes(fm.status)) {
    say('an implemented multi-party flow with no dynamic view in the model.');
  }

  // Rule 8. A gap reference points at a gap that exists.
  for (const g of [].concat(fm.profile_gaps ?? [])) {
    if (!knownGaps.has(g)) say(`references \`${g}\`, which docs/swiss-profile-gaps.md does not define.`);
  }
  if (fm.profile_status === 'beyond-current-profile' && ![].concat(fm.profile_gaps ?? []).length) {
    say('profile_status beyond-current-profile names at least one entry in `profile_gaps`.');
  }
}

for (const view of viewNames) {
  if (!seen.includes(view)) {
    problems.push(`flows/likec4: the dynamic view \`${view}\` is not claimed by any flow.`);
  }
}

if (problems.length) {
  console.log(`${files.length} flows checked, ${problems.length} problems:\n`);
  for (const p of problems) console.log(`  ${p}`);
  console.log('\nSee the front-matter tables in flows/README.md.');
  process.exit(1);
}

const tally = (field) => {
  const c = {};
  for (const f of files) {
    const v = frontMatter(readFileSync(join(FLOWS, f), 'utf8'))[field];
    c[v] = (c[v] ?? 0) + 1;
  }
  return ENUMS[field].filter((v) => c[v]).map((v) => `${c[v]} ${v}`).join(', ');
};

console.log(
  `${files.length} flows checked.\n` +
  `  kind               ${tally('kind')}\n` +
  `  interaction_scope  ${tally('interaction_scope')}\n` +
  `  composition        ${tally('composition')}\n` +
  `  data_mode          ${tally('data_mode')}\n` +
  `  profile_status     ${tally('profile_status')}\n` +
  `  ${viewNames.length} dynamic views, each claimed by a multi-party flow; ` +
  `${knownGaps.size} gaps defined, every reference resolving.`,
);
