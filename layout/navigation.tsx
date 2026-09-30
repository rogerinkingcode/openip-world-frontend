import type { ReactNode } from "react";
import {
  PlugInIcon,
  QueueIcon,
  TableIcon,
  UserCircleIcon,
  UsersIcon,
} from "@/icons";

export type NavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  // Abre em nova aba com <a> comum: o destino não é uma página do Next (ex.: o
  // Bull Board, servido via rewrite).
  external?: boolean;
  // Com subItems o item vira um grupo recolhível (padrão do tema).
  subItems?: { name: string; path: string; new?: boolean }[];
};

export const navItems: NavItem[] = [
  {
    icon: <UserCircleIcon />,
    name: "Perfil",
    path: "/profile",
  },
  {
    icon: <PlugInIcon />,
    name: "Tokens da API",
    path: "/tokens",
  },
];

// Seção visível só para admin. Esconder aqui é só conforto: quem garante o acesso
// é a API, que recusa não-admin mesmo que alguém digite a URL.
export const adminItems: NavItem[] = [
  {
    icon: <TableIcon />,
    name: "Atualizações",
    path: "/updates",
  },
  {
    icon: <PlugInIcon />,
    name: "Endpoints da API",
    path: "/api-docs",
  },
  {
    icon: <UsersIcon />,
    name: "Usuários",
    path: "/users",
  },
  {
    icon: <QueueIcon />,
    name: "Filas",
    path: "/admin/queues",
    external: true,
  },
];

export type SearchItem = {
  name: string;
  description: string;
  path: string;
  icon: ReactNode;
  // Só aparece na busca para admin.
  adminOnly?: boolean;
};

// O que a busca do header encontra: as páginas do menu e as seções que valem
// um atalho direto.
export const searchItems: SearchItem[] = [
  {
    name: "Perfil",
    description: "Dados da sua conta",
    path: "/profile",
    icon: <UserCircleIcon />,
  },
  {
    name: "Tokens da API",
    description: "Criar e consultar tokens de acesso",
    path: "/tokens",
    icon: <PlugInIcon />,
  },
  {
    name: "Atualizações",
    description: "Situação dos arquivos do INPI na base",
    path: "/updates",
    icon: <TableIcon />,
    adminOnly: true,
  },
  {
    name: "Usuários",
    description: "Criar e gerenciar logins de clientes",
    path: "/users",
    icon: <UsersIcon />,
    adminOnly: true,
  },
  {
    name: "Endpoints da API",
    description: "Referência dos endpoints para os clientes",
    path: "/api-docs",
    icon: <PlugInIcon />,
    adminOnly: true,
  },
];
