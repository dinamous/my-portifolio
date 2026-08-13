// GA4 direto (gtag.js), sem container do GTM: só existe uma tag pra carregar, e
// o container seria mais um request num site que já paga caro em WebGL + GSAP.
const ID = import.meta.env.VITE_GA_ID;

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

// o gtag.js só lê um item da fila como comando quando ele é o objeto `arguments`;
// um array vira mensagem de dados e o comando é descartado em silêncio
const gtag: (...args: unknown[]) => void = function () {
  // eslint-disable-next-line prefer-rest-params -- rest vira array, e array não é comando
  window.dataLayer.push(arguments);
};

let lastPath = "";

// sem VITE_GA_ID (dev, preview, fork) tudo vira no-op: nenhum request e nenhuma
// visita de desenvolvimento suja o relatório
export function initAnalytics() {
  if (!ID) return;
  window.dataLayer = window.dataLayer || [];
  gtag("js", new Date());
  // send_page_view desligado: numa SPA o automático só enxergaria o primeiro load,
  // e aqui ele ainda sairia com o título estático do index.html — todo page_view
  // sai de `pageview`, chamado por quem conhece o título canônico da rota
  gtag("config", ID, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`;
  document.head.appendChild(script);
}

// page_location vem de location.href em vez de parâmetro porque toda troca de rota
// mexe na URL antes de reaplicar o meta — então aqui o href já é o canônico, com a
// query de onde o GA4 tira a atribuição de campanha (utm_*).
// O guarda de pathname evita contar duas vezes quando a mesma rota é reaplicada
// (popstate pro projeto já aberto, por exemplo).
export function pageview(title: string) {
  if (!ID || location.pathname === lastPath) return;
  lastPath = location.pathname;
  gtag("event", "page_view", { page_location: location.href, page_title: title });
}
