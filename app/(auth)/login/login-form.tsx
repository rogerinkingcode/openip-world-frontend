"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import Logo from "@/components/common/Logo";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/context/ToastContext";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { backendFetch } from "@/lib/api";

// Último login bem-sucedido, para preencher o formulário na próxima visita.
// Atenção: a senha fica em texto puro no localStorage do navegador.
const SAVED_LOGIN_KEY = "openip:saved-login";

type SavedLogin = { email: string; password: string };

// Lido via useSyncExternalStore: o servidor renderiza os campos vazios e o
// cliente preenche logo após hidratar, sem erro de hidratação e sem setState em
// efeito. O evento "storage" mantém outras abas em sincronia.
function subscribeSavedLogin(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getSavedLoginSnapshot() {
  try {
    return localStorage.getItem(SAVED_LOGIN_KEY);
  } catch {
    // Storage bloqueado (modo privado, política do navegador).
    return null;
  }
}

const getServerSavedLogin = () => null;

function parseSavedLogin(raw: string | null): SavedLogin | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (typeof data?.email === "string" && typeof data?.password === "string") {
      return data;
    }
  } catch {
    // Valor corrompido: ignora e o formulário começa vazio.
  }
  return null;
}

function saveLogin(login: SavedLogin) {
  try {
    localStorage.setItem(SAVED_LOGIN_KEY, JSON.stringify(login));
  } catch {
    // Sem storage o login funciona igual, só não é lembrado.
  }
}

export default function LoginForm() {
  const router = useRouter();
  const toast = useToast();
  const savedRaw = useSyncExternalStore(
    subscribeSavedLogin,
    getSavedLoginSnapshot,
    getServerSavedLogin,
  );
  const saved = useMemo(() => parseSavedLogin(savedRaw), [savedRaw]);

  // null = o usuário ainda não mexeu no campo, então vale o valor salvo.
  const [emailDraft, setEmail] = useState<string | null>(null);
  const [passwordDraft, setPassword] = useState<string | null>(null);
  const email = emailDraft ?? saved?.email ?? "";
  const password = passwordDraft ?? saved?.password ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await backendFetch("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      // O backend responde sempre com HTTP 200, sinalizando o resultado no
      // campo "status" do corpo. Sucesso = 200 (e o cookie já foi setado).
      if (data.status === 200) {
        // Só guarda credenciais que o backend aceitou.
        saveLogin({ email, password });
        toast.success("Login realizado com sucesso.");
        router.push("/profile");
        router.refresh();
      } else if (data.status === 403) {
        // O backend só responde 403 com a senha correta: é conta bloqueada.
        setError("Sua conta está bloqueada. Fale com o administrador.");
      } else if (data.status === 429) {
        const minutes = Math.max(1, Math.ceil((data.retryAfter ?? 60) / 60));
        setError(
          `Muitas tentativas de login. Tente novamente em ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`,
        );
      } else if (data.status === 400 || data.status === 401) {
        // Mesma mensagem para e-mail inexistente e senha errada, como no backend.
        setError("E-mail ou senha incorretos.");
      } else {
        setError(data.message ?? "Não foi possível entrar.");
      }
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        {/* O painel com a marca some abaixo de lg; aqui ela aparece no lugar. */}
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>

        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Entrar
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Informe seu e-mail e senha para acessar o OpenIP World.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <Label htmlFor="email">
                E-mail <span className="text-error-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
              />
            </div>

            <div>
              <Label htmlFor="password">
                Senha <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute z-30 -translate-y-1/2 right-4 top-1/2 text-gray-500 dark:text-gray-400"
                >
                  {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
                </button>
              </div>
            </div>

            {error && (
              <Alert
                variant="error"
                title="Não foi possível entrar"
                message={error}
              />
            )}

            <Button type="submit" size="sm" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
