import { describe, expect, it } from "vitest";
import { filterTeachers, isValidPhone, mailtoHref, normalizeForSearch, telHref } from "../utils";

describe("enlaces de contacto", () => {
  it("mailto con el correo tal cual", () => {
    expect(mailtoHref("marta@uni.edu")).toBe("mailto:marta@uni.edu");
  });

  it("tel solo con dígitos y el + inicial", () => {
    expect(telHref("+57 (601) 555-0101")).toBe("tel:+576015550101");
    expect(telHref("601.555.0101")).toBe("tel:6015550101");
  });
});

describe("isValidPhone", () => {
  it.each(["+57 601 555 0101", "(601) 555-0101", "3001234567", "123"])("%s es válido", (v) => {
    expect(isValidPhone(v)).toBe(true);
  });

  it.each(["12", "llámame", "+57 601 555 0101 ext 3", "++57 601", "1".repeat(21)])(
    "%s no es válido",
    (v) => {
      expect(isValidPhone(v)).toBe(false);
    },
  );
});

describe("filterTeachers", () => {
  const teachers = [
    { full_name: "Marta Gómez", email: "marta@uni.edu" },
    { full_name: "Julián Rojas", email: null },
  ];

  it("sin búsqueda devuelve todos", () => {
    expect(filterTeachers(teachers, "  ")).toHaveLength(2);
  });

  it("ignora tildes y mayúsculas, y busca también en el correo", () => {
    expect(filterTeachers(teachers, "gomez")).toEqual([teachers[0]]);
    expect(filterTeachers(teachers, "JULIAN")).toEqual([teachers[1]]);
    expect(filterTeachers(teachers, "uni.edu")).toEqual([teachers[0]]);
    expect(filterTeachers(teachers, "pérez")).toEqual([]);
  });

  it("normalizeForSearch quita tildes", () => {
    expect(normalizeForSearch(" Ñandú ÁÉ ")).toBe("nandu ae");
  });
});
