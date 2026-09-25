import { describe, expect, it } from "vitest";
import {
  createTermSchema,
  deleteTermSchema,
  setActiveTermSchema,
  termFormSchema,
  updateTermSchema,
} from "../schemas";

const valid = {
  name: "  Segundo trimestre ",
  year: 2026,
  start_date: "2026-07-13",
  end_date: "2026-10-02",
  timezone: "America/Bogota",
  description: "",
};

function fieldErrors(result: { success: boolean; error?: { issues: unknown[] } }) {
  const issues = (result.error?.issues ?? []) as Array<{ path: PropertyKey[]; message: string }>;
  // Primer mensaje de cada campo, como lo muestra el formulario.
  const errors: Record<string, string> = {};
  for (const issue of issues) errors[issue.path.join(".")] ??= issue.message;
  return errors;
}

describe("termFormSchema", () => {
  it("acepta un trimestre válido, recorta el nombre y normaliza la descripción vacía", () => {
    expect(termFormSchema.parse(valid)).toEqual({
      ...valid,
      name: "Segundo trimestre",
      description: null,
    });
  });

  it("acepta que empiece y termine el mismo día", () => {
    const result = termFormSchema.safeParse({ ...valid, end_date: valid.start_date });
    expect(result.success).toBe(true);
  });

  it("rechaza un fin anterior al inicio, en el campo end_date", () => {
    const result = termFormSchema.safeParse({ ...valid, end_date: "2026-07-12" });
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toEqual({
      end_date: "La fecha de fin no puede ser anterior a la de inicio.",
    });
  });

  it("compara fechas de años distintos correctamente", () => {
    const result = termFormSchema.safeParse({
      ...valid,
      start_date: "2026-12-01",
      end_date: "2027-02-15",
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ["start_date", "", "Elige la fecha de inicio."],
    ["end_date", "", "Elige la fecha de fin."],
    ["start_date", "13/07/2026", "Usa el formato AAAA-MM-DD."],
    ["end_date", "2026-02-30", "La fecha no existe."],
  ])("valida %s = %j", (field, value, message) => {
    const result = termFormSchema.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    expect(fieldErrors(result)[field]).toBe(message);
  });

  it.each([1999, 2101, 2026.5, Number.NaN])("rechaza el año %s", (year) => {
    expect(termFormSchema.safeParse({ ...valid, year }).success).toBe(false);
  });

  it("rechaza nombres vacíos o de más de 80 caracteres", () => {
    expect(fieldErrors(termFormSchema.safeParse({ ...valid, name: "   " })).name).toBe(
      "El nombre es obligatorio.",
    );
    expect(termFormSchema.safeParse({ ...valid, name: "x".repeat(81) }).success).toBe(false);
  });

  it("rechaza zonas horarias inexistentes", () => {
    expect(termFormSchema.safeParse({ ...valid, timezone: "Marte/Olimpo" }).success).toBe(false);
  });

  it("limita la descripción a 1000 caracteres", () => {
    const ok = termFormSchema.safeParse({ ...valid, description: "x".repeat(1000) });
    const tooLong = termFormSchema.safeParse({ ...valid, description: "x".repeat(1001) });
    expect(ok.success).toBe(true);
    expect(tooLong.success).toBe(false);
  });
});

describe("createTermSchema / updateTermSchema", () => {
  it("createTermSchema admite make_active y valida el orden de fechas", () => {
    expect(createTermSchema.parse({ ...valid, make_active: true }).make_active).toBe(true);
    expect(createTermSchema.safeParse({ ...valid, end_date: "2026-01-01" }).success).toBe(false);
  });

  it("updateTermSchema exige un id válido", () => {
    const id = "a0000000-0000-4000-8000-000000000001";
    expect(updateTermSchema.safeParse(valid).success).toBe(false);
    expect(updateTermSchema.safeParse({ ...valid, id: "no-uuid" }).success).toBe(false);
    expect(updateTermSchema.safeParse({ ...valid, id }).success).toBe(true);
  });

  it("descarta campos que el cliente no puede fijar (user_id, status)", () => {
    const parsed = createTermSchema.parse({
      ...valid,
      user_id: "b0000000-0000-4000-8000-000000000001",
      status: "archived",
    });
    expect(parsed).not.toHaveProperty("user_id");
    expect(parsed).not.toHaveProperty("status");
  });
});

describe("deleteTermSchema / setActiveTermSchema", () => {
  const id = "a0000000-0000-4000-8000-000000000001";

  it("deleteTermSchema exige escribir el nombre", () => {
    expect(deleteTermSchema.safeParse({ id, confirm_name: "  " }).success).toBe(false);
    expect(deleteTermSchema.parse({ id, confirm_name: " Primer " }).confirm_name).toBe("Primer");
  });

  it("setActiveTermSchema exige un uuid", () => {
    expect(setActiveTermSchema.safeParse({ term_id: "x" }).success).toBe(false);
    expect(setActiveTermSchema.safeParse({ term_id: id }).success).toBe(true);
  });
});
