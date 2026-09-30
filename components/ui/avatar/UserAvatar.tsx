import type { User } from "@/lib/types";

interface UserAvatarProps {
  user: Pick<User, "firstName" | "lastName" | "profilePhoto">;
  // Tamanho e tipografia vêm de quem usa (ex.: "size-11 text-sm").
  className?: string;
}

export default function UserAvatar({ user, className = "" }: UserAvatarProps) {
  const fullName = `${user.firstName} ${user.lastName}`;

  if (user.profilePhoto) {
    return (
      <span className={`block shrink-0 overflow-hidden rounded-full ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a foto vem de uma URL arbitrária, fora do remotePatterns do next/image */}
        <img
          src={user.profilePhoto}
          alt={fullName}
          className="size-full object-cover"
        />
      </span>
    );
  }

  // Sem foto: iniciais no estilo do AvatarText do tema.
  return (
    <span
      role="img"
      aria-label={fullName}
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-medium text-brand-500 dark:bg-brand-500/15 dark:text-brand-400 ${className}`}
    >
      {user.firstName.charAt(0).toUpperCase()}
      {user.lastName.charAt(0).toUpperCase()}
    </span>
  );
}
