/**
 * CashHub PH — Vercel pre-build script
 * Stamps a unique build hash into index.html on every deploy.
 * This makes the Service Worker detect a new version and prompt users to refresh.
 *
 * Run automatically via vercel.json buildCommand: "node build.js"
 */

const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'index.html');

// Generate a short unique hash from current timestamp + random salt
const ts   = Date.now().toString(36);
const rand = Math.random().toString(36).slice(2, 6);
const hash = `cashhub-${ts}${rand}`;

let html = fs.readFileSync(FILE, 'utf8');

// Replace _BUILD_VER constant (used by the app's JS)
html = html.replace(
  /const _BUILD_VER\s*=\s*'cashhub-[^']+'/,
  `const _BUILD_VER = '${hash}'`
);

// Replace CACHE string inside the inline SW script tag
html = html.replace(
  /var CACHE\s*=\s*'cashhub-[^']+'/,
  `var CACHE = '${hash}'`
);

fs.writeFileSync(FILE, html, 'utf8');

console.log(`[CashHub Build] ✅ Stamped build hash: ${hash}`);
