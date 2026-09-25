"use client";

import { useTransition } from "react";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setActiveTermAction } from "../actions";

export function SetActiveTermButton({ termId }: { termId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={() =>
        startTransition(async () => {
          const result = await setActiveTermAction({ term_id: termId });
          if (result.ok) toast.success("Trimestre activo actualizado.");
          else toast.error(result.error.message);
        })
      }
    >
      <CheckIcon aria-hidden /> Usar como trimestre activo
    </Button>
  );
}
