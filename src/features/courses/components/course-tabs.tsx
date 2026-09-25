"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Pestañas del espacio de una clase (plan §13, §22). Tareas y Horario muestran un aviso hasta
 * sus fases; Cuadernos y Documentos llegan en MVP2 y aparecen como "Próximamente".
 */
const TABS = [
  { segment: "", label: "Resumen" },
  { segment: "/tareas", label: "Tareas" },
  { segment: "/horario", label: "Horario" },
  { segment: "/profesor", label: "Profesor" },
  { segment: "/cuadernos", label: "Cuadernos", soon: true },
  { segment: "/documentos", label: "Documentos", soon: true },
] as const;

const tabClass =
  "inline-flex items-center gap-1.5 border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function CourseTabs({ courseId }: { courseId: string }) {
  const pathname = usePathname();
  const base = `/clases/${courseId}`;

  return (
    <nav aria-label="Secciones de la clase" className="mb-6 border-b">
      <ul className="-mb-px flex gap-4 overflow-x-auto">
        {TABS.map((tab) => {
          if ("soon" in tab) {
            return (
              <li key={tab.segment}>
                <span
                  aria-disabled="true"
                  className={cn(
                    tabClass,
                    "cursor-not-allowed border-transparent text-muted-foreground",
                  )}
                >
                  {tab.label}
                  <Badge variant="outline" className="text-muted-foreground">
                    Próximamente
                  </Badge>
                </span>
              </li>
            );
          }
          const href = `${base}${tab.segment}`;
          const active = pathname === href;
          return (
            <li key={tab.segment}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  tabClass,
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
