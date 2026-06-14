/* ultimate.bible — the only runtime script.
 *
 * Three small jobs, all ported straight from the old React app.jsx:
 *   1. theme toggle   — auto / light / dark, persisted, no-flash (init is inline in <head>)
 *   2. the chant      — autoplay-once Weave suite, play/pause, the gold progress ring
 *   3. sidebar spy    — light the testament link for whatever section you're reading
 *
 * The canon itself is static HTML (see build.js). Nothing here renders content.
 */
(function () {
  "use strict";

  /* ---------------- 1. theme ---------------- */
  var THEME_KEY = "ub.theme.v1";
  var ORDER = ["auto", "light", "dark"];
  var ICONS = {
    auto:
      '<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 4 a8 8 0 0 1 0 16 z" fill="currentColor"/></svg>',
    light:
      '<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="12" y1="1.8" x2="12" y2="4.4"/><line x1="12" y1="19.6" x2="12" y2="22.2"/><line x1="1.8" y1="12" x2="4.4" y2="12"/><line x1="19.6" y1="12" x2="22.2" y2="12"/><line x1="4.8" y1="4.8" x2="6.6" y2="6.6"/><line x1="17.4" y1="17.4" x2="19.2" y2="19.2"/><line x1="4.8" y1="19.2" x2="6.6" y2="17.4"/><line x1="17.4" y1="6.6" x2="19.2" y2="4.8"/></g></svg>',
    dark:
      '<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/></svg>',
  };

  function loadMode() {
    try {
      var v = localStorage.getItem(THEME_KEY);
      return ORDER.indexOf(v) !== -1 ? v : "auto";
    } catch (e) {
      return "auto";
    }
  }
  var systemDark = function () {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  };
  function resolve(mode) {
    return mode === "dark" || (mode === "auto" && systemDark()) ? "dark" : "light";
  }
  function apply(mode) {
    var dark = resolve(mode) === "dark";
    if (dark) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    var btn = document.getElementById("theme-btn");
    if (btn) {
      btn.innerHTML = ICONS[mode];
      var lbl = "Theme: " + mode + " — click to change";
      btn.title = lbl;
      btn.setAttribute("aria-label", lbl);
    }
  }

  var mode = loadMode();
  apply(mode);

  var themeBtn = document.getElementById("theme-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      mode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
      try {
        localStorage.setItem(THEME_KEY, mode);
      } catch (e) {}
      apply(mode);
    });
  }
  // follow the system while in auto
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onSys = function () {
      if (mode === "auto") apply(mode);
    };
    mq.addEventListener ? mq.addEventListener("change", onSys) : mq.addListener(onSys);
  }

  /* ---------------- 2. the chant ---------------- */
  var PLAYLIST = ["Weave.mp3", "Weave2.mp3", "Weave3.mp3"];
  var audio = document.getElementById("chant");
  var chantBtn = document.getElementById("chant-btn");
  var IC_PLAY =
    '<svg class="ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 5.6v12.8l10.4-6.4z" fill="currentColor"/></svg>';
  var IC_PAUSE =
    '<svg class="ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="6.6" y="5.6" width="3.6" height="12.8" rx="1" fill="currentColor"/><rect x="13.8" y="5.6" width="3.6" height="12.8" rx="1" fill="currentColor"/></svg>';

  if (audio && chantBtn) {
    var trackIdx = 0;
    var ringTimer = null;
    var setRing = function (v) {
      chantBtn.style.setProperty("--p", String(v));
    };
    var fadeRing = function () {
      chantBtn.classList.add("ring-done");
      clearTimeout(ringTimer);
      ringTimer = setTimeout(function () {
        setRing(0);
        chantBtn.classList.remove("ring-done");
      }, 1500);
    };
    var label = function (playing) {
      var t = playing ? "Pause the chant" : "Play the chant";
      chantBtn.title = t;
      chantBtn.setAttribute("aria-label", t);
      chantBtn.innerHTML = playing ? IC_PAUSE : IC_PLAY;
      chantBtn.classList.toggle("playing", playing);
    };

    audio.addEventListener("play", function () {
      label(true);
    });
    audio.addEventListener("pause", function () {
      if (!audio.ended) label(false);
    });
    audio.addEventListener("ended", function () {
      if (trackIdx < PLAYLIST.length - 1) {
        trackIdx += 1;
        audio.src = PLAYLIST[trackIdx];
        audio.play().catch(function () {});
      } else {
        trackIdx = 0;
        audio.src = PLAYLIST[0];
        label(false);
        fadeRing();
      }
    });
    audio.addEventListener("timeupdate", function () {
      if (audio.duration) setRing((trackIdx + audio.currentTime / audio.duration) / PLAYLIST.length);
    });

    chantBtn.addEventListener("click", function () {
      if (!audio.paused) {
        audio.pause(); // hold the place; the ring keeps its arc
      } else {
        clearTimeout(ringTimer);
        chantBtn.classList.remove("ring-done");
        audio.play().catch(function () {});
      }
    });

    audio.play().catch(function () {}); // blocked autoplay → stays idle, ready on click
  }

  /* ---------------- 3. sidebar scroll-spy ---------------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".book-row[data-target]"));
  var sections = links
    .map(function (a) {
      return document.getElementById(a.getAttribute("data-target"));
    })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var light = function (id) {
      links.forEach(function (a) {
        a.classList.toggle("on", a.getAttribute("data-target") === id);
      });
    };
    var visible = {};
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          visible[e.target.id] = e.isIntersecting;
        });
        // light the first section (in document order) currently on screen
        for (var i = 0; i < sections.length; i++) {
          if (visible[sections[i].id]) {
            light(sections[i].id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    sections.forEach(function (s) {
      io.observe(s);
    });
    light(sections[0].id); // first paint
  }

  /* ---------------- 4. compare reveal (subtle animation) ---------------- */
  /* The <details> opens/closes instantly on its own (and with JS off). Here we
     ease it: the panel's height eases open/shut while the original cross-fades
     and drifts a few px. prefers-reduced-motion leaves the instant toggle alone. */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasWAAPI = typeof Element !== "undefined" && Element.prototype && typeof Element.prototype.animate === "function";
  var EASE = "cubic-bezier(.4, 0, .2, 1)";

  if (!reduceMotion && hasWAAPI) {
    Array.prototype.forEach.call(document.querySelectorAll("details.folio-reveal"), function (d) {
      var summary = d.querySelector("summary");
      var content = d.querySelector(".verse-original");
      if (!summary || !content) return;
      var heightAnim = null;
      var contentAnim = null;

      var settle = function (openState) {
        d.open = openState;
        d.style.height = "";
        d.style.overflow = "";
        heightAnim = null;
      };

      var run = function (from, to, willOpen) {
        if (heightAnim) heightAnim.cancel();
        if (contentAnim) contentAnim.cancel();
        d.style.overflow = "hidden";
        d.style.height = from + "px";
        heightAnim = d.animate(
          { height: [from + "px", to + "px"] },
          { duration: willOpen ? 300 : 220, easing: EASE }
        );
        contentAnim = content.animate(
          {
            opacity: willOpen ? [0, 1] : [1, 0],
            transform: willOpen
              ? ["translateY(-6px)", "translateY(0)"]
              : ["translateY(0)", "translateY(-6px)"]
          },
          { duration: willOpen ? 300 : 180, easing: EASE }
        );
        heightAnim.onfinish = function () { settle(willOpen); };
        heightAnim.oncancel = function () { heightAnim = null; };
      };

      summary.addEventListener("click", function (e) {
        e.preventDefault();
        if (!d.open) {
          var startO = d.offsetHeight; // collapsed (summary only)
          d.open = true;               // render content so we can measure it
          var endO = d.offsetHeight;   // full natural height
          run(startO, endO, true);
        } else {
          var startC = d.offsetHeight;     // full
          run(startC, summary.offsetHeight, false); // ease down to the summary
        }
      });
    });
  }
})();
