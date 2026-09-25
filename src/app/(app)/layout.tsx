import { redirect } from "next/navigation";
import { ReadOnlyBanner } from "@/components/feedback/read-only-banner";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeSync } from "@/features/profile/components/theme-sync";
import { getCurrentProfile } from "@/features/profile/queries";
import { TermTransitionButton } from "@/features/terms/components/term-transition-button";
import { getActiveTerm, getCurrentTerms } from "@/features/terms/queries";
import { getUser } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();
  if (!user) redirect("/login");

  const [profile, terms, activeTerm] = await Promise.all([
    getCurrentProfile(),
    getCurrentTerms(),
    getActiveTerm(),
  ]);
  const fullName = profile?.full_name ?? user.email?.split("@")[0] ?? "Estudiante";

  return (
    <AppShell
      user={{ fullName, email: user.email }}
      terms={terms.map(({ id, name, year, status }) => ({ id, name, year, status }))}
      activeTermId={activeTerm?.id ?? null}
    >
      {profile ? <ThemeSync theme={profile.theme} /> : null}
      {activeTerm?.status === "archived" ? (
        <ReadOnlyBanner
          termName={activeTerm.name}
          action={<TermTransitionButton termId={activeTerm.id} transition="unarchive" />}
        />
      ) : null}
      {children}
    </AppShell>
  );
}
