/**
 * CashHub PH — Vercel pre-build script
 * Stamps a unique build hash into index.html AND sw.js on every deploy.
 * This makes the Service Worker detect a new version and prompt users to refresh.
 */

const fs   = require('fs');
const path = require('path');

const INDEX = path.join(__dirname, 'index.html');
const SW    = path.join(__dirname, 'sw.js');

// Generate a short unique hash from current timestamp + random salt
const ts   = Date.now().toString(36);
const rand = Math.random().toString(36).slice(2, 6);
const hash = `cashhub-${ts}${rand}`;

// ── Stamp index.html ──────────────────────────────────────────────────────────
let html = fs.readFileSync(INDEX, 'utf8');
html = html.replace(
  /const _BUILD_VER\s*=\s*'cashhub-[^']+'/,
  `const _BUILD_VER = '${hash}'`
);
fs.writeFileSync(INDEX, html, 'utf8');

// ── Stamp sw.js ───────────────────────────────────────────────────────────────
let sw = fs.readFileSync(SW, 'utf8');
sw = sw.replace(
  /var CACHE\s*=\s*'cashhub-[^']+'/,
  `var CACHE = '${hash}'`
);
fs.writeFileSync(SW, sw, 'utf8');

console.log(`[CashHub Build] ✅ Stamped build hash: ${hash}`);
