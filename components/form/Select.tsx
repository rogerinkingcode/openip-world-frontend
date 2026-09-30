import type { ComponentProps } from "react";
import { ChevronDownIcon } from "@/icons";

type SelectProps = ComponentProps<"select"> & {
  options: { value: string; label: string }[];
};

// Select nativo no visual do tema. `className` vai no invólucro (largura/margem).
export default function Select({
  options,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
        {...props}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
      />
    </div>
  );
}
