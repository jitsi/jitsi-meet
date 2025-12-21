#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync, spawn } = require('child_process');

const root = path.resolve(__dirname, '..');

function log(...a) { console.log('[start-dev]', ...a); }

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyIfExists(src, dest) {
  if (fs.existsSync(src)) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    log('copied', src, '->', dest);
  }
}

function copyAllFromDir(srcDir, destDir, filter) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);
  const entries = fs.readdirSync(srcDir);
  for (const e of entries) {
    const s = path.join(srcDir, e);
    const d = path.join(destDir, e);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
      fs.cpSync(s, d, { recursive: true });
      log('copied dir', s, '->', d);
    } else if (!filter || filter(e)) {
      fs.copyFileSync(s, d);
      log('copied', s, '->', d);
    }
  }
}

async function main() {
  const libs = path.join(root, 'libs');
  if (fs.existsSync(libs)) fs.rmSync(libs, { recursive: true, force: true });
  ensureDir(libs);

  // lib-jitsi-meet UMD
  const libJitsiUMD = path.join(root, 'node_modules', 'lib-jitsi-meet', 'dist', 'umd');
  if (fs.existsSync(libJitsiUMD)) {
    copyAllFromDir(libJitsiUMD, libs);
  }

  // wasm and binary assets from various packages
  copyIfExists(path.join(root, 'node_modules', '@matrix-org', 'olm', 'olm.wasm'), path.join(libs, 'olm.wasm'));
  copyAllFromDir(path.join(root, 'node_modules', '@tensorflow', 'tfjs-backend-wasm', 'dist'), libs, name => name.endsWith('.wasm'));
  copyIfExists(path.join(root, 'node_modules', '@jitsi', 'rnnoise-wasm', 'dist', 'rnnoise.wasm'), path.join(libs, 'rnnoise.wasm'));
  copyAllFromDir(path.join(root, 'react', 'features', 'stream-effects', 'virtual-background', 'vendor', 'tflite'), libs, name => name.endsWith('.wasm'));
  copyAllFromDir(path.join(root, 'react', 'features', 'stream-effects', 'virtual-background', 'vendor', 'models'), libs, name => name.endsWith('.tflite'));
  copyAllFromDir(path.join(root, 'node_modules', '@vladmandic', 'human-models', 'models'), libs, name => name.endsWith('.bin') || name.endsWith('.json'));

  // excalidraw dev assets
  const excDev = path.join(root, 'node_modules', '@jitsi', 'excalidraw', 'dist', 'excalidraw-assets-dev');
  if (fs.existsSync(excDev)) {
    fs.cpSync(excDev, path.join(libs, 'excalidraw-assets-dev'), { recursive: true });
    log('copied excalidraw assets dev');
  }

  // Build CSS: sass then cleancss (via npx to use local devDeps)
  log('building CSS...');
  const sassCmd = `npx sass css/main.scss css/all.bundle.css`;
  let r = spawnSync(sassCmd, { cwd: root, shell: true, stdio: 'inherit' });
  if (r.status !== 0) log('sass command returned', r.status);

  const cleancssCmd = `npx cleancss --skip-rebase css/all.bundle.css > css/all.css`;
  r = spawnSync(cleancssCmd, { cwd: root, shell: true, stdio: 'inherit' });
  if (r.status !== 0) log('cleancss command returned', r.status);
  try { fs.unlinkSync(path.join(root, 'css', 'all.bundle.css')); } catch (e) {}

  // Finally, start webpack dev server
  log('starting webpack dev server...');
  const proc = spawn('npx webpack serve --mode development --progress', { cwd: root, shell: true, stdio: 'inherit' });
  proc.on('exit', code => process.exit(code));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
