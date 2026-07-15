import gsap from "gsap";

// scrubs a paused timeline's progress off a quickTo-smoothed value instead of
// setting .progress() directly, so scroll input glides instead of snapping —
// same lag idiom sectionStack.ts uses for its own state.value
export function scrubTimeline(
  timeline: gsap.core.Timeline,
  { duration = 0.6, ease = "power2.out" }: { duration?: number; ease?: string } = {},
) {
  const state = { value: 0 };
  return gsap.quickTo(state, "value", {
    duration,
    ease,
    onUpdate: () => timeline.progress(state.value),
  });
}
