import type { Metadata } from "next";
import { MailIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ChangeEmailForm } from "@/features/auth/components/change-email-form";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cuenta y seguridad" };

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex max-w-xl flex-col gap-4">
      <div>
        <h2 id={id} className="text-lg font-semibold">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default async function AccountSettingsPage() {
  // getUser() de Supabase (no los claims) para ver un cambio de correo pendiente (`new_email`).
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;
  const pendingEmail = data.user?.new_email ?? null;

  return (
    <div className="flex flex-col gap-8">
      <Section
        id="correo-titulo"
        title="Correo"
        description={
          <>
            Tu correo actual es <strong className="text-foreground">{email}</strong>.
          </>
        }
      >
        {pendingEmail ? (
          <Alert>
            <MailIcon aria-hidden />
            <AlertTitle>Cambio pendiente a {pendingEmail}</AlertTitle>
            <AlertDescription>
              Abre los enlaces que enviamos a ambos correos para completar el cambio.
            </AlertDescription>
          </Alert>
        ) : null}
        <ChangeEmailForm />
      </Section>

      <Separator />

      <Section
        id="contrasena-titulo"
        title="Contraseña"
        description="Por seguridad, te pediremos tu contraseña actual."
      >
        <ChangePasswordForm />
      </Section>

      <Separator />

      <Section
        id="sesiones-titulo"
        title="Sesiones"
        description="Cierra la sesión en todos los dispositivos donde hayas entrado, incluido este."
      >
        <div>
          <SignOutButton scope="global" variant="outline">
            Cerrar sesión en todos los dispositivos
          </SignOutButton>
        </div>
      </Section>
    </div>
  );
}
