// One screen, three states, Apple-style.
//
//   idle       the start page: what AutoBhajan does, around the listen button
//   listening  the page clears; rings ripple out of the button, Shazam-style
//   found      the button glides to the bottom, the lyrics rise into the middle
//
// The button is one object throughout. On the start page it sits in the page
// like any content; when listening starts it glides from there to the middle,
// and later docks under the slide.
//
// Everything else (search, other matches, what was heard, fullscreen) is for
// the volunteer, and sits quietly in the bottom-right corner.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import type { AsrProgress, AsrReady } from "./asr/asr.worker.ts";
import { AsrClient } from "./listen/asr-client.ts";
import { ListenSession, type SessionUpdate } from "./listen/session.ts";
import { buildReferences, type Bhajan, type Reference } from "./match/catalog.ts";
import { RULES, type Ranking } from "./match/identify.ts";
import { buildSearchIndex } from "./match/search.ts";
import { Home } from "./ui/Home.tsx";
import { CLOSE_MS, ListenProgress } from "./ui/ListenProgress.tsx";
import { CollapseIcon, ExpandIcon, HomeIcon, MoreIcon, SearchIcon, WaveIcon } from "./ui/icons.tsx";
import { distinguishingLine, Lyrics } from "./ui/Lyrics.tsx";
import { Search } from "./ui/Search.tsx";

type Phase =
  | { kind: "idle" }
  /**
   * since: when the first sung words began (performance.now ms), null while
   * waiting for them. twin: listening on past 10 s because two bhajans open
   * the same way. checked: the checkpoints whose checks have run. closing:
   * found, and the progress ring is closing before the slide comes up.
   */
  | {
      kind: "listening";
      singing: boolean;
      twin: boolean;
      since: number | null;
      checked: number[];
      closing: boolean;
    }
  /** ranking is null when the bhajan was chosen by search rather than heard. */
  | { kind: "identified"; index: number; ranking: Ranking | null }
  | { kind: "gave-up"; ranking: Ranking | null; heardSinging: boolean }
  | { kind: "error"; message: string };

type Check = Extract<SessionUpdate, { kind: "check" }>;

/** How long the old lyrics take to leave once the next bhajan is asked for. */
const LEAVE_MS = 380;
/** How long the button takes to glide (matches the dock's transition). */
const GLIDE_MS = 950;

// One worker for the life of the page, created at import so the model starts
// downloading before React has even rendered.
let asrProgress: ((p: AsrProgress) => void) | null = null;
const asr = new AsrClient((p) => asrProgress?.(p));

export function App() {
  const [catalog, setCatalog] = useState<Bhajan[] | null>(null);
  const [refs, setRefs] = useState<Reference[]>([]);
  const [model, setModel] = useState<AsrReady | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [progress, setProgress] = useState<AsrProgress | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [shown, setShown] = useState<Bhajan | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [checks, setChecks] = useState<Check[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const session = useRef<ListenSession | null>(null);
  // Set while the progress ring closes on a found bhajan, before it is shown.
  const closeTimer = useRef<number | null>(null);
  const homeScroller = useRef<HTMLDivElement>(null);
  const [slotEl, setSlotEl] = useState<HTMLDivElement | null>(null);
  // Where the button is: in the start page's slot, gliding out of or back into
  // it (from/to `homeOffset`, px from the middle), or in the fixed dock.
  const [place, setPlace] = useState<"inline" | "lifting" | "floating" | "landing">("inline");
  const [homeOffset, setHomeOffset] = useState(0);
  // Moving between the page and the fixed dock remounts the button; keyboard
  // focus goes with it. Read before each commit, while the old button is live.
  const listenButton = useRef<HTMLButtonElement>(null);
  const listenHadFocus = useRef(false);
  listenHadFocus.current = typeof document !== "undefined" && document.activeElement === listenButton.current;
  const searchIndex = useMemo(() => (catalog ? buildSearchIndex(catalog, refs) : null), [catalog, refs]);

  useEffect(() => {
    asrProgress = setProgress;
    asr.ready.then(setModel, (e: Error) => setModelError(e.message));
    // Ask the browser not to evict the cached model under storage pressure.
    void navigator.storage?.persist?.();
    fetch("/catalog.json")
      .then((r) => {
        if (!r.ok) throw new Error(`The bhajan list couldn't load (HTTP ${r.status}). Reload to try again.`);
        return r.json();
      })
      .then((data: Bhajan[]) => {
        const built = buildReferences(data);
        setCatalog(data);
        setRefs(built);
        asr.setReferences(built);
      })
      .catch((e: Error) => setPhase({ kind: "error", message: e.message }));
    const onFullscreen = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      asrProgress = null;
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, []);

  const ready = model !== null && catalog !== null;
  const listening = phase.kind === "listening";
  const docked = phase.kind === "identified";
  const atHome = phase.kind === "idle" && !shown;
  // When singing stops being heard the bars' animation ends wherever it is;
  // note where, before the commit, so they can ease back to rest.
  const hearing = listening && phase.singing;
  const wasHearing = useRef(hearing);
  const barsFrom = useRef<string[] | null>(null);
  if (wasHearing.current && !hearing && listenButton.current) {
    barsFrom.current = [...listenButton.current.querySelectorAll(".listen-face path")].map(
      (bar) => getComputedStyle(bar).transform,
    );
  }

  // On the start page the button is page content: it sits in the hero's slot,
  // so it scrolls, tabs and swipes with the page. It lifts out into the fixed
  // dock only to glide to the middle (and lands back the same way).
  useLayoutEffect(() => {
    const slotOffset = () => {
      const r = slotEl?.getBoundingClientRect();
      return r ? r.top + r.height / 2 - window.innerHeight / 2 : 0;
    };
    if (!atHome && place === "inline") {
      setHomeOffset(slotOffset());
      setPlace("lifting");
    } else if (!atHome && place === "landing") {
      setPlace("floating");
    } else if (atHome && place === "floating") {
      homeScroller.current?.scrollTo({ top: 0 });
      setHomeOffset(slotOffset());
      setPlace("landing");
    }
  }, [atHome, place, slotEl]);

  useLayoutEffect(() => {
    wasHearing.current = hearing;
    const from = barsFrom.current;
    barsFrom.current = null;
    if (!from || hearing) return;
    listenButton.current?.querySelectorAll(".listen-face path").forEach((bar, i) => {
      if (from[i] && from[i] !== "none") {
        bar.animate([{ transform: from[i] }, { transform: "none" }], { duration: 400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
      }
    });
  }, [hearing]);

  useLayoutEffect(() => {
    if (listenHadFocus.current && document.activeElement !== listenButton.current) {
      listenButton.current?.focus({ preventScroll: true });
    }
  }, [place]);

  useEffect(() => {
    if (place === "lifting") {
      // Paint once at the slot, then let the transition carry it.
      let frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => setPlace("floating"));
      });
      return () => cancelAnimationFrame(frame);
    }
    if (place === "landing") {
      const timer = window.setTimeout(() => setPlace("inline"), GLIDE_MS);
      return () => window.clearTimeout(timer);
    }
  }, [place]);

  const show = useCallback(
    (index: number, ranking: Ranking | null) => {
      if (!catalog) return;
      setShown(catalog[index]);
      setLeaving(false);
      setPhase({ kind: "identified", index, ranking });
    },
    [catalog],
  );

  const listen = useCallback(() => {
    if (!ready || listening) return;
    setPanelOpen(false);
    setChecks([]);
    // The old bhajan leaves while the button glides back to the middle.
    if (shown) {
      setLeaving(true);
      window.setTimeout(() => setShown(null), LEAVE_MS);
    }
    setPhase({ kind: "listening", singing: false, twin: false, since: null, checked: [], closing: false });
    const s = new ListenSession(asr, refs, (u) => {
      if (u.kind === "hearing") {
        // The words are found a little after they begin; date them from their start.
        const since = performance.now() - u.seconds * 1000;
        setPhase((p) => (p.kind === "listening" && !p.singing ? { ...p, singing: true, since } : p));
      } else if (u.kind === "waiting") {
        // Back to waiting after a false start.
        setPhase((p) =>
          p.kind === "listening" && p.singing ? { ...p, singing: false, twin: false, since: null, checked: [] } : p,
        );
      } else if (u.kind === "check") {
        setChecks((c) => [...c, u]);
        setPhase((p) =>
          p.kind === "listening"
            ? { ...p, checked: [...p.checked, u.at], twin: p.twin || u.twin !== null }
            : p,
        );
      }
      else if (u.kind === "identified") {
        // Let the ring close first, so the answer reads as the end of the wait.
        setPhase((p) => (p.kind === "listening" ? { ...p, closing: true } : p));
        closeTimer.current = window.setTimeout(() => {
          closeTimer.current = null;
          show(u.index, u.ranking);
        }, CLOSE_MS);
      }
      else if (u.kind === "gave-up") setPhase({ kind: "gave-up", ranking: u.ranking, heardSinging: u.heardSinging });
      else if (u.kind === "error") setPhase({ kind: "error", message: u.message });
    });
    session.current = s;
    void s.start();
  }, [ready, listening, refs, shown, show]);

  const clearClose = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const cancel = useCallback(() => {
    // Found and closing: nothing to stop, and the answer is a moment away.
    if (closeTimer.current !== null) return;
    void session.current?.stop();
    setPhase({ kind: "idle" });
  }, []);

  // Back to the start page from a shown bhajan or a failed attempt.
  const goHome = useCallback(() => {
    clearClose();
    void session.current?.stop();
    setPanelOpen(false);
    setChecks([]);
    if (shown) {
      setLeaving(true);
      window.setTimeout(() => setShown(null), LEAVE_MS);
    }
    setPhase({ kind: "idle" });
  }, [shown]);

  // A bhajan chosen by search replaces whatever is on screen, and stops any
  // listening in progress.
  const choose = useCallback(
    (index: number) => {
      clearClose();
      void session.current?.stop();
      setChecks([]);
      setPanelOpen(false);
      setSearchOpen(false);
      show(index, null);
    },
    [show],
  );

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }, []);

  // Space listens (or stops listening), / or ⌘K searches, F toggles full screen,
  // Escape closes the panel. The search sheet handles its own keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (searchOpen || e.target instanceof HTMLInputElement) return;
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        if (!searchIndex) return;
        e.preventDefault();
        setPanelOpen(false);
        setSearchOpen(true);
      } else if (e.code === "Space" && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        if (listening) cancel();
        else listen();
      } else if (e.key === "f" || e.key === "F") toggleFullscreen();
      else if (e.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [listening, listen, cancel, toggleFullscreen, searchOpen, searchIndex]);

  const ranking = phase.kind === "identified" || phase.kind === "gave-up" ? phase.ranking : null;
  const others =
    ranking && catalog
      ? ranking.candidates.filter((c) => phase.kind !== "identified" || c.index !== phase.index).slice(0, 3)
      : [];
  const text = caption(phase, ready, model, modelError, progress);
  const hint = captionHint(phase, ready, modelError);
  const listeningPhase = phase.kind === "listening" ? phase : null;
  // Download progress, drawn around the button while the speech model loads.
  const loaded = model ? 1 : (progress?.fraction ?? 0);

  // The listen button with its download ring, caption and fallback choices.
  const button = (
    <>
        {!ready && !modelError && phase.kind !== "error" && (
          <svg className="progress" viewBox="0 0 100 100" aria-hidden="true">
            <circle className="progress-track" cx="50" cy="50" r="48" pathLength={1} />
            <circle
              className="progress-fill"
              cx="50"
              cy="50"
              r="48"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - loaded}
            />
          </svg>
        )}
        {ready && (
          <ListenProgress
            since={listeningPhase?.since ?? null}
            twin={listeningPhase?.twin ?? false}
            checked={listeningPhase?.checked ?? []}
            closing={listeningPhase?.closing ?? false}
            found={docked}
          />
        )}
        <button
          ref={listenButton}
          type="button"
          className={`listen${listening ? " is-listening" : ""}${hearing ? " is-hearing" : ""}`}
          onClick={listening ? cancel : listen}
          disabled={!ready}
          aria-label={listening ? "Stop listening" : docked ? "Listen for the next bhajan" : "Listen for a bhajan"}
        >
          <span className="rings" aria-hidden="true">
            <span className="ring" />
            <span className="ring" />
            <span className="ring" />
          </span>
          <span className="listen-face">
            {/* Large and heavy enough to stay legible when docked at about half size. */}
            <WaveIcon size={58} stroke={2.4} />
          </span>
        </button>
        <p className={`caption${text ? "" : " is-empty"}`} role="status">
          {text}
          {hint && <span className="caption-hint">{hint}</span>}
        </p>
        {phase.kind === "gave-up" && others.length > 0 && (
          <div className="choices">
            {others.map((c) => (
              <button key={c.index} type="button" className="choice" onClick={() => show(c.index, ranking!)}>
                <BhajanName catalog={catalog!} index={c.index} among={others.map((o) => o.index)} />
              </button>
            ))}
          </div>
        )}
    </>
  );

  return (
    <div className="app">
      <Home
        catalog={catalog}
        visible={atHome}
        fullscreen={fullscreen}
        scroller={homeScroller}
        slot={setSlotEl}
        onSearch={() => setSearchOpen(true)}
        onFullscreen={toggleFullscreen}
      />

      {shown && <Lyrics key={shown.slug} bhajan={shown} leaving={leaving} />}

      {place === "inline"
        ? slotEl && createPortal(<div className="dock is-inline">{button}</div>, slotEl)
        : (
          <div
            className={`dock${docked ? " is-docked" : ""}${place === "lifting" || place === "landing" ? " is-home" : ""}${place === "lifting" ? " is-following" : ""}`}
            style={{ "--home-offset": `${homeOffset}px` } as CSSProperties}
          >
            {button}
          </div>
        )}

      {/* Under the docked button, once it has settled: what pressing it does now.
          The button itself carries the accessible name; this is for the eye. */}
      {docked && (
        <span className="next-label" aria-hidden="true" onClick={listen}>
          Tap for the next bhajan
        </span>
      )}

      <div className={`corner${atHome ? " is-hidden" : ""}`}>
        {!atHome && !listening && (
          <button type="button" className="corner-button" aria-label="Back to the start page" onClick={goHome}>
            <HomeIcon />
          </button>
        )}
        {searchIndex && (
          <button
            type="button"
            className="corner-button"
            aria-label="Search bhajans"
            aria-keyshortcuts="/"
            onClick={() => {
              setPanelOpen(false);
              setSearchOpen(true);
            }}
          >
            <SearchIcon />
          </button>
        )}
        {docked && (
          <button
            type="button"
            className="corner-button"
            aria-label="Other matches and details"
            aria-expanded={panelOpen}
            onClick={() => setPanelOpen((o) => !o)}
          >
            <MoreIcon />
          </button>
        )}
        {document.fullscreenEnabled && (
          <button
            type="button"
            className="corner-button"
            aria-label={fullscreen ? "Exit full screen" : "Full screen"}
            onClick={toggleFullscreen}
          >
            {fullscreen ? <CollapseIcon /> : <ExpandIcon />}
          </button>
        )}
      </div>

      {panelOpen && docked && catalog && (
        <aside className="panel" aria-label="Other matches">
          <h2 className="panel-heading">Not this bhajan?</h2>
          {others.length ? (
            others.map((c) => (
              <button
                key={c.index}
                type="button"
                className="panel-row"
                onClick={() => {
                  show(c.index, ranking!);
                  setPanelOpen(false);
                }}
              >
                <BhajanName
                  catalog={catalog}
                  index={c.index}
                  among={[...others.map((o) => o.index), ...(phase.kind === "identified" ? [phase.index] : [])]}
                />
              </button>
            ))
          ) : (
            <p className="panel-note">{ranking ? "No other close matches." : "Chosen from search."}</p>
          )}
          {checks.length > 0 && (
            <details className="panel-details">
              <summary>What it heard</summary>
              {checks.map((c) => (
                <p key={c.at} className="panel-note">
                  <span className="panel-at">{c.at}s</span> <span lang="sa">{c.transcript || "nothing"}</span>
                </p>
              ))}
            </details>
          )}
        </aside>
      )}

      {searchOpen && catalog && searchIndex && (
        <Search catalog={catalog} index={searchIndex} onChoose={choose} onClose={() => setSearchOpen(false)} />
      )}
    </div>
  );
}

function caption(
  phase: Phase,
  ready: boolean,
  model: AsrReady | null,
  modelError: string | null,
  progress: AsrProgress | null,
): string {
  if (modelError) return "The speech model couldn't load. Reload the page to try again.";
  if (phase.kind === "error") return phase.message;
  if (!ready) {
    if (!model && progress?.fraction != null) return `Getting ready · ${Math.round(progress.fraction * 100)}%`;
    return "Getting ready…";
  }
  switch (phase.kind) {
    case "idle":
      return "Tap when a bhajan begins";
    case "listening":
      if (phase.closing) return "Found it.";
      return phase.singing ? "Finding the bhajan…" : "Listening for a bhajan…";
    case "identified":
      return "";
    case "gave-up":
      if (!phase.heardSinging) return "Didn't hear any singing. Tap to try again.";
      return phase.ranking?.candidates.length ? "Is it one of these?" : "Couldn't make out the words. Tap to try again.";
  }
}

/** A second, quieter line saying what the app is waiting for. */
function captionHint(phase: Phase, ready: boolean, modelError: string | null): string {
  if (modelError || phase.kind === "error") return "";
  if (!ready) return "The first visit downloads the speech model.";
  if (phase.kind !== "listening" || phase.closing) return "";
  if (phase.twin) return "Two bhajans start this way. Waiting for the next line.";
  if (!phase.singing) return "Waiting for the first line.";
  // Follows the checks drawn on the ring: before the first, after it, near the end.
  if (phase.checked.length === 0) return "Heard singing.";
  return phase.checked.length < RULES.checkpoints.length - 1 ? "Narrowing it down." : "Almost there.";
}

/**
 * A bhajan's title in a list of choices, with the line that tells it apart
 * when another bhajan in the same list has the same title.
 */
function BhajanName({ catalog, index, among }: { catalog: Bhajan[]; index: number; among: number[] }) {
  const bhajan = catalog[index];
  const shared = among.some((i) => i !== index && catalog[i].title === bhajan.title);
  const line = shared ? distinguishingLine(bhajan) : undefined;
  return (
    <>
      {bhajan.title}
      {line && <span className="name-line">{line}</span>}
    </>
  );
}
