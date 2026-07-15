import { Fragment } from "react";

// word-by-word counterpart to AnimatedLetters, used by WhatIDo's two paragraphs
export default function AnimatedWords({ text, prefix }: { text: string; prefix: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className={`${prefix}__word-wrap`}>
            <span className={`${prefix}__word`}>{word}</span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </>
  );
}
