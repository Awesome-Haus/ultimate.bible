# Ultimate Bible

**The Lasting Word.**

A canon of the foundational words of Western civilization, renewed; the word
that wounds struck, and the word that frees set in its place, with the original
kept verbatim beneath every turn. Forty passages across five testaments:
Reason, Revelation, Law, Enlightenment, Imagination.

- [`canon.txt`](canon.txt) **is** the content. Adding a passage is writing three
  lines of plain text, then `node build.js`.
- [`build.js`](build.js) renders `canon.txt` into a static `index.html` at build
  time — no framework, no client-side rendering. The scripture ships as plain HTML
  (view-source, crawlable, readable with JavaScript off). Parsing is shared with
  the browser-era parser, [`canon-parser.js`](canon-parser.js), tested in `_test/`.
- [`SOURCES.md`](SOURCES.md) holds the receipts: every original verified against a
  named public-domain edition, under seven ratified editorial conventions.
- [`llms.txt`](llms.txt) states the method for machine readers.
- One page, set in light: the canon beneath the Ultimatum rose window, with the
  Weave suite playing once through; its button's edge is the progress ring. Tap a
  verse to compare the original — only the renewed words struck.
- The one runtime script, [`script.js`](script.js), carries the theme, the chant,
  and the compare reveal. Everything else is HTML and CSS.

Live at [ultimate.bible](https://ultimate.bible).
