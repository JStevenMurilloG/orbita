import Link from "next/link";
import { OrbitIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { updateThemeAction } from "@/features/profile/actions";
import { UserMenu } from "@/features/profile/components/user-menu";
import { NavList } from "./nav-list";
import { TermSwitcher } from "./term-switcher";
import { ThemeToggle } from "./theme-toggle";

function Brand() {
  return (
    <Link href="/hoy" className="flex items-center gap-2 font-semibold tracking-tight">
      <OrbitIcon className="size-5 text-primary" aria-hidden />
      Órbita
    </Link>
  );
}

/**
 * Estructura de la app autenticada (plan §22):
 * sidebar fija en desktop, cabecera + barra inferior en móvil.
 */
export function AppShell({
  children,
  termName,
  user,
}: {
  children: React.ReactNode;
  termName?: string | null;
  user: { fullName: string; email: string | null };
}) {
  return (
    <div className="flex min-h-dvh w-full">
      <aside
        aria-label="Navegación principal"
        className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-4 border-r bg-sidebar p-4 lg:flex"
      >
        <Brand />
        <TermSwitcher termName={termName} />
        <nav className="flex flex-col gap-1">
          <NavList section="primary" />
        </nav>
        <Separator />
        <nav className="flex flex-col gap-1" aria-label="Navegación secundaria">
          <NavList section="secondary" />
        </nav>
        <div className="mt-auto flex items-center justify-between gap-2">
          <UserMenu fullName={user.fullName} email={user.email} />
          <ThemeToggle persist={updateThemeAction} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/90 px-4 py-2 backdrop-blur lg:hidden">
          <Brand />
          <div className="flex min-w-0 items-center gap-1">
            <div className="max-w-44">
              <TermSwitcher termName={termName} />
            </div>
            <ThemeToggle persist={updateThemeAction} />
            <UserMenu fullName={user.fullName} email={user.email} />
          </div>
        </header>

        <main id="contenido" className="flex-1 px-4 pt-6 pb-24 lg:px-8 lg:pb-8">
          {children}
        </main>

        <nav
          aria-label="Navegación móvil"
          className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        >
          <NavList section="mobile" compact />
        </nav>
      </div>
    </div>
  );
}
