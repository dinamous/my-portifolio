// shared by any heading that reveals itself letter-by-letter (Hero, WhatIDo,
// Projects, Contact) — emits `${prefix}__letter-wrap` / `${prefix}__letter`
// spans so each section's own CSS/GSAP selectors keep working unchanged
export default function AnimatedLetters({ text, prefix }: { text: string; prefix: string }) {
  return (
    <>
      {text.split("").map((ch, i) => (
        <span className={`${prefix}__letter-wrap`} key={i}>
          {/* nbsp so a bare space char doesn't collapse away between the letter spans */}
          <span className={`${prefix}__letter`}>{ch === " " ? " " : ch}</span>
        </span>
      ))}
    </>
  );
}
