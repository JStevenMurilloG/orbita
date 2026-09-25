"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActivePath, type NavItem } from "./nav-items";

export function NavLink({ item, compact = false }: { item: NavItem; compact?: boolean }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;

  if (item.availableFrom) {
    return (
      <span
        aria-disabled="true"
        title={`Disponible en ${item.availableFrom}`}
        className={cn(
          "flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/60",
          compact && "flex-col gap-1 px-2 py-1.5 text-xs",
        )}
      >
        <Icon className="size-4" aria-hidden />
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
        compact && "flex-col gap-1 bg-transparent px-2 py-1.5 text-xs",
        compact && active && "text-primary",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {item.label}
    </Link>
  );
}
