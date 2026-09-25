import type { Metadata } from "next";
import Link from "next/link";
import { LayersIcon, SunIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/features/profile/queries";
import { termLabel } from "@/features/terms/labels";
import { getActiveTerm, getCurrentTerms } from "@/features/terms/queries";
import { termPeriod } from "@/features/terms/utils";
import { DEFAULT_TIMEZONE, formatCivilDate, getToday } from "@/lib/dates";

export const metadata: Metadata = { title: "Hoy" };

/** Esqueleto de Fase 0/2. El dashboard real llega en la Fase 5. */
export default async function TodayPage() {
  const [terms, activeTerm, profile] = await Promise.all([
    getCurrentTerms(),
    getActiveTerm(),
    getCurrentProfile(),
  ]);
  // Sin trimestres todavía: onboarding (plan §11, §12).
  if (terms.length === 0) redirect("/bienvenida");

  if (!activeTerm) {
    return (
      <>
        <PageHeader title="Hoy" />
        <EmptyState
          icon={LayersIcon}
          title="Elige un trimestre activo"
          description="Selecciona con qué trimestre quieres trabajar para ver tus clases y entregas."
          action={
            <Button asChild>
              <Link href="/trimestres">Ver trimestres</Link>
            </Button>
          }
        />
      </>
    );
  }

  // "Hoy" en la zona del usuario, nunca la del servidor (plan §27).
  const today = getToday(profile?.timezone ?? activeTerm.timezone ?? DEFAULT_TIMEZONE);
  const period = termPeriod(activeTerm, today);
  const periodNote =
    period === "past"
      ? `Este trimestre terminó el ${formatCivilDate(activeTerm.end_date)}.`
      : period === "upcoming"
        ? `Este trimestre empieza el ${formatCivilDate(activeTerm.start_date)}.`
        : null;

  return (
    <>
      <PageHeader
        title="Hoy"
        description={
          <>
            {termLabel(activeTerm)}
            {periodNote ? <> · {periodNote}</> : null}
          </>
        }
      />
      <EmptyState
        icon={SunIcon}
        title="Tu día aparecerá aquí"
        description="Cuando añadas clases y horario, verás tus clases de hoy y tus próximas entregas."
      />
    </>
  );
}
