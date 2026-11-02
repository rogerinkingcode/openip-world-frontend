"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { backendFetch } from "@/lib/api";
import type { RpiSecao } from "@/lib/types";

export default function DeleteSecaoDialog({
  secao,
  label,
  onClose,
  onDeleted,
}: {
  secao: RpiSecao | null;
  label: string;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  // Guarda a última seção para o texto não sumir durante a animação de saída.
  const [shown, setShown] = useState<RpiSecao | null>(secao);
  if (secao && secao !== shown) {
    setShown(secao);
  }

  async function handleDelete() {
    if (!shown) return;
    setDeleting(true);

    try {
      const res = await backendFetch(`/rpi/secoes/${shown.id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok && data.status === 200) {
        toast.success(
          `RPI ${shown.numero_rpi} — ${label}: ${data.deleted_files} ${data.deleted_files === 1 ? "arquivo excluído" : "arquivos excluídos"}.`,
        );
        onClose();
        await onDeleted();
      } else {
        toast.error(data.message ?? "Não foi possível excluir a seção.");
      }
    } catch {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setDeleting(false);
    }
  }

  const arquivos = shown?.arquivos.length ?? 0;

  return (
    <Modal isOpen={secao !== null} onClose={onClose}>
      <h4 className="mb-2 pr-12 text-2xl font-semibold text-gray-800 dark:text-white/90">
        Excluir seção da RPI
      </h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {arquivos === 1 ? "O arquivo" : `Os ${arquivos} arquivos`} de{" "}
        <span className="font-medium text-gray-800 dark:text-white/90">
          {label}
        </span>{" "}
        da{" "}
        <span className="font-medium text-gray-800 dark:text-white/90">
          RPI {shown?.numero_rpi}
        </span>{" "}
        {arquivos === 1 ? "é apagado" : "são apagados"} do bucket
        {shown?.update_status ? ", os dados já carregados saem da base" : ""}, e
        a linha sai da tabela. Não é possível desfazer.
      </p>
      <p className="mt-3 text-theme-xs text-gray-500 dark:text-gray-400">
        As outras seções desta edição não são afetadas. Se a edição ainda for a
        mais recente no INPI, um novo disparo baixa os arquivos de novo.
      </p>

      <div className="flex items-center gap-3 mt-8 lg:justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button size="sm" variant="danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Excluindo..." : "Excluir arquivos"}
        </Button>
      </div>
    </Modal>
  );
}
