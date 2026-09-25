import Link from "next/link";
import { OrbitIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { updateThemeAction } from "@/features/profile/actions";
import { ThemeSync } from "@/features/profile/components/theme-sync";
import { UserMenu } from "@/features/profile/components/user-menu";
import { getCurrentProfile } from "@/features/profile/queries";
import { getUser } from "@/lib/auth";

/** Onboarding: columna centrada sin la navegación de la app (aún no hay trimestre). */
export default async function OnboardingLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();
  if (!user) redirect("/login");
  const profile = await getCurrentProfile();
  const fullName = profile?.full_name ?? user.email?.split("@")[0] ?? "Estudiante";

  return (
    <div className="flex min-h-dvh flex-col">
      {profile ? <ThemeSync theme={profile.theme} /> : null}
      <header className="flex items-center justify-between px-4 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <OrbitIcon className="size-5 text-primary" aria-hidden />
          Órbita
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle persist={updateThemeAction} />
          <UserMenu fullName={fullName} email={user.email} />
        </div>
      </header>
      <main id="contenido" className="mx-auto w-full max-w-xl flex-1 px-4 pt-6 pb-16">
        {children}
      </main>
    </div>
  );
}
