interface SkeletonProps {
  className?: string;
}

// Bloco de carregamento. Cada tela monta seu skeleton com as mesmas classes de
// layout do conteúdo real e troca só o dado por este bloco, para que nada pule
// de lugar quando a resposta chega. Para texto, envolva o bloco numa caixa com a
// altura da linha (ex.: h-5 para text-sm) e deixe o bloco um pouco menor.
export default function Skeleton({ className = "" }: SkeletonProps) {
  // Só aplica o raio padrão quando quem chama não escolheu outro; duas classes
  // rounded-* no mesmo elemento dependeriam da ordem do CSS gerado.
  const radius = /(^|\s)rounded/.test(className) ? "" : "rounded-md";

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-gray-200 dark:bg-gray-800 ${radius} ${className}`}
    />
  );
}
