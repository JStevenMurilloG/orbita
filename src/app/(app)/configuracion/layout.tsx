import { PageHeader } from "@/components/layout/page-header";
import { SettingsTabs } from "./settings-tabs";

export default function SettingsLayout({ children }: LayoutProps<"/configuracion">) {
  return (
    <>
      <PageHeader title="Configuración" />
      <SettingsTabs />
      {children}
    </>
  );
}
