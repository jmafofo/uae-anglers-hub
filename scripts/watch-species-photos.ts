/**
 * watch-species-photos.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Watches public/fish-species/ for new or changed image files.
 * On any change it:
 *   1. Re-runs scan-species-photos.ts  → updates lib/species-photos.json
 *   2. Fires a macOS notification       → so you know the site is updated
 *   3. Logs a diff of added/removed slugs to the terminal
 *
 * Usage:
 *   npm run watch:species
 *
 * Keep this running in a terminal tab while you drop images into the folder.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as fs   from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';

const PHOTOS_DIR   = path.join(process.cwd(), 'public', 'fish-species');
const JSON_PATH    = path.join(process.cwd(), 'lib', 'species-photos.json');
const SUPPORTED    = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const DEBOUNCE_MS  = 600; // wait for file copy to finish before acting

// ── Helpers ──────────────────────────────────────────────────────────────────

function notify(title: string, message: string) {
  // macOS native notification via osascript — silent fail on other platforms
  try {
    spawnSync('osascript', [
      '-e',
      `display notification "${message}" with title "${title}" sound name "Glass"`,
    ]);
  } catch { /* non-macOS — ignore */ }
}

function currentSlugs(): Set<string> {
  if (!fs.existsSync(JSON_PATH)) return new Set();
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8')) as Record<string, string[]>;
  return new Set(Object.keys(data));
}

function runScan(): boolean {
  const result = spawnSync('npm', ['run', 'scan-species-photos'], {
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  if (result.status !== 0) {
    console.error('❌  scan-species-photos failed:\n', result.stderr);
    return false;
  }
  return true;
}

function imageFilesInDir(): string[] {
  return fs.readdirSync(PHOTOS_DIR).filter((f) => {
    return SUPPORTED.has(path.extname(f).toLowerCase()) && !f.startsWith('.');
  });
}

// ── Main watcher ─────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    console.error(`❌  Folder not found: ${PHOTOS_DIR}`);
    process.exit(1);
  }

  let debounce: ReturnType<typeof setTimeout> | null = null;
  let lastFileList = new Set(imageFilesInDir());
  let lastSlugs    = currentSlugs();

  console.log('\n👁️   Watching for new fish photos...');
  console.log(`📂  ${PHOTOS_DIR}`);
  console.log(`📋  Currently tracking ${lastFileList.size} images across ${lastSlugs.size} species`);
  console.log('     Drop images into the folder above — this terminal will auto-update.\n');

  const watcher = fs.watch(PHOTOS_DIR, { persistent: true }, (event, filename) => {
    if (!filename) return;
    const ext = path.extname(filename).toLowerCase();
    if (!SUPPORTED.has(ext)) return; // skip non-image files

    // Debounce: multiple events fire during a file copy
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      const newFileList = new Set(imageFilesInDir());

      // Diff: added / removed files
      const added   = [...newFileList].filter((f) => !lastFileList.has(f));
      const removed = [...lastFileList].filter((f) => !newFileList.has(f));

      if (added.length === 0 && removed.length === 0) return; // rename/touch — skip

      const timestamp = new Date().toLocaleTimeString();
      console.log(`\n⚡  Change detected at ${timestamp}`);
      if (added.length)   added.forEach((f)   => console.log(`   ✅  Added:   ${f}`));
      if (removed.length) removed.forEach((f) => console.log(`   🗑️   Removed: ${f}`));

      // Re-scan
      const ok = runScan();
      if (!ok) return;

      const newSlugs   = currentSlugs();
      const newSpecies = [...newSlugs].filter((s) => !lastSlugs.has(s));
      const lostSpecies= [...lastSlugs].filter((s) => !newSlugs.has(s));

      // Terminal summary
      console.log(`\n📸  species-photos.json updated — ${newSlugs.size} species with photos`);
      if (newSpecies.length)  newSpecies.forEach((s)  => console.log(`   🐟  New species mapped:   ${s}`));
      if (lostSpecies.length) lostSpecies.forEach((s) => console.log(`   ⚠️   Species unmapped:    ${s}`));
      console.log('\n     Vercel will pick this up on next deploy. Run `git add . && git commit` to push.\n');

      // macOS notification
      if (added.length > 0) {
        const speciesMsg = newSpecies.length > 0
          ? `${newSpecies.length} new species mapped: ${newSpecies.join(', ')}`
          : `${added.length} image(s) added, JSON updated`;
        notify('UAE Anglers Hub 🐟', speciesMsg);
      }

      lastFileList = newFileList;
      lastSlugs    = newSlugs;
    }, DEBOUNCE_MS);
  });

  watcher.on('error', (err) => {
    console.error('❌  Watcher error:', err);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋  Watcher stopped.\n');
    watcher.close();
    process.exit(0);
  });
}

main();
