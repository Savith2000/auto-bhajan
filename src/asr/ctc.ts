// CTC decoding, shared by the browser worker and the offline eval so both turn
// model output into text with exactly the same rules. Lifted from voice-seva's
// asr.worker.ts, where the reasoning for each rule is written out in full.

export type Vocab = { tokens: string[]; blankId: number };

export const MODEL_ID = "Savith/vak-san-onnx";

/** Build the vocabulary from the exported vocab.json and tokenizer_config.json.
 *
 * The blank is the exported pad_token, which voice-seva's export_onnx.py
 * corrected to the token the model actually emits (not the repo's index 1).
 */
export function vocabFrom(
  vocabJson: Record<string, number>,
  tokenizerConfig: { pad_token?: string },
): Vocab {
  const tokens: string[] = [];
  for (const [token, id] of Object.entries(vocabJson)) tokens[id] = token;
  const padToken = tokenizerConfig.pad_token;
  const blankId = padToken === undefined ? -1 : tokens.indexOf(padToken);
  if (blankId < 0) {
    throw new Error(`pad_token ${JSON.stringify(padToken) ?? "(missing)"} is not in vocab.json`);
  }
  return { tokens, blankId };
}

/** Arg-max each frame of [1, frames, vocab] logits, then collapse. */
export function decodeLogits(
  scores: Float32Array,
  frames: number,
  vocabSize: number,
  vocab: Vocab,
): string {
  return decodeCtc(argmaxIds(scores, frames, vocabSize), vocab);
}

/** The most likely token at each frame. */
export function argmaxIds(scores: Float32Array, frames: number, vocabSize: number): number[] {
  const ids = new Array<number>(frames);
  for (let frame = 0; frame < frames; frame++) {
    const offset = frame * vocabSize;
    let best = 0;
    for (let token = 1; token < vocabSize; token++) {
      if (scores[offset + token] > scores[offset + best]) best = token;
    }
    ids[frame] = best;
  }
  return ids;
}

/** Collapse runs of identical tokens FIRST, then drop the blank. Reversing the
 *  order silently merges genuine double letters ("अअ" → "अ"). */
export function decodeCtc(ids: number[], { tokens, blankId }: Vocab): string {
  let out = "";
  for (let i = 0; i < ids.length; i++) {
    if (i > 0 && ids[i] === ids[i - 1]) continue;
    if (ids[i] === blankId) continue;
    out += tokens[ids[i]] ?? "";
  }
  // "|" is this vocabulary's word delimiter.
  return out.replace(/\|/g, " ").replace(/\s+/g, " ").trim();
}
