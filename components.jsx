/* global React */
/* ultimate.bible — shared verse components */

/* The renewed text stands as carved — static, set in stone, unmarked.
   Iteration is the only animation: recarving happens in canon.txt.
   The verse sizes itself to its length so great passages sit as pages,
   not walls. */

/* nip widows: glue the last two words of each verse line with a no-break
   space so no word stands alone on its final line — the classic "widont"
   technique, vendored as five auditable lines. Lines of one or two words
   are left alone. (text-wrap: pretty does this natively where supported;
   this covers the rest.) */
function nipWidows(s) {
  return s.split("\n").map((line) =>
    line.trim().split(/\s+/).length > 2 ? line.replace(/ (?=\S+$)/, "\u00A0") : line
  ).join("\n");
}

function RenewedText({ passage, compact }) {
  const segs = passage.segments;
  const text = nipWidows(segs.map((s) => (s.type === "keep" ? s.text : s.new)).join(""));
  const cls = ["verse"];
  if (compact) {
    cls.push("compact");
  } else {
    const len = text.length;
    if (len > 450) cls.push("size-xl");
    else if (len > 220) cls.push("size-l");
    else if (len > 110) cls.push("size-m");
  }
  return <p className={cls.join(" ")}>{text}</p>;
}

function VerseSkeleton() {
  return (
    <div className="verse skeleton" aria-hidden="true">
      <span className="sk-line" style={{ width: "92%" }} />
      <span className="sk-line" style={{ width: "78%" }} />
      <span className="sk-line" style={{ width: "54%" }} />
    </div>
  );
}

/* shared verse panel used by the Featured view */
function Folio({ passage, loading, isCanon, onViewCanon }) {
  const changeCount = passage ? passage.segments.filter((s) => s.type === "change").length : 0;
  return (
    <div className="folio">
      <div className="folio-ref">
        <span className="ref-mark" />
        {loading ? "CONSULTING THE MANUSCRIPTS" : passage ? ("Renewed from " + (passage.display || passage.reference)) : ""}
      </div>
      <div className="verse-wrap">
        {loading ? (
          <VerseSkeleton />
        ) : passage ? (
          <RenewedText passage={passage} />
        ) : null}
      </div>
      {!loading && passage && (
        <div className="controls">
          {isCanon && (
            <button className="canon-link" onClick={onViewCanon}>
              ✦ Canonical · View in the canon →
            </button>
          )}
          <div className="count">
            {changeCount} {changeCount === 1 ? "renewal" : "renewals"}
          </div>
        </div>
      )}
      {passage && passage.rationale && (
        <div className="rationale show">
          <div className="rat-label">THE RENEWAL</div>
          <p className="rat-body">{passage.rationale}</p>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { RenewedText, VerseSkeleton, Folio });
