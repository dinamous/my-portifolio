import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global.css";

// ponytail: no StrictMode — the section scripts are one-shot imperative GSAP
// timelines ported straight from Astro, not written to survive a double
// mount/unmount/remount cycle. Revisit once they're refactored to cleanup properly.
createRoot(document.getElementById("root")!).render(<App />);
