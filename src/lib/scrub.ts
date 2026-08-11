import gsap from "gsap";

// escruba um valor 0..1 com lag: o alvo é retargetado num quickTo em vez de escrito
// direto, então o scroll desliza em vez de saltar de notch em notch — mesmo idiom que
// o sectionStack usa no próprio state.value. É este lag que dá à entrada o "glide" da
// Contact; escrubar na mão (gsap.set com o valor cru do evento) acompanha o wheel 1:1.
export function scrubValue(
  onValue: (value: number) => void,
  { duration = 0.6, ease = "power2.out" }: { duration?: number; ease?: string } = {},
) {
  const state = { value: 0 };
  return gsap.quickTo(state, "value", {
    duration,
    ease,
    onUpdate: () => onValue(state.value),
  });
}

// açúcar pra quem já tem uma timeline pausada em vez de escrever prop por prop
export const scrubTimeline = (
  timeline: gsap.core.Timeline,
  opts?: { duration?: number; ease?: string },
) => scrubValue((value) => timeline.progress(value), opts);
