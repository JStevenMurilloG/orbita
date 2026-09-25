import Link from "next/link";
import { OrbitIcon } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/** Páginas públicas de autenticación: columna centrada, sin el shell de la app. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <OrbitIcon className="size-5 text-primary" aria-hidden />
          Órbita
        </Link>
        <ThemeToggle />
      </header>
      <main
        id="contenido"
        className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 pt-6 pb-16"
      >
        {children}
      </main>
    </div>
  );
}
