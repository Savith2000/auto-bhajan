// The start page: what Bhajan Cue does, said once, around the button that
// does it.
//
// The first screen is Swami's photo, framed as on a centre's altar, his
// words on why the words matter, one sentence and the listen button (App places the real button in
// the `slot` here). Scrolling brings in a real bhajan, set exactly as it will
// be on the projector. Then the keys, and the source.

import { useEffect, useRef, useState, type Ref } from "react";

import emblem from "../assets/emblem.png";
import type { Bhajan } from "../match/catalog.ts";
import { CollapseIcon, ExpandIcon, SearchIcon } from "./icons.tsx";
import { Lyrics } from "./Lyrics.tsx";

/** Shown on the page as an example of the slide: five lines, with a meaning. */
const EXAMPLE_SLUG = "kamala-nayana-narayana";

/** Swami's photos; the start page shows one, a different one each visit. */
const PHOTOS = Object.values(
  import.meta.glob<string>("../assets/swami/*.jpg", { eager: true, import: "default" }),
);

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
  const [photo] = useState(() => PHOTOS[Math.floor(Math.random() * PHOTOS.length)]);
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
        <span className="wordmark">
          <img className="emblem" src={emblem} alt="Sri Sathya Sai Global Council, U.S.A." width={44} height={44} />
          Bhajan Cue
        </span>
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
        <figure className="altar">
          <img src={photo} alt="Bhagawan Sri Sathya Sai Baba" width={480} height={600} />
        </figure>
        {/* Swami's words (Sai Bhajana Mala, 29), quoted exactly. */}
        <h1 id="hero-title" className="hero-quote">
          “Any devotional song, in any language can be sung{" "}
          <span className="hero-accent">as long as all can follow.”</span>
        </h1>
        <p className="hero-credit">Sri Sathya Sai Baba</p>
        <p className="hero-lede">Bhajan Cue hears the first line and puts up the words and meaning for everyone.</p>
        <div className="hero-slot" ref={slot} />
      </section>

      {example && (
        <section className="feature" aria-labelledby="feature-title">
          <h2 id="feature-title">What the hall sees</h2>
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
        <img className="footer-emblem" src={emblem} alt="" width={72} height={72} />
        <p>{count ? `${count} bhajans` : "Bhajans"} from Sai Tunes. Listening happens on this device.</p>
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
