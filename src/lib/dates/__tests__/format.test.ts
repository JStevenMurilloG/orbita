import { describe, expect, it } from "vitest";
import { formatCivilDate, formatCivilDateRange } from "../format";

describe("formatCivilDate", () => {
  it("formatea una fecha civil en español", () => {
    expect(formatCivilDate("2026-07-13")).toMatch(/^13 de jul\.? de 2026$/);
  });

  it("el 1 de enero sigue siendo 1 de enero (sin corrimiento por zona)", () => {
    expect(formatCivilDate("2026-01-01")).toMatch(/^1 de ene\.? de 2026$/);
  });
});

describe("formatCivilDateRange", () => {
  it("muestra ambos extremos del rango", () => {
    const text = formatCivilDateRange("2026-07-13", "2026-10-02");
    expect(text).toMatch(/^13 de jul/);
    expect(text).toMatch(/2 de oct\.? de 2026$/);
  });

  it("incluye ambos años si el rango cruza de año", () => {
    const text = formatCivilDateRange("2026-12-01", "2027-02-02");
    expect(text).toContain("2026");
    expect(text).toContain("2027");
  });
});
