// ponytail: ported from the React Bits TextType component to plain DOM/timers
// since this project has no React dependency — same typing/deleting loop,
// with *word* markers rendered in the surname's serif font.

interface Segment {
  text: string;
  emphasis: boolean;
}

interface TextTypeOptions {
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

function parsePhrase(phrase: string): Segment[] {
  return phrase
    .split(/\*(.+?)\*/g)
    .map((text, i) => ({ text, emphasis: i % 2 === 1 }));
}

function renderChars(segments: Segment[], count: number): string {
  let remaining = count;
  let html = "";
  for (const seg of segments) {
    if (remaining <= 0) break;
    const slice = seg.text.slice(0, remaining);
    html += seg.emphasis ? `<em class="hero__type-em">${slice}</em>` : slice;
    remaining -= seg.text.length;
  }
  return html;
}

export function startTextType(
  el: HTMLElement,
  phrases: string[],
  { typingSpeed = 45, deletingSpeed = 20, pauseDuration = 2200 }: TextTypeOptions = {},
) {
  const parsed = phrases.map(parsePhrase);
  const lengths = parsed.map((segs) => segs.reduce((n, s) => n + s.text.length, 0));

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.innerHTML = renderChars(parsed[0], lengths[0]);
    return;
  }

  const content = document.createElement("span");
  const cursor = document.createElement("span");
  cursor.className = "hero__type-cursor";
  cursor.textContent = "|";
  el.append(content, cursor);

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    content.innerHTML = renderChars(parsed[phraseIndex], charIndex);

    if (!deleting && charIndex < lengths[phraseIndex]) {
      charIndex++;
      setTimeout(tick, typingSpeed);
    } else if (!deleting) {
      deleting = true;
      setTimeout(tick, pauseDuration);
    } else if (charIndex > 0) {
      charIndex--;
      setTimeout(tick, deletingSpeed);
    } else {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % parsed.length;
      setTimeout(tick, 300);
    }
  };

  tick();
}
