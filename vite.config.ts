import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  worker: { format: "es" },
  // transformers.js ships its own ONNX Runtime loader; pre-bundling it breaks
  // the dynamic imports that pick a backend.
  optimizeDeps: { exclude: ["@huggingface/transformers"] },
});
