// The start page: what AutoBhajan does, said once, around the button that
// does it.
//
// The first screen is a headline, one sentence and the listen button (App
// places the real button in the `slot` here). The example slide's top edge
// shows at the foot of that screen, and scrolling brings the whole slide in:
// a real bhajan, set exactly as it will be on the projector. Then the keys,
// and the source. Nothing else: the page shows rather than explains.

import { useEffect, useRef, useState, type Ref } from "react";

import type { Bhajan } from "../match/catalog.ts";
import { CollapseIcon, ExpandIcon, SearchIcon } from "./icons.tsx";
import { Lyrics } from "./Lyrics.tsx";

/** Shown on the page as an example of the slide: five lines, with a meaning. */
const EXAMPLE_SLUG = "kamala-nayana-narayana";

type Props = {
  catalog: Bhajan[] | null;
  visible: boolean;
  fullscreen: boolean;
  scroller: Ref<HTMLDivElement>;
  slot: Ref<HTMLDivElement>;
  onSearch: () => void;
  onFullscreen: () => void;
};

export function Home({ catalog, visible, fullscreen, scroller, slot, onSearch, onFullscreen }: Props) {
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
        <h1 id="hero-title">
          Sing the first line.
          <br />
          The words appear.
        </h1>
        <p className="hero-lede">
          AutoBhajan hears the opening of a bhajan, finds it among {count ?? "a thousand"}, and puts the words up for
          the whole hall.
        </p>
        <div className="hero-slot" ref={slot} />
      </section>

      {example && (
        <section className="feature" aria-labelledby="feature-title">
          <h2 id="feature-title">Readable from the back row.</h2>
          <SlidePreview bhajan={example} />
        </section>
      )}

      <p className="keys" aria-label="Keyboard shortcuts">
        <span>
          <kbd>Space</kbd> Listen
        </span>
        <span>
          <kbd>/</kbd> Search
        </span>
        <span>
          <kbd>F</kbd> Full screen
        </span>
      </p>

      <footer className="footer">
        <p>{count ? `${count} bhajans` : "Bhajans"}, with lyrics and meanings, from Sai Tunes.</p>
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
    <figure className="preview" aria-label={`Example: ${bhajan.title}, as it appears on screen`}>
      <div className="preview-screen" ref={frame}>
        {seen && <Lyrics bhajan={bhajan} leaving={false} preview />}
      </div>
    </figure>
  );
}
