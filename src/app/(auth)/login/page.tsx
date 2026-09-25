import type { Metadata } from "next";
import Link from "next/link";
import { LogInIcon } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";

export const metadata: Metadata = { title: "Iniciar sesión" };

/** Marcador de Fase 0: el formulario de inicio de sesión llega en la Fase 1. */
export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center p-6">
      <h1 className="sr-only">Iniciar sesión</h1>
      <EmptyState
        icon={LogInIcon}
        title="Inicio de sesión en construcción"
        description="Las cuentas de usuario llegan en la Fase 1."
        action={
          <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
            Volver al inicio
          </Link>
        }
      />
    </main>
  );
}
