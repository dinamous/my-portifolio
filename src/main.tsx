import { createRoot } from "react-dom/client";
import App from "./App";
import { initAnalytics } from "./lib/analytics";
import { trackInitialPageview } from "./lib/router";
import "./styles/global.css";

initAnalytics();
trackInitialPageview();

// ponytail: no StrictMode — the section scripts are one-shot imperative GSAP
// timelines ported straight from Astro, not written to survive a double
// mount/unmount/remount cycle. Revisit once they're refactored to cleanup properly.
createRoot(document.getElementById("root")!).render(<App />);
