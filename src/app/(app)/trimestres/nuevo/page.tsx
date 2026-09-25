import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentProfile } from "@/features/profile/queries";
import { TermForm } from "@/features/terms/components/term-form";
import { getCurrentTerms } from "@/features/terms/queries";
import { newTermDefaults } from "@/features/terms/utils";
import { DEFAULT_TIMEZONE } from "@/lib/dates";

export const metadata: Metadata = { title: "Nuevo trimestre" };

export default async function NewTermPage() {
  const [profile, terms] = await Promise.all([getCurrentProfile(), getCurrentTerms()]);

  return (
    <>
      <PageHeader title="Nuevo trimestre" />
      <TermForm
        mode="create"
        submitLabel="Crear trimestre"
        // El primer trimestre siempre pasa a ser el activo; con otros, se pregunta.
        offerMakeActive={terms.length > 0}
        timeZones={Intl.supportedValuesOf("timeZone")}
        defaultValues={newTermDefaults(profile?.timezone ?? DEFAULT_TIMEZONE)}
      />
    </>
  );
}
