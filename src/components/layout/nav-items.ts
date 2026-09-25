import {
  BookOpenIcon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  CheckSquareIcon,
  ClockIcon,
  LayersIcon,
  NotebookPenIcon,
  SettingsIcon,
  SunIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Fase en la que se habilita; hasta entonces se muestra deshabilitado. */
  availableFrom?: "MVP2";
};

/** Navegación principal (plan §22). */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/hoy", label: "Hoy", icon: SunIcon },
  { href: "/clases", label: "Clases", icon: BookOpenIcon },
  { href: "/horario", label: "Horario", icon: ClockIcon },
  { href: "/calendario", label: "Calendario", icon: CalendarDaysIcon, availableFrom: "MVP2" },
  { href: "/tareas", label: "Tareas", icon: CheckSquareIcon },
  { href: "/cuadernos", label: "Cuadernos", icon: NotebookPenIcon, availableFrom: "MVP2" },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/trimestres", label: "Trimestres", icon: LayersIcon },
  { href: "/configuracion", label: "Configuración", icon: SettingsIcon },
];

/** Barra inferior en móvil: Hoy · Clases · Calendario · Tareas · Más. */
export const MOBILE_NAV: NavItem[] = [
  PRIMARY_NAV[0],
  PRIMARY_NAV[1],
  { href: "/calendario", label: "Calendario", icon: CalendarRangeIcon, availableFrom: "MVP2" },
  PRIMARY_NAV[4],
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
