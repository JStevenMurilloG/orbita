import { describe, expect, it } from "vitest";
import {
  courseColorSchema,
  dateStringSchema,
  optionalText,
  requiredText,
  timeStringSchema,
  timeZoneSchema,
} from "../common";

describe("dateStringSchema", () => {
  it.each(["2026-09-25", "2028-02-29"])("acepta %s", (value) => {
    expect(dateStringSchema.safeParse(value).success).toBe(true);
  });

  it.each(["2026-02-30", "2027-02-29", "25/09/2026", "2026-9-5", ""])("rechaza %j", (value) => {
    expect(dateStringSchema.safeParse(value).success).toBe(false);
  });
});

describe("timeStringSchema", () => {
  it.each(["00:00", "08:30", "23:59"])("acepta %s", (value) => {
    expect(timeStringSchema.safeParse(value).success).toBe(true);
  });

  it.each(["24:00", "8:30", "08:60", "08:30:00"])("rechaza %j", (value) => {
    expect(timeStringSchema.safeParse(value).success).toBe(false);
  });
});

describe("timeZoneSchema", () => {
  it("acepta IANA y rechaza inventadas", () => {
    expect(timeZoneSchema.safeParse("America/Bogota").success).toBe(true);
    expect(timeZoneSchema.safeParse("America/Macondo").success).toBe(false);
  });
});

describe("courseColorSchema", () => {
  it("solo acepta tokens de la paleta", () => {
    expect(courseColorSchema.safeParse("blue").success).toBe(true);
    expect(courseColorSchema.safeParse("#ff0000").success).toBe(false);
  });
});

describe("textos", () => {
  it("requiredText recorta y exige contenido", () => {
    const schema = requiredText(5, "El nombre");
    expect(schema.parse("  Hola ")).toBe("Hola");
    expect(schema.safeParse("   ").success).toBe(false);
    expect(schema.safeParse("Demasiado").success).toBe(false);
  });

  it("optionalText normaliza vacío a null", () => {
    const schema = optionalText(10);
    expect(schema.parse("  ")).toBeNull();
    expect(schema.parse(undefined)).toBeUndefined();
    expect(schema.parse(" aula ")).toBe("aula");
  });
});
