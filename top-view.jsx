/* global React, refKey, rectifiedText, parseReference, Folio */
/* ultimate.bible — Page: Featured (curated spotlight redemptions) */
const { useState: useStateT, useEffect: useEffectT } = React;

function FeaturedView({ featured, ready, animate, canonKeys, navigate }) {
  const [currentRef, setCurrentRef] = useStateT(null);
  const current =
    featured.find((p) => refKey(p.reference) === currentRef) || featured[0] || null;
  const [revealed, setRevealed] = useStateT(false);

  // reveal the redemption on load + replay it whenever the verse changes
  useEffectT(() => {
    setRevealed(false);
    if (!current) return undefined;
    const id = setTimeout(() => setRevealed(true), animate ? 220 : 0);
    return () => clearTimeout(id);
  }, [current, animate]);

  if (!current) {
    return (
      <div className="body">
        <main className="stage">
          <div className="stage-inner">
            <div className="canon-empty">
              {ready ? "No verses featured yet — star one with “*” in canon.txt." : "Opening the book…"}
            </div>
          </div>
        </main>
      </div>);

  }

  const isCanon = canonKeys.has(refKey(current.reference));

  return (
    <div className="body">
      <aside className="index">
        <div className="index-head">FEATURED</div>
        <ul className="index-list">
          {featured.map((p, i) => {
            const on = refKey(p.reference) === refKey(current.reference);
            return (
              <li key={i}>
                <button className={"index-item" + (on ? " on" : "")} onClick={() => setCurrentRef(refKey(p.reference))}>
                  <span className="ii-ref">{p.display || p.reference}</span>
                  <span className="ii-preview">{rectifiedText(p)}</span>
                </button>
              </li>);

          })}
        </ul>
      </aside>

      <main className="stage">
        <div className="stage-inner">
          <Folio
            passage={current}
            revealed={revealed}
            loading={false}
            animate={animate}
            isCanon={isCanon}
            onViewCanon={() => navigate("canon", current.source)} />

        </div>
      </main>
    </div>);

}

Object.assign(window, { FeaturedView });
