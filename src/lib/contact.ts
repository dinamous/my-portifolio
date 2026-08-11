export type SocialLink = { label: string; handle: string; href: string };

// ponytail: hardcoded até virar documento no Sanity — este objeto é o único
// ponto a trocar por um fetch quando o documento `contact` existir lá.
export const contact = {
  email: "dinamous.dev@gmail.com",
  // wa.me aceita só dígitos (DDI + DDD + número); `phoneLabel` é o que a tela mostra
  whatsapp: "5535998901582",
  phoneLabel: "+55 35 99890-1582",
  location: "São Paulo, Brasil",
  availability: "Disponível para novos projetos",
  replyTime: "Respondo em até 24h",
  socials: [
    { label: "LinkedIn", handle: "@dinamous", href: "https://www.linkedin.com/in/dinamous/" },
    { label: "GitHub", handle: "@dinamous", href: "https://github.com/dinamous" },
    { label: "Instagram", handle: "@dinamous.dev", href: "https://www.instagram.com/dinamous.dev" },
  ] as SocialLink[],
};
