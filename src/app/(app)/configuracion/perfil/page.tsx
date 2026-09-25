import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { getCurrentProfile } from "@/features/profile/queries";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfileSettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  return (
    <section aria-labelledby="perfil-titulo" className="flex flex-col gap-4">
      <div>
        <h2 id="perfil-titulo" className="text-lg font-semibold">
          Perfil
        </h2>
        <p className="text-sm text-muted-foreground">
          Tu nombre y tus preferencias de fecha y apariencia.
        </p>
      </div>
      <ProfileForm
        timeZones={Intl.supportedValuesOf("timeZone")}
        defaultValues={{
          full_name: profile.full_name,
          timezone: profile.timezone,
          week_starts_on: profile.week_starts_on,
          theme: profile.theme,
        }}
      />
    </section>
  );
}
