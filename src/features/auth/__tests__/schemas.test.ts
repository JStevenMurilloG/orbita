import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  signOutSchema,
} from "../schemas";

const firstMessage = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe("emailSchema", () => {
  it("recorta espacios y pasa a minúsculas", () => {
    expect(emailSchema.parse("  Ana.Perez@Uni.EDU.co ")).toBe("ana.perez@uni.edu.co");
  });

  it.each(["", "   ", "ana", "ana@", "@uni.co", "ana perez@uni.co"])("rechaza %j", (value) => {
    expect(emailSchema.safeParse(value).success).toBe(false);
  });

  it("explica el error en español", () => {
    expect(firstMessage(emailSchema.safeParse(""))).toBe("Escribe tu correo.");
    expect(firstMessage(emailSchema.safeParse("ana@"))).toBe("Escribe un correo válido.");
  });
});

describe("loginSchema", () => {
  it("acepta credenciales completas", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });

  it("exige contraseña", () => {
    const result = loginSchema.safeParse({ email: "a@b.co", password: "" });
    expect(firstMessage(result)).toBe("Escribe tu contraseña.");
  });
});

describe("registerSchema", () => {
  const valid = {
    full_name: "  Ana Pérez ",
    email: "ana@uni.co",
    password: "segura-123",
    timezone: "America/Bogota",
  };

  it("acepta un registro válido y recorta el nombre", () => {
    expect(registerSchema.parse(valid).full_name).toBe("Ana Pérez");
  });

  it("exige contraseña de al menos 8 caracteres", () => {
    const result = registerSchema.safeParse({ ...valid, password: "1234567" });
    expect(firstMessage(result)).toBe("La contraseña debe tener al menos 8 caracteres.");
  });

  it("limita la contraseña a 72 caracteres (límite de bcrypt)", () => {
    expect(registerSchema.safeParse({ ...valid, password: "a".repeat(73) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: "a".repeat(72) }).success).toBe(true);
  });

  it("rechaza nombre vacío y zona horaria inválida", () => {
    expect(registerSchema.safeParse({ ...valid, full_name: "   " }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, timezone: "Marte/Olimpo" }).success).toBe(false);
  });

  it("rechaza nombres de más de 100 caracteres", () => {
    expect(registerSchema.safeParse({ ...valid, full_name: "a".repeat(101) }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("exige que ambas contraseñas coincidan", () => {
    const result = resetPasswordSchema.safeParse({
      password: "segura-123",
      confirm_password: "segura-124",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ["confirm_password"],
      message: "Las contraseñas no coinciden.",
    });
  });

  it("acepta contraseñas iguales y válidas", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "segura-123", confirm_password: "segura-123" })
        .success,
    ).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  const valid = {
    current_password: "vieja-123",
    new_password: "nueva-123",
    confirm_password: "nueva-123",
  };

  it("acepta un cambio válido", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("exige la contraseña actual", () => {
    const result = changePasswordSchema.safeParse({ ...valid, current_password: "" });
    expect(result.error?.issues[0]?.path).toEqual(["current_password"]);
  });

  it("la nueva debe ser distinta de la actual", () => {
    const result = changePasswordSchema.safeParse({
      current_password: "misma-123",
      new_password: "misma-123",
      confirm_password: "misma-123",
    });
    expect(result.error?.issues[0]).toMatchObject({ path: ["new_password"] });
  });

  it("la confirmación debe coincidir", () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirm_password: "otra-1234" });
    expect(result.error?.issues[0]).toMatchObject({ path: ["confirm_password"] });
  });
});

describe("signOutSchema", () => {
  it("usa scope local por defecto y acepta global", () => {
    expect(signOutSchema.parse({})).toEqual({ scope: "local" });
    expect(signOutSchema.parse({ scope: "global" })).toEqual({ scope: "global" });
    expect(signOutSchema.safeParse({ scope: "others" }).success).toBe(false);
  });
});
