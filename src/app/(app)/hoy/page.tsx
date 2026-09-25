import type { Metadata } from "next";
import { SunIcon } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Hoy" };

/** Esqueleto de Fase 0. El dashboard real llega en la Fase 5. */
export default function TodayPage() {
  return (
    <>
      <PageHeader title="Hoy" />
      <EmptyState
        icon={SunIcon}
        title="Tu día aparecerá aquí"
        description="Cuando crees tu primer trimestre, clases y horario, verás tus clases de hoy y tus próximas entregas."
      />
    </>
  );
}
