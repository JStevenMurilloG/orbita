import { expect, test } from "@playwright/test";
import { createConfirmedUser, login, logout } from "./helpers/auth";
import { createFirstTerm, createTerm, switchActiveTerm, termSwitcher } from "./helpers/terms";

const SECOND = { name: "Segundo trimestre", year: 2026, start: "2026-07-13", end: "2026-10-02" };
const THIRD = { name: "Tercer trimestre", year: 2026, start: "2026-10-13", end: "2026-12-18" };

test.describe("Fase 2 · trimestres", () => {
  test("onboarding: sin trimestres, Hoy lleva a crear el primero y queda activo", async ({
    page,
  }) => {
    const user = await createConfirmedUser({ fullName: "Ana Onboarding" });
    await login(page, user.email, user.password);
    await expect(page).toHaveURL(/\/bienvenida$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Te damos la bienvenida, Ana");

    // Validación de fechas en el cliente.
    await page.getByLabel("Nombre").fill(SECOND.name);
    await page.getByLabel("Fecha de inicio").fill("2026-10-02");
    await page.getByLabel("Fecha de fin").fill("2026-07-13");
    await page.getByRole("button", { name: "Crear mi primer trimestre" }).click();
    await expect(
      page.getByText("La fecha de fin no puede ser anterior a la de inicio."),
    ).toBeVisible();

    await createFirstTerm(page, SECOND);
    await expect(page.getByRole("main").getByText("Segundo trimestre · 2026")).toBeVisible();
    await expect(termSwitcher(page)).toHaveAccessibleName(
      "Cambiar trimestre activo (Segundo trimestre · 2026)",
    );

    // Con un trimestre ya creado, el onboarding no vuelve a aparecer.
    await page.goto("/bienvenida");
    await expect(page).toHaveURL(/\/hoy$/);
    await logout(page);
    await login(page, user.email, user.password);
    await expect(page).toHaveURL(/\/hoy$/);
  });

  test("crear varios trimestres y cambiar el activo", async ({ page }) => {
    const user = await createConfirmedUser();
    await login(page, user.email, user.password);
    await createFirstTerm(page, SECOND);

    // Un trimestre nuevo no pasa a ser el activo si se desmarca la casilla.
    await createTerm(page, { ...THIRD, makeActive: false });
    await expect(termSwitcher(page)).toHaveAccessibleName(
      "Cambiar trimestre activo (Segundo trimestre · 2026)",
    );

    await switchActiveTerm(page, "Tercer trimestre · 2026");
    await page.goto("/hoy");
    await expect(page.getByRole("main").getByText("Tercer trimestre · 2026")).toBeVisible();

    // La selección persiste (se guarda en el perfil).
    await page.reload();
    await expect(termSwitcher(page)).toHaveAccessibleName(
      "Cambiar trimestre activo (Tercer trimestre · 2026)",
    );

    await page.goto("/trimestres");
    const current = page.getByRole("region", { name: "En curso y finalizados" });
    await expect(current.getByRole("listitem")).toHaveCount(2);
    await expect(
      current.getByRole("listitem").filter({ hasText: "Tercer trimestre" }),
    ).toContainText("Trimestre activo");
    await expect(
      current.getByRole("listitem").filter({ hasText: "Segundo trimestre" }),
    ).not.toContainText("Trimestre activo");

    // Crear uno marcando la casilla lo activa.
    await createTerm(page, {
      name: "Intersemestral",
      year: 2026,
      start: "2026-12-01",
      end: "2027-01-20",
    });
    await expect(termSwitcher(page)).toHaveAccessibleName(
      "Cambiar trimestre activo (Intersemestral · 2026)",
    );
  });

  test("finalizar, archivar (solo lectura) y desarchivar un trimestre", async ({ page }) => {
    const user = await createConfirmedUser();
    await login(page, user.email, user.password);
    await createFirstTerm(page, SECOND);
    await createTerm(page, { ...THIRD, makeActive: false });

    // Finalizar y reabrir.
    await page.getByRole("button", { name: "Finalizar" }).click();
    await expect(page.getByRole("heading", { level: 1 }).locator("..")).toContainText("Finalizado");
    await page.getByRole("button", { name: "Reabrir" }).click();
    await expect(page.getByRole("heading", { level: 1 }).locator("..")).toContainText("En curso");

    // Archivar pide confirmación.
    await page.getByRole("button", { name: "Archivar", exact: true }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("¿Archivar “Tercer trimestre”?");
    await dialog.getByRole("button", { name: "Archivar trimestre" }).click();
    await expect(dialog).toBeHidden();

    const banner = page.getByTestId("read-only-banner");
    await expect(banner).toContainText("Tercer trimestre está archivado");
    await expect(page.getByRole("heading", { level: 1 }).locator("..")).toContainText("Archivado");
    // Solo lectura: sin formulario de edición ni acciones de ciclo de vida.
    await expect(page.getByRole("button", { name: "Guardar cambios" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Archivar", exact: true })).toHaveCount(0);

    // Consultar el archivado desde la lista y como trimestre activo.
    await page.goto("/trimestres");
    const archived = page.getByRole("region", { name: "Archivados" });
    await expect(archived.getByRole("listitem")).toHaveCount(1);
    await expect(archived).toContainText("Tercer trimestre · 2026");

    await switchActiveTerm(page, "Tercer trimestre · 2026");
    await page.goto("/hoy");
    await expect(page.getByTestId("read-only-banner")).toContainText(
      "Tercer trimestre está archivado",
    );

    // Desarchivar desde el aviso: queda finalizado y editable.
    await page.getByTestId("read-only-banner").getByRole("button", { name: "Desarchivar" }).click();
    await expect(page.getByTestId("read-only-banner")).toBeHidden();
    await page.goto("/trimestres");
    await expect(page.getByRole("region", { name: "Archivados" })).toHaveCount(0);
    await expect(page.getByRole("listitem").filter({ hasText: "Tercer trimestre" })).toContainText(
      "Finalizado",
    );
  });

  test("editar un trimestre", async ({ page }) => {
    const user = await createConfirmedUser();
    await login(page, user.email, user.password);
    await createFirstTerm(page, SECOND);
    await page.goto("/trimestres");
    await page.getByRole("link", { name: /Segundo trimestre · 2026/ }).click();

    await page.getByLabel("Nombre").fill("Segundo trimestre (ajustado)");
    await page.getByLabel("Fecha de fin").fill("2026-10-09");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Cambios guardados.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Segundo trimestre (ajustado) · 2026",
    );
    await expect(termSwitcher(page)).toHaveAccessibleName(
      "Cambiar trimestre activo (Segundo trimestre (ajustado) · 2026)",
    );
  });

  test("eliminar exige escribir el nombre y borra el trimestre", async ({ page }) => {
    const user = await createConfirmedUser();
    await login(page, user.email, user.password);
    await createFirstTerm(page, SECOND);
    await page.goto("/trimestres");
    await page.getByRole("link", { name: /Segundo trimestre · 2026/ }).click();

    await page.getByRole("button", { name: "Eliminar trimestre" }).click();
    const dialog = page.getByRole("dialog");
    const confirm = dialog.getByRole("button", { name: "Eliminar definitivamente" });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel("Escribe Segundo trimestre para confirmar").fill("Segundo");
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel("Escribe Segundo trimestre para confirmar").fill("Segundo trimestre");
    await confirm.click();

    await expect(page).toHaveURL(/\/trimestres$/);
    await expect(page.getByText("Aún no tienes trimestres")).toBeVisible();
    await expect(termSwitcher(page)).toHaveAccessibleName(
      "Cambiar trimestre activo (Sin trimestre)",
    );
    await page.goto("/hoy");
    await expect(page).toHaveURL(/\/bienvenida$/);
  });

  test("los trimestres de otro usuario no se ven ni se pueden abrir", async ({
    page: ownerPage,
    browser,
    baseURL,
  }) => {
    const owner = await createConfirmedUser();
    const other = await createConfirmedUser();

    await login(ownerPage, owner.email, owner.password);
    await createFirstTerm(ownerPage, SECOND);
    await ownerPage.goto("/trimestres");
    await ownerPage.getByRole("link", { name: /Segundo trimestre · 2026/ }).click();
    await expect(ownerPage).toHaveURL(/\/trimestres\/[0-9a-f-]{36}$/);
    const ownerTermUrl = new URL(ownerPage.url()).pathname;

    const otherPage = await browser.newPage({ baseURL });
    await login(otherPage, other.email, other.password);
    await expect(otherPage).toHaveURL(/\/bienvenida$/);
    await otherPage.goto(ownerTermUrl);
    await expect(
      otherPage.getByRole("heading", { name: "No encontramos este elemento" }),
    ).toBeVisible();
    await otherPage.goto("/trimestres");
    await expect(otherPage.getByText("Aún no tienes trimestres")).toBeVisible();
  });
});
