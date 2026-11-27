// Turkey Run — the hand-in program (Node 22, standard library only).
//
// What it does, every time it runs:
//   1. Checks that this repository actually holds a complete entry:
//      game/index.html, the game sources, and 3–4 screenshots.
//   2. Copies game/ and screenshots/ beside this file into the output
//      directory — /output inside the grader, or MAKEFUN_OUTPUT_DIR
//      anywhere else — wiping any stale files there first so the two
//      runs the grader does always write the same bytes.
//   3. Writes /output/dossier.json with buildDossier from the vendored
//      make.fun library, using the scorer's own caps, so the dossier the
//      judge reads is byte for byte the one the gate rebuilds.
//   4. Leaves every output file world-readable (0644) and every folder
//      world-executable (0755): the scorer collects the outputs as
//      another user, and a file it cannot read fails the entry.
//
// Run it locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the game:   node serve.ts   → http://localhost:8080

import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The scorer's own caps, from the bounty's gate (see competition.yaml):
// at most 4 screenshots of 256 KiB each, at most 993 files and 48 MiB
// under game/, no game/ path over 1000 bytes, and a 160 KiB dossier text.
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const SCREENSHOT_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

// Walk a directory tree and return every file path under it, sorted, so
// the checks below (and the log line) are deterministic across runs.
function listFiles(dir: string, prefix = ''): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...listFiles(full, rel));
    else if (entry.isFile()) found.push(rel);
    else fail(`unsupported entry in ${dir}: ${rel} is neither a file nor a directory`);
  }
  return found;
}

function checkEntry(here: string): void {
  const gameDir = join(here, 'game');
  const shotsDir = join(here, 'screenshots');

  if (!existsSync(join(gameDir, 'index.html'))) {
    fail('game/index.html is missing — the game has no entry page');
  }
  const gameFiles = listFiles(gameDir);
  const sources = gameFiles.filter((f) => ['.html', '.js', '.mjs', '.css'].includes(extname(f)));
  if (sources.length === 0) fail('game/ holds no source files');
  if (!existsSync(shotsDir)) fail('screenshots/ is missing');

  const shots = listFiles(shotsDir).filter((f) => SCREENSHOT_EXTENSIONS.has(extname(f).toLowerCase()));
  if (shots.length < 3 || shots.length > 4) {
    fail(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
  }
  for (const shot of shots) {
    const size = statSync(join(shotsDir, shot)).size;
    if (size > DOSSIER_OPTIONS.screenshots.max_bytes) {
      fail(`screenshots/${shot} is ${size} bytes, over the 256 KiB cap`);
    }
  }
  // Screenshots must be real PNG/JPEG bytes, not a renamed text file.
  for (const shot of shots) {
    const head = readFileSync(join(shotsDir, shot)).subarray(0, 4);
    const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    if (!isPng && !isJpeg) fail(`screenshots/${shot} is not a PNG or JPEG file`);
  }
  console.log(`main.ts: entry OK — ${gameFiles.length} game files, ${shots.length} screenshots`);
}

function makeOutputsReadable(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      chmodSync(full, 0o755);
      makeOutputsReadable(full);
    } else if (entry.isFile()) {
      chmodSync(full, 0o644);
    }
  }
}

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

checkEntry(here);

// Start from an empty output directory: stale files from an earlier run
// would make the grader's two runs disagree. Empty the directory's
// CONTENTS only — never remove the directory itself: in the grader
// /output is a volume mount, and removing a mount point fails with
// EBUSY ("Device or resource busy"), which killed the first submission's
// run with exit 1. (Reproduced locally against a tmpfs mount.)
mkdirSync(out, { recursive: true });
for (const entry of readdirSync(out)) {
  rmSync(join(out, entry), { recursive: true, force: true });
}

cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

writeFileSync(join(out, 'dossier.json'), buildDossier(out, DOSSIER_OPTIONS));

// The scorer collects the outputs as another user: the output directory
// itself must be traversable, not just the files inside it.
chmodSync(out, 0o755);
makeOutputsReadable(out);
console.log(`main.ts: wrote ${out}/dossier.json (+ game/ and screenshots/)`);
