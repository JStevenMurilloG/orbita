"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Secciones de Configuración (plan §22). Notificaciones e integraciones llegan en MVP3. */
const SECTIONS = [
  { href: "/configuracion/perfil", label: "Perfil" },
  { href: "/configuracion/cuenta", label: "Cuenta y seguridad" },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones de configuración" className="mb-6 border-b">
      <ul className="-mb-px flex gap-4 overflow-x-auto">
        {SECTIONS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
