import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const dashboardRoot = __dirname;

export default defineConfig({
  root: dashboardRoot,
  publicDir: "public",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 4173
  },
  preview: {
    host: "127.0.0.1",
    port: 4174
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
