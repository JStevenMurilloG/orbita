import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env.public", () => ({
  publicEnv: {
    NEXT_PUBLIC_SUPABASE_URL: "http://localhost",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "k",
  },
}));

const { isPublicPath } = await import("../proxy");

describe("isPublicPath", () => {
  it.each(["/", "/login", "/registro", "/recuperar", "/restablecer", "/auth/callback"])(
    "%s es pública",
    (path) => {
      expect(isPublicPath(path)).toBe(true);
    },
  );

  it.each(["/hoy", "/clases/123", "/configuracion/perfil", "/loginx", "/authx"])(
    "%s requiere sesión",
    (path) => {
      expect(isPublicPath(path)).toBe(false);
    },
  );
});
