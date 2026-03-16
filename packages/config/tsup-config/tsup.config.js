import { defineConfig } from "tsup";

export default defineConfig({ format: ["esm", "cjs"], sourcemap: true, clean: true, onSuccess: "tsc" });
