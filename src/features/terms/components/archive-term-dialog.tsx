"use client";

import { useState, useTransition } from "react";
import { ArchiveIcon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { archiveTermAction } from "../actions";

/** Confirmación para archivar (plan §24 `ArchiveTermDialog`). Es reversible: se puede desarchivar. */
export function ArchiveTermDialog({
  termId,
  termName,
  isActiveTerm,
}: {
  termId: string;
  termName: string;
  /** Si es el trimestre activo, se sugiere elegir otro (plan §12). */
  isActiveTerm: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const archive = () =>
    startTransition(async () => {
      const result = await archiveTermAction({ id: termId });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setOpen(false);
      toast.success("Trimestre archivado.", {
        description: isActiveTerm
          ? "Sigue siendo tu trimestre activo. Puedes elegir otro en el selector de trimestre."
          : undefined,
      });
    });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <ArchiveIcon aria-hidden /> Archivar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Archivar “{termName}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Quedará guardado en modo de solo lectura: podrás consultarlo, pero no editar sus clases,
            horario ni tareas hasta desarchivarlo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <Button onClick={archive} disabled={pending} aria-busy={pending || undefined}>
            Archivar trimestre
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
