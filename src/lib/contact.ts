export type SocialLink = { label: string; handle: string; href: string };

// ponytail: hardcoded até virar documento no Sanity (client já existe em
// [sanity.ts](./sanity.ts), ainda sem schema) — este objeto é o único ponto a
// trocar por um fetch quando o documento `contact` existir lá.
export const contact = {
  email: "dinamous.dev@gmail.com",
  // wa.me aceita só dígitos (DDI + DDD + número); `phoneLabel` é o que a tela mostra
  whatsapp: "5511999999999",
  phoneLabel: "+55 11 99999-9999",
  location: "São Paulo, Brasil",
  availability: "Disponível para novos projetos",
  replyTime: "Respondo em até 24h",
  socials: [
    { label: "LinkedIn", handle: "@matheussimoes", href: "#" },
    { label: "GitHub", handle: "@dinamous", href: "#" },
    { label: "Instagram", handle: "@dinamous", href: "#" },
  ] as SocialLink[],
};
