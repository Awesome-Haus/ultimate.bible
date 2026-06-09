/* Unit tests for the canon.txt parser — imports the real module (no eval). */
const path = require("node:path");
const P = require(path.join(__dirname, "..", "canon-parser.js"));

let pass = 0, fail = 0;
const eq = (a, b, msg) => {
  if (JSON.stringify(a) === JSON.stringify(b)) pass++;
  else { fail++; console.error("FAIL:", msg, "\n  got:", JSON.stringify(a), "\n  exp:", JSON.stringify(b)); }
};
const ok = (c, msg) => { if (c) pass++; else { fail++; console.error("FAIL:", msg); } };

const norm = (recs) => recs.map(P.normalizeRecord);
const bySource = (recs, s) => recs.find((r) => r.source === s);

const sample = `# comment, ignored

Matthew 5:5   @Revelation
Blessed are the [meek→gentle]: for they shall inherit the [earth→cosmos].
> ...

== Socrates @Reason ==

* Apology, 38a   ~Self
The [unexamined→examined] life is not worth living.
> The charge becomes his creed.

== Genesis ==

* 3:19   @Revelation ~Ground
for [dust→stardust] thou art, and unto [dust→the stars] shalt thou return.
> Mortality becomes cosmic belonging.

* 1:3   ~Ground
And God said, Let there be [light→fire].
> ...

== Leviticus ==
* 19:18   @Law ~Justice
Thou shalt love thy [neighbour→equal] as thyself.
> ...

== Cicero @Law ==
* De Legibus, I.42
True law is [right reason→reason] in agreement with nature.
> ...
`;

const recs = norm(P.parseCanonText(sample));

eq(recs.length, 6, "six records across one header-less + four headers");

// --- header-less full reference at top of file (source derived from the book) ---
const matt = bySource(recs, "Matthew");
eq(matt.display, "Matthew 5 : 5", "header-less Bible ref display");
eq(matt.voice, "Revelation", "header-less entry @Voice");
eq(matt.book, "Matthew", "header-less source derived from scripture book");

// --- header source + non-Bible display + voice-from-header ---
const soc = bySource(recs, "Socrates");
eq(soc.voice, "Reason", "Socrates voice inherited from header");
eq(soc.theme, "Self", "theme tag parsed");
eq(soc.display, "Socrates — Apology, 38a", "non-Bible display: source — locus");
eq(soc.reference, "Socrates Apology, 38a", "reference = source + locus");
ok(soc.featured === true, "featured * survives tags");
eq(P.rectifiedText(soc), "The examined life is not worth living.", "rectified round-trip");

// --- Bible under header: locus joins source, pretty display, scripture parse ---
const gen319 = recs.find((r) => r.source === "Genesis" && r.chapter === 3);
eq(gen319.display, "Genesis 3 : 19", "Bible pretty ' : ' display");
eq(gen319.voice, "Revelation", "entry @Voice set (header had none)");
eq(gen319.theme, "Ground", "Bible theme tag");
eq([gen319.book, gen319.chapter, gen319.verse], ["Genesis", 3, "19"], "scripture parsed");

// --- no voice anywhere -> null (Unsorted handled in the view) ---
const gen13 = recs.find((r) => r.source === "Genesis" && r.chapter === 1);
eq(gen13.voice, null, "no @Voice + no header default -> null");

// --- per-source default voice inherited when entry omits @Voice ---
const cic = bySource(recs, "Cicero");
eq(cic.voice, "Law", "Cicero voice inherited from header default");
eq(cic.display, "Cicero — De Legibus, I.42", "Cicero display");

// --- Leviticus voice override + theme ---
const lev = bySource(recs, "Leviticus");
eq(lev.voice, "Law", "Leviticus entry @Law");
eq(lev.theme, "Justice", "Leviticus theme");

// --- voice canonicalization (case-insensitive) ---
eq(P.parseHeader("== Plato @reason ==").voice, "Reason", "lowercase voice canonicalized");
eq(P.parseHeader("== Plato @reason ==").source, "Plato", "header source parsed");

// --- edge cases ---
eq(P.parseCanonText("").length, 0, "empty file -> no records");
eq(P.parseCanonText("# only comments\n").length, 0, "comments-only -> no records");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
