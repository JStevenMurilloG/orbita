"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signOutAction } from "../actions";

/** Cierra la sesión en este dispositivo (`local`) o en todos (`global`). */
export function SignOutButton({
  scope = "local",
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick" | "type"> & {
  scope?: "local" | "global";
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await signOutAction({ scope });
          if (!result.ok) toast.error(result.error.message);
        })
      }
      {...props}
    >
      {children ?? "Cerrar sesión"}
    </Button>
  );
}
