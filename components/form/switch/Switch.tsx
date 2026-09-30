interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

// Chave liga/desliga no visual do tema, controlada pelo pai. Por baixo é um
// checkbox com role="switch": teclado e leitor de tela funcionam sem extra.
export default function Switch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: SwitchProps) {
  return (
    <label
      className={`flex items-start gap-3 select-none ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <span className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={`block h-6 w-11 rounded-full transition duration-150 ease-linear peer-focus-visible:ring-3 peer-focus-visible:ring-brand-500/20 ${
            checked ? "bg-brand-500" : "bg-gray-200 dark:bg-white/10"
          }`}
        />
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-theme-sm transition-transform duration-150 ease-linear ${
            checked ? "translate-x-full" : "translate-x-0"
          }`}
        />
      </span>
      <span>
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-400">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
