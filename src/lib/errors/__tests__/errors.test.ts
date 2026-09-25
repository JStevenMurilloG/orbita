import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError, mapPostgresError, toAppError, toResult } from "..";

describe("mapPostgresError", () => {
  it.each([
    ["23505", "CONFLICT", 409],
    ["23503", "NOT_FOUND", 404],
    ["42501", "NOT_FOUND", 404],
    ["PGRST116", "NOT_FOUND", 404],
    ["23514", "VALIDATION", 422],
    ["22007", "VALIDATION", 422],
    ["XX000", "INTERNAL", 500],
  ])("%s → %s", (pgCode, appCode, status) => {
    const error = mapPostgresError({ code: pgCode, message: "x" });
    expect(error.code).toBe(appCode);
    expect(error.httpStatus).toBe(status);
  });

  it("P0001 con código propio conserva el código", () => {
    const error = mapPostgresError({ code: "P0001", message: "TERM_ARCHIVED" });
    expect(error.code).toBe("TERM_ARCHIVED");
    expect(error.httpStatus).toBe(409);
  });

  it("P0001 desconocido se trata como validación", () => {
    expect(mapPostgresError({ code: "P0001", message: "otra cosa" }).code).toBe("VALIDATION");
  });
});

describe("toAppError", () => {
  it("convierte ZodError en VALIDATION con errores por campo", () => {
    const schema = z.object({ name: z.string().min(1, "Obligatorio") });
    const parsed = schema.safeParse({ name: "" });
    const error = toAppError(parsed.error);
    expect(error.code).toBe("VALIDATION");
    expect(error.fields).toEqual({ name: ["Obligatorio"] });
  });

  it("deja pasar AppError tal cual", () => {
    const original = new AppError("GONE");
    expect(toAppError(original)).toBe(original);
  });

  it("cualquier otra cosa es INTERNAL", () => {
    expect(toAppError(new Error("boom")).code).toBe("INTERNAL");
  });
});

describe("toResult", () => {
  it("envuelve el éxito", async () => {
    await expect(toResult(async () => 42)).resolves.toEqual({ ok: true, data: 42 });
  });

  it("serializa el error sin filtrar la causa", async () => {
    const result = await toResult(async () => {
      throw new AppError("NOT_FOUND", { cause: { secreto: true } });
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "No encontramos este elemento." },
    });
  });
});
