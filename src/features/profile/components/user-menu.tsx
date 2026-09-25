"use client";

import { useTransition } from "react";
import Link from "next/link";
import { LogOutIcon, ShieldCheckIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/features/auth/actions";
import { initials } from "../labels";

/** Avatar con acceso al perfil, la cuenta y el cierre de sesión (plan §24). */
export function UserMenu({ fullName, email }: { fullName: string; email: string | null }) {
  const [pending, startTransition] = useTransition();

  const signOut = () =>
    startTransition(async () => {
      const result = await signOutAction({ scope: "local" });
      if (!result.ok) toast.error(result.error.message);
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Menú de usuario" title={fullName}>
          <Avatar className="size-7">
            <AvatarFallback className="text-xs font-medium text-foreground">
              {initials(fullName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium text-foreground">{fullName}</span>
          {email ? (
            <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/configuracion/perfil">
            <UserIcon aria-hidden /> Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/configuracion/cuenta">
            <ShieldCheckIcon aria-hidden /> Cuenta y seguridad
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          onSelect={(event) => {
            event.preventDefault();
            signOut();
          }}
        >
          <LogOutIcon aria-hidden /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
