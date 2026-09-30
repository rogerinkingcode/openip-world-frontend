import type { ReactNode } from "react";

interface LabelProps {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export default function Label({
  htmlFor,
  children,
  className = "mb-1.5",
}: LabelProps) {
  // className substitui a margem padrão (mb-1.5) em vez de somar a ela.
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 dark:text-gray-400 ${className}`}
    >
      {children}
    </label>
  );
}
