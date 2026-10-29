// One screen, three states, Apple-style.
//
//   idle       the start page: what Bhajan Cue does, around the listen button
//   listening  the page clears; rings ripple out of the button, Shazam-style
//   found      the button glides to the bottom, the lyrics rise into the middle
//
// With "next bhajan automatically" on (the default), the app keeps listening
// once a bhajan is up, and when the next one starts it swaps the slide by
// itself: the old one leaves, the new one arrives, and for a while a quiet
// "Back to" undoes it. The progress ring belongs to the first answer only.
//
// The button is one object throughout. On the start page it sits in the page
// like any content; when listening starts it glides from there to the middle,
// and later docks under the slide.
//
// Everything else (home, search, other matches, what was heard, auto next,
// full screen) is for the volunteer, and sits quietly along the bottom corners.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import type { AsrProgress, AsrReady } from "./asr/asr.worker.ts";
import { AsrClient } from "./listen/asr-client.ts";
import { ListenSession, type SessionOptions, type SessionUpdate } from "./listen/session.ts";
import { buildReferences, type Bhajan, type Reference } from "./match/catalog.ts";
import { RULES, type Ranking } from "./match/identify.ts";
import { buildSearchIndex } from "./match/search.ts";
import { Home } from "./ui/Home.tsx";
import { CLOSE_MS, ListenProgress } from "./ui/ListenProgress.tsx";
import {
  AutoIcon,
  BackIcon,
  CollapseIcon,
  ExpandIcon,
  HomeIcon,
  MoreIcon,
  SearchIcon,
  WaveIcon,
} from "./ui/icons.tsx";
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
/** How long "Back to" stays up after a switch (matches its fade in styles.css). */
const BACK_MS = 20_000;
/** A session can run for hours; "What it heard" keeps only the latest checks. */
const MAX_CHECKS = 12;
/** Where the "next bhajan automatically" setting is kept between visits. */
const AUTO_KEY = "bhajan-cue:auto";

const MIC_LOST = "Mic stopped. Tap to restart.";
const STOPPED = "Stopped. Tap to listen again.";

function savedAuto(): boolean {
  try {
    return localStorage.getItem(AUTO_KEY) !== "off";
  } catch {
    return true;
  }
}

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
  // Whether a session holds the mic, for the wake lock.
  const [running, setRunning] = useState(false);
  const [auto, setAuto] = useState(savedAuto);
  // The bhajan a running session is following, and whether it has heard the
  // bhajan end and is listening for the next one's opening (armed).
  const [following, setFollowing] = useState<{ index: number; armed: boolean } | null>(null);
  // What was on screen before an automatic switch, while "Back to" is offered.
  const [back, setBack] = useState<{ index: number; ranking: Ranking | null } | null>(null);
  // Set when listening stopped by itself with a bhajan on screen (mic lost).
  const [halted, setHalted] = useState<string | null>(null);
  // Set while the progress ring closes on a found bhajan, before it is shown.
  const closeTimer = useRef<number | null>(null);
  // Set while the old lyrics leave, before the next bhajan (or nothing) is shown.
  const leaveTimer = useRef<number | null>(null);
  // The checks since the session last started on a next bhajan: the ones that
  // found it, if it switches.
  const attempt = useRef<Check[]>([]);
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

  const clearTimers = useCallback(() => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    closeTimer.current = null;
    leaveTimer.current = null;
  }, []);

  const show = useCallback(
    (index: number, ranking: Ranking | null) => {
      if (!catalog) return;
      if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
      setShown(catalog[index]);
      setLeaving(false);
      setPhase({ kind: "identified", index, ranking });
    },
    [catalog],
  );

  // The bhajan on screen leaves; then the next one comes up (or nothing does).
  const leave = useCallback((then: () => void) => {
    setLeaving(true);
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => {
      leaveTimer.current = null;
      then();
    }, LEAVE_MS);
  }, []);

  const stopSession = useCallback(() => {
    const s = session.current;
    session.current = null;
    void s?.stop();
    setRunning(false);
    setFollowing(null);
  }, []);

  // Updates go through a ref, so a session that runs for hours acts on the
  // state as it is now, not as it was when the session started.
  const onUpdate = useRef<(sessionAuto: boolean, u: SessionUpdate) => void>(() => {});
  const autoNow = useRef(auto);
  autoNow.current = auto;

  const startSession = useCallback(
    (options: SessionOptions) => {
      stopSession();
      setHalted(null);
      attempt.current = [];
      const sessionAuto = !!options.auto || options.following !== undefined;
      const s = new ListenSession(
        asr,
        refs,
        (u) => {
          // A session that has been replaced may still have an update in flight.
          if (session.current === s) onUpdate.current(sessionAuto, u);
        },
        options,
      );
      session.current = s;
      setRunning(true);
      void s.start();
    },
    [refs, stopSession],
  );

  // The session heard the next bhajan begin: the old slide leaves and the new
  // one comes up, with the way back on offer for a while.
  const switchTo = (index: number, ranking: Ranking) => {
    if (phase.kind !== "identified") return show(index, ranking);
    // What it heard is now about the new bhajan: the checks that found it.
    setChecks(attempt.current);
    attempt.current = [];
    setPanelOpen(false);
    if (phase.index !== index) setBack({ index: phase.index, ranking: phase.ranking });
    leave(() => show(index, ranking));
  };

  onUpdate.current = (sessionAuto, u) => {
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
      attempt.current = [...attempt.current, u].slice(-MAX_CHECKS);
      setChecks((c) => [...c, u].slice(-MAX_CHECKS));
      setPhase((p) =>
        p.kind === "listening"
          ? { ...p, checked: [...p.checked, u.at], twin: p.twin || u.twin !== null }
          : p,
      );
    } else if (u.kind === "following") {
      // The bhajan has ended and it is listening for the next: a fresh attempt.
      if (u.armed && !following?.armed) attempt.current = [];
      setFollowing({ index: u.index, armed: u.armed });
    } else if (u.kind === "identified" && u.switched) {
      switchTo(u.index, u.ranking);
    } else if (u.kind === "identified") {
      // Without auto the session has already let go of the mic.
      if (!sessionAuto) stopSession();
      // Let the ring close first, so the answer reads as the end of the wait.
      setPhase((p) => (p.kind === "listening" ? { ...p, closing: true } : p));
      closeTimer.current = window.setTimeout(() => {
        closeTimer.current = null;
        show(u.index, u.ranking);
        // The setting may have been changed while it listened.
        if (sessionAuto && !autoNow.current) stopSession();
        else if (!sessionAuto && autoNow.current) startSession({ auto: true, following: u.index });
      }, CLOSE_MS);
    } else if (u.kind === "gave-up") {
      stopSession();
      // Only a first attempt gives up; a bhajan on screen stays.
      setPhase((p) => (p.kind === "identified" ? p : { kind: "gave-up", ranking: u.ranking, heardSinging: u.heardSinging }));
    } else if (u.kind === "error" || u.kind === "mic-lost") {
      stopSession();
      // With a bhajan up (or about to be), keep it there and say so under the button.
      if (phase.kind === "identified" || closeTimer.current !== null) {
        setHalted(u.kind === "mic-lost" ? MIC_LOST : STOPPED);
      } else {
        // mic-lost's message is the technical reason ("track ended"); say it plainly.
        setPhase({ kind: "error", message: u.kind === "mic-lost" ? MIC_LOST : u.message });
      }
    }
  };

  const listen = useCallback(() => {
    if (!ready || listening) return;
    clearTimers();
    setPanelOpen(false);
    setChecks([]);
    setBack(null);
    // The old bhajan leaves while the button glides back to the middle.
    if (shown) leave(() => setShown(null));
    setPhase({ kind: "listening", singing: false, twin: false, since: null, checked: [], closing: false });
    // Stops any session still following the bhajan on screen, and starts afresh.
    startSession({ auto });
  }, [ready, listening, shown, auto, clearTimers, leave, startSession]);

  const cancel = useCallback(() => {
    // Found and closing: nothing to stop, and the answer is a moment away.
    if (closeTimer.current !== null) return;
    stopSession();
    setPhase({ kind: "idle" });
  }, [stopSession]);

  // Back to the start page from a shown bhajan or a failed attempt.
  const goHome = useCallback(() => {
    clearTimers();
    stopSession();
    setPanelOpen(false);
    setChecks([]);
    setBack(null);
    setHalted(null);
    if (shown) leave(() => setShown(null));
    setPhase({ kind: "idle" });
  }, [shown, clearTimers, stopSession, leave]);

  // The volunteer put a bhajan up by hand. With auto on, carry on from it:
  // follow it in the running session, or start one that follows it.
  const keepFollowing = useCallback(
    (index: number) => {
      if (!auto) stopSession();
      else if (session.current && following) session.current.follow(index);
      else startSession({ auto: true, following: index });
    },
    [auto, following, stopSession, startSession],
  );

  // A bhajan chosen by search replaces whatever is on screen, and stops any
  // listening in progress.
  const choose = useCallback(
    (index: number) => {
      clearTimers();
      setChecks([]);
      setPanelOpen(false);
      setSearchOpen(false);
      setBack(null);
      show(index, null);
      keepFollowing(index);
    },
    [clearTimers, show, keepFollowing],
  );

  // One of the other matches, from the panel or after giving up.
  const pick = useCallback(
    (index: number, ranking: Ranking | null) => {
      clearTimers();
      setPanelOpen(false);
      setBack(null);
      show(index, ranking);
      keepFollowing(index);
    },
    [clearTimers, show, keepFollowing],
  );

  // Undo an automatic switch.
  const goBack = useCallback(() => {
    if (!back) return;
    setBack(null);
    setChecks([]);
    setPanelOpen(false);
    keepFollowing(back.index);
    leave(() => show(back.index, back.ranking));
  }, [back, keepFollowing, leave, show]);

  const toggleAuto = useCallback(() => {
    const on = !auto;
    setAuto(on);
    try {
      localStorage.setItem(AUTO_KEY, on ? "on" : "off");
    } catch {
      // Private browsing may refuse storage; the setting holds for this visit.
    }
    if (!on) {
      setHalted(null);
      if (following) stopSession();
    } else if (phase.kind === "identified" && !session.current) {
      startSession({ auto: true, following: phase.index });
    }
  }, [auto, following, phase, stopSession, startSession]);

  // "Back to" offers itself for a while, then goes.
  useEffect(() => {
    if (!back) return;
    const timer = window.setTimeout(() => setBack(null), BACK_MS);
    return () => window.clearTimeout(timer);
  }, [back]);

  // Keep the screen on while listening: a session can follow bhajans for an
  // hour with nobody touching the device. The browser drops the lock when the
  // page is hidden, so ask again when it comes back.
  useEffect(() => {
    if (!running || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let done = false;
    const request = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock.request("screen").then(
        (l) => {
          if (done) void l.release().catch(() => {});
          else lock = l;
        },
        () => {},
      );
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      done = true;
      document.removeEventListener("visibilitychange", request);
      void lock?.release().catch(() => {});
    };
  }, [running]);

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
  const text = caption(phase, ready, model, modelError, progress, halted);
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
          className={`listen${listening ? " is-listening" : ""}${hearing ? " is-hearing" : ""}${docked && following?.armed ? " is-armed" : ""}`}
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
              <button key={c.index} type="button" className="choice" onClick={() => pick(c.index, ranking)}>
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
        <span
          className={`next-label${back ? " has-back" : ""}${following && !halted ? " is-live" : ""}`}
          aria-hidden="true"
          onClick={listen}
        >
          {halted ?? (following ? "Listening for the next bhajan" : "Tap for the next bhajan")}
        </span>
      )}

      {/* After an automatic switch, for a while: undo it. */}
      {docked && back && catalog && (
        <button
          key={back.index}
          type="button"
          className="back"
          aria-label={`Back to ${catalog[back.index].title}`}
          onClick={goBack}
        >
          <BackIcon />
          <span className="back-text">
            Back<span className="back-to"> to {catalog[back.index].title}</span>
          </span>
        </button>
      )}

      {/* Each control is named under its circle: a volunteer under pressure
          should not have to guess what a glyph means. Getting about (home,
          search) sits bottom-left and the controls for the bhajan on screen
          bottom-right, so the docked button and its label fit between them.
          Below 640px they share one row on the right, and only the auto
          control keeps its name, since its state is the one to read. */}
      <div className={`corner${atHome ? " is-hidden" : ""}`}>
        <div className="corner-group">
          {!atHome && !listening && (
            <button type="button" className="corner-button" aria-label="Home" onClick={goHome}>
              <span className="corner-circle">
                <HomeIcon />
              </span>
              <span className="corner-caption">Home</span>
            </button>
          )}
          {searchIndex && (
            <button
              type="button"
              className="corner-button"
              aria-label="Search"
              aria-keyshortcuts="/"
              onClick={() => {
                setPanelOpen(false);
                setSearchOpen(true);
              }}
            >
              <span className="corner-circle">
                <SearchIcon />
              </span>
              <span className="corner-caption">Search</span>
            </button>
          )}
        </div>
        <div className="corner-group">
          {docked && (
            <button
              type="button"
              className="corner-button"
              aria-label="Wrong bhajan? Other matches"
              aria-expanded={panelOpen}
              onClick={() => setPanelOpen((o) => !o)}
            >
              <span className="corner-circle">
                <MoreIcon />
              </span>
              <span className="corner-caption">Wrong bhajan?</span>
            </button>
          )}
          <button
            type="button"
            className={`corner-button corner-auto${auto ? " is-on" : ""}`}
            aria-label="Auto next: move to the next bhajan by itself"
            aria-pressed={auto}
            onClick={toggleAuto}
          >
            <span className="corner-circle">
              <AutoIcon />
            </span>
            <span className="corner-caption">
              Auto<span className="corner-caption-long"> next</span>: {auto ? "on" : "off"}
            </span>
          </button>
          {document.fullscreenEnabled && (
            <button
              type="button"
              className="corner-button corner-fullscreen"
              aria-label={fullscreen ? "Exit full screen" : "Full screen"}
              onClick={toggleFullscreen}
            >
              <span className="corner-circle">{fullscreen ? <CollapseIcon /> : <ExpandIcon />}</span>
              <span className="corner-caption">{fullscreen ? "Exit full screen" : "Full screen"}</span>
            </button>
          )}
        </div>
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
                onClick={() => pick(c.index, ranking)}
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
              {/* A session can check many times; the same moment can recur. */}
              {checks.map((c, i) => (
                <p key={i} className="panel-note">
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
  halted: string | null,
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
      // Hidden under the docked button, but still announced.
      return halted ?? "";
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
