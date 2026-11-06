import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Cross-origin isolation, the same headers vercel.json sends in production.
// Without it ONNX Runtime keeps the CPU backend (every iPhone, and any machine
// without WebGPU) to one thread: a 4 s check took 1114 ms instead of 308 ms.
// require-corp rather than credentialless because Safari has only the former;
// everything cross-origin here is a CORS fetch from Hugging Face, which it allows.
const isolation = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

export default defineConfig({
  plugins: [react()],
  server: { headers: isolation },
  preview: { headers: isolation },
  worker: { format: "es" },
  // transformers.js ships its own ONNX Runtime loader; pre-bundling it breaks
  // the dynamic imports that pick a backend.
  optimizeDeps: { exclude: ["@huggingface/transformers"] },
});
