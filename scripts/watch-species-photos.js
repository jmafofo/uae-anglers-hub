#!/usr/bin/env node
/**
 * watch-species-photos.js  (plain Node.js — no tsx/TypeScript required)
 * ─────────────────────────────────────────────────────────────────────────────
 * Watches public/fish-species/ for new image files.
 * On detection it:
 *   1. Converts to .jpg using macOS sips (built-in, no deps)
 *   2. Removes the original non-jpg file
 *   3. Re-runs scan-species-photos → updates lib/species-photos.json
 *   4. git add + commit + push → Vercel deploys automatically
 *   5. Fires a macOS notification
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const fs      = require('fs');
const path    = require('path');
const { spawnSync, execSync } = require('child_process');

const PROJECT_DIR = path.resolve(__dirname, '..');
const PHOTOS_DIR  = path.join(PROJECT_DIR, 'public', 'fish-species');
const JSON_PATH   = path.join(PROJECT_DIR, 'lib', 'species-photos.json');
const DEBOUNCE_MS = 800;

const CONVERT_EXTS   = new Set(['.png', '.webp', '.heic', '.avif', '.tiff', '.tif', '.bmp', '.gif']);
const ALL_IMAGE_EXTS = new Set(['.jpg', '.jpeg', ...CONVERT_EXTS]);

// ── Utilities ─────────────────────────────────────────────────────────────────

function notify(title, message) {
  try {
    spawnSync('osascript', [
      '-e',
      `display notification "${message.replace(/"/g, "'")}" with title "${title}" sound name "Glass"`,
    ]);
  } catch (_) {}
}

function log(msg) {
  const ts = new Date().toLocaleTimeString();
  process.stdout.write(`[${ts}] ${msg}\n`);
}

function currentSlugs() {
  if (!fs.existsSync(JSON_PATH)) return new Set();
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  return new Set(Object.keys(data));
}

function convertToJpg(srcPath) {
  const ext = path.extname(srcPath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return srcPath;

  const dir      = path.dirname(srcPath);
  const base     = path.basename(srcPath, ext);
  const destPath = path.join(dir, `${base}.jpg`);

  log(`🔄  Converting ${path.basename(srcPath)} → ${path.basename(destPath)}`);

  const result = spawnSync('sips', [
    '--setProperty', 'format', 'jpeg',
    '--setProperty', 'formatOptions', '90',
    srcPath,
    '--out', destPath,
  ], { encoding: 'utf-8' });

  if (result.status !== 0) {
    log(`❌  sips error: ${result.stderr}`);
    return null;
  }

  try { fs.unlinkSync(srcPath); } catch (_) {}
  log(`✅  Converted and original removed`);
  return destPath;
}

function runScan() {
  const tsx = path.join(PROJECT_DIR, 'node_modules', '.bin', 'tsx');
  const result = spawnSync(tsx, ['scripts/scan-species-photos.ts'], {
    cwd: PROJECT_DIR,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  if (result.status !== 0) {
    log(`❌  scan failed:\n${result.stderr}`);
    return false;
  }
  return true;
}

function gitAddCommitPush(relPaths, newSlugs) {
  try {
    const filesToAdd = [...relPaths, 'lib/species-photos.json'].join(' ');
    execSync(`git add ${filesToAdd}`, { cwd: PROJECT_DIR });

    const staged = execSync('git diff --cached --name-only', {
      cwd: PROJECT_DIR, encoding: 'utf-8',
    }).trim();
    if (!staged) { log('ℹ️   Nothing new to commit'); return; }

    const speciesList = newSlugs.length > 0
      ? newSlugs.join(', ')
      : path.basename(relPaths[0] || 'unknown');

    const msg = `Add fish species photo(s): ${speciesList}\n\nAuto-committed by watch-species-photos watcher.\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`;
    execSync(`git commit -m ${JSON.stringify(msg)}`, { cwd: PROJECT_DIR });
    log('📦  Committed to git');

    execSync('git push origin main', { cwd: PROJECT_DIR });
    log('🚀  Pushed — Vercel is deploying now');
  } catch (err) {
    log(`❌  Git error: ${err.message}`);
  }
}

function imageFilesInDir() {
  return new Set(
    fs.readdirSync(PHOTOS_DIR).filter((f) => {
      return ALL_IMAGE_EXTS.has(path.extname(f).toLowerCase()) && !f.startsWith('.');
    })
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    process.stderr.write(`❌  Folder not found: ${PHOTOS_DIR}\n`);
    process.exit(1);
  }

  let debounce    = null;
  let lastFiles   = imageFilesInDir();
  let lastSlugs   = currentSlugs();

  process.stdout.write('\n👁️   UAE Anglers Hub — Species Photo Watcher\n');
  process.stdout.write(`📂  ${PHOTOS_DIR}\n`);
  process.stdout.write(`📋  Tracking ${lastFiles.size} images across ${lastSlugs.size} species\n`);
  process.stdout.write('     Supports: JPG · PNG · WEBP · HEIC · AVIF · TIFF · BMP · GIF\n');
  process.stdout.write('     Drop images → auto-converted to JPG → committed → deployed\n\n');

  const watcher = fs.watch(PHOTOS_DIR, { persistent: true }, (event, filename) => {
    if (!filename) return;
    if (!ALL_IMAGE_EXTS.has(path.extname(filename).toLowerCase())) return;

    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      const newFiles  = imageFilesInDir();
      const added     = [...newFiles].filter((f) => !lastFiles.has(f));
      const removed   = [...lastFiles].filter((f) => !newFiles.has(f));

      if (added.length === 0 && removed.length === 0) return;

      log('⚡  Change detected');
      removed.forEach((f) => log(`   🗑️   Removed: ${f}`));

      const finalRelPaths = [];
      for (const file of added) {
        const fullPath = path.join(PHOTOS_DIR, file);
        if (!fs.existsSync(fullPath)) continue;

        const ext = path.extname(file).toLowerCase();
        if (CONVERT_EXTS.has(ext)) {
          const converted = convertToJpg(fullPath);
          if (converted) finalRelPaths.push(path.relative(PROJECT_DIR, converted));
        } else {
          log(`   ✅  Added: ${file}`);
          finalRelPaths.push(path.relative(PROJECT_DIR, fullPath));
        }
      }

      if (finalRelPaths.length === 0) { lastFiles = imageFilesInDir(); return; }

      if (!runScan()) return;

      const newSlugs    = currentSlugs();
      const newSpecies  = [...newSlugs].filter((s) => !lastSlugs.has(s));
      const lostSpecies = [...lastSlugs].filter((s) => !newSlugs.has(s));

      log(`📸  species-photos.json updated — ${newSlugs.size} species with photos`);
      newSpecies.forEach((s)  => log(`   🐟  New species mapped: ${s}`));
      lostSpecies.forEach((s) => log(`   ⚠️   Species unmapped:  ${s}`));

      gitAddCommitPush(finalRelPaths, newSpecies);

      const notifMsg = newSpecies.length > 0
        ? `${newSpecies.join(', ')} added & deployed`
        : `${finalRelPaths.length} photo(s) updated & deployed`;
      notify('UAE Anglers Hub 🐟', notifMsg);

      lastFiles  = imageFilesInDir();
      lastSlugs  = newSlugs;
    }, DEBOUNCE_MS);
  });

  watcher.on('error', (err) => {
    process.stderr.write(`❌  Watcher error: ${err.message}\n`);
    process.exit(1);
  });

  process.on('SIGINT',  () => { process.stdout.write('\n👋  Watcher stopped.\n'); watcher.close(); process.exit(0); });
  process.on('SIGTERM', () => { watcher.close(); process.exit(0); });
}

main();
