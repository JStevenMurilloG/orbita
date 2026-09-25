"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resendConfirmationAction } from "../actions";

/** Reenvía el correo de confirmación de la cuenta. */
export function ResendConfirmationButton({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await resendConfirmationAction({ email });
          if (result.ok) toast.success("Te enviamos un nuevo enlace de confirmación.");
          else toast.error(result.error.message);
        })
      }
    >
      Reenviar correo de confirmación
    </Button>
  );
}
