import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// ponytail: module-level singleton so whichever script (layout or a
// section) runs first creates it and everyone else reuses the same instance
export function getSmoother() {
  return (
    ScrollSmoother.get() ??
    ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.2,
      effects: true,
    })
  );
}
