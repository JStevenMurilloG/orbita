import { ArchiveIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Aviso de modo solo lectura para un trimestre archivado (plan §12, §24).
 * `action` suele ser el botón "Desarchivar".
 */
export function ReadOnlyBanner({
  termName,
  action,
}: {
  termName: string;
  action?: React.ReactNode;
}) {
  return (
    <Alert
      role="status"
      data-testid="read-only-banner"
      className="mb-6 flex flex-wrap items-center justify-between gap-3 border-amber-500/40 bg-amber-500/10"
    >
      <div className="flex min-w-0 gap-2">
        <ArchiveIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="min-w-0">
          <AlertTitle>{termName} está archivado</AlertTitle>
          <AlertDescription className="text-foreground/85">
            Estás viendo este trimestre en modo de solo lectura. Desarchívalo para editar.
          </AlertDescription>
        </div>
      </div>
      {action}
    </Alert>
  );
}
