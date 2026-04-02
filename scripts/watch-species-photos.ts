/**
 * watch-species-photos.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Watches public/fish-species/ for ANY new image file (jpg, png, webp, heic,
 * avif, tiff, bmp, gif). On detection it:
 *
 *   1. Converts the file to .jpg using macOS `sips` (lossless-quality, built-in)
 *   2. Removes the original if it was a different format
 *   3. Re-runs scan-species-photos → updates lib/species-photos.json
 *   4. git add + commit + push     → deploys to Vercel automatically
 *   5. Fires a macOS notification  → tells you what was added
 *
 * Usage (keep running in a terminal tab):
 *   npm run watch:species
 *
 * Or install as a background LaunchAgent so it runs automatically:
 *   scripts/com.uaeangler.species-watcher.plist
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as fs   from 'fs';
import * as path from 'path';
import { spawnSync, execSync } from 'child_process';

const PROJECT_DIR = process.cwd();
const PHOTOS_DIR  = path.join(PROJECT_DIR, 'public', 'fish-species');
const JSON_PATH   = path.join(PROJECT_DIR, 'lib', 'species-photos.json');
const DEBOUNCE_MS = 800;

// All formats we'll detect and convert
const CONVERT_EXTS = new Set(['.png', '.webp', '.heic', '.avif', '.tiff', '.tif', '.bmp', '.gif']);
const ALL_IMAGE_EXTS = new Set(['.jpg', '.jpeg', ...CONVERT_EXTS]);

// ── Utilities ─────────────────────────────────────────────────────────────────

function notify(title: string, message: string) {
  try {
    spawnSync('osascript', [
      '-e',
      `display notification "${message.replace(/"/g, "'")}" with title "${title}" sound name "Glass"`,
    ]);
  } catch { /* non-macOS */ }
}

function log(msg: string) {
  const ts = new Date().toLocaleTimeString();
  console.log(`[${ts}] ${msg}`);
}

function currentSlugs(): Set<string> {
  if (!fs.existsSync(JSON_PATH)) return new Set();
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8')) as Record<string, string[]>;
  return new Set(Object.keys(data));
}

// Convert any image to JPG using macOS sips (built-in, no extra deps)
function convertToJpg(srcPath: string): string | null {
  const ext  = path.extname(srcPath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return srcPath; // already JPG

  const dir     = path.dirname(srcPath);
  const base    = path.basename(srcPath, ext);
  const destPath = path.join(dir, `${base}.jpg`);

  log(`🔄  Converting ${path.basename(srcPath)} → ${path.basename(destPath)}`);

  const result = spawnSync('sips', [
    '--setProperty', 'format', 'jpeg',
    '--setProperty', 'formatOptions', '90',  // quality 90
    srcPath,
    '--out', destPath,
  ], { encoding: 'utf-8' });

  if (result.status !== 0) {
    log(`❌  sips conversion failed: ${result.stderr}`);
    return null;
  }

  // Remove original non-jpg file
  try { fs.unlinkSync(srcPath); } catch { /* ignore */ }
  log(`✅  Converted to JPG, original removed`);
  return destPath;
}

function runScan(): boolean {
  const result = spawnSync('npm', ['run', 'scan-species-photos'], {
    cwd: PROJECT_DIR,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  if (result.status !== 0) {
    log(`❌  scan-species-photos failed:\n${result.stderr}`);
    return false;
  }
  return true;
}

function gitAddCommitPush(addedFiles: string[], newSlugs: string[]) {
  try {
    // Stage image file(s) + updated JSON
    const filesToAdd = [
      ...addedFiles,
      'lib/species-photos.json',
    ].join(' ');

    execSync(`git add ${filesToAdd}`, { cwd: PROJECT_DIR });

    // Check there's actually something staged
    const staged = execSync('git diff --cached --name-only', { cwd: PROJECT_DIR, encoding: 'utf-8' }).trim();
    if (!staged) {
      log('ℹ️   Nothing new to commit (already up to date)');
      return;
    }

    const speciesList = newSlugs.length > 0
      ? newSlugs.join(', ')
      : path.basename(addedFiles[0] ?? 'unknown');

    const msg = `Add fish species photo(s): ${speciesList}\n\nAuto-committed by watch-species-photos watcher.\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`;

    execSync(`git commit -m ${JSON.stringify(msg)}`, { cwd: PROJECT_DIR });
    log('📦  Committed to git');

    execSync('git push origin main', { cwd: PROJECT_DIR });
    log('🚀  Pushed to GitHub — Vercel deploying now');
  } catch (err: unknown) {
    log(`❌  Git error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function imageFilesInDir(): Set<string> {
  return new Set(
    fs.readdirSync(PHOTOS_DIR).filter((f) => {
      return ALL_IMAGE_EXTS.has(path.extname(f).toLowerCase()) && !f.startsWith('.');
    })
  );
}

// ── Main watcher ─────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    console.error(`❌  Folder not found: ${PHOTOS_DIR}`);
    process.exit(1);
  }

  // Check git config
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: PROJECT_DIR, stdio: 'pipe' });
  } catch {
    console.error('❌  Not inside a git repository. Push will be skipped.');
  }

  let debounce: ReturnType<typeof setTimeout> | null = null;
  let lastFileList = imageFilesInDir();
  let lastSlugs    = currentSlugs();

  console.log('\n👁️   UAE Anglers Hub — Species Photo Watcher');
  console.log(`📂  ${PHOTOS_DIR}`);
  console.log(`📋  Tracking ${lastFileList.size} images across ${lastSlugs.size} species`);
  console.log('     Supports: JPG · PNG · WEBP · HEIC · AVIF · TIFF · BMP · GIF');
  console.log('     Non-JPG files are auto-converted → committed → deployed\n');

  const watcher = fs.watch(PHOTOS_DIR, { persistent: true }, (event, filename) => {
    if (!filename) return;
    const ext = path.extname(filename).toLowerCase();
    if (!ALL_IMAGE_EXTS.has(ext)) return;

    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(async () => {
      const newFileList = imageFilesInDir();

      const added   = [...newFileList].filter((f) => !lastFileList.has(f));
      const removed = [...lastFileList].filter((f) => !newFileList.has(f));

      if (added.length === 0 && removed.length === 0) return;

      log(`⚡  Change detected`);
      if (removed.length) removed.forEach((f) => log(`   🗑️   Removed: ${f}`));

      // Process each added file: convert if needed
      const finalFiles: string[] = [];
      for (const file of added) {
        const fullPath = path.join(PHOTOS_DIR, file);
        if (!fs.existsSync(fullPath)) continue; // file may have been temp

        const ext = path.extname(file).toLowerCase();
        if (CONVERT_EXTS.has(ext)) {
          const converted = convertToJpg(fullPath);
          if (converted) finalFiles.push(path.relative(PROJECT_DIR, converted));
        } else {
          log(`   ✅  Added: ${file}`);
          finalFiles.push(path.relative(PROJECT_DIR, fullPath));
        }
      }

      if (finalFiles.length === 0) {
        lastFileList = imageFilesInDir();
        return;
      }

      // Re-scan to update JSON
      const ok = runScan();
      if (!ok) return;

      const newSlugs    = currentSlugs();
      const newSpecies  = [...newSlugs].filter((s) => !lastSlugs.has(s));
      const lostSpecies = [...lastSlugs].filter((s) => !newSlugs.has(s));

      log(`📸  species-photos.json updated — ${newSlugs.size} species with photos`);
      if (newSpecies.length)  newSpecies.forEach((s)  => log(`   🐟  New species: ${s}`));
      if (lostSpecies.length) lostSpecies.forEach((s) => log(`   ⚠️   Unmapped:   ${s}`));

      // Commit + push
      gitAddCommitPush(finalFiles, newSpecies);

      // macOS notification
      const notifMsg = newSpecies.length > 0
        ? `${newSpecies.join(', ')} added & deployed`
        : `${finalFiles.length} photo(s) updated & deployed`;
      notify('UAE Anglers Hub 🐟', notifMsg);

      lastFileList = imageFilesInDir();
      lastSlugs    = newSlugs;
    }, DEBOUNCE_MS);
  });

  watcher.on('error', (err) => {
    log(`❌  Watcher error: ${err.message}`);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    console.log('\n\n👋  Watcher stopped.\n');
    watcher.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    watcher.close();
    process.exit(0);
  });
}

main();
