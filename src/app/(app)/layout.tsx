import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getUser } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();
  if (!user) redirect("/login");

  return <AppShell>{children}</AppShell>;
}
