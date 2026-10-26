// The main thread's handle on the speech-model worker.
//
// The worker is created once, when the page opens, and starts downloading the
// model straight away so it is ready before anyone presses the button.
// transformers.js keeps the files in the browser's Cache Storage, so after the
// first visit the model loads from the device rather than the network.

import type { Reference } from "../match/catalog.ts";
import type {
  AsrMessage,
  AsrProgress,
  AsrReady,
  AsrRequest,
  AsrResult,
} from "../asr/asr.worker.ts";

export class AsrClient {
  private readonly worker: Worker;
  private nextId = 1;
  private readonly pending = new Map<
    number,
    { resolve: (r: AsrResult) => void; reject: (e: Error) => void }
  >();
  readonly ready: Promise<AsrReady>;

  constructor(onProgress: (progress: AsrProgress) => void) {
    this.worker = new Worker(new URL("../asr/asr.worker.ts", import.meta.url), {
      type: "module",
    });

    let resolveReady!: (r: AsrReady) => void;
    let rejectReady!: (e: Error) => void;
    this.ready = new Promise((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });

    this.worker.onmessage = (event: MessageEvent<AsrMessage>) => {
      const message = event.data;
      if (message.type === "progress") onProgress(message);
      else if (message.type === "ready") resolveReady(message);
      else if (message.type === "result") {
        this.pending.get(message.id)?.resolve(message);
        this.pending.delete(message.id);
      } else if (message.type === "error") {
        const error = new Error(message.message);
        if (message.id === undefined) rejectReady(error);
        else {
          this.pending.get(message.id)?.reject(error);
          this.pending.delete(message.id);
        }
      }
    };
    this.worker.onerror = (event) => {
      const error = new Error(event.message || "the speech model could not start");
      rejectReady(error);
      for (const { reject } of this.pending.values()) reject(error);
      this.pending.clear();
    };

    this.post({ type: "load", device: "auto" });
  }

  /** The catalog, so each result also carries every bhajan scored by sound. */
  setReferences(refs: Reference[]): void {
    this.post({ type: "refs", refs });
  }

  /** score: false skips scoring every bhajan by sound, when only words matter. */
  async transcribe(samples: Float32Array, { score = true } = {}): Promise<AsrResult> {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.post({ type: "transcribe", id, samples, score }, [samples.buffer as ArrayBuffer]);
    });
  }

  private post(request: AsrRequest, transfer: Transferable[] = []): void {
    this.worker.postMessage(request, transfer);
  }
}
