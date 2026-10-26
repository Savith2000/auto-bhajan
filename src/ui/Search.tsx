// Find a bhajan by typing, Spotlight-style: one field near the top of the
// screen, results as you type, arrow keys and Enter to choose. For the
// volunteer when listening is not the right tool (a noisy room, a bhajan the
// listener keeps missing, or simply knowing the name already).

import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { Bhajan } from "../match/catalog.ts";
import { foldLatin, search, type SearchIndex } from "../match/search.ts";
import { SearchIcon } from "./icons.tsx";
import { distinguishingLine, parseLyrics, pitchLabel } from "./Lyrics.tsx";

type Props = {
  catalog: Bhajan[];
  index: SearchIndex;
  onChoose: (index: number) => void;
  onClose: () => void;
};

export function Search({ catalog, index, onChoose, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const hits = useMemo(() => search(query, index), [query, index]);
  const words = foldLatin(query).split(" ").filter(Boolean);

  useEffect(() => input.current?.focus(), []);
  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      onChoose(hits[active].index);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="search-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="search" role="dialog" aria-modal="true" aria-label="Search bhajans">
        <label className="search-field">
          <SearchIcon size={22} />
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search by title or any line"
            aria-label="Search bhajans"
            role="combobox"
            aria-expanded={hits.length > 0}
            aria-controls={`${id}-results`}
            aria-activedescendant={hits[active] ? `${id}-${hits[active].index}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        {query.trim() && (
          <ul className="search-results" id={`${id}-results`} role="listbox" ref={list}>
            {hits.length === 0 && <li className="search-empty">No bhajans match "{query.trim()}".</li>}
            {hits.map((hit, i) => {
              const bhajan = catalog[hit.index];
              // The line that matched, so a hit found in the lyrics shows why;
              // otherwise the first line that isn't the title, which also tells
              // apart two bhajans catalogued under the same title.
              const lines = parseLyrics(bhajan.lyrics).flatMap((l) => (l.kind === "text" ? [l.text] : []));
              const matched = lines.find((l) => words.every((w) => foldLatin(l).includes(w)));
              const line = matched && matched !== bhajan.title ? matched : distinguishingLine(bhajan);
              const pitch = pitchLabel(bhajan);
              return (
                <li
                  key={hit.index}
                  id={`${id}-${hit.index}`}
                  role="option"
                  aria-selected={i === active}
                  className={`search-hit${i === active ? " is-active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => onChoose(hit.index)}
                >
                  <span className="search-title">
                    {bhajan.title}
                    {pitch && <span className="search-pitch"> {pitch}</span>}
                  </span>
                  {line && line !== bhajan.title && <span className="search-line">{line}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
