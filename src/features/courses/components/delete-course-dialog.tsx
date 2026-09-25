"use client";

import { useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { deleteCourseAction, restoreCourseAction } from "../actions";

/**
 * Borrado suave de una clase (plan §13): confirmación y "Deshacer" en el aviso.
 * La papelera completa (restaurar más tarde, purga a los 30 días) llega en MVP2.
 */
export function DeleteCourseDialog({
  courseId,
  courseName,
  termId,
}: {
  courseId: string;
  courseName: string;
  termId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const undo = async () => {
    const result = await restoreCourseAction({ id: courseId });
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(`Se restauró “${courseName}”.`);
    router.push(`/clases/${courseId}`);
  };

  const remove = () =>
    startTransition(async () => {
      const result = await deleteCourseAction({ id: courseId });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setOpen(false);
      toast.success(`Se eliminó “${courseName}”.`, {
        action: { label: "Deshacer", onClick: () => void undo() },
      });
      router.push(`/trimestres/${termId}/clases`);
    });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2Icon aria-hidden /> Eliminar clase
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar “{courseName}”?</AlertDialogTitle>
          <AlertDialogDescription>
            La clase dejará de aparecer junto con su información. Podrás deshacerlo desde el aviso
            que aparece a continuación.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={remove}
            disabled={pending}
            aria-busy={pending || undefined}
          >
            Eliminar clase
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
