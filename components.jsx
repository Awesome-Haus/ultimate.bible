/* global React */
/* ultimate.bible — shared verse components */

function RectifiedText({ passage, revealed, animate, compact }) {
  const segs = passage.segments;
  const stepMs = animate ? 240 : 0;
  const cls = ["verse"];
  if (revealed) cls.push("is-rectified");
  if (compact) cls.push("compact");

  let changeIdx = -1;
  return (
    <p className={cls.join(" ")}>
      {segs.map((seg, i) => {
        if (seg.type === "keep") return <span key={i}>{seg.text}</span>;
        changeIdx += 1;
        const d = changeIdx * stepMs;
        return (
          <span className="rx" key={i} style={{ transitionDelay: d + "ms" }}>
            {revealed ? seg.new : seg.old}
          </span>
        );
      })}
    </p>
  );
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
function Folio({ passage, revealed, loading, animate, isCanon, onViewCanon }) {
  const changeCount = passage ? passage.segments.filter((s) => s.type === "change").length : 0;
  return (
    <div className="folio">
      <div className="folio-ref">
        <span className="ref-mark" />
        {loading ? "CONSULTING THE MANUSCRIPTS" : passage ? (passage.display || passage.reference) : ""}
      </div>
      <div className="verse-wrap">
        {loading ? (
          <VerseSkeleton />
        ) : passage ? (
          <RectifiedText passage={passage} revealed={revealed} animate={animate} />
        ) : null}
      </div>
      {!loading && passage && (
        <div className="controls">
          {revealed && isCanon && (
            <button className="canon-link" onClick={onViewCanon}>
              ✦ Canonical · View in the canon →
            </button>
          )}
          <div className="count">
            {changeCount} {changeCount === 1 ? "indemnification" : "indemnifications"}
          </div>
        </div>
      )}
      <div className={"rationale" + (revealed && !loading && passage ? " show" : "")}>
        <div className="rat-label">THE REDEMPTION</div>
        <p className="rat-body">{passage ? passage.rationale : ""}</p>
      </div>
    </div>
  );
}

Object.assign(window, { RectifiedText, VerseSkeleton, Folio });
