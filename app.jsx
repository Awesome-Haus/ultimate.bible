/* global React, ReactDOM, CanonView, loadCanon, refKey */
const { useState, useEffect, useMemo, useCallback, useRef } = React;

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
  scriptureFont: "Prata"
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
/* icons as inline SVG — pure geometry, identical in every browser; font
   glyphs (◐ ☀ ☾ ▶ ⏸) render from different symbol fonts per engine and wobble */
const IconPlay = () => (
  <svg className="ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M9 5.6v12.8l10.4-6.4z" fill="currentColor" />
  </svg>
);
const IconPause = () => (
  <svg className="ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <rect x="6.6" y="5.6" width="3.6" height="12.8" rx="1" fill="currentColor" />
    <rect x="13.8" y="5.6" width="3.6" height="12.8" rx="1" fill="currentColor" />
  </svg>
);
const IconAuto = () => (
  <svg className="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 4 a8 8 0 0 1 0 16 z" fill="currentColor" />
  </svg>
);
const IconSun = () => (
  <svg className="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="12" y1="1.8" x2="12" y2="4.4" />
      <line x1="12" y1="19.6" x2="12" y2="22.2" />
      <line x1="1.8" y1="12" x2="4.4" y2="12" />
      <line x1="19.6" y1="12" x2="22.2" y2="12" />
      <line x1="4.8" y1="4.8" x2="6.6" y2="6.6" />
      <line x1="17.4" y1="17.4" x2="19.2" y2="19.2" />
      <line x1="4.8" y1="19.2" x2="6.6" y2="17.4" />
      <line x1="17.4" y1="6.6" x2="19.2" y2="4.8" />
    </g>
  </svg>
);
const IconMoon = () => (
  <svg className="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
  </svg>
);
const THEME_ICONS = { auto: IconAuto, light: IconSun, dark: IconMoon };

function App() {
  const t = TWEAK_DEFAULTS;
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

  // the chant: plays once on arrival (where the browser allows audible
  // autoplay), ends on its own; the ♪ circle replays or stops it.
  const PLAYLIST = ["Weave.mp3", "Weave2.mp3", "Weave3.mp3"];
  const audioRef = useRef(null);
  const audioBtnRef = useRef(null);
  const ringTimer = useRef(null);
  const trackIdx = useRef(0);
  const [chant, setChant] = useState("idle"); // "idle" | "playing"
  const setRing = (v) => {
    const b = audioBtnRef.current;
    if (b) b.style.setProperty("--p", String(v));
  };
  // when the chant finishes (or is stopped), the gold arc fades out over the
  // hairline track, then the ring resets for next time
  const fadeRing = () => {
    const b = audioBtnRef.current;
    if (!b) return;
    b.classList.add("ring-done");
    clearTimeout(ringTimer.current);
    ringTimer.current = setTimeout(() => {
      setRing(0);
      b.classList.remove("ring-done");
    }, 1500);
  };
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return undefined;
    // state follows the element's own events (media keys work for free);
    // pause holds the ring where it is — only a finished loop fades it out
    const onPlay = () => setChant("playing");
    const onPause = () => { if (!a.ended) setChant("idle"); };
    // the suite plays through in order; the ring spans all three songs
    // (each one third of the circle); the fade waits for the last note
    const onEnd = () => {
      if (trackIdx.current < PLAYLIST.length - 1) {
        trackIdx.current += 1;
        a.src = PLAYLIST[trackIdx.current];
        a.play().catch(() => {});
      } else {
        trackIdx.current = 0;
        a.src = PLAYLIST[0];
        setChant("idle");
        fadeRing();
      }
    };
    // progress writes a CSS var directly on the button — no re-renders
    const onTime = () => {
      if (a.duration) setRing((trackIdx.current + a.currentTime / a.duration) / PLAYLIST.length);
    };
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnd);
    a.addEventListener("timeupdate", onTime);
    a.play().catch(() => {}); // blocked → stay idle
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("timeupdate", onTime);
      clearTimeout(ringTimer.current);
    };
  }, []);
  const toggleChant = () => {
    const a = audioRef.current;
    const b = audioBtnRef.current;
    if (!a) return;
    if (chant === "playing") {
      a.pause(); // hold the place; the ring keeps its arc
    } else {
      clearTimeout(ringTimer.current);
      if (b) b.classList.remove("ring-done");
      a.play().catch(() => {});
    }
  };

  const [canon, setCanon] = useState(null); // null = still loading
  useEffect(() => {
    let live = true;
    loadCanon().then((c) => { if (live) setCanon(c); });
    return () => { live = false; };
  }, []);
  const ready = canon != null;
  const list = canon || [];

  const paperName = themeMode === "light" ? "Bone" : themeMode === "dark" ? "Night" : systemDark ? "Night" : "Bone";
  const paper = PAPERS[paperName] || PAPERS.Bone;
  const accent = ACCENTS[t.accent] || ACCENTS.Gold;
  const rootVars = {
    "--paper": paper.paper, "--paper-2": paper.paper2, "--ink": paper.ink,
    "--ink-soft": paper.inkSoft, "--struck": paper.struck, "--line": paper.line,
    "--accent": accent.accent, "--accent-deep": accent.deep, "--grain": paper.grain,
    "--scripture": SCRIPTURE_FONTS[t.scriptureFont] || SCRIPTURE_FONTS["Prata"]
  };

  return (
    <div className={"root" + (paperName === "Night" ? " is-dark" : "")} style={rootVars}>
      <header className="masthead">
        <audio ref={audioRef} src="Weave.mp3" preload="auto" />
        <button
          ref={audioBtnRef}
          className={"audio-cycle" + (chant === "playing" ? " playing" : "")}
          onClick={toggleChant}
          title={chant === "playing" ? "Pause the chant" : "Play the chant"}
          aria-label={chant === "playing" ? "Pause the chant" : "Play the chant"}>
          {chant === "playing" ? <IconPause /> : <IconPlay />}
        </button>
        <button className="brand" onClick={() => navigate("canon", "")} title="Ultimate Bible" aria-label="Ultimate Bible">
          <img className="brand-mark" src="Ultimatum.png" alt="Ultimate Bible" width={68} height={68} />
        </button>
        <button
          className="theme-cycle"
          onClick={() => {
            const order = ["auto", "light", "dark"];
            setTheme(order[(order.indexOf(themeMode) + 1) % order.length]);
          }}
          title={"Theme: " + themeMode + " — click to change"}
          aria-label={"Theme: " + themeMode + " — click to change"}>
          {React.createElement(THEME_ICONS[themeMode])}
        </button>
      </header>

      {ready ?
      <CanonView canon={list} route={route} navigate={navigate} /> :
      <div className="body" />
      }

    </div>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);