import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { formatCivilDateRange } from "@/lib/dates";
import { termLabel } from "../labels";
import type { Term } from "../types";
import { TermStatusBadge } from "./term-status-badge";

/** Tarjeta de un trimestre en la lista (plan §24 `TermCard`). */
export function TermCard({ term, isActive }: { term: Term; isActive: boolean }) {
  return (
    <li>
      <Link
        href={`/trimestres/${term.id}`}
        className="flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">{termLabel(term)}</span>
          <TermStatusBadge status={term.status} />
        </div>
        <span className="text-sm text-muted-foreground">
          {formatCivilDateRange(term.start_date, term.end_date)}
        </span>
        {isActive ? (
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            <CheckIcon className="size-3.5" aria-hidden /> Trimestre activo
          </span>
        ) : null}
      </Link>
    </li>
  );
}
