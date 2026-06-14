#!/usr/bin/env node
/* ultimate.bible — static site build.
 *
 * Regenerates index.html from canon.txt. The parsing engine is the SAME pure
 * module the browser app + node tests use (canon-parser.js) — required here, not
 * reimplemented, so there is one source of truth for how the canon is read.
 *
 * The grouping / ordering / verse rendering below mirror what canon-view.jsx and
 * components.jsx did at runtime; this just does it once, at build time, and bakes
 * the result into the page. The CSS lives in styles.css (verbatim from the old
 * inline <style>); the only remaining JS is script.js (theme toggle + chant).
 *
 * Run:  node build.js     ->  writes index.html in place
 */
"use strict";
const fs = require("fs");
const path = require("path");

const HERE = __dirname;
const P = require(path.join(HERE, "canon-parser.js")); // the real parser
const CANON_TXT = path.join(HERE, "canon.txt");
const OUT = path.join(HERE, "index.html");

// ---- read + parse the canon (identical pipeline to data.jsx loadCanon) ----
const raw = fs.readFileSync(CANON_TXT, "utf8");
const canon = P.parseCanonText(raw).map((r) => P.normalizeRecord(r));

// ---- grouping / ordering (from canon-view.jsx, testaments lens) ----
const TESTAMENT_ORDER = ["Reason", "Revelation", "Law", "Enlightenment", "Imagination"];
const groupName = (r) => r.testament || "Unsorted";

function orderGroupNames(names) {
  const known = TESTAMENT_ORDER.filter((n) => names.includes(n));
  const rest = names.filter((n) => !TESTAMENT_ORDER.includes(n)).sort((a, b) => a.localeCompare(b));
  return [...known, ...rest];
}

function entrySort(a, b) {
  const s = (a.source || "").localeCompare(b.source || "");
  if (s) return s;
  const ca = typeof a.chapter === "number" ? a.chapter : 9999;
  const cb = typeof b.chapter === "number" ? b.chapter : 9999;
  if (ca !== cb) return ca - cb;
  const va = parseInt(a.verse, 10) || 0;
  const vb = parseInt(b.verse, 10) || 0;
  if (va !== vb) return va - vb;
  return (a.display || "").localeCompare(b.display || "");
}

const map = new Map();
canon.forEach((r) => {
  const k = groupName(r);
  if (!map.has(k)) map.set(k, []);
  map.get(k).push(r);
});
const groups = orderGroupNames([...map.keys()]).map((n) => ({
  name: n,
  items: map.get(n).slice().sort(entrySort),
}));

// ---- verse rendering (from components.jsx RenewedText, compact path) ----
// nip widows: glue the last two words of each line with a no-break space.
function nipWidows(s) {
  return s
    .split("\n")
    .map((line) => (line.trim().split(/\s+/).length > 2 ? line.replace(/ (?=\S+$)/, " ") : line))
    .join("\n");
}
function renewedText(passage) {
  return nipWidows(passage.segments.map((s) => (s.type === "keep" ? s.text : s.new)).join(""));
}

// ---- html helpers ----
function esc(t) {
  return String(t == null ? "" : t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
const slug = (n) => "testament-" + String(n).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ---- render the canon body ----
// The original passage, reconstructed from the segments: unchanged words pass
// through (muted by the parent), only the RENEWED words are wrapped to be
// struck. nipWidows is skipped here — the original is the muted witness, not
// the carved line. Newlines survive (collapse like the renewed text does).
function renderOriginal(segs) {
  return segs
    .map((s) => (s.type === "keep" ? esc(s.text) : `<span class="struck">${esc(s.old)}</span>`))
    .join("");
}

function renderFolio(r) {
  const ref = `<span class="ref-mark"></span>Renewed from ${esc(r.display || r.reference)}`;
  const renewed = `<p class="verse compact">${esc(renewedText(r))}</p>`;
  const rat = r.rationale ? `\n          <p class="cf-rationale">${esc(r.rationale)}</p>` : "";
  const hasChange = r.segments.some((s) => s.type === "change");

  // Nothing was renewed → no original to compare; render the line plainly.
  if (!hasChange) {
    return `        <li class="cfolio">
          <div class="cf-ref">${ref}</div>
          ${renewed}${rat}
        </li>`;
  }

  // Set in stone by default; tap the verse to unfold the original beneath it —
  // muted, with only the renewed words struck. Native <details>: no JS, instant,
  // accessible (keyboard + screen reader), works with JS off. The carved
  // (renewed) line stays put; the witness appears below it.
  return `        <li class="cfolio">
          <details class="folio-reveal">
            <summary>
              <div class="cf-ref">${ref} <span class="cf-compare"></span></div>
              ${renewed}
            </summary>
            <p class="verse compact verse-original">${renderOriginal(r.segments)}</p>
          </details>${rat}
        </li>`;
}

function renderSection(g) {
  const passages = g.items.length === 1 ? "passage" : "passages";
  const folios = g.items.map(renderFolio).join("\n");
  return `      <section class="canon-section" id="${slug(g.name)}">
        <div class="canon-book-head">
          <div class="cbh-kicker">TESTAMENT OF</div>
          <h1 class="cbh-title">${esc(g.name)}</h1>
          <div class="cbh-meta">${g.items.length} ${passages}</div>
        </div>
        <ul class="canon-folios">
${folios}
        </ul>
      </section>`;
}

const unit = groups.length === 1 ? "testament" : "testaments";
const sidebar = groups
  .map(
    (g) =>
      `          <li><a class="book-row has" href="#${slug(g.name)}" data-target="${slug(g.name)}"><span class="br-name">${esc(
        g.name
      )}</span><span class="br-count">${g.items.length}</span></a></li>`
  )
  .join("\n");

const sections = groups.map(renderSection).join("\n");

// ---- inline SVG icons (from app.jsx — baked, identical in every engine) ----
const ICON_PLAY = `<svg class="ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 5.6v12.8l10.4-6.4z" fill="currentColor"/></svg>`;
const ICON_AUTO = `<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 4 a8 8 0 0 1 0 16 z" fill="currentColor"/></svg>`;

// ---- full page ----
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Ultimate Bible — The Lasting Word</title>
<link rel="icon" type="image/png" href="UltimatumFavicon.png" />
<meta name="description" content="The foundational words of Western civilization, renewed; the word that wounds struck, and the word that frees set in its place, with the original kept to the last word." />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Ultimate Bible" />
<meta property="og:title" content="Ultimate Bible — The Lasting Word" />
<meta property="og:description" content="The foundational words of Western civilization, renewed; the word that wounds struck, and the word that frees set in its place, with the original kept to the last word." />
<meta property="og:url" content="https://ultimate.bible/" />
<meta property="og:image" content="https://ultimate.bible/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Ultimate Bible — The Lasting Word" />
<meta name="twitter:description" content="The foundational words of Western civilization, renewed; the word that wounds struck, and the word that frees set in its place, with the original kept to the last word." />
<meta name="twitter:image" content="https://ultimate.bible/og.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Prata&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "9738bf1f5c7e4637a0add795d946a862"}'></script>
<link rel="stylesheet" href="styles.css" />
<script>
  /* theme-init: resolve light/dark before first paint so there is no flash.
     Mode (auto|light|dark) lives in localStorage; script.js owns the toggle. */
  (function () {
    try {
      var m = localStorage.getItem("ub.theme.v1");
      if (["auto", "light", "dark"].indexOf(m) === -1) m = "auto";
      var dark = m === "dark" || (m === "auto" && window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
      if (dark) document.documentElement.setAttribute("data-theme", "dark");
    } catch (e) {}
  })();
</script>
</head>
<body>
  <div class="root" id="top">
    <header class="masthead">
      <audio id="chant" src="Weave.mp3" preload="auto"></audio>
      <button id="chant-btn" class="audio-cycle" title="Play the chant" aria-label="Play the chant">${ICON_PLAY}</button>
      <a class="brand" href="#top" title="Ultimate Bible" aria-label="Ultimate Bible">
        <img class="brand-mark" src="Ultimatum.png" alt="Ultimate Bible" width="68" height="68" />
      </a>
      <button id="theme-btn" class="theme-cycle" title="Theme: auto — click to change" aria-label="Theme: auto — click to change">${ICON_AUTO}</button>
    </header>

    <div class="body canon">
      <aside class="books">
        <div class="canon-controls">
          <div class="books-summary">
            <div class="bs-num">${canon.length}</div>
            <div class="bs-cap">renewed passages<br />across ${groups.length} ${unit}</div>
          </div>
        </div>
        <ul class="book-rows">
${sidebar}
        </ul>
      </aside>

      <main class="canon-main">
${sections}
      </main>
    </div>
  </div>
  <script src="script.js" defer></script>
</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log(
  `index.html written — ${canon.length} passages across ${groups.length} ${unit} (${groups
    .map((g) => `${g.name}:${g.items.length}`)
    .join(", ")})`
);
