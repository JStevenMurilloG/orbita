import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { ReadOnlyBanner } from "@/components/feedback/read-only-banner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArchiveTermDialog } from "@/features/terms/components/archive-term-dialog";
import { DeleteTermDialog } from "@/features/terms/components/delete-term-dialog";
import { SetActiveTermButton } from "@/features/terms/components/set-active-term-button";
import { TermForm } from "@/features/terms/components/term-form";
import { TermStatusBadge } from "@/features/terms/components/term-status-badge";
import { TermTransitionButton } from "@/features/terms/components/term-transition-button";
import { termLabel } from "@/features/terms/labels";
import { findCurrentTerm, getActiveTerm } from "@/features/terms/queries";
import { formatCivilDateRange } from "@/lib/dates";

export async function generateMetadata({
  params,
}: PageProps<"/trimestres/[termId]">): Promise<Metadata> {
  const term = await findCurrentTerm((await params).termId);
  return { title: term ? termLabel(term) : "Trimestre" };
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div>
        <h2 id={id} className="text-lg font-semibold">
          {title}
        </h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default async function TermPage({ params }: PageProps<"/trimestres/[termId]">) {
  const [term, activeTerm] = await Promise.all([
    findCurrentTerm((await params).termId),
    getActiveTerm(),
  ]);
  if (!term) notFound();

  const isActiveTerm = activeTerm?.id === term.id;
  const archived = term.status === "archived";

  return (
    <>
      {/* Si es el activo, el layout ya muestra el aviso de solo lectura. */}
      {archived && !isActiveTerm ? (
        <ReadOnlyBanner
          termName={term.name}
          action={<TermTransitionButton termId={term.id} transition="unarchive" />}
        />
      ) : null}

      <PageHeader
        title={termLabel(term)}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <TermStatusBadge status={term.status} />
            <span>{formatCivilDateRange(term.start_date, term.end_date)}</span>
            <span aria-hidden>·</span>
            <span>{term.timezone.replaceAll("_", " ")}</span>
            {isActiveTerm ? (
              <>
                <span aria-hidden>·</span>
                <span className="font-medium text-primary">Trimestre activo</span>
              </>
            ) : null}
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/trimestres/${term.id}/clases`}>
                <BookOpenIcon aria-hidden /> Ver clases
              </Link>
            </Button>
            {!isActiveTerm ? <SetActiveTermButton termId={term.id} /> : null}
            {term.status === "active" ? (
              <TermTransitionButton termId={term.id} transition="finish" />
            ) : null}
            {term.status === "finished" ? (
              <TermTransitionButton termId={term.id} transition="reopen" />
            ) : null}
            {!archived ? (
              <ArchiveTermDialog
                termId={term.id}
                termName={term.name}
                isActiveTerm={isActiveTerm}
              />
            ) : null}
          </div>
        }
      />

      <div className="flex flex-col gap-8">
        {term.description ? (
          <p className="max-w-2xl text-sm whitespace-pre-line">{term.description}</p>
        ) : null}

        {!archived ? (
          <Section id="editar-titulo" title="Datos del trimestre">
            <TermForm
              key={term.updated_at}
              mode="edit"
              termId={term.id}
              submitLabel="Guardar cambios"
              timeZones={Intl.supportedValuesOf("timeZone")}
              defaultValues={{
                name: term.name,
                year: term.year,
                start_date: term.start_date,
                end_date: term.end_date,
                timezone: term.timezone,
                description: term.description ?? "",
              }}
            />
          </Section>
        ) : null}

        <Separator />

        <Section
          id="eliminar-titulo"
          title="Eliminar trimestre"
          description="Borra el trimestre y todo su contenido de forma permanente. Para conservarlo sin editarlo, archívalo."
        >
          <div>
            <DeleteTermDialog termId={term.id} termName={term.name} />
          </div>
        </Section>
      </div>
    </>
  );
}
