"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PersistTheme = (input: { theme: string }) => Promise<{ ok: boolean }>;

/**
 * Selector de tema. Con `persist` (sesión iniciada) el cambio también se guarda en el perfil,
 * para que se aplique en otros dispositivos.
 */
export function ThemeToggle({ persist }: { persist?: PersistTheme }) {
  const { theme, setTheme } = useTheme();

  const onValueChange = (value: string) => {
    setTheme(value);
    if (!persist) return;
    void persist({ theme: value }).then((result) => {
      if (!result.ok) toast.error("No pudimos guardar el tema en tu perfil.");
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Cambiar tema">
          <SunIcon className="dark:hidden" />
          <MoonIcon className="hidden dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={onValueChange}>
          <DropdownMenuRadioItem value="light">
            <SunIcon /> Claro
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <MoonIcon /> Oscuro
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <MonitorIcon /> Sistema
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
