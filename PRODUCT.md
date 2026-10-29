# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**A volunteer** sits at a laptop or tablet during a group bhajan session and runs
the app. They are not leading the singing. When the lead singer begins a new
bhajan, the volunteer presses one button; nothing else is asked of them.

**Everyone in the room** reads the result. Two screens, both real, often at once:

- **A projector or TV in the hall**, read by the whole group from 3 m or more.
- **The laptop or tablet up front**, read from about 1 m by the volunteer and
  nearby singers.

The people reading are singing while they read. They glance up for the next
line; they do not study the screen.

## Product Purpose

Bhajan Cue listens to the first few seconds of a bhajan through the
microphone, works out which of ~1,000 catalogued bhajans it is, and puts that
bhajan's title and lyrics on screen. Then it keeps listening, and when the
next bhajan starts it puts that one up by itself (this can be turned off).

Success is that the room has the right words in front of it within seconds of
the bhajan starting, without anyone searching a book, a binder or a phone.

## Positioning

- **It identifies by listening, not by searching.** Nobody types a title. The
  first sung line is the query.
- **This is a matching problem, not a transcription problem** (inherited from
  Voice Seva). The speech model only has to hear enough to pick the right bhajan
  from a known, finite catalog; its raw transcript is never the product.
- **Everything runs in the browser.** No accounts, no login, and no audio
  leaves the device. The speech model downloads once and is cached.

## Operating Context

- A bhajan session is a sequence: a bhajan is sung, ends, the next begins. The
  app's cycle follows it exactly: press once, then listen, show, and listen for
  the next.
- Bhajans are call and response: the leader sings a line and the group sings it
  back.
- Identification takes about 3 to 10 seconds after the first sung word; most
  bhajans are recognised by 5 seconds.
- The room has harmonium, tabla and many voices; the app hears all of it.

## Capabilities and Constraints

**Confirmed:**

- A start page that says what the app does, by the user's request, once and
  in as few words as possible: Swami's photo, a headline, one sentence and the
  listen button on the first screen; on scroll, a real bhajan
  shown as it appears on screen, the keyboard shortcuts and the source. Search
  is in its top bar. Volunteers can still start in one tap.
- One control while singing: listen. It shows the identified bhajan as a slide in
  the format centres already project: title with pitch (ladies / gents, e.g.
  "6 P / 2 P") centred over a rule, romanised lyrics left-aligned, the English
  meaning in italics at the bottom over a closing rule.
- Catalog: 1,044 bhajans from the Sai Tunes API, mostly Sanskrit/Hindi, 26 in
  English, a few Tamil, Telugu and others. Lyrics run from 2 to about 12 lines.
- It shows a bhajan only when the match clearly stands out from the catalog;
  otherwise it treats what it heard as a false start (music, talking) and
  keeps listening, giving up after 45 seconds. Bhajans that share a first line
  are told apart by waiting for the second. Runners-up stay available.
- Next bhajan automatically, on by default and remembered on the device: once a
  bhajan is up the app keeps listening. When the singing stops for a few
  seconds, or the words stop fitting the bhajan on screen (the next one began
  with no pause), it looks for the next bhajan. It switches the slide only if
  the new opening fits clearly better than any line of the bhajan on screen,
  so a line from the middle never moves it. A missed switch is fine (the
  volunteer taps); a wrong one is not. "Back to" undoes a switch for 20
  seconds. The screen is kept awake while it listens.
- No login, no backend at runtime. First use downloads a ~190 MB speech model.
- Microphone access needs HTTPS or localhost.

**Undecided:**

- Whether lyrics ever appear in Devanagari or other scripts on screen.
- Lighting of the rooms it is used in.

## Brand Commitments

- **Sai community identity, its own look.** The app belongs clearly to the Sri
  Sathya Sai community, but it is not a copy of Voice Seva's visual identity.
- **Apple-style design, by the user's explicit choice.** Minimal, smooth and
  clean, executed straight and at Apple's level of craft: no concept worlds,
  textures or ornament. Apple's own interfaces are the quality bar.
- **The centres' bhajan-slide layout in the Sai organisation's colours, by
  the user's explicit choice (October 2026).** The slide's warm cream page
  (`#FDF8E8`) stays. Everything else follows the Sai centre's look: navy ink
  from the brand blue, brand blue `#0C5098` for titles, saffron `#EE7900` for
  the listen button, the slide's rules and the rings, ray orange `#FBBA74`
  around Swami's photo (values from the Voice Seva brand spec, sampled from
  the emblem). Apple-style restraint around it: one round button, smooth
  motion, and nothing but the slide on screen once a bhajan is up.
- **Name:** Bhajan Cue, chosen by the user (October 2026) to replace
  "AutoBhajan", which they found corny: the words come up on cue, by
  themselves. The repository and deployment keep the old `auto-bhajan` name.
- **Logo:** the Sri Sathya Sai Global Council, U.S.A. general emblem, in the
  top bar and footer. Not the 100th or 99th birthday logos (the user's
  instruction).

## Evidence on Hand

- `public/catalog.json`: every bhajan's title, romanised lyrics, Devanagari and
  English meaning. Real content, usable in any design.
- The user supplied the emblem and photos of Swami (October 2026). The start
  page shows six of them (`src/assets/swami/`), one per visit, chosen for being
  clear, in colour, and free of text overlays and heavy edits. No
  illustration, testimonials or usage figures exist; none may be invented.

## Product Principles

1. **The words are the interface.** Once a bhajan is identified, the lyrics are
   the only thing that matters on screen.
2. **Readable across a hall.** Anything shown must work from the back of the
   room on a projector, not only on the laptop.
3. **One press, then hands off.** The volunteer presses once; after that the app
   follows the session by itself, and a press is only needed when it misses.
   The cycle must be obvious without explanation.
4. **Never pull the room out of the bhajan.** Transitions mark the change from
   one bhajan to the next; they never compete with the singing.

## Accessibility & Inclusion

- Readers are at a distance and mid-song, so text size and contrast must hold up
  on a projector, including washed-out projectors in lit rooms.
- Voice Seva records an audience that skews older, with presbyopia common. That
  is the same community and is assumed here, not separately confirmed.
