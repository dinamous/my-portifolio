import "./SectionProgress.css";

// barra de progresso de uma seção da pilha. Só marca o alvo — quem escreve scaleX/origin
// é o driver do sectionStack, então dá pra pendurar em qualquer lugar (link da navbar,
// dentro da própria seção) sem duplicar assinatura de evento nem a fórmula.
// `className` fica por conta do consumidor, que é quem sabe onde ela se posiciona.
export default function SectionProgress({
  section,
  className = "",
}: {
  section: string;
  className?: string;
}) {
  return (
    <span
      className={`section-progress ${className}`}
      data-section-progress={section}
      aria-hidden="true"
    />
  );
}
