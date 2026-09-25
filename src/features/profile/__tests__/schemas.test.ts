import { describe, expect, it } from "vitest";
import { initials } from "../labels";
import { updateProfileSchema, updateThemeSchema } from "../schemas";

describe("updateProfileSchema", () => {
  const valid = {
    full_name: "Ana Pérez",
    timezone: "Europe/Madrid",
    week_starts_on: 1,
    theme: "dark",
  };

  it("acepta un perfil válido", () => {
    expect(updateProfileSchema.parse(valid)).toEqual(valid);
  });

  it.each([0, 8, 1.5, Number.NaN])("rechaza week_starts_on = %s", (week_starts_on) => {
    expect(updateProfileSchema.safeParse({ ...valid, week_starts_on }).success).toBe(false);
  });

  it("acepta domingo (7) como inicio de semana", () => {
    expect(updateProfileSchema.safeParse({ ...valid, week_starts_on: 7 }).success).toBe(true);
  });

  it("rechaza zonas horarias inexistentes", () => {
    expect(updateProfileSchema.safeParse({ ...valid, timezone: "Bogota" }).success).toBe(false);
  });

  it("rechaza temas desconocidos", () => {
    expect(updateProfileSchema.safeParse({ ...valid, theme: "sepia" }).success).toBe(false);
    expect(updateThemeSchema.safeParse({ theme: "system" }).success).toBe(true);
  });

  it("no deja pasar campos no editables", () => {
    const parsed = updateProfileSchema.parse({ ...valid, id: "otro", onboarded_at: "2026-01-01" });
    expect(parsed).not.toHaveProperty("id");
    expect(parsed).not.toHaveProperty("onboarded_at");
  });
});

describe("initials", () => {
  it.each([
    ["Ana María Pérez", "AP"],
    ["ana", "A"],
    ["  bruno   díaz ", "BD"],
    ["", "?"],
  ])("%j → %s", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
