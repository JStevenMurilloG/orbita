import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard, AuthLink } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";
import { DEFAULT_AFTER_LOGIN } from "@/features/auth/utils";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage() {
  if (await getUser()) redirect(DEFAULT_AFTER_LOGIN);

  return (
    <AuthCard
      title="Crear cuenta"
      description="Organiza tus trimestres, clases y tareas en un solo lugar."
      footer={
        <>
          ¿Ya tienes cuenta? <AuthLink href="/login">Inicia sesión</AuthLink>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
