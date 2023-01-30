import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    plugins: [react()],
    server: {
      port: 39105,
      proxy: {
        "/api": {
          target: "http://localhost:3000/",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    resolve: {
      alias: {
        // For some reason octokit's usage of node-fetch doesn't play nice with vite
        //
        // So polyfill with axios which works
        "node-fetch": "axios",
        src: resolve(__dirname, "src"),
      },
    },
  };
});
