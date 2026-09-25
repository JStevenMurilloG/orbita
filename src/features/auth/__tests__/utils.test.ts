import { describe, expect, it } from "vitest";
import type { AuthUser } from "@/lib/auth";
import { isRecentEmailLinkSession, RECOVERY_WINDOW_MS, safeNextPath } from "../utils";

describe("safeNextPath", () => {
  it.each([
    ["/hoy", "/hoy"],
    ["/trimestres/123?vista=semana#lunes", "/trimestres/123?vista=semana#lunes"],
    ["/configuracion/cuenta", "/configuracion/cuenta"],
  ])("conserva la ruta interna %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });

  it.each([
    undefined,
    null,
    42,
    "",
    "hoy",
    "//evil.com",
    "/\\evil.com",
    "https://evil.com/hoy",
    "javascript:alert(1)",
    "/hoy\nSet-Cookie: x=1",
    `/${"a".repeat(600)}`,
  ])("usa el destino por defecto ante %j", (input) => {
    expect(safeNextPath(input)).toBe("/hoy");
  });

  it("admite un destino por defecto propio", () => {
    expect(safeNextPath("//evil.com", "/restablecer")).toBe("/restablecer");
  });
});

describe("isRecentEmailLinkSession", () => {
  const now = new Date("2026-09-25T15:00:00Z");
  const user = (method: string | null, minutesAgo = 5): AuthUser => ({
    id: "u",
    email: "a@b.co",
    authMethod: method ? { method, at: new Date(now.getTime() - minutesAgo * 60_000) } : null,
  });

  it("acepta sesiones recientes abiertas con enlace de correo", () => {
    expect(isRecentEmailLinkSession(user("otp"), now)).toBe(true);
    expect(isRecentEmailLinkSession(user("magiclink"), now)).toBe(true);
  });

  it("rechaza sesiones iniciadas con contraseña", () => {
    expect(isRecentEmailLinkSession(user("password"), now)).toBe(false);
  });

  it("rechaza sesiones sin método conocido", () => {
    expect(isRecentEmailLinkSession(user(null), now)).toBe(false);
  });

  it("caduca pasada la ventana de recuperación", () => {
    const minutes = RECOVERY_WINDOW_MS / 60_000;
    expect(isRecentEmailLinkSession(user("otp", minutes), now)).toBe(true);
    expect(isRecentEmailLinkSession(user("otp", minutes + 1), now)).toBe(false);
  });
});
