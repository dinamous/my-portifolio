/// <reference types="vite/client" />

// declarado explicitamente porque `vite/client` tipa qualquer VITE_* como `any`:
// um erro de digitação no nome viraria `undefined` e o analytics ficaria mudo
// pra sempre, sem nada quebrar.
interface ImportMetaEnv {
  readonly VITE_GA_ID?: string;
}
