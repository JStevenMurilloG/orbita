import { expect, test } from "@playwright/test";
import {
  createConfirmedUser,
  DEFAULT_PASSWORD,
  getEmailLinkPath,
  login,
  logout,
  openUserMenu,
  uniqueEmail,
} from "./helpers/auth";

test.describe("Fase 1 · autenticación", () => {
  test("registro → confirmación por correo → Hoy → cerrar sesión → iniciar sesión", async ({
    page,
  }) => {
    const email = uniqueEmail("registro");

    await page.goto("/registro");
    await page.getByLabel("Nombre", { exact: true }).fill("Ana Registro");
    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill(DEFAULT_PASSWORD);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByRole("heading", { name: "Revisa tu correo" })).toBeVisible();

    // Sin confirmar no se puede entrar.
    await page.goto("/login");
    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill(DEFAULT_PASSWORD);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByText("Confirma tu correo antes de iniciar sesión.")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reenviar correo de confirmación" }),
    ).toBeVisible();

    // El enlace del correo confirma la cuenta y abre la sesión.
    await page.goto(await getEmailLinkPath(email, "Confirma tu cuenta"));
    await expect(page).toHaveURL(/\/hoy$/);
    await openUserMenu(page);
    await expect(page.getByRole("menu")).toContainText("Ana Registro");
    await expect(page.getByRole("menu")).toContainText(email);
    await page.keyboard.press("Escape");

    await logout(page);
    await page.goto("/hoy");
    await expect(page).toHaveURL(/\/login\?next=%2Fhoy$/);

    await login(page, email, DEFAULT_PASSWORD);
  });

  test("el registro guarda la zona horaria del navegador en el perfil", async ({ page }) => {
    const email = uniqueEmail("zona");
    await page.goto("/registro");
    await page.getByLabel("Nombre", { exact: true }).fill("Zona Horaria");
    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill(DEFAULT_PASSWORD);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByRole("heading", { name: "Revisa tu correo" })).toBeVisible();

    await page.goto(await getEmailLinkPath(email, "Confirma tu cuenta"));
    await page.goto("/configuracion/perfil");
    // playwright.config.ts fija timezoneId = America/Bogota.
    await expect(page.getByLabel("Zona horaria", { exact: true })).toHaveValue("America/Bogota");
  });

  test("credenciales incorrectas muestran un error genérico", async ({ page }) => {
    const user = await createConfirmedUser();
    await page.goto("/login");
    await page.getByLabel("Correo").fill(user.email);
    await page.getByLabel("Contraseña", { exact: true }).fill("no-es-la-clave");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("valida los formularios en el cliente con mensajes en español", async ({ page }) => {
    await page.goto("/registro");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByText("El nombre es obligatorio.")).toBeVisible();
    await expect(page.getByText("Escribe tu correo.")).toBeVisible();
    await expect(page.getByText("La contraseña debe tener al menos 8 caracteres.")).toBeVisible();
    await expect(page.getByLabel("Nombre", { exact: true })).toBeFocused();
  });

  test("tras iniciar sesión vuelve a la página pedida (next)", async ({ page }) => {
    const user = await createConfirmedUser();
    await page.goto("/configuracion/cuenta");
    await expect(page).toHaveURL(/\/login\?next=%2Fconfiguracion%2Fcuenta$/);
    await page.getByLabel("Correo").fill(user.email);
    await page.getByLabel("Contraseña", { exact: true }).fill(user.password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(/\/configuracion\/cuenta$/);
  });

  test("un next externo no redirige fuera de la app", async ({ page }) => {
    const user = await createConfirmedUser();
    await page.goto("/login?next=//evil.example.com");
    await page.getByLabel("Correo").fill(user.email);
    await page.getByLabel("Contraseña", { exact: true }).fill(user.password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(/\/hoy$/);
  });

  test("con sesión iniciada, /login y /registro llevan a Hoy", async ({ page }) => {
    const user = await createConfirmedUser();
    await login(page, user.email, user.password);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/hoy$/);
    await page.goto("/registro");
    await expect(page).toHaveURL(/\/hoy$/);
  });

  test("un enlace de correo inválido lleva al login con aviso", async ({ page }) => {
    await page.goto("/auth/confirm?token_hash=falso&type=email&next=/hoy");
    await expect(page).toHaveURL(/\/login\?error=enlace$/);
    await expect(page.getByText("El enlace no es válido o expiró.")).toBeVisible();
  });
});

test.describe("Fase 1 · recuperación de contraseña", () => {
  test("pedir enlace → elegir nueva contraseña → entrar con ella", async ({ page }) => {
    const user = await createConfirmedUser();
    const newPassword = "recuperada-456";

    await page.goto("/login");
    await page.getByRole("link", { name: "¿Olvidaste tu contraseña?" }).click();
    await expect(page).toHaveURL(/\/recuperar$/);
    await page.getByLabel("Correo").fill(user.email);
    await page.getByRole("button", { name: "Enviar enlace" }).click();
    await expect(page.getByRole("heading", { name: "Revisa tu correo" })).toBeVisible();

    await page.goto(await getEmailLinkPath(user.email, "Restablece tu contraseña"));
    await expect(page).toHaveURL(/\/restablecer$/);
    await page.getByLabel("Nueva contraseña", { exact: true }).fill(newPassword);
    await page.getByLabel("Repite la contraseña").fill(newPassword);
    await page.getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(page).toHaveURL(/\/hoy$/);
    await expect(page.getByText("Contraseña actualizada.")).toBeVisible();

    await logout(page);
    await page.getByLabel("Correo").fill(user.email);
    await page.getByLabel("Contraseña", { exact: true }).fill(user.password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();

    await login(page, user.email, newPassword);
  });

  test("no revela si el correo existe", async ({ page }) => {
    await page.goto("/recuperar");
    await page.getByLabel("Correo").fill(uniqueEmail("no-existe"));
    await page.getByRole("button", { name: "Enviar enlace" }).click();
    await expect(page.getByText("Si existe una cuenta con ese correo")).toBeVisible();
  });

  test("con una sesión normal /restablecer no permite cambiar la contraseña", async ({ page }) => {
    const user = await createConfirmedUser();
    await login(page, user.email, user.password);
    await page.goto("/restablecer");
    await expect(page.getByText("Enlace no válido")).toBeVisible();
    await expect(page.getByLabel("Nueva contraseña", { exact: true })).toHaveCount(0);
  });
});

test.describe("Fase 1 · configuración", () => {
  test("editar el perfil persiste nombre, zona, inicio de semana y tema", async ({ page }) => {
    const user = await createConfirmedUser({ fullName: "Nombre Original" });
    await login(page, user.email, user.password);

    await openUserMenu(page);
    await page.getByRole("menuitem", { name: "Perfil" }).click();
    await expect(page).toHaveURL(/\/configuracion\/perfil$/);

    await page.getByLabel("Nombre", { exact: true }).fill("Nombre Nuevo");
    await page.getByLabel("Zona horaria", { exact: true }).selectOption("Europe/Madrid");
    await page.getByLabel("La semana empieza el").selectOption({ label: "Domingo" });
    await page.getByRole("radio", { name: "Oscuro" }).click();
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Perfil actualizado.")).toBeVisible();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.reload();
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Nombre Nuevo");
    await expect(page.getByLabel("Zona horaria", { exact: true })).toHaveValue("Europe/Madrid");
    await expect(page.getByLabel("La semana empieza el")).toHaveValue("7");
    await expect(page.getByRole("radio", { name: "Oscuro" })).toBeChecked();
    await openUserMenu(page);
    await expect(page.getByRole("menu")).toContainText("Nombre Nuevo");
  });

  test("el tema del perfil se aplica al entrar desde otro navegador", async ({
    browser,
    baseURL,
  }) => {
    const user = await createConfirmedUser();

    const first = await browser.newPage({ baseURL });
    await login(first, user.email, user.password);
    await first.goto("/configuracion/perfil");
    await first.getByRole("radio", { name: "Oscuro" }).click();
    await first.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(first.getByText("Perfil actualizado.")).toBeVisible();
    await first.close();

    const second = await browser.newPage({ baseURL, colorScheme: "light" });
    await login(second, user.email, user.password);
    await expect(second.locator("html")).toHaveClass(/dark/);
    await second.close();
  });

  test("cambiar la contraseña exige la actual", async ({ page }) => {
    const user = await createConfirmedUser();
    const newPassword = "cambiada-789";
    await login(page, user.email, user.password);
    await page.goto("/configuracion/cuenta");

    await page.getByLabel("Contraseña actual").fill("equivocada-000");
    await page.getByLabel("Nueva contraseña", { exact: true }).fill(newPassword);
    await page.getByLabel("Repite la nueva contraseña").fill(newPassword);
    await page.getByRole("button", { name: "Cambiar contraseña" }).click();
    await expect(page.getByText("La contraseña actual no es correcta.")).toBeVisible();

    await page.getByLabel("Contraseña actual").fill(user.password);
    await page.getByRole("button", { name: "Cambiar contraseña" }).click();
    await expect(page.getByText("Contraseña actualizada.")).toBeVisible();
    await expect(page.getByLabel("Contraseña actual")).toHaveValue("");

    await logout(page);
    await login(page, user.email, newPassword);
  });

  test("cambiar el correo requiere confirmar en ambas direcciones", async ({ page }) => {
    const user = await createConfirmedUser();
    const newEmail = uniqueEmail("nuevo");
    await login(page, user.email, user.password);
    await page.goto("/configuracion/cuenta");

    const requestedAt = new Date(Date.now() - 1000);
    await page.getByLabel("Nuevo correo").fill(newEmail);
    await page.getByRole("button", { name: "Cambiar correo" }).click();
    await expect(page.getByText("Revisa ambos correos para confirmar el cambio.")).toBeVisible();
    await page.reload();
    await expect(page.getByText(`Cambio pendiente a ${newEmail}`)).toBeVisible();

    const subject = "Confirma el cambio de correo";
    await page.goto(await getEmailLinkPath(user.email, subject, { after: requestedAt }));
    await page.goto(await getEmailLinkPath(newEmail, subject, { after: requestedAt }));
    await expect(page).toHaveURL(/\/configuracion\/cuenta$/);
    await expect(page.getByText(`Tu correo actual es ${newEmail}.`)).toBeVisible();

    await logout(page);
    await login(page, newEmail, user.password);
  });

  test("cerrar sesión en todos los dispositivos", async ({ browser, baseURL }) => {
    const user = await createConfirmedUser();
    const phone = await browser.newPage({ baseURL });
    const laptop = await browser.newPage({ baseURL });
    await login(phone, user.email, user.password);
    await login(laptop, user.email, user.password);

    await laptop.goto("/configuracion/cuenta");
    await laptop.getByRole("button", { name: "Cerrar sesión en todos los dispositivos" }).click();
    await expect(laptop).toHaveURL(/\/login$/);

    // Su sesión queda revocada en Supabase Auth: el JWT ya emitido sigue siendo válido hasta
    // caducar (jwt_expiry), pero cualquier operación que consulte la sesión se rechaza.
    await phone.goto("/configuracion/cuenta");
    await phone.getByLabel("Nuevo correo").fill(uniqueEmail("revocada"));
    await phone.getByRole("button", { name: "Cambiar correo" }).click();
    await expect(phone.getByText("Tu sesión expiró. Inicia sesión de nuevo.")).toBeVisible();

    await phone.close();
    await laptop.close();
  });
});
