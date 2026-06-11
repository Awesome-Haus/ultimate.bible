/* global React, refKey, renewedText, parseReference, Folio */
/* ═══ ARCHIVED — not loaded by the site (editor's call, 2026-06-10: just the Canon). ═══
   The Featured page: curated spotlight renewals with a rail of starred entries.
   TO RESTORE: (1) re-add <script type="text/babel" src="top-view.jsx"> to index.html,
   (2) restore the navbar + view routing + featuredList/canonKeys wiring in app.jsx
   (see git history), (3) paste the CSS block from the bottom of this file back into
   index.html and rejoin the split selectors it names. Folio + VerseSkeleton live on
   in components.jsx. The * markers in canon.txt still curate the featured set. */
const { useState: useStateT } = React;

function FeaturedView({ featured, ready, canonKeys, navigate }) {
  const [currentRef, setCurrentRef] = useStateT(null);
  const current =
    featured.find((p) => refKey(p.reference) === currentRef) || featured[0] || null;

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
                  <span className="ii-preview">{renewedText(p)}</span>
                </button>
              </li>);

          })}
        </ul>
      </aside>

      <main className="stage">
        <div className="stage-inner">
          <Folio
            passage={current}
            loading={false}
            isCanon={isCanon}
            onViewCanon={() => navigate("canon", current.testament || "")} />

        </div>
      </main>
    </div>);

}

Object.assign(window, { FeaturedView });

/* ═══ ARCHIVED CSS (Featured page + nav bar) — paste back into index.html on restore.
   Also restore the split selectors: .index-head and .index-list rejoin their canon
   siblings; .ii-preview rejoins the ligature rule; .index/.stage rejoin the responsive
   rules. ═══
  /* nav bar below the masthead — hugs the main panel: when a rail is present it
     starts where the rail ends, and its contents always sit right-aligned * /
  .navbar {
    flex: 0 0 auto; display: flex; align-items: center; justify-content: center;
    padding: 9px clamp(20px, 5vw, 64px); border-bottom: 1px solid var(--line);
  }
  .nav { display: flex; gap: 4px; }
  .nav-tab {
    appearance: none; cursor: pointer; background: transparent; border: 1px solid transparent;
    font-family: var(--mono); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--ink-soft); padding: 9px 16px; border-radius: 2px; transition: color .2s, background .2s, border-color .2s;
  }
  .nav-tab:hover { color: var(--ink); }
  .nav-tab.on { color: var(--ink); border-color: var(--line); background: color-mix(in oklab, var(--paper-2) 70%, transparent); }
  /* ---------------- top-verses index ---------------- * /
  .index { border-right: 1px solid var(--line); padding: 28px clamp(16px, 2vw, 28px); display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
  .index-head { font-size: 10.5px; letter-spacing: 0.34em; color: var(--ink-soft); margin-bottom: 14px; }
  .index-item {
    width: 100%; text-align: left; cursor: pointer; appearance: none; background: transparent;
    border: none; border-top: 1px solid var(--line); padding: 13px 8px 14px 14px; position: relative;
    display: flex; flex-direction: column; gap: 5px; transition: background .18s;
  }
  .index-item::before { content: ""; position: absolute; left: 0; top: -1px; bottom: 0; width: 2px; background: var(--accent); transform: scaleY(0); transform-origin: top; transition: transform .22s ease; }
  .index-item:hover { background: color-mix(in oklab, var(--paper-2) 60%, transparent); }
  .index-item.on::before { transform: scaleY(1); }
  .index-item.on { background: color-mix(in oklab, var(--paper-2) 80%, transparent); }
  .index-list li:last-child .index-item { border-bottom: 1px solid var(--line); }
  .ii-ref { font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; color: var(--accent-deep); text-transform: uppercase; }
  .ii-preview { font-family: var(--scripture); font-size: 17px; line-height: 1.34; color: var(--ink); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .index-foot { margin-top: auto; padding-top: 22px; font-size: 12px; line-height: 1.55; color: var(--ink-soft); font-style: italic; }
  .index-foot .ff { color: var(--accent); font-style: normal; margin-right: 4px; }
  /* ---------------- stage (renew) ---------------- * /
  .stage { overflow-y: auto; display: flex; padding: clamp(24px, 5vh, 56px) clamp(22px, 6vw, 84px); }
  .stage-inner { margin: auto; width: 100%; max-width: 900px; }
  .seek-bar { display: flex; align-items: center; gap: 12px; border-bottom: 1.5px solid var(--ink); padding-bottom: 10px; margin-bottom: clamp(30px, 6vh, 54px); }
  .seek-glyph { color: var(--accent); font-size: 16px; }
  .seek-input { flex: 1; min-width: 0; appearance: none; background: transparent; border: none; padding: 4px 0; font-family: var(--ui); font-size: 15px; color: var(--ink); }
  .seek-input::placeholder { color: color-mix(in oklab, var(--ink-soft) 80%, transparent); }
  .seek-input:focus { outline: none; }
  .seek-btn { appearance: none; cursor: pointer; border: 1px solid var(--ink); background: var(--ink); color: var(--paper); font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; padding: 9px 18px; border-radius: 2px; transition: background .2s, opacity .2s; }
  .seek-btn:hover:not(:disabled) { background: var(--accent-deep); border-color: var(--accent-deep); }
  .seek-btn:disabled { opacity: 0.35; cursor: default; }
  .folio { width: 100%; }
  .folio-ref { display: flex; align-items: center; gap: 12px; font-family: var(--mono); font-size: 12px; letter-spacing: 0.28em; color: var(--accent-deep); text-transform: uppercase; margin-bottom: 24px; }
  .verse-wrap { min-height: 1.4em; }
  .skeleton { display: flex; flex-direction: column; gap: 0.42em; }
  .sk-line { height: 0.72em; border-radius: 3px; background: linear-gradient(90deg, var(--paper-2) 0%, color-mix(in oklab, var(--paper-2) 55%, var(--line)) 40%, var(--paper-2) 80%); background-size: 200% 100%; animation: sh 1.3s ease-in-out infinite; }
  @keyframes sh { 0% { background-position: 200% 0; } 100% { background-position: -120% 0; } }
  .controls { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-top: 36px; padding-top: 22px; border-top: 1px solid var(--line); }
  .renew-cta { appearance: none; cursor: pointer; border: 1px solid var(--ink); background: var(--ink); color: var(--paper); font-family: var(--mono); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; padding: 13px 22px; border-radius: 2px; display: inline-flex; align-items: center; gap: 9px; transition: background .2s, transform .12s; }
  .renew-cta:hover { background: var(--accent-deep); border-color: var(--accent-deep); }
  .renew-cta:active { transform: translateY(1px); }
  .cta-glyph { color: var(--accent); font-size: 14px; }
  .revert { appearance: none; cursor: pointer; background: transparent; border: none; font-family: var(--mono); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-soft); padding: 6px 0; transition: color .2s; }
  .revert:hover { color: var(--accent-deep); }
  .canonize { appearance: none; cursor: pointer; background: transparent; border: 1px solid var(--accent); color: var(--accent-deep); font-family: var(--mono); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; padding: 12px 18px; border-radius: 2px; transition: background .2s, color .2s; }
  .canonize:hover { background: var(--accent); color: var(--paper); }
  .canon-link { appearance: none; cursor: pointer; background: transparent; border: none; font-family: var(--mono); font-size: 12px; letter-spacing: 0.08em; color: var(--accent-deep); padding: 6px 0; transition: color .2s; }
  .canon-link:hover { color: var(--ink); }
  .submitted { font-family: var(--mono); font-size: 12px; letter-spacing: 0.06em; color: var(--accent-deep); display: inline-flex; align-items: center; }
  .count { font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--struck); margin-left: auto; }
  .err { margin-top: 22px; font-size: 13px; color: var(--accent-deep); border-left: 2px solid var(--accent); padding: 8px 0 8px 14px; background: var(--paper-2); }
  .rationale { margin-top: 30px; max-width: 620px; opacity: 0; transform: translateY(10px); transition: opacity .6s ease .25s, transform .6s ease .25s; pointer-events: none; }
  .rationale.show { opacity: 1; transform: none; pointer-events: auto; }
  .rat-label { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.32em; color: var(--accent-deep); margin-bottom: 10px; }
  .rat-body { margin: 0; font-size: 16.5px; line-height: 1.62; color: var(--ink-soft); font-style: italic; text-wrap: pretty; }
  <script type="text/babel" src="top-view.jsx"></script>
*/
