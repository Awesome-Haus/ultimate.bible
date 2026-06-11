/* global React, RenewedText */
/* ultimate.bible — Page: The Canon, read by Testament. (The Source lens was retired —
   the citation eyebrows carry attribution; the Theme lens is parked, parsing intact.) */
const { useMemo: useMemoC, useState: useStateC } = React;

const TESTAMENT_ORDER = ["Reason", "Revelation", "Law", "Enlightenment", "Imagination"];
const SORTS = [
  { id: "testaments", label: "Testaments", kicker: "TESTAMENT OF", unit: "testament" },
  // Theme lens disabled for now (editor's call). Parsing of ~Theme stays intact in canon-parser.js;
  // to bring it back, restore this line (the Sort by control reappears with a second lens):
  // { id: "theme", label: "Theme", kicker: "THE THEME OF", unit: "theme" },
];

function groupName(r, sortBy) {
  if (sortBy === "theme") return r.theme || "Unplaced";
  return r.testament || "Unsorted";
}

/* the five testaments in canonical order (Unsorted/custom after); themes alpha with the
   catch-all bucket pushed to the end */
function orderGroupNames(sortBy, names) {
  if (sortBy === "theme") {
    const main = names.filter((n) => n !== "Unplaced").sort((a, b) => a.localeCompare(b));
    return names.includes("Unplaced") ? [...main, "Unplaced"] : main;
  }
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

function CanonView({ canon, route, navigate }) {
  // a testament param (from Featured's "view in the canon") opens the canon on that group
  const [sortBy, setSortBy] = useStateC("testaments");
  const [picked, setPicked] = useStateC(route.param || null);

  const groups = useMemoC(() => {
    const m = new Map();
    canon.forEach((r) => {
      const k = groupName(r, sortBy);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    });
    return orderGroupNames(sortBy, [...m.keys()]).map((n) => ({
      name: n,
      items: m.get(n).slice().sort(entrySort),
    }));
  }, [canon, sortBy]);

  const current = groups.find((g) => g.name === picked) || groups[0] || null;
  const meta = SORTS.find((s) => s.id === sortBy);

  const changeSort = (id) => { setSortBy(id); setPicked(null); };

  return (
    <div className="body canon">
      <aside className="books">
        <div className="canon-controls">
          {SORTS.length > 1 && (
            <label className="sort-by">
              <span className="sort-by-label">SORT BY</span>
              <select value={sortBy} onChange={(e) => changeSort(e.target.value)}>
                {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
          )}
          <div className="books-summary">
            <div className="bs-num">{canon.length}</div>
            <div className="bs-cap">renewed passages<br />across {groups.length} {groups.length === 1 ? meta.unit : meta.unit + "s"}</div>
          </div>
        </div>

        <ul className="book-rows">
          {groups.map((g) => {
            const on = current && g.name === current.name;
            return (
              <li key={g.name}>
                <button className={"book-row has" + (on ? " on" : "")} onClick={() => setPicked(g.name)}>
                  <span className="br-name">{g.name}</span>
                  <span className="br-count">{g.items.length}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="canon-main">
        {!current ? (
          <div className="canon-empty">The canon is empty. Renew a verse and inscribe it.</div>
        ) : (
          <>
            <div className="canon-book-head">
              <div className="cbh-kicker">{meta.kicker}</div>
              <h1 className="cbh-title">{current.name}</h1>
              <div className="cbh-meta">{current.items.length} {current.items.length === 1 ? "passage" : "passages"}</div>
            </div>

            <ul className="canon-folios">
              {current.items.map((r, i) => (
                <li className="cfolio" key={r.key + i}>
                  <div className="cf-ref">
                    <span className="ref-mark" />
                    Renewed from {r.display || r.reference}
                  </div>
                  <RenewedText passage={r} compact={true} />
                  {r.rationale && <p className="cf-rationale">{r.rationale}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}

Object.assign(window, { CanonView });
