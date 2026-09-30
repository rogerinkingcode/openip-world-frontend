import type { ReactNode } from "react";
import type { User } from "@/lib/types";
import Skeleton from "../ui/skeleton/Skeleton";

// Os rótulos são fixos, então o skeleton os mostra de verdade e só o valor pisca.
const FIELDS: { label: string; skeletonWidth: string }[] = [
  { label: "Nome", skeletonWidth: "w-24" },
  { label: "Sobrenome", skeletonWidth: "w-28" },
  { label: "E-mail", skeletonWidth: "w-48" },
  { label: "Perfil de acesso", skeletonWidth: "w-16" },
  { label: "Membro desde", skeletonWidth: "w-20" },
  { label: "ID", skeletonWidth: "w-64 max-w-full" },
];

function InfoCardFrame({ children }: { children: ReactNode }) {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
        Informações pessoais
      </h4>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
        {children}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
      {children}
    </p>
  );
}

export default function UserInfoCard({ user }: { user: User }) {
  const values = [
    user.firstName,
    user.lastName,
    user.email,
    user.role,
    new Date(user.createdAt).toLocaleDateString("pt-BR"),
    user.id,
  ];

  return (
    <InfoCardFrame>
      {FIELDS.map((field, index) => (
        <div key={field.label}>
          <FieldLabel>{field.label}</FieldLabel>
          <p
            className={`text-sm font-medium text-gray-800 break-all dark:text-white/90 ${
              field.label === "ID" ? "font-mono" : ""
            }`}
          >
            {values[index]}
          </p>
        </div>
      ))}
    </InfoCardFrame>
  );
}

export function UserInfoCardSkeleton() {
  return (
    <InfoCardFrame>
      {FIELDS.map((field) => (
        <div key={field.label}>
          <FieldLabel>{field.label}</FieldLabel>
          <div className="flex h-5 items-center">
            <Skeleton className={`h-3.5 ${field.skeletonWidth}`} />
          </div>
        </div>
      ))}
    </InfoCardFrame>
  );
}
