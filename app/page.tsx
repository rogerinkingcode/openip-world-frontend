import { redirect } from "next/navigation";

// A raiz é só um atalho: o proxy.ts já barra quem não tem sessão e manda para
// /login, então quem chega aqui logado segue direto para o perfil.
export default function Home() {
  redirect("/profile");
}
