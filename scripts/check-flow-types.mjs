#!/usr/bin/env node
/**
 * Hold the flow front matter to its declared schema.
 *
 *     node scripts/check-flow-types.mjs
 *
 * The set in flows/ is not homogeneous. F-01 to F-06, F-09 and F-11 describe
 * message exchanges between parties. F-07 describes a transformation performed
 * inside one party. F-08 composes other flows. F-10 describes repeated
 * measurement rather than a discrete authored event. Reading all eleven as the
 * same kind of object produced two defects that this check exists to prevent
 * recurring: F-07 was presented on the portal as a flow awaiting a diagram, and
 * FHIR and openEHR were recorded in its `protocols` field, which is for wire
 * protocols.
 *
 * What is enforced:
 *
 *   1. Every flow declares a `type` from the known set.
 *   2. A `local-transformation` declares no protocols, because no message
 *      passes between parties, and declares `execution_scope: local`.
 *   3. An `interaction-flow` declares at least one protocol.
 *   4. Information models go in `representations` and not in `protocols`.
 *   5. Every flow the LikeC4 model gives a dynamic view is an
 *      `interaction-flow`, and every `interaction-flow` that is `implemented`
 *      or `partial` has such a view.
 *
 * Rule 5 is what ties the classification to the model rather than leaving the
 * two to drift.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FLOWS = join(ROOT, 'flows');
const MODEL = join(FLOWS, 'likec4', 'health-flow.likec4');

const TYPES = ['interaction-flow', 'local-transformation', 'composed-flow', 'continuous-data-flow'];

// Names of information models, which belong in `representations`. A wire
// protocol carries messages; these describe how data is shaped.
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

const problems = [];
const files = readdirSync(FLOWS).filter((f) => /^F-\d\d.*\.md$/.test(f)).sort();

for (const file of files) {
  const fm = frontMatter(readFileSync(join(FLOWS, file), 'utf8'));
  if (!fm) { problems.push(`${file}: no front matter`); continue; }
  const { id, type } = fm;
  const protocols = [].concat(fm.protocols ?? []);

  if (!type) {
    problems.push(`${file}: no \`type\`. One of: ${TYPES.join(', ')}`);
    continue;
  }
  if (!TYPES.includes(type)) {
    problems.push(`${file}: unknown type \`${type}\`. One of: ${TYPES.join(', ')}`);
    continue;
  }

  for (const p of protocols) {
    if (REPRESENTATION.test(p)) {
      problems.push(`${file}: \`${p}\` is an information model listed under \`protocols\`. Move it to \`representations\`.`);
    }
  }

  if (type === 'local-transformation') {
    if (protocols.length) {
      problems.push(`${file}: a local-transformation exchanges no messages, so \`protocols\` must be empty.`);
    }
    if (fm.execution_scope !== 'local') {
      problems.push(`${file}: a local-transformation must declare \`execution_scope: local\`.`);
    }
  }

  if (type === 'interaction-flow' && !protocols.length) {
    problems.push(`${file}: an interaction-flow must name at least one protocol.`);
  }

  const view = VIEW_OF[id];
  if (view) {
    if (type !== 'interaction-flow') {
      problems.push(`${file}: has the dynamic view \`${view}\` but is typed \`${type}\`. A sequence view renders an exchange between parties.`);
    }
    if (!viewNames.includes(view)) {
      problems.push(`${file}: expects the dynamic view \`${view}\`, which the model does not define.`);
    }
  } else if (type === 'interaction-flow' && ['implemented', 'partial'].includes(fm.status)) {
    problems.push(`${file}: an implemented interaction-flow with no dynamic view in the model.`);
  }
}

for (const view of viewNames) {
  if (!Object.values(VIEW_OF).includes(view)) {
    problems.push(`flows/likec4: the dynamic view \`${view}\` is not claimed by any flow.`);
  }
}

if (problems.length) {
  console.log(`${files.length} flows checked, ${problems.length} problems:\n`);
  for (const p of problems) console.log(`  ${p}`);
  console.log('\nSee the `type` table in flows/README.md.');
  process.exit(1);
}

const counts = {};
for (const file of files) {
  const t = frontMatter(readFileSync(join(FLOWS, file), 'utf8')).type;
  counts[t] = (counts[t] ?? 0) + 1;
}
console.log(
  `${files.length} flows checked: ` +
  TYPES.filter((t) => counts[t]).map((t) => `${counts[t]} ${t}`).join(', ') +
  `; ${viewNames.length} dynamic views, each claimed by an interaction-flow.`,
);
