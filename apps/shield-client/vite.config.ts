import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: "127.0.0.1",
  },
  optimizeDeps: {
    exclude: ["axios.js"],
  },
  resolve: {
    alias: {
      "@types": "/src/types",
      "@store": "/src/store",
      "@themes": "/src/themes",
      "@screens": "/src/screens",
      "@constants": "/src/constants",
      "@components": "/src/components",
      "@api": "/src/api",
      "@helpers": "/src/helpers",
      "@assets": "/src/assets",
      "@contexts": "/src/contexts",
    },
  },
});
