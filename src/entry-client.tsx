import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import "./index.css";
import "./i18n/index";
import { initAnalytics } from "./lib/analytics";
import App from "./App";

initAnalytics();

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root not found");
}

hydrateRoot(
  root,
  <StrictMode>
    <App />
  </StrictMode>,
);
