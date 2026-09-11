#!/usr/bin/env node
/**
 * Check the mermaid blocks in the markdown for constructs GitHub refuses to render.
 *
 * Three sequence diagrams in this repository never rendered on github.com, and
 * nothing caught it, because a diagram that fails to parse is shown by GitHub as
 * a plain code block rather than as an error. The cause was a semicolon inside a
 * message: `;` is a statement separator in mermaid, so `A->>B: Store; render`
 * ends the message at `Store` and then tries to parse `render` as a statement.
 *
 * This is a lint for that class of fault, not a full parser. A full parse needs
 * a DOM, so it stays a local one-off:
 *
 *     npm i --no-save mermaid playwright
 *     node scripts/check-mermaid.mjs --parse
 *
 * Without `--parse` it runs the structural rules below, with no dependencies, so
 * it can sit in `npm run verify` and in CI.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SKIP = new Set(['node_modules', '.git', 'site', 'dist', 'build', 'coverage']);

/** Every markdown file in the repository, excluding build output. */
function markdownFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name) && !entry.name.startsWith('.')) {
        markdownFiles(join(dir, entry.name), out);
      }
    } else if (entry.name.endsWith('.md')) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

/** Each fenced mermaid block, with the line its first line sits on. */
function mermaidBlocks(file) {
  const text = readFileSync(file, 'utf8');
  const blocks = [];
  const re = /```mermaid\n([\s\S]*?)```/g;
  let match;
  while ((match = re.exec(text))) {
    blocks.push({
      firstLine: text.slice(0, match.index).split('\n').length + 1,
      code: match[1],
      kind: (match[1].trim().split(/\s|\n/)[0] || '').trim(),
    });
  }
  return blocks;
}

/**
 * The rules. Each returns a message when the line is a problem.
 *
 * Deliberately narrow: a rule that fires on a diagram GitHub renders fine is
 * worse than no rule, because it teaches people to ignore the check.
 */
const RULES = [
  {
    name: 'semicolon-in-message',
    appliesTo: (kind) => kind === 'sequenceDiagram',
    test: (line) => {
      // Lines that carry a message: `A->>B: text`, and `Note over A: text`.
      // The message is everything after the first colon.
      const trimmed = line.trim();
      const carriesMessage =
        /(?:-{1,2}>{1,2}|-{1,2}x|-{1,2}\))/.test(trimmed) || /^Note\s+(?:over|left of|right of)\b/.test(trimmed);
      if (!carriesMessage) return null;
      const colon = trimmed.indexOf(':');
      if (colon === -1) return null;
      const message = trimmed.slice(colon + 1);
      if (message.includes(';')) {
        return 'a semicolon inside a message ends the statement early. Use a comma or a full stop';
      }
      return null;
    },
  },
  {
    name: 'unbalanced-quotes-in-label',
    appliesTo: () => true,
    test: (line) => {
      const quotes = (line.match(/"/g) || []).length;
      return quotes % 2 === 1 ? 'an odd number of double quotes on one line' : null;
    },
  },
  {
    name: 'unbalanced-brackets-in-node',
    appliesTo: (kind) => kind.startsWith('flowchart') || kind.startsWith('graph'),
    test: (line) => {
      const open = (line.match(/\[/g) || []).length;
      const close = (line.match(/\]/g) || []).length;
      return open !== close ? 'square brackets do not balance on this line' : null;
    },
  },
];

async function fullParse(blocks) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage();
  await page.goto('about:blank');
  await page.addScriptTag({ path: join(ROOT, 'node_modules/mermaid/dist/mermaid.min.js') });
  const failures = [];
  for (const block of blocks) {
    const result = await page.evaluate(async (code) => {
      try {
        window.mermaid.initialize({ startOnLoad: false });
        await window.mermaid.parse(code);
        return { ok: true };
      } catch (error) {
        return { ok: false, message: String(error?.message ?? error).split('\n')[0] };
      }
    }, block.code);
    if (!result.ok) failures.push({ ...block, message: result.message });
  }
  await browser.close();
  return failures;
}

const files = markdownFiles(ROOT);
const blocks = [];
for (const file of files) {
  for (const block of mermaidBlocks(file)) {
    blocks.push({ ...block, file: relative(ROOT, file) });
  }
}

const failures = [];

if (process.argv.includes('--parse')) {
  failures.push(...(await fullParse(blocks)));
} else {
  for (const block of blocks) {
    const lines = block.code.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line.trim() || line.trim().startsWith('%%')) continue;
      for (const rule of RULES) {
        if (!rule.appliesTo(block.kind)) continue;
        const message = rule.test(line);
        if (message) {
          failures.push({
            file: block.file,
            firstLine: block.firstLine + i,
            message: `${message} (${rule.name})`,
            line: line.trim(),
          });
        }
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`${failures.length} mermaid problem(s):\n`);
  for (const failure of failures) {
    console.error(`  ${failure.file}:${failure.firstLine}`);
    if (failure.line) console.error(`    ${failure.line}`);
    console.error(`    ${failure.message}\n`);
  }
  console.error('GitHub renders a diagram it cannot parse as a plain code block, so');
  console.error('this fails silently in the browser. That is why it is checked here.');
  process.exit(1);
}

console.log(`${blocks.length} mermaid blocks checked across ${files.length} markdown files, all clean.`);
