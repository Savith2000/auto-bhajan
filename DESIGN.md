---
name: AutoBhajan
description: The Sai centre's look. Swami's photo and one saffron button on a cream page under the Sri Sathya Sai Global Council emblem; the bhajan arrives as the slide the centre already projects, navy words, a brand-blue title and saffron rules, readable from the back of the hall.
colors:
  ink: "#0e2a4d"
  ground: "#fdf8e8"
  ink-2: "#3b4e6b"
  ink-3: "#56667f"
  blue: "#0c5098"
  saffron: "#ee7900"
  saffron-deep: "#e06f00"
  saffron-press: "#d26800"
  ray: "#fbba74"
  rule: "#ee7900"
  hairline: "rgba(14, 42, 77, 0.12)"
  fill: "rgba(12, 80, 152, 0.07)"
  fill-hover: "rgba(12, 80, 152, 0.13)"
  glass: "rgba(253, 248, 232, 0.86)"
  keycap: "#fffdf5"
typography:
  page-display:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"SF Pro Text\", \"Helvetica Neue\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "clamp(36px, min(6vw, 8.2vh), 84px)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  page-headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"SF Pro Text\", \"Helvetica Neue\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "clamp(32px, 4vw, 56px)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  page-lede:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"SF Pro Text\", \"Helvetica Neue\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "clamp(18px, 1.55vw, 23px)"
    fontWeight: 400
    lineHeight: 1.42
    letterSpacing: "-0.01em"
  shortcut:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"SF Pro Text\", \"Helvetica Neue\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"SF Pro Text\", \"Helvetica Neue\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "fit-to-stage, 18px to 110px"
    fontWeight: 400
    lineHeight: 1.24
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"SF Pro Text\", \"Helvetica Neue\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "clamp(26px, 3.3vw, 64px)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  meaning:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"SF Pro Text\", \"Helvetica Neue\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "clamp(15px, 1.35vw, 26px)"
    fontWeight: 400
    lineHeight: 1.4
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"SF Pro Text\", \"Helvetica Neue\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"SF Pro Text\", \"Helvetica Neue\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  note:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"SF Pro Text\", \"Helvetica Neue\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
  key:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"SF Pro Text\", \"Helvetica Neue\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1
rounded:
  key: "7px"
  row: "12px"
  screen: "20px"
  sheet: "22px"
  full: "999px"
spacing:
  xs: "8px"
  sm: "10px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  button: "132px"
  button-narrow: "112px"
  dock-gap: "76px"
  dock-gap-narrow: "64px"
  dock-band: "132px"
  dock-band-narrow: "120px"
  margin: "clamp(20px, 5.5vw, 120px)"
  page: "min(1120px, calc(100% - 2 * clamp(20px, 5.5vw, 120px)))"
  topbar: "64px"
  topbar-narrow: "56px"
  slide-top: "clamp(16px, 3vh, 40px)"
components:
  button-listen:
    backgroundColor: "{colors.saffron-deep}"
    textColor: "{colors.keycap}"
    rounded: "{rounded.full}"
    size: "{spacing.button}"
  button-listen-hover:
    backgroundColor: "{colors.saffron-press}"
    textColor: "{colors.keycap}"
  button-listen-disabled:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.full}"
    size: "{spacing.button}"
  caption:
    textColor: "{colors.ink-2}"
    typography: "{typography.body}"
  top-bar:
    textColor: "{colors.ink}"
    height: "{spacing.topbar}"
    padding: "0 max(var(--margin), calc((100% - 1120px) / 2))"
  top-bar-scrolled:
    backgroundColor: "rgba(253, 248, 232, 0.92)"
  search-pill:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.full}"
    height: "40px"
    padding: "0 10px 0 14px"
  search-pill-hover:
    backgroundColor: "{colors.fill-hover}"
    textColor: "{colors.ink}"
  keycap:
    backgroundColor: "{colors.keycap}"
    textColor: "{colors.ink}"
    typography: "{typography.key}"
    rounded: "{rounded.key}"
    height: "24px"
    padding: "0 7px"
  preview-screen:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.screen}"
  altar-photo:
    backgroundColor: "{colors.ground}"
    rounded: "50% 50% 18px 18px / 40% 40% 18px 18px"
    padding: "5px"
    height: "clamp(130px, 27svh, 300px)"
  slide-title:
    textColor: "{colors.blue}"
    typography: "{typography.headline}"
    padding: "0 0 clamp(12px, 2vh, 28px)"
  lyrics:
    textColor: "{colors.ink}"
    typography: "{typography.display}"
  slide-meaning:
    textColor: "{colors.ink-2}"
    typography: "{typography.meaning}"
    padding: "clamp(10px, 2vh, 24px) 0"
  choice-pill:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "11px 20px"
  choice-pill-hover:
    backgroundColor: "{colors.fill-hover}"
  corner-button:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.full}"
    size: "40px"
  corner-button-hover:
    backgroundColor: "{colors.fill-hover}"
    textColor: "{colors.ink}"
  panel:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "16px 10px 12px"
    width: "min(320px, calc(100vw - 40px))"
  panel-row:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.row}"
    padding: "10px 12px"
  panel-row-hover:
    backgroundColor: "{colors.fill}"
  search-sheet:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    width: "min(680px, calc(100vw - 32px))"
  search-field:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "16px 20px"
  search-hit:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.row}"
    padding: "10px 14px"
  search-hit-active:
    backgroundColor: "{colors.fill-hover}"
---

# Design System: AutoBhajan

## Overview

**Creative North Star: "The Centre's Slide, in the Centre's Colours"**

AutoBhajan puts up the slide the Sai centre already projects, from a reference slide the user shared: a warm cream page, the bhajan's name and pitch bold and centred over a rule, the romanised lyrics left-aligned below in regular weight, and the English meaning in italics over a closing rule. The room already knows how to read this layout. Since October 2026, by the user's request, the app wears the Sai organisation's own colours rather than the slide's greys: the cream ground stays, the type is a navy ink drawn from the brand blue, titles are brand blue, and saffron (the colour of Swami's robe and of the emblem's centre) carries the listen button, the slide's rules and the listening rings. The Sri Sathya Sai Global Council, U.S.A. emblem (the general emblem, never the 100th birthday one) sits in the top bar and closes the start page, and a photo of Swami, framed in an arch as on a centre's altar, opens it. Around that the app keeps Apple-style restraint: one round button, Shazam-style rings, lines that rise out of a blur, and motion that glides and never bounces.

There are two densities. The start page says what the app does in as few words as possible and then shows it: a sticky bar with the emblem, wordmark and search; Swami's photo; the headline "Sing a bhajan. See the words." and one sentence; and the listen button with its caption. On scroll, a real bhajan set in a screen under "What the hall sees", a single line of keyboard shortcuts, the emblem and the source. The moment listening starts, the page clears and the screen holds only what the room needs this second: the button and its rings, then the slide with the button docked small beneath it. Everything the volunteer might need beyond that (home, search, other matches, what was heard, full screen) sits in quiet shaded circles in the bottom-right corner. The slide's scale is set for a projector read from the back of a hall by an audience that skews older.

The system is light only (`color-scheme: light`, theme colour cream). Navy ink on cream holds about 13.6:1 and the blue title 7.6:1, so the words stay strong on a washed-out projector.

**Key Characteristics:**
- Warm cream page; navy ink; brand-blue titles; saffron button, rules and rings; ray orange only around Swami's photo.
- The Sri Sathya Sai Global Council, U.S.A. emblem in the top bar and footer, never recoloured or captioned.
- Swami's photo on the start page, one of six, a different one each visit, in an arched frame.
- The slide: bold centred title with pitch over a rule, left-aligned regular-weight lyrics, italic meaning over a closing rule.
- Lyrics sized to fill the space between the rules, one sung line per row.
- One solid saffron object: the round listen button.
- One system type stack (SF Pro on Apple devices); page headlines are 700 and tightly tracked, the sung words are 400.
- The button is one object that sits in the page, lifts out, glides to the middle, docks under the slide and lands back.
- Glide and exponential ease-out motion; nothing overshoots, nothing moves while people sing.

## Colors

The Sai organisation's palette on the slide's cream. The brand values come from the Voice Seva brand spec, which pixel-counted them from the organisation's emblem: brand blue `#0C5098`, brand orange (saffron) `#EE7900`, ray orange `#FBBA74`. Per that spec, the blue is pushed toward ink for text and full-chroma saffron is kept for small, earned moments.

### Primary
- **Saffron** (`saffron`, `#ee7900`): the slide's two 2px rules, the listening progress segments, and the download ring's arc. At about 2.7:1 on cream it is a line and object colour, never a text colour.
- **Deep Saffron** (`saffron-deep`, `#e06f00`): the face of the listen button, one step deeper than the brand orange so its cream glyph holds 3.3:1. Hover presses it to **Saffron Press** (`#d26800`).
- **Brand Blue** (`blue`, `#0c5098`): the slide title, the second half of the start page's headline ("See the words."), and the focus ring. About 7.6:1 on cream.

### Secondary
- **Ray Orange** (`ray`, `#fbba74`): the 2px line around Swami's photo and the listening rings before singing is heard. Decorative only; about 1.6:1.

### Neutral
- **Slide Cream** (`ground`): the page itself, the slide, and the preview screen's face. Warm and slightly yellow, as the centres' slides are. Not white.
- **Navy Ink** (`ink`, `#0e2a4d`): every word that matters: headlines, each lyric line, panel rows, choice labels, keycap letters, the wordmark. About 13.6:1.
- **Soft Navy** (`ink-2`, `#3b4e6b`): the lede, shortcut labels, the English meaning, the caption, the search pill's label, corner glyphs at rest, the panel heading and timings. About 8.0:1.
- **Quiet Navy** (`ink-3`, `#56667f`): the footer, lyric cues and repeat counts, panel notes, search pitches and matched lines, the disabled button's glyph. About 5.5:1; never lower for text.
- **Hairline** (`hairline`, 12% navy): the footer's top edge, the scrolled bar's bottom edge, the preview screen's edge, glass sheet edges, the search divider and the download ring's track.
- **Shade** (`fill`) and **Shade Deeper** (`fill-hover`): 7% and 13% brand blue, the translucent fill of every secondary control (search pill, corner circles, choices, the disabled listen action) and its hover; Shade Deeper is also the search scrim and the active search row.
- **Cream Glass** (`glass`): the volunteer panel and the search sheet, always with a 30px backdrop blur and 1.3 saturation. The scrolled top bar uses a denser cream glass (0.92, 20px blur, 1.4 saturation).
- **Keycap Cream** (`keycap`): the face of keyboard keycaps and the listen button's glyph.

### Named Rules
**The Sai Palette Rule.** Cream, navy ink, brand blue, saffron and ray orange; nothing else. No gradients, no glows, no tinted bands.

**The One Solid Rule.** The round listen button is the only solid saffron object. Everything else is type, a rule, a hairline, a 7% shade, cream glass or the photo.

**The Saffron Is Not Text Rule.** Saffron and ray orange draw the button, rules, rings and the photo frame. Words are navy or brand blue.

**The Emblem Rule.** The emblem is the Sri Sathya Sai Global Council, U.S.A. general emblem (`src/assets/emblem.png`, from the user's 2000px transparent PNG). Never the 100th or 99th birthday logos, never recoloured, cropped or placed on a busy background, and never captioned with its own name or values. At least 44px tall.

## Typography

**Display Font:** SF Pro via the system stack (`-apple-system`, `BlinkMacSystemFont`, "SF Pro Display"), falling back to Helvetica Neue, Segoe UI, system-ui
**Body Font:** the same stack
**Label/Mono Font:** none; tabular numerals (`font-variant-numeric: tabular-nums`) for timings

**Character:** One family doing every job, as Apple's interfaces do. The start page speaks like an Apple product page: big, heavy, tightly tracked statements over soft-navy ledes. The slide is set the way the centres set theirs: a bold centred heading, plain regular lyrics, an italic gloss. Hierarchy comes from weight, size, position and the rules; colour marks only the title (brand blue).

### Hierarchy
- **Page Display** (700, clamp(36px, min(6vw, 8.2vh), 84px), line-height 1.04, -0.03em, Navy Ink, balanced): the start page's one h1, "Sing a bhajan. See the words.", the second sentence in Brand Blue. clamp(34px, min(5.2vw, 7vh), 76px); the height term keeps it from pushing the button below the fold under the photo.
- **Page Headline** (700, clamp(32px, 4vw, 56px), line-height 1.08, -0.025em, balanced, centred): the example's heading, "What the hall sees".
- **Page Lede** (400, clamp(18px, 1.55vw, 23px), line-height 1.42, Soft Navy, max 30em, balanced): the one sentence under the h1.
- **Shortcut** (400, 15px, Soft Navy): the shortcut labels beside their keycaps.
- **Display** (400, fit-to-stage between 18px and 110px, line-height 1.24, -0.005em, Navy Ink): the lyrics, left-aligned. The size is computed per bhajan by bisection to the largest at which the whole block fits the stage, capped at 20% of stage height, 7.5% of stage width and 110px. Lines sit 0.18em apart; a verse break is 0.5em.
- **Headline** (700, clamp(26px, 3.3vw, 64px), line-height 1.15, -0.01em, Brand Blue): the bhajan title, centred, balanced, followed by its pitch in parentheses, ladies first then gents ("(6 P / 2 P)"). The pitch never splits across lines.
- **Meaning** (400 italic, clamp(15px, 1.35vw, 26px), line-height 1.4, Soft Navy): the English meaning at the foot of the slide, left-aligned, at most 120ch wide.
- **Body** (500, 18px, line-height 1.35, -0.01em, Soft Navy): the caption under the button ("Tap when a bhajan begins", "Getting ready · 42%", "Listening for a bhajan…"), max width min(84vw, 560px); also the search field.
- **Label** (600, 17px, -0.01em): choice pills, panel rows, search results. The search pill is 15px / 500; the wordmark is 19px / 700 / -0.02em.
- **Note** (400, 14px, line-height 1.4, Quiet Navy): the caption's hint line, panel notes, search lines. The footer is 13px. Inline lyric notes (repeat counts "×5", cues "· repeat Gana Lola") are a relative variant: 0.5em of the lyric size, 500, no tracking, Quiet Navy, never wrapping.
- **Key** (600, 13px, line-height 1, Navy Ink): keycap letters; 12px in Soft Navy inside the search pill.

### Named Rules
**The Page Voice Rule.** Start-page statements are 700 with tight tracking (-0.025em to -0.03em) and balanced wrapping. The slide never borrows that tracking: its title is -0.01em and its lyrics -0.005em.

**The Say It Once Rule.** The start page says what the app does once, in as few words as possible (the headline and one sentence, by the user's request), and then shows it (the example slide). No step-by-step explainer, no feature blurbs, no repeated call to action; anything the button's caption or the slide already says is not said again.

**The One Line, One Row Rule.** Every sung line sits on a single row so singers see where a line ends. Wrapping is a last resort: only when the one-row fit would fall below 40px (26px on stages under 640px wide) do long lines wrap, at line-height 1.1 with a 0.5em gap between sung lines. The start page's example never wraps.

**The Largest That Fits Rule.** Lyric size is never a fixed step on a scale; it is the largest size at which the whole bhajan fits between the title rule and the meaning. Only outliers that overflow even at 18px with wrapping scroll, inside the stage, fading out at the bottom edge.

**The Slide Weights Rule.** On the slide the title is 700, the sung words 400, the meaning 400 italic in Soft Navy. The lyrics are never bold.

## Layout

The app is a fixed full-viewport stage. Only the start page scrolls, inside its own layer; listening and the slide never scroll the page.

- **Start page column:** content sits in `page`, at most 1120px wide inside the shared `margin`. The sticky top bar (64px, 56px below 640px) aligns its wordmark and actions to the same column; it is transparent at the top and turns to cream glass with a hairline bottom edge once the page scrolls past 8px.
- **First screen (hero):** 90% of the viewport height minus the bar, so the example's heading shows at its foot; a centred column: Swami's photo in its arch (clamp(130px, 27svh, 300px) tall, 4:5; clamp(120px, 24svh, 220px) below 640px), clamp(20px, 3.4vh, 36px) above the headline and lede, then clamp(32px, 6vh, 64px) down, the listen button in its 132px slot with its caption 22px below, inside the hero's bottom padding (clamp(96px, 14vh, 140px)).
- **Below the fold:** in the page column, the example's heading and its screen (clamp(32px, 5vh, 56px) apart), then one centred line of shortcuts (keycap and label pairs 28px apart; hidden on touch screens, which have no keyboard), then the footer over a hairline (the 72px emblem centred over one line of source), each clamp(56px, 9vh, 96px) below the last.
- **Listening:** the page fades away and the button stands alone at dead centre on the empty cream page. The caption sits 56px below the button's bottom edge; fallback choices stack 108px below it.
- **Found, the slide:** an inset panel, `slide-top` from the top, `margin` from each side, and `dock-band` (dock-gap + 56px) from the bottom, so the words never run under the docked button. It is a three-row grid: the title (with its rule), the lyrics stage (taking all remaining height), and the meaning (with its closing rule). The title's rule sits clamp(12px, 2vh, 28px) below the title text; the lyrics stage starts clamp(12px, 2.4vh, 32px) below that rule; the meaning has clamp(10px, 2vh, 24px) above and below it. The rules span the slide's full width; the closing rule is drawn even when a bhajan has no meaning.
- **Found, the button:** bottom centre, `dock-gap` above the viewport bottom, scaled to 0.46 (about 60px), with "Tap for the next bhajan" centred 10px beneath it. Below 640px there is no room for that beside the corner controls, so the docked button moves to the slide's left margin and its label sits beside it (12px to its right, wrapping to two lines at most 7em wide).
- **Volunteer corner:** a row of 40px circles, 10px apart, 20px from the bottom-right corner (14px below 640px), hidden on the start page, whose bar carries search and full screen instead. The panel opens above them, 72px from the bottom, right-aligned, at most 320px wide. The search sheet hangs 12vh from the top, centred.
- **Spacing rhythm:** 8, 10, 12, 16 and 20px inside controls and sheets; the page's and slide's own spacing is fluid (clamps of vh and vw) so it holds on a projector, a laptop and a phone; lyric spacing is in em so it scales with the fitted size.
- **Breakpoints:** 640px shrinks the button (112px) and dock gap (64px), shortens the bar, collapses the search pill to an icon-only 40px circle, squares the preview screen (1:1), moves the docked button to the left margin and pulls in the corner inset. The slide's own wrap floor drops separately when the lyrics stage is under 640px wide.

### Named Rules
**The Button Keeps The Middle Rule.** On the start page's first screen the listen button sits near the middle, under the statement; nothing above it may push it below the fold.

**The Nothing Else Rule.** Once listening starts, and in the found state, the screen shows only the button (and its rings), the slide (title, rule, words, meaning, rule) and the corner circles. No header bar, no list, no progress bar. The start page is the only place with a bar, sections or explanation.

**The Slide Order Rule.** Title and pitch, rule, lyrics, meaning, rule: always in that order, always inside the slide's margins. The lyrics take whatever height the title and meaning leave.

**The No Boxes Rule.** The start page has no cards, boxes or tinted bands. Two objects are framed: Swami's photo, in its arch as on an altar, and the preview screen, because it depicts a screen.

## Elevation & Depth

Depth is mostly flat: navy type and saffron rules printed on cream, with the slide casting nothing. A few objects lift: the listen button and Swami's photo with warm saffron-brown shadows, the cream-glass sheets (panel and search) and the preview screen with navy ones. Keycaps get their depth from a heavier bottom border, not a shadow. Rings are flat outlines with no fill.

### Shadow Vocabulary
- **Button lift** (`box-shadow: 0 22px 50px -20px rgba(170, 72, 0, 0.6), 0 2px 6px rgba(120, 50, 0, 0.2)`): the round listen button. Removed when disabled.
- **Altar lift** (`box-shadow: 0 34px 60px -34px rgba(170, 72, 0, 0.55)`): Swami's photo.
- **Glass float** (`box-shadow: 0 28px 70px -24px rgba(14, 42, 77, 0.4), inset 0 0 0 1px rgba(14, 42, 77, 0.12)`): the volunteer panel and the search sheet, with `backdrop-filter: blur(30px) saturate(1.3)`.
- **Screen lift** (`box-shadow: 0 50px 100px -48px rgba(14, 42, 77, 0.4), 0 2px 8px rgba(14, 42, 77, 0.08), 0 0 0 1px rgba(14, 42, 77, 0.12)`): the start page's preview screen only.
- **Bar edge** (`box-shadow: inset 0 -1px 0 rgba(14, 42, 77, 0.12)`): the top bar once scrolled, with a cream glass of 0.92 and `backdrop-filter: blur(20px) saturate(1.4)`.
- **Ring outline** (`box-shadow: inset 0 0 0 2px #fbba74`): the listening rings, over a transparent background.

### Named Rules
**The Lifted Few Rule.** Only the listen button, Swami's photo, the glass sheets and the preview screen cast shadows. The slide, every rule, pills and corner circles are flat.

**The Outline Ring Rule.** Listening rings, the download ring and the progress ring are strokes only, never filled discs.

**The Honest Progress Rule.** The progress ring follows the session's real clock and checks. A segment never completes before its check has run, the ring never closes without an answer, and it never names a candidate before one is shown.

## Shapes

The form language is the circle and the horizontal rule. The listen button, its rings, the download ring, the corner buttons, the search pill and the choices are all fully round (circles or 999px pills). Lines are horizontal only: the slide's 2px saffron rules and the footer's 1px hairline; there are no vertical rules. The one arch is Swami's photo frame: a semicircular top over 18px bottom corners, a 2px ray-orange line, 5px of cream, then the photo, its corners concentric. Rounded rectangles are few and concentric in spirit: the glass sheets (22px corners) with their rows (12px), the preview screen (20px, 14px below 640px), and keycaps (7px). Icons are drawn on a 24px grid with round caps and joins at a 1.75 stroke (search, more, expand, collapse, home); the listen waveform is drawn heavier (2.4 stroke, 58px) so it stays legible when docked at under half size.

## Components

### Listen Button (signature)
The whole product in one object: a saffron circle that listens.
- **Shape:** a full circle, 132px (112px below 640px).
- **Face:** Deep Saffron with the five-bar waveform glyph in Keycap Cream, plus the Button lift shadow.
- **Hover / Active:** grows to 1.04 on a 0.5s glide and presses to Saffron Press over 0.4s; presses to 0.95 in 0.15s. Focus shows a 2px Brand Blue outline 4px out, as every control does.
- **Getting ready (model or catalog still loading):** a Shade face with a Quiet Navy glyph, no shadow, default cursor. On the first visit a 2.4px download ring sits 16px outside it: a Hairline track with a Saffron arc, round-capped, starting at twelve o'clock and filling clockwise on a 0.6s Arrive as the model downloads. The caption reads "Getting ready · 42%" with the hint "The first visit downloads the speech model."
- **Listening:** three Ray Orange outline rings ripple out, 1s apart, from 90% opacity to 1.85x over 3s, gone by 70% of their cycle so they never reach the caption. They sit in one layer at 70% that fades in over 0.5s. The button itself does not scale while listening.
- **Hearing singing:** the ripples fade out (same rhythm, never restarted; ripples mean waiting, the ring means working) and the waveform's bars move (scaleY 1 to 0.45, 0.9s, offset per bar), starting from their resting height. When it stops, the layer fades out and the bars ease back to rest over 0.4s.
- **Listening progress (ListenProgress):** five round-capped Saffron segments (2.4 units, about 4px) on a pale saffron track (16% saffron), 16px outside the button, separated by small gaps and reading clockwise from twelve o'clock. Five, like the petals of the emblem's lotus; each is one stretch of the decision: up to the checks at 3, 5, 7 and 9 s, then the answer at 10 s. Nothing shows while waiting for singing, since there is no deadline yet. From the first sung word (dated from when the words began, so the first segment may start part-filled) each segment fills with the clock, but completes only once its check has run (holding at 92% until then), and the next starts only after that: progress is the clock or the work, whichever is behind. The early stretches are the longest, so the ring gathers pace toward the end. Found: the caption says "Found it.", the remaining segments fill one after another 60ms apart, and the gaps close into one unbroken ring (0.48s in all); it holds 0.18s, and only then (CLOSE_MS, 0.66s after the answer, by the user's request) does the slide come up, the ring fading over 0.45s as the button docks. A press during the close is ignored. Twins: the first five stay drawn in Ray Orange and a second five fill over them in Saffron toward 20 s (checks at 12, 14, 16, 18). False start: the segments drain and the ring fades. Drawn per frame from the session's clock and checks, eased (exponential, rate 12; 20 while closing), never by CSS transitions. The hint follows the checks: "Heard singing.", "Narrowing it down.", then "Almost there." from the third.
- **One object, four places:** on the start page the button is page content, placed in the hero's slot so it scrolls, tabs and swipes with the page (inline). When listening starts it lifts into a fixed layer painted exactly over the slot (lifting), then glides to dead centre over 0.95s (floating) while the page fades out. When a bhajan is found it glides at once to the bottom centre and scales to 0.46 (docked), out of the middle before the lyrics fill it; its caption fades out. While docked, a label beneath it says what pressing it does now, "Tap for the next bhajan" (16px, 500, Navy Ink; clicking it does the same), fading in at 0.8s as the button settles. Tapped again, it glides back to centre for the next bhajan. Going home scrolls the page to the top and the button glides back onto its slot (landing) before settling into the page. Keyboard focus follows it through every move.

### Caption
- **Style:** Body type in Soft Navy, centred under the button (22px below in the page, 56px below when floating, gliding between the two with the button, never snapping), one short status sentence, fading over 0.3s. It is a live status region.
- **Voice:** plain and short: "Tap when a bhajan begins", "Getting ready…", "Listening for a bhajan…", "Finding the bhajan…", or a one-sentence recovery instruction on failure.
- **Hint:** a second, shorter line in Note type and Quiet Navy: "Waiting for the first line.", then, following the progress ring, "Heard singing.", "Narrowing it down.", "Almost there.", or "Two bhajans start this way. Waiting for the next line."

### Top Bar and Search Pill
- **Bar:** sticky, the 44px emblem and the bold wordmark (10px apart) on the left; on the right the search pill and a full-screen corner circle, 10px apart. Transparent at rest; Bar edge and denser cream glass once scrolled, over 0.3s.
- **Search pill:** a 40px Shade pill with a 17px search icon, "Search bhajans" in Soft Navy 15px / 500, and a small `/` keycap; hover goes to Shade Deeper with Navy Ink text. Below 640px it is an icon-only 40px circle. Disabled (catalog loading) at 60% opacity.

### Keycap
- **Style:** Keycap Cream face, 1px border in 18% navy with a 2px bottom edge, 7px corners, 24px tall (22px in the pill), Key type. Used in the search pill and the shortcuts line (Space, /, F).

### Preview Screen
A real bhajan ("Kamala Nayana Narayana"), set by the same slide component, inside a cream screen at 16:10 (1:1 below 640px) with 20px corners and the Screen lift. The slide scales to the screen by container units (6% inset; title clamp(12px, 3.4cqw, 44px); meaning clamp(9px, 1.5cqw, 19px)) and never wraps. It arrives line by line the first time 35% of it scrolls into view. The slide is hidden from assistive tech; the figure's label names the bhajan.

### Bhajan Slide (signature)
The identified bhajan, laid out as the centres lay out their slides. It is an article; the title is the page's heading.
- **Title:** Headline type in Brand Blue, centred, the pitch in parentheses after the name, over a 2px Saffron rule. Rises out of a blur at 0ms, before the first line.
- **Lyrics:** Display type, left-aligned, sized by the Largest That Fits rule, one sung line per row. Each line rises 0.4em and sharpens out of a 14px blur over 1.05s on Arrive; the first line starts at 260ms and each later line 90ms after the one before. Lines arrive once, then nothing moves. Repeat counts and singer cues sit inline after the line in the Note variant.
- **Meaning:** Meaning type, italic, Soft Navy, over the closing 2px Saffron rule. It rises the same way, 120ms after the last lyric line.
- **Leaving:** the whole slide fades and blurs 10px over 0.38s on Arrive while the button glides back to centre (or home).

### Choice Pills
- **Style:** Shade fill, Navy Ink Label type, 999px pill, 11px 20px padding, stacked 8px apart, centred under the caption. A Quiet Navy line beneath tells apart two bhajans with the same title.
- **State:** hover deepens to Shade Deeper over 0.2s. Shown only when the app gives up and has runners-up.

### Corner Buttons
- **Style:** 40px Shade circles holding a 20px line icon in Soft Navy: home (back to the start page; shown whenever the app is off the start page and not listening), search, more (only once a bhajan is shown) and full screen.
- **State:** hover deepens to Shade Deeper with the glyph going to Navy Ink. The row is hidden on the start page.

### Volunteer Panel
- **Style:** a Cream Glass sheet, 22px corners, Glass float, anchored bottom-right above the corner buttons. It pops in from 10px lower at 0.97 scale over 0.4s on the glide curve, from its bottom-right origin.
- **Rows:** full-width transparent rows in Label type with 12px corners; hover fills them with Shade. A heading "Not this bhajan?" in Soft Navy, notes in Quiet Navy, and a "What it heard" disclosure with timings in tabular numerals.

### Search Sheet
- **Style:** a Spotlight-style Cream Glass sheet, 22px corners, Glass float, centred at 12vh over a Shade Deeper scrim; it pops in like the panel. One field in Body type with a 22px Quiet Navy search icon; results below a 1px divider.
- **Results:** rows in Label type with 12px corners; the pitch follows the title in Quiet Navy, and the matched (or distinguishing) lyric line sits beneath in Note type, truncated. The active row fills with Shade Deeper; arrow keys move it, Enter chooses, Escape or a click outside closes. Opens from the search pill, the search corner circle, `/` or ⌘K / Ctrl K.

### Motion
- **Glide** (`cubic-bezier(0.32, 0.72, 0, 1)`): iOS-like, no overshoot. For things that move: the button's glides and dock, hover and press, the panel and sheet pop, the start page settling away (scale 0.985).
- **Arrive** (`cubic-bezier(0.16, 1, 0.3, 1)`): exponential ease-out. For things that appear: the page headline and lede (rising at 0 and 0.12s), the slide's title, lines and meaning, rings, fills, the caption, the download arc, the slide leaving.
- **Reduced motion:** the big movements become crossfades. The button jumps between places without gliding; the start page fades without scaling; rings and bars stop, leaving one static ring at 50% opacity and 1.35x as the listening sign; the headline, lede, title, lyric lines and meaning fade in over 0.5s without rise or blur; the slide leaves with a plain fade.

### Named Rules
**The One Button Rule.** There is one listen button, and it travels: page slot, centre, dock, and back. It is never duplicated: the start page has no second listen control.

**The Words First Rule.** When a bhajan is found, the progress ring closes first (0.66s, so the answer reads as the end of the wait, by the user's request); then the button leaves the middle at once while the title rises and the first lyric line follows at 260ms. The room's eye goes to the words, not to the control.

**The No Snap Rule.** Nothing on the button starts or stops mid-motion. The rings run at one steady rhythm inside a layer that fades in and out; hearing fades them out, never changes their timing; the bars start from rest and ease back to it. A snapping button reads as jitter.

**The Still While Singing Rule.** Motion happens only at the change from one bhajan to the next. Once the meaning has arrived, nothing on screen moves.

## Do's and Don'ts

### Do:
- **Do** keep every surface Slide Cream (`#fdf8e8`), with Navy Ink (`#0e2a4d`) type, Brand Blue (`#0c5098`) titles and Saffron (`#ee7900`) rules, and keep the system light only.
- **Do** use the Sri Sathya Sai Global Council, U.S.A. general emblem, at 44px or more, in the top bar and footer.
- **Do** open the start page with one of Swami's photos (`src/assets/swami/`) in the arched, ray-orange frame.
- **Do** lay out every found bhajan as the slide: bold centred title with "(ladies / gents)" pitch over a 2px rule, left-aligned lyrics, italic meaning over a closing 2px rule.
- **Do** set lyrics at 400, at the largest size that fits between the rules, one sung line per row, wrapping only below the 40px / 26px floor.
- **Do** keep the slide inside its side margins (clamp(20px, 5.5vw, 120px)) and above the dock band, so the docked button never sits on the words.
- **Do** keep the listen button on the start page's first screen, under the photo and one statement.
- **Do** write start-page headings at 700 with tight tracking (-0.025em to -0.03em).
- **Do** keep start-page copy minimal: say what is happening, once, in plain words.
- **Do** make every secondary control a translucent blue Shade circle or pill, deepening to Shade Deeper on hover.
- **Do** use a 2px Brand Blue outline, 4px out, as the focus ring on every control.
- **Do** use Glide for movement and Arrive for appearance; let the lyrics arrive before the docked button moves, and the meaning after the last line.
- **Do** keep listening rings inside the space between the button and its caption; they must be invisible by the time they reach the text.
- **Do** swap every large movement for a crossfade under reduced motion.

### Don't:
- **Don't** use the 100th or 99th birthday logos, or recolour, crop or caption the emblem.
- **Don't** add a dark theme, a white ground, gradients, glows or tinted bands.
- **Don't** set any text in Saffron or Ray Orange; they are for the button, rules, rings and the photo frame.
- **Don't** bold or centre the lyrics; weight and centring belong to the title.
- **Don't** use Hairline for text, or set any text below Quiet Navy.
- **Don't** add vertical rules, boxes, cards or header bars around the slide; its two horizontal rules are its only lines.
- **Don't** put cards, tinted bands or boxed panels on the start page.
- **Don't** use solid saffron for anything but the round listen button.
- **Don't** add explainer steps, feature blurbs or a second call to listen to the start page.
- **Don't** show the start page's bar, photo, sections or explanations once listening starts.
- **Don't** fill the listening rings or the download ring.
- **Don't** add overshoot to movement; the glide is a critically damped curve and arrivals ease out exponentially.
- **Don't** animate anything while the bhajan is being sung.
- **Don't** shrink lyrics to a fixed small size to fit a long bhajan before trying one-row fitting, then wrapping.
- **Don't** use photos with text overlays, signatures or heavy edits, or invent imagery; only the user's supplied photos of Swami.
