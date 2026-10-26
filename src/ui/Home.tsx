// The start page: what AutoBhajan is, around the one button that does it.
//
// Tool first. The listen button keeps its place in the middle of the first
// screen (App places the real button in the `slot` here), with one
// sentence above it saying what happens and the three-beat cycle below. A
// volunteer can tap straight away; a first-time visitor can read the screen
// top to bottom and know what it does. Scrolling down shows the slide it puts
// up, how it behaves when unsure, and what to know at a session.

import { useEffect, useRef, useState, type Ref } from "react";

import type { Bhajan } from "../match/catalog.ts";
import { ChevronDownIcon, CollapseIcon, ExpandIcon, SearchIcon, WaveIcon } from "./icons.tsx";
import { Lyrics } from "./Lyrics.tsx";

/** Shown on the page as an example of the slide: five lines, with a meaning. */
const EXAMPLE_SLUG = "kamala-nayana-narayana";
const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

type Props = {
  catalog: Bhajan[] | null;
  visible: boolean;
  ready: boolean;
  fullscreen: boolean;
  scroller: Ref<HTMLDivElement>;
  slot: Ref<HTMLDivElement>;
  onListen: () => void;
  onSearch: () => void;
  onFullscreen: () => void;
};

export function Home({ catalog, visible, ready, fullscreen, scroller, slot, onListen, onSearch, onFullscreen }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const count = catalog ? catalog.length.toLocaleString("en") : null;
  const example = catalog?.find((b) => b.slug === EXAMPLE_SLUG) ?? null;

  return (
    <div
      className={`home${visible ? "" : " is-hidden"}`}
      ref={scroller}
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 8)}
      aria-hidden={!visible}
      inert={!visible}
    >
      <header className={`topbar${scrolled ? " is-scrolled" : ""}`}>
        <span className="wordmark">AutoBhajan</span>
        <div className="topbar-actions">
          <button type="button" className="search-pill" onClick={onSearch} disabled={!catalog} aria-keyshortcuts="/">
            <SearchIcon size={17} />
            <span className="search-pill-label">Search bhajans</span>
            <kbd>/</kbd>
          </button>
          {document.fullscreenEnabled && (
            <button
              type="button"
              className="corner-button"
              aria-label={fullscreen ? "Exit full screen" : "Full screen"}
              onClick={onFullscreen}
            >
              {fullscreen ? <CollapseIcon /> : <ExpandIcon />}
            </button>
          )}
        </div>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">
            Sing the first line.
            <br />
            The words appear.
          </h1>
          <p className="hero-lede">
            AutoBhajan listens as a bhajan begins, recognises it among {count ?? "over a thousand"} Sai bhajans, and
            puts the lyrics and their meaning on screen for the whole hall.
          </p>
        </div>

        {/* The listen button is placed here by App (it lifts out to listen). */}
        <div className="hero-slot" ref={slot} />
        <div className="hero-caption-space" aria-hidden="true" />

        <ol className="cycle" aria-label="How it works">
          <li>
            <span className="cycle-step" aria-hidden="true">1</span>
            <h2>Tap as it begins</h2>
            <p>When the lead singer starts a new bhajan, press the button once.</p>
          </li>
          <li>
            <span className="cycle-step" aria-hidden="true">2</span>
            <h2>It listens for the words</h2>
            <p>Music before the singing doesn't count. Most bhajans are found within 10 seconds.</p>
          </li>
          <li>
            <span className="cycle-step" aria-hidden="true">3</span>
            <h2>The words go up</h2>
            <p>Title, pitch, lyrics and meaning, sized to read from the back of the hall.</p>
          </li>
        </ol>

        <a
          className="more-cue"
          href="#more"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("more")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          More about AutoBhajan
          <ChevronDownIcon size={18} />
        </a>
      </section>

      <section className="feature" id="more" aria-labelledby="slide-title">
        <div className="feature-copy">
          <h2 id="slide-title">The slide your centre already uses.</h2>
          <p>
            The bhajan's name and pitch, the lyrics as large as the screen allows, one sung line to a row, and the
            English meaning underneath. Nothing else is on screen while people sing.
          </p>
        </div>
        {example && <SlidePreview bhajan={example} />}
      </section>

      <section className="facts" aria-label="What to expect">
        <div className="fact is-lead">
          <h2>Nothing leaves this device.</h2>
          <p>
            Listening happens in your browser. What the microphone hears is never uploaded or saved, and there's no
            account or login. The speech model downloads on your first visit, then loads from this device.
          </p>
        </div>
        <div className="fact">
          <h2>It shows a bhajan only when it's sure.</h2>
          <p>
            If nothing matches clearly, it keeps listening rather than guess. When two bhajans start with the same
            line, it waits for the line that tells them apart. If it's ever wrong, the ··· button lists the
            next-closest matches.
          </p>
        </div>
        <div className="fact">
          <h2>Or just search.</h2>
          <p>Find any bhajan by its title or any line, spelled however you like, and put it up straight away.</p>
          <button type="button" className="text-button" onClick={onSearch} disabled={!catalog}>
            Search bhajans
          </button>
        </div>
      </section>

      <section className="session" aria-labelledby="session-title">
        <h2 id="session-title">At the session</h2>
        <div className="session-grid">
          <ul className="tips">
            <li>Open AutoBhajan before the session starts, so it's ready when the first bhajan is.</li>
            <li>Keep the laptop or tablet near the singers, with the microphone allowed.</li>
            <li>Connect the projector and go full screen. The slide is made to be read from across the room.</li>
            <li>Press at the start of every bhajan. When one ends, the words stay up until you press again.</li>
          </ul>
          <dl className="keys">
            <div>
              <dt>
                <kbd>Space</kbd>
              </dt>
              <dd>Listen, or stop listening</dd>
            </div>
            <div>
              <dt>
                <kbd>/</kbd> or <kbd>{IS_MAC ? "⌘K" : "Ctrl K"}</kbd>
              </dt>
              <dd>Search bhajans</dd>
            </div>
            <div>
              <dt>
                <kbd>F</kbd>
              </dt>
              <dd>Full screen</dd>
            </div>
            <div>
              <dt>
                <kbd>Esc</kbd>
              </dt>
              <dd>Close a panel</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="close" aria-labelledby="close-title">
        <h2 id="close-title">Ready for the next bhajan.</h2>
        <button type="button" className="close-listen" onClick={onListen} disabled={!ready}>
          <WaveIcon size={20} stroke={2.2} />
          {ready ? "Start listening" : "Getting ready…"}
        </button>
      </section>

      <footer className="footer">
        <p>
          AutoBhajan · {count ? `${count} bhajans` : "Bhajans"}, with lyrics and meanings from Sai Tunes. Runs
          entirely in your browser.
        </p>
      </footer>
    </div>
  );
}

/**
 * A real bhajan, set exactly as the app sets it, inside a screen. It arrives
 * the way it does in use, line by line, the first time it scrolls into view.
 */
function SlidePreview({ bhajan }: { bhajan: Bhajan }) {
  const frame = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = frame.current;
    if (!el || seen) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSeen(true);
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [seen]);

  return (
    <figure className="preview">
      <div className="preview-screen" ref={frame}>
        {seen && <Lyrics bhajan={bhajan} leaving={false} preview />}
      </div>
      <figcaption>{bhajan.title}, as AutoBhajan puts it on screen.</figcaption>
    </figure>
  );
}
