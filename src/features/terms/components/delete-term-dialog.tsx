"use client";

import { useId, useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteTermAction } from "../actions";
import { confirmNameMatches } from "../utils";

/**
 * Eliminación física de un trimestre (acción excepcional, plan §12). Doble confirmación:
 * abrir el diálogo y escribir el nombre exacto; el servidor vuelve a comprobarlo.
 */
export function DeleteTermDialog({ termId, termName }: { termId: string; termName: string }) {
  const router = useRouter();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const matches = confirmNameMatches(termName, typed);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setTyped("");
      setError(null);
    }
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!matches) return;
    startTransition(async () => {
      const result = await deleteTermAction({ id: termId, confirm_name: typed });
      if (!result.ok) {
        setError(result.error.fields?.confirm_name?.[0] ?? result.error.message);
        return;
      }
      setOpen(false);
      toast.success(`Se eliminó “${termName}”.`);
      router.push("/trimestres");
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2Icon aria-hidden /> Eliminar trimestre
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>¿Eliminar “{termName}” para siempre?</DialogTitle>
            <DialogDescription>
              Se borrarán el trimestre y todo lo que contiene (clases, horario, tareas…). Esta
              acción no se puede deshacer. Si solo quieres guardarlo, archívalo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={inputId}>
              Escribe <strong className="font-semibold">{termName}</strong> para confirmar
            </Label>
            <Input
              id={inputId}
              value={typed}
              autoComplete="off"
              onChange={(event) => {
                setTyped(event.target.value);
                setError(null);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${inputId}-error` : undefined}
            />
            {error ? (
              <p id={`${inputId}-error`} role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant="destructive"
              disabled={!matches || pending}
              aria-busy={pending || undefined}
            >
              Eliminar definitivamente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
