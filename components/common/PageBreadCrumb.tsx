import Link from "next/link";
import { BreadcrumbArrowIcon } from "@/icons";

interface BreadcrumbProps {
  pageTitle: string;
}

export default function PageBreadcrumb({ pageTitle }: BreadcrumbProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
        {pageTitle}
      </h2>
      <nav aria-label="Trilha de navegação">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
              href="/"
            >
              Início
              <BreadcrumbArrowIcon />
            </Link>
          </li>
          <li
            aria-current="page"
            className="text-sm text-gray-800 dark:text-white/90"
          >
            {pageTitle}
          </li>
        </ol>
      </nav>
    </div>
  );
}
