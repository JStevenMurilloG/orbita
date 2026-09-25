import { ChevronsUpDownIcon, LayersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Selector de trimestre activo. Esqueleto de Fase 0: la lista de trimestres
 * y el cambio de trimestre activo llegan en la Fase 2.
 */
export function TermSwitcher({ termName }: { termName?: string | null }) {
  return (
    <Button
      variant="outline"
      className="h-auto w-full justify-between gap-2 px-3 py-2 text-left"
      disabled
      title="Disponible en la Fase 2"
    >
      <span className="flex min-w-0 items-center gap-2">
        <LayersIcon className="text-muted-foreground" aria-hidden />
        <span className="truncate">{termName ?? "Sin trimestre"}</span>
      </span>
      <ChevronsUpDownIcon className="text-muted-foreground" aria-hidden />
    </Button>
  );
}
