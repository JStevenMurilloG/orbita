"use client";

import { MOBILE_NAV, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "./nav-items";
import { NavLink } from "./nav-link";

const SECTIONS = {
  primary: PRIMARY_NAV,
  secondary: SECONDARY_NAV,
  mobile: MOBILE_NAV,
} satisfies Record<string, NavItem[]>;

/**
 * Enlaces de una sección de navegación. Vive en el cliente porque los ítems llevan
 * componentes de icono, que no se pueden pasar como props desde un Server Component.
 */
export function NavList({
  section,
  compact = false,
}: {
  section: keyof typeof SECTIONS;
  compact?: boolean;
}) {
  return SECTIONS[section].map((item) => <NavLink key={item.href} item={item} compact={compact} />);
}
