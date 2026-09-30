interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const NAV_BUTTON =
  "flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]";

// Até 5 números em volta da página atual, sempre dentro do intervalo válido.
function pageWindow(page: number, totalPages: number) {
  const size = Math.min(5, totalPages);
  const end = Math.min(totalPages, Math.max(page + 2, size));
  const start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  return (
    <nav aria-label="Paginação" className="flex items-center gap-2">
      <button
        type="button"
        className={NAV_BUTTON}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Anterior
      </button>

      {/* No celular os números somem e ficam só Anterior/Próxima. */}
      <div className="hidden items-center gap-1 sm:flex">
        {pageWindow(page, totalPages).map((number) => (
          <button
            key={number}
            type="button"
            onClick={() => onPageChange(number)}
            aria-current={number === page ? "page" : undefined}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
              number === page
                ? "bg-brand-500 text-white"
                : "text-gray-700 hover:bg-brand-500/[0.08] hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500"
            }`}
          >
            {number}
          </button>
        ))}
      </div>

      <button
        type="button"
        className={NAV_BUTTON}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Próxima
      </button>
    </nav>
  );
}
