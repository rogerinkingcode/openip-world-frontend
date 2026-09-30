"use client";

import { useEffect, useRef, useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { CopyIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { backendFetch } from "@/lib/api";
import type { ManagedUser } from "@/lib/types";

// Devem acompanhar o backend (UserServices).
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Role = "user" | "admin";

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  {
    value: "user",
    label: "Cliente",
    description: "Acessa o painel e cria tokens de leitura da API.",
  },
  {
    value: "admin",
    label: "Administrador",
    description: "Acesso total: gerencia usuários, filas e tokens de escrita.",
  },
];

// Senha para entregar ao cliente: 16 caracteres, sem os que se confundem ao ler
// (0/O, 1/l/I). Rejeita valores que causariam viés no sorteio.
function generatePassword(length = 16) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  const limit = Math.floor(256 / alphabet.length) * alphabet.length;
  const chars: string[] = [];
  while (chars.length < length) {
    for (const byte of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (byte < limit && chars.length < length) {
        chars.push(alphabet[byte % alphabet.length]);
      }
    }
  }
  return chars.join("");
}

export default function UserFormDialog({
  open,
  initialUser,
  currentUserId,
  onClose,
  onSaved,
}: {
  open: boolean;
  // Lido só ao montar (o pai troca a `key` a cada abertura). null = criar.
  initialUser: ManagedUser | null;
  currentUserId: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const toast = useToast();
  // Congela o usuário da abertura: o pai limpa a seleção enquanto o modal anima a saída.
  const [initial] = useState(initialUser);
  const isEdit = initial !== null;
  // Na própria conta perfil, situação e senha ficam travados (a API também recusa).
  const isSelf = initial?.id === currentUserId;

  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>(initial?.role === "admin" ? "admin" : "user");
  const [active, setActive] = useState(initial ? !initial.isBlocked : true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // O efeito do Modal (filho) roda antes e já abriu o <dialog>: o campo pode receber foco.
  useEffect(() => {
    if (open) firstFieldRef.current?.focus();
  }, [open]);

  function validate() {
    if (!firstName.trim() || !lastName.trim()) return "Preencha o nome e o sobrenome.";
    if (!EMAIL_PATTERN.test(email.trim())) return "Informe um e-mail válido.";
    if (!isSelf && (!isEdit || password) && password.length < MIN_PASSWORD_LENGTH) {
      return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    return null;
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Senha copiada.");
    } catch {
      toast.error("Não foi possível copiar. Selecione a senha e copie manualmente.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    const body: Record<string, unknown> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    };
    if (!isSelf) {
      body.role = role;
      body.isBlocked = !active;
      if (password) body.password = password;
    }

    try {
      const res = await backendFetch(isEdit ? `/users/${initial.id}` : "/users", {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.status === 200 || data.status === 201) {
        toast.success(isEdit ? "Usuário atualizado." : "Usuário criado.");
        onClose();
        await onSaved();
      } else if (data.status === 409) {
        setError("Já existe um usuário com este e-mail.");
      } else {
        setError(data.message ?? "Não foi possível salvar o usuário.");
      }
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <h4 className="mb-2 pr-12 text-2xl font-semibold text-gray-800 dark:text-white/90">
          {isEdit ? "Editar usuário" : "Novo usuário"}
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
          {isEdit
            ? "Atualize os dados de acesso deste login."
            : "Crie o login e envie o e-mail e a senha para o cliente."}
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="user-first-name">
              Nome <span className="text-error-500">*</span>
            </Label>
            <Input
              ref={firstFieldRef}
              id="user-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              maxLength={150}
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="user-last-name">
              Sobrenome <span className="text-error-500">*</span>
            </Label>
            <Input
              id="user-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              maxLength={150}
              autoComplete="off"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="user-email">
              E-mail <span className="text-error-500">*</span>
            </Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              autoComplete="off"
              placeholder="cliente@empresa.com"
            />
          </div>

          {isSelf ? (
            <p className="sm:col-span-2 text-theme-xs text-gray-500 dark:text-gray-400">
              Esta é a sua conta: perfil, situação e senha não são alterados por
              aqui.
            </p>
          ) : (
            <>
              <div className="sm:col-span-2">
                <Label htmlFor="user-password">
                  {isEdit ? (
                    "Nova senha"
                  ) : (
                    <>
                      Senha <span className="text-error-500">*</span>
                    </>
                  )}
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Input
                      id="user-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder={
                        isEdit
                          ? "Em branco mantém a senha atual"
                          : `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`
                      }
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      setPassword(generatePassword());
                      setShowPassword(true);
                    }}
                  >
                    Gerar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={copyPassword}
                    disabled={!password}
                    aria-label="Copiar senha"
                  >
                    <CopyIcon className="size-4" />
                  </Button>
                </div>
                <p className="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                  {isEdit
                    ? "A senha atual continua valendo se este campo ficar vazio."
                    : "Guarde a senha antes de salvar: ela não é exibida de novo."}
                </p>
              </div>

              <fieldset className="sm:col-span-2">
                <legend className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Perfil
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ROLE_OPTIONS.map((option) => {
                    const selected = role === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          selected
                            ? "border-brand-300 bg-brand-25 dark:border-brand-800 dark:bg-brand-500/10"
                            : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="user-role"
                          value={option.value}
                          checked={selected}
                          onChange={() => setRole(option.value)}
                          className="mt-0.5 accent-brand-500"
                        />
                        <span>
                          <span className="block text-sm font-medium text-gray-800 dark:text-white/90">
                            {option.label}
                          </span>
                          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="sm:col-span-2">
                <Switch
                  label="Acesso liberado"
                  description="Desligado, o usuário não entra no painel e os tokens de API dele param de funcionar."
                  checked={active}
                  onChange={setActive}
                />
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-5">
            <Alert variant="error" title="Não foi possível salvar" message={error} />
          </div>
        )}

        <div className="flex items-center gap-3 mt-8 lg:justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={saving}>
            {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar usuário"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
