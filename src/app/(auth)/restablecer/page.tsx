import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { isRecentEmailLinkSession } from "@/features/auth/utils";
import { getUser } from "@/lib/auth";
import { ERROR_CODES } from "@/lib/errors";

export const metadata: Metadata = { title: "Nueva contraseña" };

/** Destino del enlace de recuperación: /auth/confirm ya abrió la sesión de recuperación. */
export default async function ResetPasswordPage() {
  const user = await getUser();

  if (!user || !isRecentEmailLinkSession(user)) {
    return (
      <>
        <h1 className="sr-only">Nueva contraseña</h1>
        <EmptyState
          icon={LinkIcon}
          title="Enlace no válido"
          description={ERROR_CODES.LINK_INVALID.message}
          action={
            <Button asChild>
              <Link href="/recuperar">Pedir un enlace nuevo</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <AuthCard
      title="Elige una nueva contraseña"
      description={user.email ? `Para la cuenta ${user.email}.` : undefined}
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
