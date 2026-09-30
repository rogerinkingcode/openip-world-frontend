import type React from "react";
import {
  AlertIcon,
  CheckCircleIcon,
  InfoIcon,
} from "@/icons";

type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertProps {
  variant: AlertVariant;
  title: string;
  message: React.ReactNode;
}

const variantClasses: Record<AlertVariant, { container: string; icon: string }> = {
  success: {
    container:
      "border-success-500 bg-success-50 dark:border-success-500/30 dark:bg-success-500/15",
    icon: "text-success-500",
  },
  error: {
    container:
      "border-error-500 bg-error-50 dark:border-error-500/30 dark:bg-error-500/15",
    icon: "text-error-500",
  },
  warning: {
    container:
      "border-warning-500 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/15",
    icon: "text-warning-500",
  },
  info: {
    container:
      "border-blue-light-500 bg-blue-light-50 dark:border-blue-light-500/30 dark:bg-blue-light-500/15",
    icon: "text-blue-light-500",
  },
};

const icons: Record<AlertVariant, React.ReactNode> = {
  success: <CheckCircleIcon />,
  error: <InfoIcon className="rotate-180" />,
  warning: <AlertIcon />,
  info: <InfoIcon />,
};

export default function Alert({ variant, title, message }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-xl border p-4 ${variantClasses[variant].container}`}
    >
      <div className="flex items-start gap-3">
        <div className={`-mt-0.5 ${variantClasses[variant].icon}`}>
          {icons[variant]}
        </div>

        <div>
          <h4 className="mb-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h4>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}
