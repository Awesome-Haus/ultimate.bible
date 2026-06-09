/* global parseCanonText, normalizeRecord */
/* ultimate.bible — canon loading: browser fetch glue over canon-parser.js */

/* load + parse the canon from the static text file (works on GitHub Pages) */
async function loadCanon() {
  try {
    const res = await fetch("canon.txt", { cache: "no-cache" });
    if (!res.ok) return [];
    const raw = await res.text();
    return parseCanonText(raw).map((r) => normalizeRecord(r));
  } catch (e) {
    return [];
  }
}

Object.assign(window, { loadCanon });
