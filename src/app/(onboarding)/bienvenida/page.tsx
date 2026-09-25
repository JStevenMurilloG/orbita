import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/features/profile/queries";
import { TermForm } from "@/features/terms/components/term-form";
import { getCurrentTerms } from "@/features/terms/queries";
import { newTermDefaults } from "@/features/terms/utils";
import { DEFAULT_TIMEZONE } from "@/lib/dates";

export const metadata: Metadata = { title: "Bienvenida" };

/** Onboarding: crear el primer trimestre (plan §11, §22). Pasa a ser el activo automáticamente. */
export default async function WelcomePage() {
  const [terms, profile] = await Promise.all([getCurrentTerms(), getCurrentProfile()]);
  if (terms.length > 0) redirect("/hoy");

  const firstName = profile?.full_name.split(/\s+/)[0];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {firstName ? `Te damos la bienvenida, ${firstName}` : "Te damos la bienvenida"}
        </h1>
        <p className="text-muted-foreground">
          En Órbita todo se organiza por trimestres: tus clases, tu horario y tus tareas viven
          dentro de uno. Empieza creando el trimestre que estás cursando.
        </p>
      </div>
      <TermForm
        mode="create"
        redirectTo="/hoy"
        submitLabel="Crear mi primer trimestre"
        timeZones={Intl.supportedValuesOf("timeZone")}
        defaultValues={newTermDefaults(profile?.timezone ?? DEFAULT_TIMEZONE)}
      />
    </div>
  );
}
