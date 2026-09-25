"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import type { Theme } from "../schemas";

/**
 * Aplica el tema guardado en el perfil (p. ej. al iniciar sesión en otro dispositivo).
 * Solo reacciona cuando cambia el valor del perfil, para no pisar un cambio local en curso.
 */
export function ThemeSync({ theme }: { theme: Theme }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  return null;
}
