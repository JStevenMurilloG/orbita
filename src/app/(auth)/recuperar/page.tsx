import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard, AuthLink } from "@/features/auth/components/auth-card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { DEFAULT_AFTER_LOGIN } from "@/features/auth/utils";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default async function ForgotPasswordPage() {
  if (await getUser()) redirect(DEFAULT_AFTER_LOGIN);

  return (
    <AuthCard
      title="Recuperar contraseña"
      description="Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una nueva."
      footer={<AuthLink href="/login">Volver a iniciar sesión</AuthLink>}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
