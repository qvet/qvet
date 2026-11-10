import { resolve } from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const mock = (name: string) => resolve(__dirname, "mocks", `${name}.ts`);

// Serves the real app components with GitHub swapped for an in-memory fake.
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: { port: 20557 },
  resolve: {
    alias: [
      // Must precede the general src alias, which would otherwise match first.
      { find: /^src\/hooks\/useOctokit$/, replacement: mock("useOctokit") },
      { find: /^src\/hooks\/useOwnerRepo$/, replacement: mock("useOwnerRepo") },
      { find: "node-fetch", replacement: "axios" },
      { find: /^src\//, replacement: resolve(__dirname, "../src") + "/" },
    ],
  },
});
