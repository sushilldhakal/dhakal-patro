import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import "./i18n/index";
import { initAnalytics } from "./lib/analytics";
import App from "./App";

initAnalytics();

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root not found");
}

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Only hydrate when the served HTML was prerendered for this exact URL. When a
// path has no prerendered file the server falls back to another route's HTML
// (already swapped for the boot loader by the inline script in index.html), and
// in dev there is no prerender at all — render from scratch in both cases.
const normalize = (p: string) => p.replace(/\/+$/, "") || "/";
const ssrPath = root.getAttribute("data-ssr-path");

if (ssrPath && normalize(ssrPath) === normalize(window.location.pathname)) {
  hydrateRoot(root, app);
} else {
  root.innerHTML = "";
  createRoot(root).render(app);
}
