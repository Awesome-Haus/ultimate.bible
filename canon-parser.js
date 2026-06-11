/* ultimate.bible — canon parser (pure; shared by the browser app + node tests).
   No DOM, no network, no React. Browser: attaches to window. Node: module.exports.

   canon.txt grammar:
     # comment line
     == Source @Testament ==     source header; @Testament sets a default testament (optional)
     * Locus  @Testament  ~Theme  '*' = featured; @Testament / ~Theme optional, override the default
     verse text with [old→new]   the renewed line (→ or -> both work)
     > rationale                 optional
   Blank line ends a block. A testament is NEVER inferred — declared at header or per-entry, else Unsorted.
   The five testaments: Reason · Revelation · Law · Enlightenment · Imagination. */
(function (factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else if (typeof window !== "undefined") Object.assign(window, api);
})(function () {
  const OLD_TESTAMENT = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges",
    "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
    "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes",
    "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea",
    "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
    "Haggai", "Zechariah", "Malachi",
  ];
  const NEW_TESTAMENT = [
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
    "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians",
    "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
    "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation",
  ];
  const ALL_BOOKS = [...OLD_TESTAMENT, ...NEW_TESTAMENT];
  const BOOK_ALIASES = {
    "Psalm": "Psalms", "Song of Songs": "Song of Solomon", "Canticles": "Song of Solomon",
    "Revelations": "Revelation", "Qoheleth": "Ecclesiastes",
  };
  const TESTAMENTS = ["Reason", "Revelation", "Law", "Enlightenment", "Imagination"];

  function titleCase(s) {
    return String(s || "").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  /* canonicalize a testament name to one of the five (case-insensitive), else keep it as given */
  function canonTestament(s) {
    if (!s) return null;
    const hit = TESTAMENTS.find((v) => v.toLowerCase() === String(s).toLowerCase());
    return hit || titleCase(s);
  }

  /* normalized lookup key for a reference */
  function refKey(ref) {
    return String(ref || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/\s*:\s*/g, ":");
  }

  /* parse "1 Corinthians 13:4" -> { book, chapter, verse } (Bible only; else Unverified) */
  function parseReference(ref) {
    const raw = String(ref || "").trim();
    const candidates = [
      ...ALL_BOOKS.map((b) => ({ match: b, book: b })),
      ...Object.keys(BOOK_ALIASES).map((a) => ({ match: a, book: BOOK_ALIASES[a] })),
    ].sort((a, b) => b.match.length - a.match.length);
    for (const c of candidates) {
      if (raw === c.match || raw.toLowerCase().startsWith(c.match.toLowerCase() + " ")) {
        const rest = raw.slice(c.match.length).trim().replace(/\s*:\s*/, ":");
        const [ch, vs] = rest.split(":");
        return {
          book: c.book,
          chapter: ch ? parseInt(ch, 10) || ch : null,
          verse: vs ? vs.trim() : null,
        };
      }
    }
    return { book: "Unverified", chapter: null, verse: null };
  }

  function originalText(p) {
    return p.segments.map((s) => (s.type === "keep" ? s.text : s.old)).join("");
  }
  function renewedText(p) {
    return p.segments.map((s) => (s.type === "keep" ? s.text : s.new)).join("");
  }

  /* split a verse line into keep/change segments: "[old→new]" (→ or -> both accepted) */
  function parseSegments(text) {
    const segs = [];
    const re = /\[([^\[\]]+)\]/g;
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) segs.push({ type: "keep", text: text.slice(last, m.index) });
      const parts = m[1].split(/\s*(?:→|->)\s*/);
      if (parts.length >= 2) {
        segs.push({ type: "change", old: parts[0].trim(), new: parts[1].trim() });
      } else {
        segs.push({ type: "keep", text: m[0] }); // bracket with no arrow -> keep literally
      }
      last = re.lastIndex;
    }
    if (last < text.length) segs.push({ type: "keep", text: text.slice(last) });
    return segs;
  }

  /* "== Cicero @Law ==" -> { source: "Cicero", testament: "Law" } */
  function parseHeader(raw) {
    const inner = raw.trim().replace(/^=+\s*/, "").replace(/\s*=+$/, "").trim();
    let source = inner;
    let testament = null;
    const m = inner.match(/@(\S+)/);
    if (m) {
      testament = canonTestament(m[1]);
      source = inner.slice(0, m.index).trim();
    }
    return { source: source || null, testament };
  }

  /* "* Apology, 38a  @Reason ~Self" -> { featured, locus, testament, theme } */
  function parseRefLine(raw) {
    let line = raw.trim();
    let featured = false;
    if (line.startsWith("*")) { featured = true; line = line.slice(1).trim(); }
    let testament = null;
    let theme = null;
    const rm = line.match(/@(\S+)/);
    if (rm) testament = canonTestament(rm[1]);
    const tm = line.match(/~(\S+)/);
    if (tm) theme = titleCase(tm[1]);
    const locus = line.replace(/@\S+/g, "").replace(/~\S+/g, "").replace(/\s+/g, " ").trim();
    return { featured, locus, testament, theme };
  }

  /* one verse block + the active header context -> raw record */
  function parseBlock(lines, ctx) {
    const { featured, locus, testament: entryTestament, theme } = parseRefLine(lines[0] || "");
    const verseLines = [];
    const ratLines = [];
    for (let i = 1; i < lines.length; i++) {
      const t = lines[i].trim();
      if (!t) continue;
      if (t.startsWith(">")) ratLines.push(t.slice(1).trim());
      else verseLines.push(t);
    }
    // Join verse lines with newlines so poems keep their lineation (CSS renders them);
    // collapse only intra-line whitespace. Single-line verses are unaffected.
    const verseText = verseLines.map((l) => l.replace(/\s+/g, " ").trim()).join("\n").trim();
    const rationale = ratLines.join(" ").trim();
    if (!verseText || (!locus && !ctx.source)) return null;
    return {
      source: ctx.source || null,
      locus,
      testament: entryTestament || ctx.testament || null,
      theme: theme || null,
      segments: parseSegments(verseText),
      rationale,
      featured,
    };
  }

  /* whole canon.txt -> raw records, tracking the current source/testament header */
  function parseCanonText(raw) {
    const lines = String(raw || "").replace(/\r\n?/g, "\n").split("\n");
    const out = [];
    let ctx = { source: null, testament: null };
    let block = [];
    const flush = () => {
      if (block.length) {
        const rec = parseBlock(block, ctx);
        if (rec) out.push(rec);
        block = [];
      }
    };
    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith("#")) continue;
      if (t.length > 4 && t.startsWith("==") && t.endsWith("==")) {
        flush();
        ctx = parseHeader(t);
        continue;
      }
      if (t === "") { flush(); continue; }
      block.push(line);
    }
    flush();
    return out;
  }

  /* attach reference/key/pretty display + carry source/testament/theme through */
  function normalizeRecord(rec) {
    const headerSource = rec.source || null;
    const locus = rec.locus || "";
    const reference = headerSource ? `${headerSource} ${locus}`.trim() : locus;
    const pr = parseReference(reference);
    const isScripture = pr.book !== "Unverified";
    let display;
    if (isScripture && pr.chapter != null && pr.verse != null) {
      display = `${pr.book} ${pr.chapter} : ${pr.verse}`;
    } else if (headerSource && locus) {
      display = `${headerSource} — ${locus}`;
    } else if (headerSource) {
      display = headerSource;
    } else {
      display = reference;
    }
    const source = headerSource || (isScripture ? pr.book : (locus || "—"));
    return {
      ...rec,
      reference,
      key: refKey(reference || display),
      source,
      book: pr.book,
      chapter: pr.chapter,
      verse: pr.verse,
      display,
      testament: rec.testament || null,
      theme: rec.theme || null,
    };
  }

  return {
    OLD_TESTAMENT, NEW_TESTAMENT, ALL_BOOKS, BOOK_ALIASES, TESTAMENTS,
    refKey, parseReference, originalText, renewedText, parseSegments,
    parseHeader, parseRefLine, parseBlock, parseCanonText, normalizeRecord,
  };
});
