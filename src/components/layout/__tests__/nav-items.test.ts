import { describe, expect, it } from "vitest";
import { isActivePath } from "../nav-items";

describe("isActivePath", () => {
  it("marca la sección por prefijo de ruta", () => {
    expect(isActivePath("/clases/abc/profesor", "/clases")).toBe(true);
    expect(isActivePath("/trimestres/nuevo", "/trimestres")).toBe(true);
    expect(isActivePath("/clasesx", "/clases")).toBe(false);
  });

  it("las vistas de un trimestre activan su atajo, no Trimestres", () => {
    expect(isActivePath("/trimestres/abc/clases", "/clases")).toBe(true);
    expect(isActivePath("/trimestres/abc/clases/nueva", "/clases")).toBe(true);
    expect(isActivePath("/trimestres/abc/clases", "/trimestres")).toBe(false);
    expect(isActivePath("/trimestres/abc", "/trimestres")).toBe(true);
  });
});
