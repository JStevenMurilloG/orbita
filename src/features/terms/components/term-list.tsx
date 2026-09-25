import type { Term } from "../types";
import { TermCard } from "./term-card";

/** Lista de trimestres con título de sección (plan §24 `TermList`). */
export function TermList({
  id,
  title,
  terms,
  activeTermId,
}: {
  id: string;
  title: string;
  terms: Term[];
  activeTermId: string | null;
}) {
  if (terms.length === 0) return null;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-sm font-medium text-muted-foreground">
        {title}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {terms.map((term) => (
          <TermCard key={term.id} term={term} isActive={term.id === activeTermId} />
        ))}
      </ul>
    </section>
  );
}
