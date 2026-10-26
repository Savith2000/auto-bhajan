# autobhajan

Press **Start listening**, sing the opening of a bhajan, and the page shows its
title and lyrics. Then it stops listening.

Everything runs in the browser. The speech model is voice-seva's
`Savith/vak-san-onnx` (wav2vec2, Sanskrit, Devanagari output). It downloads
once when the page first opens and is cached on the device after that. Audio
never leaves the device, and there is no login and no backend.

## How it works

```
mic → wait for something loud → every 1.5 s, ask the model for words (music
    doesn't count) → at 3 s after the first words: transcribe everything since them
    → normalise → compare with the opening of all ~1,000 bhajans
    → clear winner? show lyrics, stop listening
    → two still close? wait 2 s more and check again (5, 7, 9 s)
    → still close at 10 s? show whichever is on top, unless the runner-up
      opens with the same line (a twin): then keep listening every 2 s
      until line 2 is heard, 20 s at most
```

As in voice-seva, this is a **matching** problem, not a transcription problem.
Every bhajan is scored two ways, and the two scores are added:

- **By words:** the model's best-guess Devanagari is compared with each bhajan's
  Devanagari by edit distance, after both are normalised (vowel length, nasals,
  sibilants, aspiration and viramas ignored).
- **By sound:** each bhajan's opening is force-aligned (CTC Viterbi) against
  the model's full per-frame probabilities (`src/match/ctc-score.ts`), so a
  sound the model was unsure about still counts for the bhajan that needs it.
  On singing, where the best-guess transcript is often garbled, this is what
  finds the right bhajan first.

Because the clip starts at the first sung word, both compare it with the
**opening** of each bhajan rather than anywhere inside it, both as written and
as sung (every line twice, leader then group).

A check is **clear** when the best bhajan leads the next-best different bhajan
by 2 standard deviations of the catalog's combined scores. If no check is clear, the app checks once
more at 10 s and shows whichever bhajan ranks first; the runners-up are in the
matching details. The exception is **twins**, bhajans that share a first line
and only differ from line 2 ("Manasa Bhajare Guru Charanam" is catalogued
twice). At 10 s the group is usually still repeating line 1, so the top pick
between twins is a coin toss. If the runner-up is a twin over everything sung
so far, the app keeps listening, checks every 2 s, and answers once about a
second of the line that tells them apart has been heard (20 s at most).
Wherever two bhajans share a title, lists and search show the line that tells
them apart. The timings and
thresholds are `RULES` in `src/match/identify.ts`, and the singing detector's
settings are `ONSET` in `src/listen/onset.ts` and `WORDS` in `src/listen/words.ts`.

The countdown starts on the first **words**, not the first loud sound. A loud
sound (often the harmonium or tabla introduction) only wakes the listener; from
then on the model is asked every 1.5 s whether the last 4 s hold words, and
singing starts where it first writes 4 or more letters. On instruments it
writes nothing, so a musical introduction never starts the countdown (measured
on synthetic harmonium and tabla: `eval/recordings/music/` has clips with a
4–13 s introduction under the singing). Talking near the mic does count.

**Only a real match is ever shown.** Every check ranks every bhajan, so
something always comes first, even for music or talking. On test audio that was
no bhajan at all (`eval/recordings/notbhajan/`, spoken Hindi and English), that
leader never stood more than 4.1 standard deviations above the catalog; real
matches almost always stand 5 or more. So a leader under 5 (`RULES.minMatch`)
is never shown. If nothing reaches it by 10 s, the "words" were a false start
(an instrument the model half-heard as syllables, or talking): the app forgets
them and goes back to waiting for words, until it gives up at 45 s.

## Setup

```bash
npm install
npm run catalog     # needs .env credentials; writes public/catalog.json
npm run dev         # http://localhost:5173
```

`public/catalog.json` is built from the Sai Tunes API at build time, so the
client secret never reaches the browser. The same step gives the 26 English
bhajans, which have no Devanagari in the catalog, a Devanagari spelling of how
they *sound* (`scripts/english-devanagari.ts`). English words take their
pronunciation from CMUdict; Indian words in them (Sai, Ram, Baba) take the
spelling the catalog's own Devanagari uses. After that the Sanskrit speech
model matches them like any other bhajan. Rerun `npm run catalog` when bhajans
are added. The API allows 60 requests a minute, so a full refresh takes about
20 minutes. Details are cached in `data/raw/`; pass `--refresh` to refetch them.

## Code map

| | |
|---|---|
| `src/App.tsx` | the three states (start page, listening, slide) and the one listen button that moves between them |
| `src/ui/Home.tsx` | the start page: what AutoBhajan does, the cycle, an example slide, privacy, session tips |
| `src/ui/Lyrics.tsx` | the bhajan slide, fitted to the screen (also the start page's example) |
| `src/listen/session.ts` | one listening attempt: wait for singing → checkpoints → stop |
| `src/listen/onset.ts` | notices when something loud starts (singing or music), against the room's background noise |
| `src/listen/words.ts` | decides when singing has actually started: where the model first writes words |
| `src/match/identify.ts` | `rank()` (by words), `rankBySound()`, `combine()`; `isClear()` and `RULES` decide |
| `src/match/ctc-score.ts` | scoring by sound: model tokens → sound classes, prefix forced alignment |
| `src/match/catalog.ts` | builds the matchable text for each bhajan |
| `src/match/normalize.ts` | voice-seva's normaliser, unchanged |
| `src/match/romanized.ts` | rough Devanagari for the 26 bhajans that have only romanised lyrics |
| `src/match/search.ts` | typed search: phonetic folding of romanised text, plus a Devanagari sound match |
| `src/match/english.ts` | English lyrics → Devanagari by sound (used by `scripts/english-devanagari.ts`) |
| `src/asr/` | the model worker (from voice-seva) and CTC decoding |
| `src/audio/`, `public/worklets/` | mic capture at 16 kHz (from voice-seva) |
| `saitunes/` | Python API client and CLI (`python3 -m saitunes --help`) |

**Search:** the magnifier in the bottom-right corner (or `/`, or ⌘K) opens a
Spotlight-style search over titles and lyrics. It runs in the browser over the
downloaded catalog and forgives spelling variants ("Gowinda", "Shyaama"). A
bhajan chosen there replaces whatever is on screen, and stops any listening.

The **Matching details** panel under each result shows what the model heard
and the top candidates with their scores. Use it to see why a match went wrong.

## Measuring accuracy

```bash
node eval/openings.ts          # how alike are bhajan openings? (no audio needed)
node eval/transcribe.ts 60     # run recordings through onset + checkpoints (cached)
node eval/score.ts             # replay those through the matcher: right / wrong / choices
node eval/score.ts --text      # the same, ranking by words only, for comparison
```

To test with your own recordings, put them in `eval/recordings/`, named by
bhajan slug (e.g. `eval/recordings/prem-se-bolo-ek-baar-sai-ram.m4a`), then run
the two eval commands. Without that folder, `eval/transcribe.ts` falls back to
the API's recordings, which currently cannot be downloaded. Every recording URL in the API
points at `sai-beats-bhajan-recordings.<id>.r2.dev`, which fails the TLS
handshake.
