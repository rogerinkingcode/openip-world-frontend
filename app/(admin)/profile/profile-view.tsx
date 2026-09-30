"use client";

import type { ReactNode } from "react";
import Alert from "@/components/ui/alert/Alert";
import UserInfoCard, {
  UserInfoCardSkeleton,
} from "@/components/user-profile/UserInfoCard";
import UserMetaCard, {
  UserMetaCardSkeleton,
} from "@/components/user-profile/UserMetaCard";
import { useUser } from "@/context/UserContext";

function AccountCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
        Dados da conta
      </h3>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

export default function ProfileView() {
  // O usuário vem do UserProvider do layout, que já o busca para o header.
  const { user, error } = useUser();

  if (error) {
    return (
      <Alert
        variant="error"
        title="Não foi possível carregar o perfil"
        message={error}
      />
    );
  }

  if (!user) return <ProfileSkeleton />;

  return (
    <AccountCard>
      <UserMetaCard user={user} />
      <UserInfoCard user={user} />
    </AccountCard>
  );
}

export function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Carregando perfil">
      <AccountCard>
        <UserMetaCardSkeleton />
        <UserInfoCardSkeleton />
      </AccountCard>
    </div>
  );
}
