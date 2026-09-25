import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeSync } from "@/features/profile/components/theme-sync";
import { getCurrentProfile } from "@/features/profile/queries";
import { getUser } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  const fullName = profile?.full_name ?? user.email?.split("@")[0] ?? "Estudiante";

  return (
    <AppShell user={{ fullName, email: user.email }}>
      {profile ? <ThemeSync theme={profile.theme} /> : null}
      {children}
    </AppShell>
  );
}
