"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Result } from "@/lib/errors";
import { finishTermAction, reopenTermAction, unarchiveTermAction } from "../actions";
import type { Term } from "../types";

const ACTIONS = {
  finish: { run: finishTermAction, label: "Finalizar", done: "Trimestre finalizado." },
  reopen: { run: reopenTermAction, label: "Reabrir", done: "Trimestre reabierto." },
  unarchive: { run: unarchiveTermAction, label: "Desarchivar", done: "Trimestre desarchivado." },
} satisfies Record<
  string,
  { run: (input: unknown) => Promise<Result<Term>>; label: string; done: string }
>;

/** Botón de una transición sin confirmación (finalizar, reabrir, desarchivar). */
export function TermTransitionButton({
  termId,
  transition,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  termId: string;
  transition: keyof typeof ACTIONS;
}) {
  const [pending, startTransition] = useTransition();
  const action = ACTIONS[transition];

  return (
    <Button
      variant="outline"
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={() =>
        startTransition(async () => {
          const result = await action.run({ id: termId });
          if (result.ok) toast.success(action.done);
          else toast.error(result.error.message);
        })
      }
      {...props}
    >
      {props.children ?? action.label}
    </Button>
  );
}
