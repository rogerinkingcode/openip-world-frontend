import type { User } from "@/lib/types";
import UserAvatar from "../ui/avatar/UserAvatar";
import Badge from "../ui/badge/Badge";
import Skeleton from "../ui/skeleton/Skeleton";

const CARD_CLASS =
  "p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6";

export default function UserMetaCard({ user }: { user: User }) {
  return (
    <div className={CARD_CLASS}>
      <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
        <UserAvatar
          user={user}
          className="w-20 h-20 text-2xl border border-gray-200 dark:border-gray-800"
        />
        <div className="order-3 xl:order-2">
          <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
            {user.firstName} {user.lastName}
          </h4>
          <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.role}
            </p>
            <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
            <p className="text-sm text-gray-500 break-all dark:text-gray-400">
              {user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
          <Badge color={user.isBlocked ? "error" : "success"}>
            {user.isBlocked ? "Bloqueado" : "Ativo"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// Mesma estrutura do card real, com blocos no lugar de cada dado.
export function UserMetaCardSkeleton() {
  return (
    <div className={CARD_CLASS}>
      <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="order-3 flex flex-col items-center xl:order-2 xl:items-start">
          <div className="mb-2 flex h-7 items-center">
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex flex-col items-center gap-1 xl:flex-row xl:gap-3">
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-16" />
            </div>
            <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-44" />
            </div>
          </div>
        </div>
        <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}
