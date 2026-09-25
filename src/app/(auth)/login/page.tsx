import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CircleAlertIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCard, AuthLink } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeNextPath } from "@/features/auth/utils";
import { getUser } from "@/lib/auth";
import { ERROR_CODES } from "@/lib/errors";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const nextPath = safeNextPath(typeof next === "string" ? next : undefined);

  if (await getUser()) redirect(nextPath);

  return (
    <AuthCard
      title="Iniciar sesión"
      description="Entra a tu espacio académico."
      footer={
        <>
          ¿No tienes cuenta? <AuthLink href="/registro">Regístrate</AuthLink>
        </>
      }
    >
      {error === "enlace" ? (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden />
          <AlertDescription>{ERROR_CODES.LINK_INVALID.message}</AlertDescription>
        </Alert>
      ) : null}
      <LoginForm next={nextPath} />
    </AuthCard>
  );
}
