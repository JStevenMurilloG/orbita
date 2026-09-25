import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createConfirmedUser, login } from "./helpers/auth";

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
}

test.describe("Fase 1 · accesibilidad", () => {
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
  }
});
