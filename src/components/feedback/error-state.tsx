"use client";

import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Algo salió mal",
  description = "No pudimos cargar esta sección. Inténtalo de nuevo.",
  digest,
  onRetry,
}: {
  title?: string;
  description?: string;
  digest?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border px-6 py-12 text-center"
    >
      <TriangleAlertIcon className="size-8 text-destructive" aria-hidden />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {digest ? (
          <p className="mt-2 font-mono text-xs text-muted-foreground">ID de error: {digest}</p>
        ) : null}
      </div>
      {onRetry ? <Button onClick={onRetry}>Reintentar</Button> : null}
    </div>
  );
}
