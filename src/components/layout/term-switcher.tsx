"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ArchiveIcon, ChevronsUpDownIcon, LayersIcon, ListIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setActiveTermAction } from "@/features/terms/actions";
import { termLabel } from "@/features/terms/labels";
import type { TermSummary } from "@/features/terms/types";

/**
 * Selector del trimestre activo (plan §12, §22): siempre visible, cambia el contexto de toda
 * la app. Se puede elegir cualquier trimestre, incluso archivado (modo lectura).
 */
export function TermSwitcher({
  terms,
  activeTermId,
}: {
  terms: TermSummary[];
  activeTermId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const active = terms.find((term) => term.id === activeTermId) ?? null;
  const current = terms.filter((term) => term.status !== "archived");
  const archived = terms.filter((term) => term.status === "archived");
  const label = active ? termLabel(active) : "Sin trimestre";

  const onValueChange = (termId: string) => {
    if (termId === activeTermId) return;
    startTransition(async () => {
      const result = await setActiveTermAction({ term_id: termId });
      if (!result.ok) toast.error(result.error.message);
    });
  };

  const items = (list: TermSummary[]) =>
    list.map((term) => (
      <DropdownMenuRadioItem key={term.id} value={term.id} disabled={pending}>
        <span className="truncate">{termLabel(term)}</span>
        {term.status === "archived" ? (
          <ArchiveIcon className="ml-auto text-muted-foreground" aria-label="Archivado" />
        ) : null}
      </DropdownMenuRadioItem>
    ));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-auto w-full justify-between gap-2 px-3 py-2 text-left"
          aria-label={`Cambiar trimestre activo (${label})`}
          aria-busy={pending || undefined}
        >
          <span className="flex min-w-0 items-center gap-2">
            <LayersIcon className="text-muted-foreground" aria-hidden />
            <span className="truncate">{label}</span>
          </span>
          <ChevronsUpDownIcon className="text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuRadioGroup value={activeTermId ?? ""} onValueChange={onValueChange}>
          {current.length > 0 ? (
            <DropdownMenuGroup>
              <DropdownMenuLabel>Trimestres</DropdownMenuLabel>
              {items(current)}
            </DropdownMenuGroup>
          ) : null}
          {archived.length > 0 ? (
            <DropdownMenuGroup>
              <DropdownMenuLabel>Archivados</DropdownMenuLabel>
              {items(archived)}
            </DropdownMenuGroup>
          ) : null}
        </DropdownMenuRadioGroup>
        {terms.length > 0 ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem asChild>
          <Link href="/trimestres">
            <ListIcon aria-hidden /> Ver todos los trimestres
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/trimestres/nuevo">
            <PlusIcon aria-hidden /> Nuevo trimestre
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
