import { describe, expect, it } from "vitest";
import { courseTeacherSchema, createTeacherSchema, teacherFormSchema } from "../schemas";

const valid = {
  full_name: "  Marta Gómez ",
  email: " marta@universidad.edu ",
  phone: "+57 601 555 0101",
  office: "",
  office_hours: "",
  notes: "",
};

const ID = "0b6b3c38-8f7e-4a57-9f0a-5d1b2c3d4e5f";

describe("teacherFormSchema", () => {
  it("recorta y normaliza los opcionales vacíos a null", () => {
    expect(teacherFormSchema.parse(valid)).toEqual({
      full_name: "Marta Gómez",
      email: "marta@universidad.edu",
      phone: "+57 601 555 0101",
      office: null,
      office_hours: null,
      notes: null,
    });
  });

  it("solo exige el nombre", () => {
    const result = teacherFormSchema.parse({ ...valid, email: "", phone: "" });
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(teacherFormSchema.safeParse({ ...valid, full_name: " " }).success).toBe(false);
  });

  it("valida el formato del correo y del teléfono", () => {
    const result = teacherFormSchema.safeParse({ ...valid, email: "marta@", phone: "llámame" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(["email", "phone"]);
  });

  it("respeta los límites de la BD", () => {
    const result = teacherFormSchema.safeParse({
      ...valid,
      full_name: "x".repeat(101),
      office: "x".repeat(101),
      office_hours: "x".repeat(501),
      notes: "x".repeat(2001),
    });
    expect(result.error?.issues.map((issue) => issue.path[0]).sort()).toEqual([
      "full_name",
      "notes",
      "office",
      "office_hours",
    ]);
  });
});

describe("esquemas de las acciones", () => {
  it("crear acepta opcionalmente la clase a la que se asigna", () => {
    expect(createTeacherSchema.safeParse(valid).success).toBe(true);
    expect(createTeacherSchema.safeParse({ ...valid, course_id: ID }).success).toBe(true);
    expect(createTeacherSchema.safeParse({ ...valid, course_id: "x" }).success).toBe(false);
  });

  it("asignar exige clase y docente", () => {
    expect(courseTeacherSchema.safeParse({ course_id: ID, teacher_id: ID }).success).toBe(true);
    expect(courseTeacherSchema.safeParse({ course_id: ID }).success).toBe(false);
  });
});
