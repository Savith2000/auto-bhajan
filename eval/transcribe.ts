// Offline accuracy test, step 1 of 2: what does the model hear?
//
// Plays recordings through the same steps the browser takes: find the first
// sung words the way the app does (something loud by the OnsetDetector, then
// the model's first words after it, see words.ts), then transcribe everything
// since them at each checkpoint (3, 5, 7, 9 s, 10 s, and the twin checks to 20 s). Every transcript is stored, because
// inference is the slow part; eval/score.ts replays the matching against the
// cache in seconds, so the rules can be tuned without re-running the model.
//
//   node eval/transcribe.ts [count=60] [--set name]
//
// Audio comes from eval/recordings/<slug>.(mp3|m4a|wav|...) (or
// eval/recordings/<name>/ with --set name) if that folder has
// any files, e.g. your own recordings named after the bhajan's slug. Otherwise
// it samples the catalog's own recordings from the API.
//
// Uses the same ONNX export (int8, CPU) and the same CTC decoding as the app.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

import { AutoModelForCTC, AutoProcessor, env } from "@huggingface/transformers";

import { argmaxIds, decodeLogits, MODEL_ID, vocabFrom } from "../src/asr/ctc.ts";
import { ONSET, OnsetDetector } from "../src/listen/onset.ts";
import { firstWordFrame, frameSample, WORDS } from "../src/listen/words.ts";
import { NO_SINGING_SECONDS } from "../src/listen/session.ts";
import type { Bhajan } from "../src/match/catalog.ts";
import { RULES } from "../src/match/identify.ts";

const ROOT = join(import.meta.dirname, "..");
const AUDIO = join(ROOT, "eval", "audio");
const setArg = process.argv.indexOf("--set");
const set = setArg > 0 ? process.argv[setArg + 1] : "";
const LOCAL = join(ROOT, "eval", "recordings", set);
const OUT = join(ROOT, "eval", "transcripts", set);
const RATE = 16_000;
const FRAME = 1024; // what the capture worklet delivers
const TIMES = [...RULES.checkpoints, RULES.decideAfter, ...RULES.twinCheckpoints, RULES.twinDecideAfter];
/** Enough audio for the latest possible onset plus the last check. */
const DECODE_SECONDS = NO_SINGING_SECONDS + Math.max(...TIMES) + 1;

export type Check = {
  at: number;
  text: string;
  ms: number;
  /** Raw logits, [frames × vocab] float32, base64; what rankBySound needs. */
  logits: string;
  frames: number;
};
export type Transcript = {
  slug: string;
  source: string;
  /** The model's vocabulary and blank, to rebuild the sound classes. */
  tokens: string[];
  blankId: number;
  /** Seconds into the recording where singing was detected, or null. */
  onsetSeconds: number | null;
  checks: Check[];
};

const count = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)) ?? 60);
const catalog: Bhajan[] = JSON.parse(readFileSync(join(ROOT, "public", "catalog.json"), "utf8"));
const bySlug = new Map(catalog.map((b) => [b.slug, b]));

const local = existsSync(LOCAL)
  ? readdirSync(LOCAL).filter((f) => !f.startsWith(".") && extname(f)).map((f) => ({ slug: f.slice(0, -extname(f).length), source: join(LOCAL, f) }))
  : [];
for (const { slug } of local) if (!bySlug.has(slug)) console.log(`warning: ${slug} is not a catalog slug`);

let sample: { slug: string; source: string }[];
if (local.length) {
  sample = local.filter((l) => bySlug.has(l.slug));
  console.log(`testing ${sample.length} recordings from eval/recordings/`);
} else {
  // An even spread through the catalog, so the sample is not all one deity or
  // one end of the alphabet, and the same bhajans every run.
  const eligible = catalog
    .filter((b) => b.devanagari.trim())
    .map((b) => ({ slug: b.slug, source: firstRecording(b.slug) }))
    .filter((e): e is { slug: string; source: string } => e.source !== null)
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const stride = Math.max(1, Math.floor(eligible.length / count));
  sample = eligible.filter((_, i) => i % stride === 0).slice(0, count);
  console.log(`${eligible.length} bhajans with Devanagari and a recording; testing ${sample.length}`);
}

mkdirSync(AUDIO, { recursive: true });
mkdirSync(OUT, { recursive: true });

env.allowLocalModels = false;
const processor = await AutoProcessor.from_pretrained(MODEL_ID);
const model = await AutoModelForCTC.from_pretrained(MODEL_ID, { dtype: "q8", device: "cpu" });
const base = `${env.remoteHost}${env.remotePathTemplate.replace("{model}", MODEL_ID).replace("{revision}", "main")}`.replace(/\/$/, "");
const vocab = vocabFrom(
  await (await fetch(`${base}/vocab.json`)).json(),
  await (await fetch(`${base}/tokenizer_config.json`)).json(),
);

for (const [n, { slug, source }] of sample.entries()) {
  const outPath = join(OUT, `${slug}.json`);
  if (existsSync(outPath)) continue;
  const tag = `[${n + 1}/${sample.length}]`;

  let audio: Float32Array;
  try {
    audio = await load(slug, source);
  } catch (error) {
    console.log(`${tag} skipped ${slug}: ${(error as Error).message.split("\n")[0]}`);
    continue;
  }

  // Something loud, by the same detector and frame size as the browser...
  const detector = new OnsetDetector();
  let onset: number | null = null;
  let loud: number | null = null;
  for (let i = 0; i + FRAME <= audio.length && loud === null; i += FRAME) {
    loud = detector.push(rms(audio.subarray(i, i + FRAME)), FRAME);
  }
  // ...then the same looks for words as the browser, every 1.5 s after it.
  for (let heard = (loud ?? Infinity) + WORDS.everySamples; heard <= audio.length && onset === null; heard += WORDS.everySamples) {
    const length = Math.min(heard - loud!, WORDS.windowSamples);
    const { logits } = await model(await processor(audio.subarray(heard - length, heard)));
    const [, frames, vocabSize] = logits.dims as [number, number, number];
    const frame = firstWordFrame(argmaxIds(logits.data as Float32Array, frames, vocabSize), vocab);
    if (frame !== null) onset = Math.max(loud!, frameSample(heard - length, length, frames, frame) - ONSET.prerollSamples);
  }

  const checks: Check[] = [];
  if (onset !== null) {
    for (const at of TIMES) {
      const window = audio.subarray(onset, onset + ONSET.prerollSamples + at * RATE);
      const started = performance.now();
      const inputs = await processor(window);
      const { logits } = await model(inputs);
      const [, frames, vocabSize] = logits.dims as [number, number, number];
      const data = logits.data as Float32Array;
      const text = decodeLogits(data, frames, vocabSize, vocab);
      checks.push({
        at,
        text,
        ms: Math.round(performance.now() - started),
        logits: Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString("base64"),
        frames,
      });
    }
  }

  const transcript: Transcript = {
    slug,
    source,
    tokens: vocab.tokens,
    blankId: vocab.blankId,
    onsetSeconds: onset === null ? null : onset / RATE,
    checks,
  };
  writeFileSync(outPath, JSON.stringify(transcript, null, 1));
  console.log(
    `${tag} ${bySlug.get(slug)!.title}  onset ${transcript.onsetSeconds?.toFixed(1) ?? "none"}s\n` +
      `    @3s: ${checks[0]?.text ?? "(no singing found)"}`,
  );
}

function firstRecording(slug: string): string | null {
  const path = join(ROOT, "data", "raw", `${slug}.json`);
  if (!existsSync(path)) return null;
  const detail = JSON.parse(readFileSync(path, "utf8"));
  return detail.recordings?.find((r: { audioUrl?: string }) => r.audioUrl)?.audioUrl ?? null;
}

/** The start of a recording (local path or URL) as 16 kHz mono float32, via ffmpeg. */
async function load(slug: string, source: string): Promise<Float32Array> {
  const pcm = join(AUDIO, `${slug}.f32`);
  if (!existsSync(pcm) || source.startsWith("/")) {
    let input = source;
    if (/^https?:/.test(source)) {
      // Downloaded by Node rather than handed to ffmpeg as a URL: ffmpeg's TLS
      // build fails the handshake with the recordings host.
      input = join(AUDIO, `${slug}.mp3`);
      const response = await fetch(source);
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${source}`);
      writeFileSync(input, Buffer.from(await response.arrayBuffer()));
    }
    execFileSync("ffmpeg", [
      "-v", "error", "-y", "-i", input,
      "-t", String(DECODE_SECONDS), "-ac", "1", "-ar", String(RATE), "-f", "f32le", pcm,
    ]);
  }
  const bytes = readFileSync(pcm);
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

function rms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}
