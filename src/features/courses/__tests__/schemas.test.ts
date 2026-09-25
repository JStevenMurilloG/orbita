import { describe, expect, it } from "vitest";
import {
  courseFormSchema,
  createCourseSchema,
  creditsSchema,
  reorderCoursesSchema,
  updateCourseSchema,
} from "../schemas";

const valid = {
  name: "  Cálculo diferencial ",
  code: " MAT-204 ",
  description: "",
  color: "indigo",
  icon: "📐",
  room: "",
  credits: "4",
};

const ID = "0b6b3c38-8f7e-4a57-9f0a-5d1b2c3d4e5f";

function firstErrors(result: { success: boolean; error?: { issues: unknown[] } }) {
  const issues = (result.error?.issues ?? []) as Array<{ path: PropertyKey[]; message: string }>;
  const errors: Record<string, string> = {};
  for (const issue of issues) errors[issue.path.join(".")] ??= issue.message;
  return errors;
}

describe("courseFormSchema", () => {
  it("recorta textos, normaliza vacíos a null y convierte los créditos", () => {
    expect(courseFormSchema.parse(valid)).toEqual({
      name: "Cálculo diferencial",
      code: "MAT-204",
      description: null,
      color: "indigo",
      icon: "📐",
      room: null,
      credits: 4,
    });
  });

  it("exige nombre y un color de la paleta", () => {
    const errors = firstErrors(courseFormSchema.safeParse({ ...valid, name: "  ", color: "#f00" }));
    expect(errors.name).toBe("El nombre es obligatorio.");
    expect(errors.color).toBe("Color no válido.");
  });

  it("respeta los límites de la BD", () => {
    const errors = firstErrors(
      courseFormSchema.safeParse({
        ...valid,
        name: "x".repeat(101),
        code: "x".repeat(31),
        room: "x".repeat(51),
        description: "x".repeat(2001),
      }),
    );
    expect(Object.keys(errors).sort()).toEqual(["code", "description", "name", "room"]);
  });

  it("el emoji es opcional pero debe ser uno solo", () => {
    expect(courseFormSchema.parse({ ...valid, icon: "" }).icon).toBeNull();
    expect(courseFormSchema.parse({ ...valid, icon: "👩🏽‍🔬" }).icon).toBe("👩🏽‍🔬");
    expect(courseFormSchema.safeParse({ ...valid, icon: "📐📚" }).success).toBe(false);
    expect(courseFormSchema.safeParse({ ...valid, icon: "A" }).success).toBe(false);
  });
});

describe("creditsSchema", () => {
  it.each([
    ["", null],
    [undefined, null],
    [null, null],
    ["3", 3],
    ["4,5", 4.5],
    ["0", 0],
    [2.5, 2.5],
  ])("%j → %j", (input, expected) => {
    expect(creditsSchema.parse(input)).toBe(expected);
  });

  it.each([
    ["tres", "Escribe un número, p. ej. 3 o 4,5."],
    ["-1", "Los créditos deben estar entre 0 y 999,9."],
    ["1000", "Los créditos deben estar entre 0 y 999,9."],
    ["2,25", "Usa como máximo un decimal."],
  ])("rechaza %j", (input, message) => {
    const result = creditsSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });
});

describe("esquemas de las acciones", () => {
  it("crear exige un trimestre válido", () => {
    expect(createCourseSchema.safeParse({ ...valid, term_id: ID }).success).toBe(true);
    expect(createCourseSchema.safeParse({ ...valid, term_id: "x" }).success).toBe(false);
  });

  it("la salida del formulario vuelve a validar en el servidor (créditos ya numéricos)", () => {
    const output = courseFormSchema.parse(valid);
    expect(updateCourseSchema.parse({ ...output, id: ID }).credits).toBe(4);
  });

  it("reordenar exige al menos una clase", () => {
    expect(reorderCoursesSchema.safeParse({ term_id: ID, course_ids: [] }).success).toBe(false);
    expect(reorderCoursesSchema.safeParse({ term_id: ID, course_ids: [ID] }).success).toBe(true);
  });
});
