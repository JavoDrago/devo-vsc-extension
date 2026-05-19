import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    outDir: path.resolve(__dirname, "out/webview"),
    rollupOptions: {
      input: path.resolve(__dirname, "src/webview/index.html"),
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  root: path.resolve(__dirname, "src/webview"),
  base: "",
});
