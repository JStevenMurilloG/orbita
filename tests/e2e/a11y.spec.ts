import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createConfirmedUser, login } from "./helpers/auth";
import { createFirstTerm } from "./helpers/terms";

async function expectNoSeriousViolations(page: Page) {
  // Un toast a mitad de su animación de entrada tiene opacidad parcial y falsea el contraste.
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
}

test.describe("Fases 1–2 · accesibilidad", () => {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`páginas públicas de autenticación (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      for (const path of ["/login", "/registro", "/recuperar", "/restablecer"]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoSeriousViolations(page);
      }
    });

    test(`configuración con sesión (${colorScheme})`, async ({ page }) => {
      const user = await createConfirmedUser();
      await page.emulateMedia({ colorScheme });
      await login(page, user.email, user.password);
      for (const path of ["/hoy", "/configuracion/perfil", "/configuracion/cuenta"]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoSeriousViolations(page);
      }
    });

    test(`trimestres y onboarding (${colorScheme})`, async ({ page }) => {
      const user = await createConfirmedUser();
      await page.emulateMedia({ colorScheme });
      await login(page, user.email, user.password);
      await expectNoSeriousViolations(page); // /bienvenida
      await createFirstTerm(page, {
        name: "Segundo trimestre",
        start: "2026-07-13",
        end: "2026-10-02",
      });
      for (const path of ["/hoy", "/trimestres", "/trimestres/nuevo"]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoSeriousViolations(page);
      }
      await page.goto("/trimestres");
      await page.getByRole("link", { name: /Segundo trimestre · / }).click();
      await expect(page).toHaveURL(/\/trimestres\/[0-9a-f-]{36}$/);
      await expectNoSeriousViolations(page);

      // Archivado: aviso de solo lectura.
      await page.getByRole("button", { name: "Archivar", exact: true }).click();
      await page
        .getByRole("alertdialog")
        .getByRole("button", { name: "Archivar trimestre" })
        .click();
      await expect(page.getByTestId("read-only-banner")).toBeVisible();
      await expectNoSeriousViolations(page);
    });
  }
});
