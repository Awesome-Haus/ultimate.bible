/* global React, ReactDOM, useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakToggle, TweakSelect, FeaturedView, CanonView, loadCanon, refKey */
const { useState, useEffect, useMemo, useCallback } = React;

const PAPERS = {
  Ivory: { paper: "#f4efe4", paper2: "#ece4d3", ink: "#1b1712", inkSoft: "#6f6757", struck: "#a99f8b", line: "#ddd3bf", grain: 0.05 },
  Bone: { paper: "#faf8f3", paper2: "#f1ede3", ink: "#1c1813", inkSoft: "#736b5c", struck: "#b3a892", line: "#e6ddcb", grain: 0.035 },
  Night: { paper: "#161310", paper2: "#1f1b16", ink: "#f1e9d8", inkSoft: "#a89e8a", struck: "#6a6253", line: "#2e2820", grain: 0.06 }
};
const ACCENTS = {
  Gold: { accent: "#b08d4f", deep: "#8a6c33" },
  Oxblood: { accent: "#8c3a34", deep: "#6f2b27" },
  Lapis: { accent: "#36607a", deep: "#284a5e" },
  Olive: { accent: "#5a6b3a", deep: "#45532b" }
};
const SCRIPTURE_FONTS = {
  "Prata": "'Prata', serif",
  "Bodoni Moda": "'Bodoni Moda', serif",
  "Cormorant": "'Cormorant Garamond', serif"
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  accent: "Gold",
  paper: "Bone",
  scriptureFont: "Prata",
  animate: true
} /*EDITMODE-END*/;

function parseHash() {
  const h = (location.hash || "").replace(/^#/, "");
  const [view, ...rest] = h.split("/");
  return { view: view || "featured", param: rest.length ? decodeURIComponent(rest.join("/")) : "" };
}

const THEME_KEY = "ub.theme.v1";
function loadThemeMode() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return ["auto", "light", "dark"].includes(v) ? v : "auto";
  } catch (e) {return "auto";}
}
const THEME_ICONS = { auto: "◐", light: "☀", dark: "☾" };

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState(parseHash());
  const [themeMode, setThemeMode] = useState(loadThemeMode);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = (e) => setSystemDark(e.matches);
    mq.addEventListener ? mq.addEventListener("change", fn) : mq.addListener(fn);
    return () => {mq.removeEventListener ? mq.removeEventListener("change", fn) : mq.removeListener(fn);};
  }, []);

  const setTheme = useCallback((mode) => {
    setThemeMode(mode);
    try {localStorage.setItem(THEME_KEY, mode);} catch (e) {}
  }, []);

  useEffect(() => {
    const fn = () => setRoute(parseHash());
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);

  const navigate = useCallback((view, param) => {
    location.hash = view + (param ? "/" + encodeURIComponent(param) : "");
  }, []);

  const [canon, setCanon] = useState(null); // null = still loading
  useEffect(() => {
    let live = true;
    loadCanon().then((c) => { if (live) setCanon(c); });
    return () => { live = false; };
  }, []);
  const ready = canon != null;
  const list = canon || [];
  const canonKeys = useMemo(() => new Set((canon || []).map((r) => r.key)), [canon]);
  const featuredList = useMemo(() => {
    const all = canon || [];
    const f = all.filter((r) => r.featured);
    return f.length ? f : all; // fall back to whole canon when nothing is starred
  }, [canon]);

  const paperName = themeMode === "light" ? "Bone" : themeMode === "dark" ? "Night" : systemDark ? "Night" : "Bone";
  const paper = PAPERS[paperName] || PAPERS.Bone;
  const accent = ACCENTS[t.accent] || ACCENTS.Gold;
  const rootVars = {
    "--paper": paper.paper, "--paper-2": paper.paper2, "--ink": paper.ink,
    "--ink-soft": paper.inkSoft, "--struck": paper.struck, "--line": paper.line,
    "--accent": accent.accent, "--accent-deep": accent.deep, "--grain": paper.grain,
    "--scripture": SCRIPTURE_FONTS[t.scriptureFont] || SCRIPTURE_FONTS["Prata"]
  };

  const view = ["featured", "canon"].includes(route.view) ? route.view : "featured";

  return (
    <div className="root" style={rootVars}>
      <header className="masthead">
        <button className="brand" onClick={() => navigate("featured", "")}>
          <div className="wordmark">Ultimate<span className="dot">.</span>Bible</div>
          <div className="tagline">THE REDEEMED WORD</div>
        </button>
        <nav className="nav">
          <button className={"nav-tab" + (view === "featured" ? " on" : "")} onClick={() => navigate("featured", "")}>
            Featured
          </button>
          <button className={"nav-tab" + (view === "canon" ? " on" : "")} onClick={() => navigate("canon", view === "canon" ? route.param : "")}>
            Canon
          </button>
          <div className="theme-toggle" role="group" aria-label="Theme">
            {["auto", "light", "dark"].map((m) =>
            <button
              key={m}
              className={"theme-seg" + (themeMode === m ? " on" : "")}
              onClick={() => setTheme(m)}
              title={m === "auto" ? "Auto (match system)" : m === "light" ? "Light" : "Dark"}
              aria-pressed={themeMode === m}>
              
                <span className="ts-icon">{THEME_ICONS[m]}</span>
                <span className="ts-label">{m}</span>
              </button>
            )}
          </div>
        </nav>
      </header>

      {view === "canon" ?
      <CanonView canon={list} animate={t.animate} route={route} navigate={navigate} /> :

      <FeaturedView featured={featuredList} ready={ready} animate={t.animate} canonKeys={canonKeys} navigate={navigate} />
      }

      <TweaksPanel>
        <TweakSection label="Palette" />
        <TweakColor
          label="Accent"
          value={accent.accent}
          options={Object.values(ACCENTS).map((a) => a.accent)}
          onChange={(v) => {
            const name = Object.keys(ACCENTS).find((k) => ACCENTS[k].accent === v);
            if (name) setTweak("accent", name);
          }} />
        
        <TweakSection label="Typography" />
        <TweakSelect label="Scripture face" value={t.scriptureFont} options={Object.keys(SCRIPTURE_FONTS)} onChange={(v) => setTweak("scriptureFont", v)} />
        <TweakSection label="Motion" />
        <TweakToggle label="Animate the redemption" value={t.animate} onChange={(v) => setTweak("animate", v)} />
      </TweaksPanel>
    </div>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);