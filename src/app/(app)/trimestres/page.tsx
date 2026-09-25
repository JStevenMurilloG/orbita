import type { Metadata } from "next";
import Link from "next/link";
import { LayersIcon, PlusIcon } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { TermList } from "@/features/terms/components/term-list";
import { getActiveTerm, getCurrentTerms } from "@/features/terms/queries";

export const metadata: Metadata = { title: "Trimestres" };

export default async function TermsPage() {
  const [terms, activeTerm] = await Promise.all([getCurrentTerms(), getActiveTerm()]);
  const activeTermId = activeTerm?.id ?? null;
  const newTermButton = (
    <Button asChild>
      <Link href="/trimestres/nuevo">
        <PlusIcon aria-hidden /> Nuevo trimestre
      </Link>
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Trimestres"
        description="Todos tus trimestres. Los archivados se conservan en modo de solo lectura."
        actions={terms.length > 0 ? newTermButton : null}
      />
      {terms.length === 0 ? (
        <EmptyState
          icon={LayersIcon}
          title="Aún no tienes trimestres"
          description="Crea el trimestre que estás cursando para organizar tus clases y tareas."
          action={newTermButton}
        />
      ) : (
        <div className="flex flex-col gap-8">
          <TermList
            id="trimestres-vigentes"
            title="En curso y finalizados"
            terms={terms.filter((term) => term.status !== "archived")}
            activeTermId={activeTermId}
          />
          <TermList
            id="trimestres-archivados"
            title="Archivados"
            terms={terms.filter((term) => term.status === "archived")}
            activeTermId={activeTermId}
          />
        </div>
      )}
    </>
  );
}
