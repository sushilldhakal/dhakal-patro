import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // In dev, mirror the production nginx setup: forward "/api/*" to the local
  // FastAPI server with the prefix stripped, so the app is same-origin here too.
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("@tanstack/react-table")) return "table";
          if (id.includes("react-day-picker") || id.includes("date-fns")) {
            return "calendar-picker";
          }
          if (id.includes("@tanstack/react-router")) return "router";
          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("lucide-react")) return "icons";
          if (
            id.includes("@base-ui") ||
            id.includes("radix-ui") ||
            id.includes("class-variance-authority") ||
            id.includes("clsx") ||
            id.includes("tailwind-merge")
          ) {
            return "ui";
          }
          if (id.includes("react-dom") || id.includes("/react/")) return "react";
        },
      },
    },
  },
})