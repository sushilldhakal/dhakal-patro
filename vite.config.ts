import { defineConfig, loadEnv, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

function injectGaSnippet(measurementId: string | undefined): Plugin {
  return {
    name: "inject-ga-snippet",
    transformIndexHtml(html) {
      if (!measurementId) {
        return html.replace(/\s*<!-- @ga-snippet -->\s*/, "\n")
      }

      const snippet = `<!-- Google tag (gtag.js) — deferred after idle -->
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      (function () {
        var id = "${measurementId}";
        function loadGtag() {
          var s = document.createElement("script");
          s.async = true;
          s.src = "https://www.googletagmanager.com/gtag/js?id=" + id;
          s.onload = function () {
            gtag("js", new Date());
            gtag("config", id, { send_page_view: false });
            window.dispatchEvent(new Event("gtag-ready"));
          };
          document.head.appendChild(s);
        }
        if ("requestIdleCallback" in window) {
          requestIdleCallback(loadGtag, { timeout: 3000 });
        } else {
          window.addEventListener("load", loadGtag, { once: true });
        }
      })();
    </script>`

      return html.replace("<!-- @ga-snippet -->", snippet)
    },
  }
}

/** Load built CSS without blocking first paint (boot loader uses inline styles). */
function asyncCss(): Plugin {
  return {
    name: "async-css",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return html.replace(
          /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
          '<link rel="preload" href="$1" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">\n    <noscript><link rel="stylesheet" href="$1"></noscript>',
        )
      },
    },
  }
}

export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const gaId = env.VITE_GA_MEASUREMENT_ID

  return {
    base: "/",
    plugins: [react(), tailwindcss(), ...(isSsrBuild ? [] : [injectGaSnippet(gaId), asyncCss()])],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    ssr: {
      noExternal: [
        "@tanstack/react-router",
        "@tanstack/react-query",
        "@tanstack/history",
        "react-i18next",
        "i18next",
      ],
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
            if (!id.includes("node_modules")) return

            if (id.includes("@tanstack/react-table")) return "table"
            if (id.includes("react-day-picker") || id.includes("date-fns")) {
              return "calendar-picker"
            }
            if (id.includes("@tanstack/react-router")) return "router"
            if (id.includes("@tanstack/react-query")) return "query"
            if (id.includes("lucide-react")) return "icons"
            if (
              id.includes("@base-ui") ||
              id.includes("radix-ui") ||
              id.includes("class-variance-authority") ||
              id.includes("clsx") ||
              id.includes("tailwind-merge")
            ) {
              return "ui"
            }
            if (id.includes("react-dom") || id.includes("/react/")) return "react"
          },
        },
      },
    },
  }
})
