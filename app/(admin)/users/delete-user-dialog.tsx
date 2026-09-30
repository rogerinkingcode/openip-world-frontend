"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { backendFetch } from "@/lib/api";
import type { ManagedUser } from "@/lib/types";

export default function DeleteUserDialog({
  user,
  onClose,
  onDeleted,
}: {
  user: ManagedUser | null;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  // Guarda o último usuário para o texto não sumir durante a animação de saída
  // (o pai zera `user` assim que o modal começa a fechar).
  const [shown, setShown] = useState<ManagedUser | null>(user);
  if (user && user !== shown) {
    setShown(user);
  }

  async function handleDelete() {
    if (!shown) return;
    setDeleting(true);

    try {
      const res = await backendFetch(`/users/${shown.id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.status === 200) {
        toast.success("Usuário excluído.");
        onClose();
        await onDeleted();
      } else {
        toast.error(data.message ?? "Não foi possível excluir o usuário.");
      }
    } catch {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setDeleting(false);
    }
  }

  const tokens = shown?.tokens ?? 0;

  return (
    <Modal isOpen={user !== null} onClose={onClose}>
      <h4 className="mb-2 pr-12 text-2xl font-semibold text-gray-800 dark:text-white/90">
        Excluir usuário
      </h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        O login de{" "}
        <span className="font-medium text-gray-800 dark:text-white/90">
          {shown?.firstName} {shown?.lastName}
        </span>{" "}
        ({shown?.email}) é apagado
        {tokens > 0
          ? ` junto com ${tokens} ${tokens === 1 ? "token" : "tokens"} de API — os sistemas que ${tokens === 1 ? "o usam perdem" : "os usam perdem"} o acesso na hora`
          : ""}
        . Não é possível desfazer.
      </p>
      <p className="mt-3 text-theme-xs text-gray-500 dark:text-gray-400">
        Para só suspender o acesso, edite o usuário e desligue &quot;Acesso liberado&quot;.
      </p>

      <div className="flex items-center gap-3 mt-8 lg:justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button size="sm" variant="danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Excluindo..." : "Excluir usuário"}
        </Button>
      </div>
    </Modal>
  );
}
