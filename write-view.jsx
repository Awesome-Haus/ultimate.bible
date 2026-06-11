/* global React */
/* ═══ ARCHIVED — not loaded by the site (editor's call, 2026-06-10: launch without the form). ═══
   The Transcribe page: a sanctuary for submitting renewals or words to keep.
   TO RESTORE: (1) re-add <script type="text/babel" src="write-view.jsx"> to index.html,
   (2) restore "transcribe" to the views array + nav tab + render branch in app.jsx,
   (3) paste the CSS block from the bottom of this file back into index.html,
   (4) set SUBMIT_EMAIL (Porkbun forwarding) or FORM_ENDPOINT (Formspree).

   The seal's promise made into a door: whoever adds that which is well,
   their name is added. v1 submits via mailto; set SUBMIT_EMAIL before launch. */
const { useState: useStateW } = React;

const SUBMIT_EMAIL = "write@ultimate.bible"; // ← set the real inbox before launch
// Paste a form endpoint (e.g. Formspree: https://formspree.io/f/XXXXXXXX) and the form
// submits quietly in-page — no mail app needed. Leave empty to fall back to mailto.
const FORM_ENDPOINT = "";

function WriteView() {
  const [source, setSource] = useStateW("");
  const [locus, setLocus] = useStateW("");
  const [original, setOriginal] = useStateW("");
  const [renewal, setRenewal] = useStateW("");
  const [name, setName] = useStateW("");
  const [sent, setSent] = useStateW(""); // "" | "sending" | "ok" | "error"
  const [copied, setCopied] = useStateW(false);

  const ready = !!original.trim() && sent !== "sending";

  const compose = () => {
    const kind = renewal.trim() ? "A renewal" : "A word to keep";
    const subject = `${kind}: ${source.trim() || "unnamed source"}${locus.trim() ? " " + locus.trim() : ""}`;
    const body = [
      `Source: ${source.trim()}`,
      `Locus: ${locus.trim()}`,
      "",
      "Original (verbatim):",
      original.trim(),
      "",
      "Renewal:",
      renewal.trim() || "(none; submitted for keeping)",
      "",
      `Contact: ${name.trim() || "(unsigned)"}`,
    ].join("\n");
    return { subject, body };
  };

  const copyOut = () => {
    if (!ready) return;
    const { subject, body } = compose();
    navigator.clipboard
      .writeText(`To: ${SUBMIT_EMAIL}\nSubject: ${subject}\n\n${body}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      });
  };

  const send = (e) => {
    e.preventDefault();
    if (!ready) return;
    const { subject, body } = compose();

    if (FORM_ENDPOINT) {
      setSent("sending");
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ _subject: subject, message: body }),
      })
        .then((r) => setSent(r.ok ? "ok" : "error"))
        .catch(() => setSent("error"));
      return;
    }

    window.location.href =
      "mailto:" + SUBMIT_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  };

  if (sent === "ok") {
    return (
      <div className="body write">
        <main className="write-main">
          <div className="orn" aria-hidden="true"><span className="orn-line" />{"⚜︎"}<span className="orn-line" /></div>
          <p className="write-sent">Received. Thank you for your words.</p>
          <div className="orn orn-after" aria-hidden="true"><span className="orn-line" />{"⚜︎"}<span className="orn-line" /></div>
        </main>
      </div>
    );
  }

  return (
    <div className="body write">
      <main className="write-main">
        <img className="write-mark" src="Ultimatum.png" alt="" width={45} height={45} />
        <p className="write-welcome">
          Every word is welcome here; the kind worth keeping,
          and the kind ready to be renewed.
        </p>
        <div className="orn" aria-hidden="true"><span className="orn-line" />{"⚜︎"}<span className="orn-line" /></div>
        <form className="write-form" onSubmit={send}>
          <div className="wf-row2">
            <label className="wf-field">
              <span className="wf-label">SOURCE</span>
              <input value={source} onChange={(e) => setSource(e.target.value)}
                     placeholder="Ecclesiastes, Nietzsche, …" />
            </label>
            <label className="wf-field">
              <span className="wf-label">LOCUS</span>
              <input value={locus} onChange={(e) => setLocus(e.target.value)}
                     placeholder="1:9, The Gay Science 125, …" />
            </label>
          </div>
          <label className="wf-field">
            <span className="wf-label">THE ORIGINAL, WORD FOR WORD</span>
            <textarea rows={3} value={original} onChange={(e) => setOriginal(e.target.value)}
                      placeholder="The thing that hath been, it is that which shall be…" />
          </label>
          <label className="wf-field">
            <span className="wf-label"><span>YOUR RENEWAL</span><i className="wf-opt">(OPTIONAL)</i></span>
            <textarea rows={3} value={renewal} onChange={(e) => setRenewal(e.target.value)}
                      placeholder="Everything that has been, and everything that shall be…" />
          </label>
          <label className="wf-field">
            <span className="wf-label"><span>YOUR NAME, BLUESKY HANDLE, EMAIL ADDRESS, ETC.</span><i className="wf-opt">(OPTIONAL)</i></span>
            <input value={name} onChange={(e) => setName(e.target.value)}
                   placeholder="(unsigned is welcome)" />
          </label>
          <div className="write-actions">
            <button type="submit" className="seek-btn" disabled={!ready}>
              {sent === "sending" ? "SENDING…" : "SEND YOUR WORDS →"}
            </button>
            <button type="button" className="copy-btn" disabled={!ready} onClick={copyOut}>
              {copied ? "COPIED ✓" : "COPY INSTEAD"}
            </button>
            {sent === "error" ? (
              <p className="write-note">That didn't go through; try again, or email {SUBMIT_EMAIL}.</p>
            ) : (
              <p className="write-note">
                {FORM_ENDPOINT
                  ? "Sends quietly from right here."
                  : "Send opens your mail app, filled in. No mail app? Copy your words and paste them to " + SUBMIT_EMAIL + "."}
              </p>
            )}
          </div>
        </form>
        <div className="orn orn-after" aria-hidden="true"><span className="orn-line" />{"⚜︎"}<span className="orn-line" /></div>
      </main>
    </div>
  );
}

Object.assign(window, { WriteView });

/* ═══ ARCHIVED CSS — paste back into index.html when restoring this page ═══
  .body.write { display: flex; overflow-y: auto; }
  .write-main { max-width: 760px; width: 100%; margin: auto; padding: 28px; }
  .write-mark { display: block; margin: 0 auto 22px; width: 45px; height: 45px; object-fit: contain; }
  .root.is-dark .write-mark { filter: invert(1); }
  .write-welcome { font-family: var(--scripture); font-size: 19px; line-height: 1.55; color: var(--ink); text-align: center; max-width: 44ch; margin: 0 auto 30px; }
  .orn { display: flex; align-items: center; gap: 18px; color: var(--accent); font-size: 19px; line-height: 1; margin: 4px 0 38px; user-select: none; }
  .orn-line { flex: 1 1 auto; height: 1px; background: var(--line); }
  .orn-after { margin: 38px 0 0; }
  .write-form { display: flex; flex-direction: column; gap: 18px; }
  .wf-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .wf-field { display: flex; flex-direction: column; gap: 7px; }
  .wf-label { font-family: var(--mono); font-size: 9.5px; letter-spacing: 0.2em; color: var(--ink-soft); display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .wf-opt { font-style: normal; color: var(--struck); }
  .wf-field input, .wf-field textarea { font-family: var(--scripture); font-size: 18px; color: var(--ink); background: var(--paper-2); border: 1px solid var(--line); border-radius: 2px; padding: 12px 14px; outline: none; resize: vertical; }
  .wf-field input:focus, .wf-field textarea:focus { border-color: var(--accent); }
  .write-actions { display: flex; align-items: center; gap: 16px; margin-top: 8px; flex-wrap: wrap; }
  .copy-btn { appearance: none; cursor: pointer; background: transparent; border: 1px solid var(--line); color: var(--ink-soft); font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; padding: 9px 16px; border-radius: 2px; transition: color .2s, border-color .2s; }
  .copy-btn:hover { color: var(--ink); border-color: var(--accent); }
  .copy-btn:disabled { opacity: 0.45; cursor: default; }
  .seek-btn:disabled { opacity: 0.45; cursor: default; }
  .write-note { font-family: var(--mono); font-size: 11px; letter-spacing: 0.04em; color: var(--ink-soft); margin: 0; max-width: 40ch; }
  .write-sent { font-family: var(--scripture); font-size: 22px; text-align: center; color: var(--ink); margin: 10px 0; }
*/
