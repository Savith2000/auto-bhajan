// Drawn icons on a 24 grid, 1.75 stroke; the listen glyph is heavier so it reads when docked.

type IconProps = { size?: number; stroke?: number };

const base = (size: number, stroke = 1.75) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: stroke,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

/** Five bars of a sung waveform: what the button listens for. */
export function WaveIcon({ size = 24, stroke }: IconProps) {
  return (
    <svg {...base(size, stroke)}>
      <path d="M4 10v4" />
      <path d="M8 7v10" />
      <path d="M12 4v16" />
      <path d="M16 7v10" />
      <path d="M20 10v4" />
    </svg>
  );
}

export function MoreIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="5.5" cy="12" r="0.9" fill="currentColor" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" />
      <circle cx="18.5" cy="12" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function ExpandIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M14 4h6v6" />
      <path d="M20 4l-6.5 6.5" />
      <path d="M10 20H4v-6" />
      <path d="M4 20l6.5-6.5" />
    </svg>
  );
}

export function CollapseIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M20 10h-6V4" />
      <path d="M14 10l6.5-6.5" />
      <path d="M4 14h6v6" />
      <path d="M10 14l-6.5 6.5" />
    </svg>
  );
}

export function SearchIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </svg>
  );
}

export function HomeIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 10.5L12 4l8 6.5" />
      <path d="M6 9v10h12V9" />
    </svg>
  );
}
