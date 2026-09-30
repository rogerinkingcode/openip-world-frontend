interface LogoProps {
  // Só o símbolo, para a sidebar recolhida.
  iconOnly?: boolean;
  size?: "md" | "lg";
  // "light" força texto branco (painel azul da tela de login).
  tone?: "auto" | "light";
}

// Marca do OpenIP World no formato do logo do tema: quadrado brand-500 com
// cantos de 8.4px e o nome ao lado. O texto é HTML (não path de SVG) para herdar
// a Outfit e trocar de cor com o tema sem precisar de dois arquivos.
export default function Logo({
  iconOnly = false,
  size = "md",
  tone = "auto",
}: LogoProps) {
  const isLarge = size === "lg";

  return (
    <span className={`inline-flex items-center ${isLarge ? "gap-4" : "gap-3"}`}>
      <LogoMark size={isLarge ? 48 : 32} />
      {iconOnly ? (
        <span className="sr-only">OpenIP World</span>
      ) : (
        <span
          className={`font-semibold leading-none tracking-tight whitespace-nowrap ${
            isLarge ? "text-[32px]" : "text-[22px]"
          } ${tone === "light" ? "text-white" : "text-gray-900 dark:text-white"}`}
        >
          OpenIP World
        </span>
      )}
    </span>
  );
}

function LogoMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="8.42" fill="#465FFF" />
      <circle cx="16" cy="16" r="8.25" stroke="white" strokeWidth="1.75" />
      <ellipse
        cx="16"
        cy="16"
        rx="3.5"
        ry="8.25"
        stroke="white"
        strokeOpacity="0.9"
        strokeWidth="1.5"
      />
      <path
        d="M7.75 16H24.25"
        stroke="white"
        strokeOpacity="0.7"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
