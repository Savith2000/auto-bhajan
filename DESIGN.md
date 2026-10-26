---
name: AutoBhajan
description: A start page that explains itself around one charcoal button; the bhajan arrives as the slide the centre already projects, cream page, charcoal words, grey rules, readable from the back of the hall.
colors:
  ink: "#333333"
  ink-deep: "#262626"
  ground: "#fdf8e8"
  ink-2: "#4d4d4d"
  ink-3: "#5c5c5c"
  rule: "#9e9e9e"
  hairline: "rgba(51, 51, 51, 0.12)"
  fill: "rgba(51, 51, 51, 0.07)"
  fill-hover: "rgba(51, 51, 51, 0.13)"
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
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"SF Pro Text\", \"Helvetica Neue\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  copy:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"SF Pro Text\", \"Helvetica Neue\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
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
  section-gap: "clamp(96px, 15vh, 168px)"
  section-gap-narrow: "72px"
  slide-top: "clamp(16px, 3vh, 40px)"
components:
  button-listen:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.full}"
    size: "{spacing.button}"
  button-listen-hover:
    backgroundColor: "{colors.ink-deep}"
    textColor: "{colors.ground}"
  button-listen-disabled:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.full}"
    size: "{spacing.button}"
  button-listen-pill:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: "52px"
    padding: "0 26px 0 22px"
  button-listen-pill-hover:
    backgroundColor: "{colors.ink-deep}"
  button-listen-pill-disabled:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink-3}"
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
  text-button:
    textColor: "{colors.ink}"
    typography: "{typography.copy}"
  preview-screen:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.screen}"
  slide-title:
    textColor: "{colors.ink}"
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

**Creative North Star: "The Centre's Slide"**

AutoBhajan puts up the slide the Sai centre already projects, by the user's explicit choice, from a reference slide they shared: a warm cream page, charcoal type and grey rules. The bhajan's name and its pitch sit bold and centred over a rule, the romanised lyrics are left-aligned below in regular weight, and the English meaning closes the slide in italics over a second rule. The room already knows how to read this layout. The same cream, charcoal and grey carry the whole app, start page included, again by the user's choice. Around the slide the app is Apple canon: a start page in the voice of an Apple product page (tight 700 headlines, soft-charcoal ledes, generous air), one round charcoal button that listens, Shazam-style rings, lines that rise out of a blur as in Apple Music's lyrics view, and motion that glides and never bounces. It is executed straight, with no concept world, texture or ornament, and no colour beyond the slide's own.

There are two densities. The start page explains itself: a sticky bar with the wordmark and search, a headline and one-sentence lede, the listen button near the middle of the first screen with its caption, the three-step cycle over a 2px rule, and on scroll a real bhajan set in a screen, the privacy fact, how it behaves when unsure, session tips with keyboard shortcuts, and a closing call to listen. The moment listening starts, the page clears and the screen holds only what the room needs this second: the button and its grey rings, then the slide with the button docked small beneath it. Everything the volunteer might need beyond that (home, search, other matches, what was heard, full screen) sits in quiet shaded circles in the bottom-right corner. The slide's scale is set for a projector read from the back of a hall by an audience that skews older.

The system is light only (`color-scheme: light`, theme colour cream). Charcoal on cream holds about 11.9:1, so the words stay strong on a washed-out projector.

**Key Characteristics:**
- Warm cream page, charcoal type, grey 2px rules, everywhere; no other hue.
- The slide: bold centred title with pitch over a rule, left-aligned regular-weight lyrics, italic meaning over a closing rule.
- Lyrics sized to fill the space between the rules, one sung line per row.
- Solid charcoal belongs to the listen action only: the round button, and the start page's closing pill that does the same thing.
- One system type stack (SF Pro on Apple devices); page headlines are 700 and tightly tracked, the sung words are 400.
- The button is one object that sits in the page, lifts out, glides to the middle, docks under the slide and lands back.
- Glide and exponential ease-out motion; nothing overshoots, nothing moves while people sing.

## Colors

The slide's palette and nothing else: cream ground, charcoal inks in three strengths, one grey for rules and rings, a charcoal hairline for quiet dividers, and translucent charcoal shades for secondary controls.

### Primary
- **Charcoal** (`ink`): every word that matters (headlines, the slide title, each lyric line, panel rows, choice labels, keycap letters) and the face of the listen action, which carries its waveform glyph in cream. Its hover and pressed depth is **Deep Charcoal** (`ink-deep`), on the round button and the closing pill only.

### Neutral
- **Slide Cream** (`ground`): the page itself, the slide, and the preview screen's face. Warm and slightly yellow, as the centres' slides are. Not white.
- **Soft Charcoal** (`ink-2`): ledes and body copy on the start page, the English meaning, the caption under the button, the search pill's label, corner glyphs at rest, the panel heading and timings. About 8.0:1 on the ground.
- **Quiet Charcoal** (`ink-3`): step numbers, figure captions, the footer, shortcut labels, lyric cues and repeat counts, panel notes, search pitches and matched lines, the disabled button's glyph, the download ring's progress, and the listening rings once singing is heard. About 6.3:1 on the ground; never lower for text.
- **Rule Grey** (`rule`): every 2px rule (the slide's two, the cycle's, the facts', the tips' and the shortcuts' top edges), the listening rings' outline, and the text button's underline at rest. At about 2.5:1 it is a line colour, never a text colour.
- **Hairline** (`hairline`): 1px dividers between rows (tips, shortcuts), the footer's top edge, the scrolled bar's bottom edge, the preview screen's edge, and the download ring's track.
- **Shade** (`fill`) and **Shade Deeper** (`fill-hover`): the translucent charcoal fill of every secondary control (search pill, corner circles, choices, the disabled listen action) and its hover; Shade Deeper is also the search scrim and the active search row.
- **Cream Glass** (`glass`): the volunteer panel and the search sheet, always with a 30px backdrop blur and 1.3 saturation. The scrolled top bar uses a denser cream glass (0.92, 20px blur, 1.4 saturation).
- **Keycap Cream** (`keycap`): the face of keyboard keycaps only, a touch lighter than the page so a key reads as a key.

### Named Rules
**The Slide Palette Rule.** Cream, charcoal and grey only, on every surface, the start page included. No accent hue, no gradient wash, no glow, no tinted band.

**The One Action Solid Rule.** Solid charcoal is reserved for the listen action: the round button, and the start page's closing "Start listening" pill, which does the same thing. They never share a viewport. Everything else is type, a rule, a hairline, a 7% shade or cream glass.

**The Grey Is A Line Rule.** Rule Grey and Hairline draw lines, ring outlines and underlines only. Text starts at Quiet Charcoal.

## Typography

**Display Font:** SF Pro via the system stack (`-apple-system`, `BlinkMacSystemFont`, "SF Pro Display"), falling back to Helvetica Neue, Segoe UI, system-ui
**Body Font:** the same stack
**Label/Mono Font:** none; tabular numerals (`font-variant-numeric: tabular-nums`) for step numbers and timings

**Character:** One family doing every job, as Apple's interfaces do. The start page speaks like an Apple product page: big, heavy, tightly tracked statements over soft-charcoal ledes. The slide is set the way the centres set theirs: a bold centred heading, plain regular lyrics, an italic gloss. Hierarchy comes from weight, size, position and the rules rather than colour.

### Hierarchy
- **Page Display** (700, clamp(36px, min(6vw, 8.2vh), 84px), line-height 1.04, -0.03em, Charcoal, balanced): the start page's one h1, "Sing the first line. / The words appear." The height term keeps it from pushing the button below the fold on short screens.
- **Page Headline** (700, clamp(32px, 4vw, 56px), line-height 1.08, -0.025em, balanced): section headings on the start page and the privacy lead fact. The closing "Ready for the next bhajan." is one step larger (clamp(36px, 4.6vw, 64px), 1.05, -0.03em).
- **Page Lede** (400, clamp(18px, 1.55vw, 23px), line-height 1.42, Soft Charcoal, max 34em): the sentence under the h1. Section ledes are the same voice slightly smaller (clamp(18px, 1.45vw, 21px), line-height 1.5, max 38em).
- **Title** (650, 22px, line-height 1.25, -0.015em): the 2-up fact headings. Cycle step headings are 19px / 600 / -0.015em, each under a 15px / 600 Quiet Charcoal tabular step number.
- **Copy** (400, 16px, line-height 1.55, Soft Charcoal): fact text and shortcut descriptions. Cycle text is 15px / 1.45; session tips are 18px / 1.5 in Charcoal.
- **Display** (400, fit-to-stage between 18px and 110px, line-height 1.24, -0.005em, Charcoal): the lyrics, left-aligned. The size is computed per bhajan by bisection to the largest at which the whole block fits the stage, capped at 20% of stage height, 7.5% of stage width and 110px. Lines sit 0.18em apart; a verse break is 0.5em.
- **Headline** (700, clamp(26px, 3.3vw, 64px), line-height 1.15, -0.01em, Charcoal): the bhajan title, centred, balanced, followed by its pitch in parentheses, ladies first then gents ("(6 P / 2 P)"). The pitch never splits across lines.
- **Meaning** (400 italic, clamp(15px, 1.35vw, 26px), line-height 1.4, Soft Charcoal): the English meaning at the foot of the slide, left-aligned, at most 120ch wide.
- **Body** (500, 18px, line-height 1.35, -0.01em, Soft Charcoal): the caption under the button ("Tap when a bhajan begins", "Getting ready · 42%", "Listening for a bhajan…"), max width min(84vw, 560px); also the search field.
- **Label** (600, 17px, -0.01em): choice pills, panel rows, search results, the closing pill. The search pill is 15px / 500; the wordmark is 19px / 700 / -0.02em.
- **Note** (400, 14px, line-height 1.4, Quiet Charcoal): the caption's hint line, panel notes, figure captions, search lines. The footer is 13px. Inline lyric notes (repeat counts "×5", cues "· repeat Gana Lola") are a relative variant: 0.5em of the lyric size, 500, no tracking, Quiet Charcoal, never wrapping.
- **Key** (600, 13px, line-height 1, Charcoal): keycap letters; 12px in Soft Charcoal inside the search pill.

### Named Rules
**The Page Voice Rule.** Start-page statements are 700 with tight tracking (-0.025em to -0.03em) and balanced wrapping, each followed by a regular-weight lede in Soft Charcoal. The slide never borrows that tracking: its title is -0.01em and its lyrics -0.005em.

**The One Line, One Row Rule.** Every sung line sits on a single row so singers see where a line ends. Wrapping is a last resort: only when the one-row fit would fall below 40px (26px on stages under 640px wide) do long lines wrap, at line-height 1.1 with a 0.5em gap between sung lines. The start page's example never wraps.

**The Largest That Fits Rule.** Lyric size is never a fixed step on a scale; it is the largest size at which the whole bhajan fits between the title rule and the meaning. Only outliers that overflow even at 18px with wrapping scroll, inside the stage, fading out at the bottom edge.

**The Slide Weights Rule.** On the slide the title is 700, the sung words 400, the meaning 400 italic in Soft Charcoal. The lyrics are never bold.

## Layout

The app is a fixed full-viewport stage. Only the start page scrolls, inside its own layer; listening and the slide never scroll the page.

- **Start page column:** content sits in `page`, at most 1120px wide inside the shared `margin`. The sticky top bar (64px, 56px below 640px) aligns its wordmark and actions to the same column; it is transparent at the top and turns to cream glass with a hairline bottom edge once the page scrolls past 8px.
- **First screen (hero):** at least the viewport height minus the bar, a centred column: headline and lede, a gap of clamp(28px, 5.5vh, 60px), the listen button in its 132px slot with its caption 22px below, a 64px space held for the caption, then the cycle (three columns, at most 980px, clamp(20px, 4vw, 56px) apart, over a 2px rule) and a "More about AutoBhajan" cue that scrolls smoothly to the next section.
- **Below the fold:** sections stack in the page column, `section-gap` apart (72px below 640px): the example slide (a centred copy block at most 760px, then the screen), the facts (privacy lead fact at full width and centred, then two facts side by side, each under a 2px rule), the session block (tips and shortcuts in a 1.25 : 1 grid), the closing call (large vertical padding, centred), and a footer over a hairline.
- **Listening:** the page fades away and the button stands alone at dead centre on the empty cream page. The caption sits 56px below the button's bottom edge; fallback choices stack 108px below it.
- **Found, the slide:** an inset panel, `slide-top` from the top, `margin` from each side, and `dock-band` (dock-gap + 56px) from the bottom, so the words never run under the docked button. It is a three-row grid: the title (with its rule), the lyrics stage (taking all remaining height), and the meaning (with its closing rule). The title's rule sits clamp(12px, 2vh, 28px) below the title text; the lyrics stage starts clamp(12px, 2.4vh, 32px) below that rule; the meaning has clamp(10px, 2vh, 24px) above and below it. The rules span the slide's full width; the closing rule is drawn even when a bhajan has no meaning.
- **Found, the button:** bottom centre, `dock-gap` above the viewport bottom, scaled to 0.46 (about 60px), with "Tap for the next bhajan" centred 10px beneath it. Below 640px there is no room for that beside the corner controls, so the docked button moves to the slide's left margin and its label sits beside it (12px to its right, wrapping to two lines at most 7em wide).
- **Volunteer corner:** a row of 40px circles, 10px apart, 20px from the bottom-right corner (14px below 640px), hidden on the start page, whose bar carries search and full screen instead. The panel opens above them, 72px from the bottom, right-aligned, at most 320px wide. The search sheet hangs 12vh from the top, centred.
- **Spacing rhythm:** 8, 10, 12, 16 and 20px inside controls and sheets; the page's and slide's own spacing is fluid (clamps of vh and vw) so it holds on a projector, a laptop and a phone; lyric spacing is in em so it scales with the fitted size.
- **Breakpoints:** 860px collapses the facts and the session grid to one column. 640px shrinks the button (112px) and dock gap (64px), shortens the bar, collapses the search pill to an icon-only 40px circle, stacks the cycle in one column (18px apart), squares the preview screen (1:1), shortens the section gap and pulls in the corner inset. The slide's own wrap floor drops separately when the lyrics stage is under 640px wide.

### Named Rules
**The Button Keeps The Middle Rule.** On the start page's first screen the listen button sits near the middle, between the statement above it and the cycle below; the explanation frames the tool and never pushes it below the fold.

**The Nothing Else Rule.** Once listening starts, and in the found state, the screen shows only the button (and its rings), the slide (title, rule, words, meaning, rule) and the corner circles. No header bar, no list, no progress bar. The start page is the only place with a bar, sections or explanation.

**The Slide Order Rule.** Title and pitch, rule, lyrics, meaning, rule: always in that order, always inside the slide's margins. The lyrics take whatever height the title and meaning leave.

**The Rules Divide Rule.** On the start page, sections and groups open on a 2px Rule Grey rule and rows within them are split by 1px hairlines. No cards, boxes or tinted bands; the preview screen is the one framed object, because it depicts a screen.

## Elevation & Depth

Depth is mostly flat: charcoal type and grey rules printed on cream, with the slide casting nothing. A few objects lift, all with warm brown shadows (rgba(51, 40, 20, …)) that belong to the cream rather than grey ones: the listen action (circle and closing pill), the cream-glass sheets (panel and search), and the preview screen, which reads as a device showing the slide. Keycaps get their depth from a heavier bottom border, not a shadow. Rings are flat outlines with no fill.

### Shadow Vocabulary
- **Button lift** (`box-shadow: 0 22px 50px -20px rgba(51, 40, 20, 0.45), 0 2px 6px rgba(51, 40, 20, 0.18)`): the round listen button. Removed when disabled.
- **Pill lift** (`box-shadow: 0 16px 36px -18px rgba(51, 40, 20, 0.45)`): the closing "Start listening" pill. Removed when disabled.
- **Glass float** (`box-shadow: 0 28px 70px -24px rgba(51, 40, 20, 0.45), inset 0 0 0 1px rgba(51, 51, 51, 0.1)`): the volunteer panel and the search sheet, with `backdrop-filter: blur(30px) saturate(1.3)`.
- **Screen lift** (`box-shadow: 0 50px 100px -48px rgba(51, 40, 20, 0.5), 0 2px 8px rgba(51, 40, 20, 0.08), 0 0 0 1px rgba(51, 51, 51, 0.12)`): the start page's preview screen only.
- **Bar edge** (`box-shadow: inset 0 -1px 0 rgba(51, 51, 51, 0.12)`): the top bar once scrolled, with a cream glass of 0.92 and `backdrop-filter: blur(20px) saturate(1.4)`.
- **Ring outline** (`box-shadow: inset 0 0 0 2px #9e9e9e`, `#5c5c5c` once singing is heard): the listening rings, over a transparent background.

### Named Rules
**The Lifted Few Rule.** Only the listen action, the glass sheets and the preview screen cast shadows. The slide, every rule, pills, corner circles, facts and tips are flat.

**The Outline Ring Rule.** Listening rings and the download ring are 2px outlines only, never filled.

## Shapes

The form language is the circle and the horizontal rule. The listen button, its rings, the download ring, the corner buttons, the search pill and the choices and closing pill are all fully round (circles or 999px pills). Lines are horizontal only: 2px Rule Grey rules that open the slide's parts and the start page's groups, and 1px hairlines between rows; there are no vertical rules. Rounded rectangles are few and concentric in spirit: the glass sheets (22px corners) with their rows (12px), the preview screen (20px, 14px below 640px), and keycaps (7px). Icons are drawn on a 24px grid with round caps and joins at a 1.75 stroke (search, more, expand, collapse, home, chevron); the listen waveform is drawn heavier (2.4 stroke, 58px) so it stays legible when docked at under half size, and at 20px / 2.2 inside the closing pill.

## Components

### Listen Button (signature)
The whole product in one object: a charcoal circle that listens.
- **Shape:** a full circle, 132px (112px below 640px).
- **Face:** Charcoal with the five-bar waveform glyph in cream, plus the Button lift shadow.
- **Hover / Active:** grows to 1.04 on a 0.5s glide and deepens to Deep Charcoal over 0.4s; presses to 0.95 in 0.15s. Focus shows a 2px Charcoal outline 4px out, as every control does.
- **Getting ready (model or catalog still loading):** a Shade face with a Quiet Charcoal glyph, no shadow, default cursor. On the first visit a 2.4px download ring sits 12px outside it: a Hairline track with a Quiet Charcoal arc, round-capped, starting at twelve o'clock and filling clockwise on a 0.6s Arrive as the model downloads. The caption reads "Getting ready · 42%" with the hint "The speech model downloads on your first visit, then loads from this device."
- **Listening:** three Rule Grey outline rings ripple out, 1s apart, from 90% opacity to 1.85x over 3s, gone by 70% of their cycle so they never reach the caption. They sit in one layer at 70% that fades in over 0.5s. The button itself does not scale while listening.
- **Hearing singing:** the ring layer strengthens to 100% and the rings darken to Quiet Charcoal over 0.6s, at the same rhythm, and the waveform's bars move (scaleY 1 to 0.45, 0.9s, offset per bar), starting from their resting height. When it stops, the layer fades out and the bars ease back to rest over 0.4s.
- **One object, four places:** on the start page the button is page content, placed in the hero's slot so it scrolls, tabs and swipes with the page (inline). When listening starts it lifts into a fixed layer painted exactly over the slot (lifting), then glides to dead centre over 0.95s (floating) while the page fades out. When a bhajan is found it glides at once to the bottom centre and scales to 0.46 (docked), out of the middle before the lyrics fill it; its caption fades out. While docked, a label beneath it says what pressing it does now, "Tap for the next bhajan" (16px, 500, Charcoal; clicking it does the same), fading in at 0.8s as the button settles. Tapped again, it glides back to centre for the next bhajan. Going home scrolls the page to the top and the button glides back onto its slot (landing) before settling into the page. Keyboard focus follows it through every move.

### Caption
- **Style:** Body type in Soft Charcoal, centred under the button (22px below in the page, 56px below when floating, gliding between the two with the button, never snapping), one short status sentence, fading over 0.3s. It is a live status region.
- **Voice:** plain and short: "Tap when a bhajan begins", "Getting ready…", "Listening for a bhajan…", "Hearing singing…", "Is it one of these?", or a one-sentence recovery instruction on failure.
- **Hint:** a second line in Note type and Quiet Charcoal says what the app is waiting for, e.g. "Waiting for the first line to be sung."

### Start Listening Pill
The same action as the round button, at the foot of the start page, so it is the same charcoal.
- **Style:** a 52px Charcoal pill (padding 0 26px 0 22px) with a 20px cream waveform and Label text "Start listening", 10px apart, plus the Pill lift.
- **States:** hover deepens to Deep Charcoal over 0.2s; press scales to 0.97 in 0.15s; disabled is a Shade pill in Quiet Charcoal reading "Getting ready…", no shadow.

### Top Bar and Search Pill
- **Bar:** sticky, the bold wordmark on the left; on the right the search pill and a full-screen corner circle, 10px apart. Transparent at rest; Bar edge and denser cream glass once scrolled, over 0.3s.
- **Search pill:** a 40px Shade pill with a 17px search icon, "Search bhajans" in Soft Charcoal 15px / 500, and a small `/` keycap; hover goes to Shade Deeper with Charcoal text. Below 640px it is an icon-only 40px circle. Disabled (catalog loading) at 60% opacity.

### Keycap
- **Style:** Keycap Cream face, 1px border in 18% charcoal with a 2px bottom edge, 7px corners, 24px tall (22px in the pill), Key type. Used in the search pill and the shortcuts list (Space, /, ⌘K or Ctrl K, F, Esc).

### Cycle
- **Style:** three steps over a 2px Rule Grey rule, left-aligned in columns: a Quiet Charcoal tabular step number, a 19px / 600 heading, a 15px Soft Charcoal sentence. It fades in 0.3s after the headline on page load. One column below 640px.

### Facts, Tips and Shortcuts
- **Facts:** the privacy lead fact is centred at full width in Page Headline and section-lede type with no rule; the other two sit side by side, each under a 2px rule, Title heading and Copy text.
- **Text button:** an inline Charcoal 16px / 600 action with a 1.5px Rule Grey underline 4px below, turning Charcoal on hover.
- **Tips and shortcuts:** lists under a 2px rule with hairline row dividers; tips are 18px Charcoal, shortcuts pair keycaps (left) with a right-aligned Soft Charcoal description.

### Preview Screen
A real bhajan ("Kamala Nayana Narayana"), set by the same slide component, inside a cream screen at 16:10 (1:1 below 640px) with 20px corners and the Screen lift. The slide scales to the screen by container units (6% inset; title clamp(12px, 3.4cqw, 44px); meaning clamp(9px, 1.5cqw, 19px)) and never wraps. It arrives line by line the first time 35% of it scrolls into view. A Quiet Charcoal figure caption names it. It is hidden from assistive tech; the caption carries it.

### Bhajan Slide (signature)
The identified bhajan, laid out as the centres lay out their slides. It is an article; the title is the page's heading.
- **Title:** Headline type, centred, the pitch in parentheses after the name, over a 2px Rule Grey rule. Rises out of a blur at 0ms, before the first line.
- **Lyrics:** Display type, left-aligned, sized by the Largest That Fits rule, one sung line per row. Each line rises 0.4em and sharpens out of a 14px blur over 1.05s on Arrive; the first line starts at 260ms and each later line 90ms after the one before. Lines arrive once, then nothing moves. Repeat counts and singer cues sit inline after the line in the Note variant.
- **Meaning:** Meaning type, italic, Soft Charcoal, over the closing 2px rule. It rises the same way, 120ms after the last lyric line.
- **Leaving:** the whole slide fades and blurs 10px over 0.38s on Arrive while the button glides back to centre (or home).

### Choice Pills
- **Style:** Shade fill, Charcoal Label type, 999px pill, 11px 20px padding, stacked 8px apart, centred under the caption. A Quiet Charcoal line beneath tells apart two bhajans with the same title.
- **State:** hover deepens to Shade Deeper over 0.2s. Shown only when the app gives up and has runners-up.

### Corner Buttons
- **Style:** 40px Shade circles holding a 20px line icon in Soft Charcoal: home (back to the start page; shown whenever the app is off the start page and not listening), search, more (only once a bhajan is shown) and full screen.
- **State:** hover deepens to Shade Deeper with the glyph going to Charcoal. The row is hidden on the start page.

### Volunteer Panel
- **Style:** a Cream Glass sheet, 22px corners, Glass float, anchored bottom-right above the corner buttons. It pops in from 10px lower at 0.97 scale over 0.4s on the glide curve, from its bottom-right origin.
- **Rows:** full-width transparent rows in Label type with 12px corners; hover fills them with Shade. A heading "Not this bhajan?" in Soft Charcoal, notes in Quiet Charcoal, and a "What it heard" disclosure with timings in tabular numerals.

### Search Sheet
- **Style:** a Spotlight-style Cream Glass sheet, 22px corners, Glass float, centred at 12vh over a Shade Deeper scrim; it pops in like the panel. One field in Body type with a 22px Quiet Charcoal search icon; results below a 1px divider.
- **Results:** rows in Label type with 12px corners; the pitch follows the title in Quiet Charcoal, and the matched (or distinguishing) lyric line sits beneath in Note type, truncated. The active row fills with Shade Deeper; arrow keys move it, Enter chooses, Escape or a click outside closes. Opens from the search pill, the search corner circle, `/` or ⌘K / Ctrl K.

### Motion
- **Glide** (`cubic-bezier(0.32, 0.72, 0, 1)`): iOS-like, no overshoot. For things that move: the button's glides and dock, hover and press, the panel and sheet pop, the start page settling away (scale 0.985).
- **Arrive** (`cubic-bezier(0.16, 1, 0.3, 1)`): exponential ease-out. For things that appear: the page headline and lede (rising at 0 and 0.12s), the cycle (fading at 0.3s), the slide's title, lines and meaning, rings, fills, the caption, the download arc, the slide leaving.
- **Reduced motion:** the big movements become crossfades. The button jumps between places without gliding; the start page fades without scaling; rings and bars stop, leaving one static ring at 50% opacity and 1.35x as the listening sign; the headline, lede, title, lyric lines and meaning fade in over 0.5s without rise or blur; the slide leaves with a plain fade.

### Named Rules
**The One Button Rule.** There is one listen button, and it travels: page slot, centre, dock, and back. It is never duplicated as a second circle; the closing pill is a pill.

**The Words First Rule.** When a bhajan is found, the button leaves the middle at once (no delay: a waiting button read as lag) while the title rises and the first lyric line follows at 260ms. The room's eye goes to the words, not to the control.

**The No Snap Rule.** Nothing on the button starts or stops mid-motion. The rings run at one steady rhythm inside a layer that fades in and out; hearing changes their colour and strength, never their timing; the bars start from rest and ease back to it. A snapping button reads as jitter.

**The Still While Singing Rule.** Motion happens only at the change from one bhajan to the next. Once the meaning has arrived, nothing on screen moves.

## Do's and Don'ts

### Do:
- **Do** keep every surface, start page included, Slide Cream (`#fdf8e8`) with Charcoal (`#333333`) type and Rule Grey (`#9e9e9e`) rules, and keep the system light only.
- **Do** lay out every found bhajan as the slide: bold centred title with "(ladies / gents)" pitch over a 2px rule, left-aligned lyrics, italic meaning over a closing 2px rule.
- **Do** set lyrics at 400, at the largest size that fits between the rules, one sung line per row, wrapping only below the 40px / 26px floor.
- **Do** keep the slide inside its side margins (clamp(20px, 5.5vw, 120px)) and above the dock band, so the docked button never sits on the words.
- **Do** keep the listen button near the middle of the start page's first screen, framed by one statement above and the cycle below.
- **Do** write start-page headings at 700 with tight tracking (-0.025em to -0.03em), each followed by a regular-weight Soft Charcoal lede.
- **Do** open start-page groups with a 2px Rule Grey rule and split rows with 1px hairlines.
- **Do** make every secondary control a translucent charcoal Shade circle or pill, deepening to Shade Deeper on hover.
- **Do** use a 2px Charcoal outline, 4px out, as the focus ring on every control.
- **Do** use Glide for movement and Arrive for appearance; let the lyrics arrive before the docked button moves, and the meaning after the last line.
- **Do** keep listening rings inside the space between the button and its caption; they must be invisible by the time they reach the text.
- **Do** swap every large movement for a crossfade under reduced motion.

### Don't:
- **Don't** add a dark theme, a white or tinted ground, or any accent hue; the Sai Samathee blue, saffron and ray orange, the blue glow and the saffron warmth are retired.
- **Don't** colour any word: titles and lyrics are Charcoal, ledes and the meaning Soft Charcoal.
- **Don't** bold or centre the lyrics; weight and centring belong to the title.
- **Don't** use Rule Grey or Hairline for text, or set any text below Quiet Charcoal.
- **Don't** add vertical rules, boxes, cards or header bars around the slide; its two horizontal rules are its only lines.
- **Don't** put cards, tinted bands or boxed panels on the start page; groups are divided by rules alone.
- **Don't** use solid charcoal for anything but the listen action, and never show the round button and the closing pill in the same viewport.
- **Don't** show the start page's bar, sections or explanations once listening starts.
- **Don't** fill the listening rings or the download ring.
- **Don't** add overshoot to movement; the glide is a critically damped curve and arrivals ease out exponentially.
- **Don't** animate anything while the bhajan is being sung.
- **Don't** shrink lyrics to a fixed small size to fit a long bhajan before trying one-row fitting, then wrapping.
- **Don't** put logos, ornament, texture, illustration or invented imagery on the page; the only picture is a real bhajan set by the slide itself.
